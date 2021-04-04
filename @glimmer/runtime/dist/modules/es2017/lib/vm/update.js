import {
// Tags
combine, value, update, validate, createUpdatableTag, combineSlice, INITIAL, IteratorSynchronizer, END } from '@glimmer/reference';
import { associate, LinkedList, Stack } from '@glimmer/util';
import { move as moveBounds } from '../bounds';
import { asyncReset, detach } from '../lifetime';
import { UpdatingOpcode } from '../opcodes';
import { NewElementBuilder } from './element-builder';
export default class UpdatingVM {
    constructor(env, { alwaysRevalidate = false }) {
        this.frameStack = new Stack();
        this.env = env;
        this.dom = env.getDOM();
        this.alwaysRevalidate = alwaysRevalidate;
    }
    execute(opcodes, handler) {
        let { frameStack } = this;
        this.try(opcodes, handler);
        while (true) {
            if (frameStack.isEmpty()) break;
            let opcode = this.frame.nextStatement();
            if (opcode === null) {
                frameStack.pop();
                continue;
            }
            opcode.evaluate(this);
        }
    }
    get frame() {
        return this.frameStack.current;
    }
    goto(op) {
        this.frame.goto(op);
    }
    try(ops, handler) {
        this.frameStack.push(new UpdatingVMFrame(ops, handler));
    }
    throw() {
        this.frame.handleException();
        this.frameStack.pop();
    }
}
export class ResumableVMStateImpl {
    constructor(state, resumeCallback) {
        this.state = state;
        this.resumeCallback = resumeCallback;
    }
    resume(runtime, builder) {
        return this.resumeCallback(runtime, this.state, builder);
    }
}
export class BlockOpcode extends UpdatingOpcode {
    constructor(state, runtime, bounds, children) {
        super();
        this.state = state;
        this.runtime = runtime;
        this.type = 'block';
        this.next = null;
        this.prev = null;
        this.children = children;
        this.bounds = bounds;
    }
    parentElement() {
        return this.bounds.parentElement();
    }
    firstNode() {
        return this.bounds.firstNode();
    }
    lastNode() {
        return this.bounds.lastNode();
    }
    evaluate(vm) {
        vm.try(this.children, null);
    }
}
export class TryOpcode extends BlockOpcode {
    constructor(state, runtime, bounds, children) {
        super(state, runtime, bounds, children);
        this.type = 'try';
        this.tag = this._tag = createUpdatableTag();
    }
    didInitializeChildren() {
        update(this._tag, combineSlice(this.children));
    }
    evaluate(vm) {
        vm.try(this.children, this);
    }
    handleException() {
        let { state, bounds, children, prev, next, runtime } = this;
        children.clear();
        asyncReset(this, runtime.env);
        let elementStack = NewElementBuilder.resume(runtime.env, bounds);
        let vm = state.resume(runtime, elementStack);
        let updating = new LinkedList();
        let result = vm.execute(vm => {
            vm.pushUpdating(updating);
            vm.updateWith(this);
            vm.pushUpdating(children);
        });
        associate(this, result.drop);
        this.prev = prev;
        this.next = next;
    }
}
class ListRevalidationDelegate {
    constructor(opcode, marker) {
        this.opcode = opcode;
        this.marker = marker;
        this.didInsert = false;
        this.didDelete = false;
        this.map = opcode.map;
        this.updating = opcode['children'];
    }
    insert(_env, key, item, memo, before) {
        let { map, opcode, updating } = this;
        let nextSibling = null;
        let reference = null;
        if (typeof before === 'string') {
            reference = map.get(before);
            nextSibling = reference['bounds'].firstNode();
        } else {
            nextSibling = this.marker;
        }
        let vm = opcode.vmForInsertion(nextSibling);
        let tryOpcode = null;
        vm.execute(vm => {
            tryOpcode = vm.iterate(memo, item);
            map.set(key, tryOpcode);
            vm.pushUpdating(new LinkedList());
            vm.updateWith(tryOpcode);
            vm.pushUpdating(tryOpcode.children);
        });
        updating.insertBefore(tryOpcode, reference);
        this.didInsert = true;
    }
    retain(_env, _key, _item, _memo) {}
    move(_env, key, _item, _memo, before) {
        let { map, updating } = this;
        let entry = map.get(key);
        if (before === END) {
            moveBounds(entry, this.marker);
            updating.remove(entry);
            updating.append(entry);
        } else {
            let reference = map.get(before);
            moveBounds(entry, reference.firstNode());
            updating.remove(entry);
            updating.insertBefore(entry, reference);
        }
    }
    delete(env, key) {
        let { map, updating } = this;
        let opcode = map.get(key);
        detach(opcode, env);
        updating.remove(opcode);
        map.delete(key);
        this.didDelete = true;
    }
    done() {
        this.opcode.didInitializeChildren(this.didInsert || this.didDelete);
    }
}
export class ListBlockOpcode extends BlockOpcode {
    constructor(state, runtime, bounds, children, artifacts) {
        super(state, runtime, bounds, children);
        this.type = 'list-block';
        this.map = new Map();
        this.lastIterated = INITIAL;
        this.artifacts = artifacts;
        let _tag = this._tag = createUpdatableTag();
        this.tag = combine([artifacts.tag, _tag]);
    }
    didInitializeChildren(listDidChange = true) {
        this.lastIterated = value(this.artifacts.tag);
        if (listDidChange) {
            update(this._tag, combineSlice(this.children));
        }
    }
    evaluate(vm) {
        let { artifacts, lastIterated } = this;
        if (!validate(artifacts.tag, lastIterated)) {
            let { bounds } = this;
            let { dom } = vm;
            let marker = dom.createComment('');
            dom.insertAfter(bounds.parentElement(), marker, bounds.lastNode());
            let target = new ListRevalidationDelegate(this, marker);
            let synchronizer = new IteratorSynchronizer({ target, artifacts, env: vm.env });
            synchronizer.sync();
            this.parentElement().removeChild(marker);
        }
        // Run now-updated updating opcodes
        super.evaluate(vm);
    }
    vmForInsertion(nextSibling) {
        let { bounds, state, runtime } = this;
        let elementStack = NewElementBuilder.forInitialRender(runtime.env, {
            element: bounds.parentElement(),
            nextSibling
        });
        return state.resume(runtime, elementStack);
    }
}
class UpdatingVMFrame {
    constructor(ops, exceptionHandler) {
        this.ops = ops;
        this.exceptionHandler = exceptionHandler;
        this.current = ops.head();
    }
    goto(op) {
        this.current = op;
    }
    nextStatement() {
        let { current, ops } = this;
        if (current) this.current = ops.nextNode(current);
        return current;
    }
    handleException() {
        if (this.exceptionHandler) {
            this.exceptionHandler.handleException();
        }
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3J1bnRpbWUvbGliL3ZtL3VwZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFlQTtBQUNFO0FBQ0EsT0FGRixFQUdFLEtBSEYsRUFJRSxNQUpGLEVBS0UsUUFMRixFQU1FLGtCQU5GLEVBVUUsWUFWRixFQVdFLE9BWEYsRUFhRSxvQkFiRixFQWdCRSxHQWhCRixRQWlCTyxvQkFqQlA7QUFrQkEsU0FBUyxTQUFULEVBQTRCLFVBQTVCLEVBQWdELEtBQWhELFFBQTZELGVBQTdEO0FBRUEsU0FBUyxRQUFRLFVBQWpCLFFBQW1DLFdBQW5DO0FBQ0EsU0FBUyxVQUFULEVBQXFCLE1BQXJCLFFBQW1DLGFBQW5DO0FBQ0EsU0FBUyxjQUFULFFBQThDLFlBQTlDO0FBRUEsU0FBUyxpQkFBVCxRQUFrQyxtQkFBbEM7QUFFQSxlQUFjLE1BQU8sVUFBUCxDQUFpQjtBQU83QixnQkFBWSxHQUFaLEVBQThCLEVBQUUsbUJBQW1CLEtBQXJCLEVBQTlCLEVBQTBEO0FBRmxELGFBQUEsVUFBQSxHQUFxQyxJQUFJLEtBQUosRUFBckM7QUFHTixhQUFLLEdBQUwsR0FBVyxHQUFYO0FBQ0EsYUFBSyxHQUFMLEdBQVcsSUFBSSxNQUFKLEVBQVg7QUFDQSxhQUFLLGdCQUFMLEdBQXdCLGdCQUF4QjtBQUNEO0FBRUQsWUFBUSxPQUFSLEVBQWdDLE9BQWhDLEVBQXlEO0FBQ3ZELFlBQUksRUFBRSxVQUFGLEtBQWlCLElBQXJCO0FBRUEsYUFBSyxHQUFMLENBQVMsT0FBVCxFQUFrQixPQUFsQjtBQUVBLGVBQU8sSUFBUCxFQUFhO0FBQ1gsZ0JBQUksV0FBVyxPQUFYLEVBQUosRUFBMEI7QUFFMUIsZ0JBQUksU0FBUyxLQUFLLEtBQUwsQ0FBVyxhQUFYLEVBQWI7QUFFQSxnQkFBSSxXQUFXLElBQWYsRUFBcUI7QUFDbkIsMkJBQVcsR0FBWDtBQUNBO0FBQ0Q7QUFFRCxtQkFBTyxRQUFQLENBQWdCLElBQWhCO0FBQ0Q7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YW1pY1Njb3BlLFxuICBFbnZpcm9ubWVudCxcbiAgRXhjZXB0aW9uSGFuZGxlcixcbiAgR2xpbW1lclRyZWVDaGFuZ2VzLFxuICBKaXRPckFvdEJsb2NrLFxuICBSdW50aW1lQ29udGV4dCxcbiAgU2NvcGUsXG4gIEFvdFJ1bnRpbWVDb250ZXh0LFxuICBKaXRSdW50aW1lQ29udGV4dCxcbiAgRWxlbWVudEJ1aWxkZXIsXG4gIExpdmVCbG9jayxcbiAgVXBkYXRhYmxlQmxvY2ssXG59IGZyb20gJ0BnbGltbWVyL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtcbiAgLy8gVGFnc1xuICBjb21iaW5lLFxuICB2YWx1ZSxcbiAgdXBkYXRlLFxuICB2YWxpZGF0ZSxcbiAgY3JlYXRlVXBkYXRhYmxlVGFnLFxuICBUYWcsXG4gIFVwZGF0YWJsZVRhZyxcbiAgUmV2aXNpb24sXG4gIGNvbWJpbmVTbGljZSxcbiAgSU5JVElBTCxcbiAgSXRlcmF0aW9uQXJ0aWZhY3RzLFxuICBJdGVyYXRvclN5bmNocm9uaXplcixcbiAgSXRlcmF0b3JTeW5jaHJvbml6ZXJEZWxlZ2F0ZSxcbiAgUGF0aFJlZmVyZW5jZSxcbiAgRU5ELFxufSBmcm9tICdAZ2xpbW1lci9yZWZlcmVuY2UnO1xuaW1wb3J0IHsgYXNzb2NpYXRlLCBleHBlY3QsIExpbmtlZExpc3QsIE9wdGlvbiwgU3RhY2sgfSBmcm9tICdAZ2xpbW1lci91dGlsJztcbmltcG9ydCB7IFNpbXBsZUNvbW1lbnQsIFNpbXBsZU5vZGUgfSBmcm9tICdAc2ltcGxlLWRvbS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgbW92ZSBhcyBtb3ZlQm91bmRzIH0gZnJvbSAnLi4vYm91bmRzJztcbmltcG9ydCB7IGFzeW5jUmVzZXQsIGRldGFjaCB9IGZyb20gJy4uL2xpZmV0aW1lJztcbmltcG9ydCB7IFVwZGF0aW5nT3Bjb2RlLCBVcGRhdGluZ09wU2VxIH0gZnJvbSAnLi4vb3Bjb2Rlcyc7XG5pbXBvcnQgeyBJbnRlcm5hbFZNLCBWbUluaXRDYWxsYmFjaywgSml0Vk0gfSBmcm9tICcuL2FwcGVuZCc7XG5pbXBvcnQgeyBOZXdFbGVtZW50QnVpbGRlciB9IGZyb20gJy4vZWxlbWVudC1idWlsZGVyJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBkYXRpbmdWTSB7XG4gIHB1YmxpYyBlbnY6IEVudmlyb25tZW50O1xuICBwdWJsaWMgZG9tOiBHbGltbWVyVHJlZUNoYW5nZXM7XG4gIHB1YmxpYyBhbHdheXNSZXZhbGlkYXRlOiBib29sZWFuO1xuXG4gIHByaXZhdGUgZnJhbWVTdGFjazogU3RhY2s8VXBkYXRpbmdWTUZyYW1lPiA9IG5ldyBTdGFjazxVcGRhdGluZ1ZNRnJhbWU+KCk7XG5cbiAgY29uc3RydWN0b3IoZW52OiBFbnZpcm9ubWVudCwgeyBhbHdheXNSZXZhbGlkYXRlID0gZmFsc2UgfSkge1xuICAgIHRoaXMuZW52ID0gZW52O1xuICAgIHRoaXMuZG9tID0gZW52LmdldERPTSgpO1xuICAgIHRoaXMuYWx3YXlzUmV2YWxpZGF0ZSA9IGFsd2F5c1JldmFsaWRhdGU7XG4gIH1cblxuICBleGVjdXRlKG9wY29kZXM6IFVwZGF0aW5nT3BTZXEsIGhhbmRsZXI6IEV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgICBsZXQgeyBmcmFtZVN0YWNrIH0gPSB0aGlzO1xuXG4gICAgdGhpcy50cnkob3Bjb2RlcywgaGFuZGxlcik7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGZyYW1lU3RhY2suaXNFbXB0eSgpKSBicmVhaztcblxuICAgICAgbGV0IG9wY29kZSA9IHRoaXMuZnJhbWUubmV4dFN0YXRlbWVudCgpO1xuXG4gICAgICBpZiAob3Bjb2RlID09PSBudWxsKSB7XG4gICAgICAgIGZyYW1lU3RhY2sucG9wKCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBvcGNvZGUuZXZhbHVhdGUodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXQgZnJhbWUoKSB7XG4gICAgcmV0dXJuIGV4cGVjdCh0aGlzLmZyYW1lU3RhY2suY3VycmVudCwgJ2J1ZzogZXhwZWN0ZWQgYSBmcmFtZScpO1xuICB9XG5cbiAgZ290byhvcDogVXBkYXRpbmdPcGNvZGUpIHtcbiAgICB0aGlzLmZyYW1lLmdvdG8ob3ApO1xuICB9XG5cbiAgdHJ5KG9wczogVXBkYXRpbmdPcFNlcSwgaGFuZGxlcjogT3B0aW9uPEV4Y2VwdGlvbkhhbmRsZXI+KSB7XG4gICAgdGhpcy5mcmFtZVN0YWNrLnB1c2gobmV3IFVwZGF0aW5nVk1GcmFtZShvcHMsIGhhbmRsZXIpKTtcbiAgfVxuXG4gIHRocm93KCkge1xuICAgIHRoaXMuZnJhbWUuaGFuZGxlRXhjZXB0aW9uKCk7XG4gICAgdGhpcy5mcmFtZVN0YWNrLnBvcCgpO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVk1TdGF0ZSB7XG4gIHJlYWRvbmx5IHBjOiBudW1iZXI7XG4gIHJlYWRvbmx5IHNjb3BlOiBTY29wZTxKaXRPckFvdEJsb2NrPjtcbiAgcmVhZG9ubHkgZHluYW1pY1Njb3BlOiBEeW5hbWljU2NvcGU7XG4gIHJlYWRvbmx5IHN0YWNrOiB1bmtub3duW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdW1hYmxlVk1TdGF0ZTxWIGV4dGVuZHMgSW50ZXJuYWxWTT4ge1xuICByZXN1bWUocnVudGltZTogUnVudGltZUNvbnRleHQsIGJ1aWxkZXI6IEVsZW1lbnRCdWlsZGVyKTogVjtcbn1cblxuZXhwb3J0IGNsYXNzIFJlc3VtYWJsZVZNU3RhdGVJbXBsPFYgZXh0ZW5kcyBJbnRlcm5hbFZNPiBpbXBsZW1lbnRzIFJlc3VtYWJsZVZNU3RhdGU8Vj4ge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBzdGF0ZTogVk1TdGF0ZSwgcHJpdmF0ZSByZXN1bWVDYWxsYmFjazogVm1Jbml0Q2FsbGJhY2s8Vj4pIHt9XG5cbiAgcmVzdW1lKFxuICAgIHJ1bnRpbWU6IFYgZXh0ZW5kcyBKaXRWTSA/IEppdFJ1bnRpbWVDb250ZXh0IDogQW90UnVudGltZUNvbnRleHQsXG4gICAgYnVpbGRlcjogRWxlbWVudEJ1aWxkZXJcbiAgKTogViB7XG4gICAgcmV0dXJuIHRoaXMucmVzdW1lQ2FsbGJhY2socnVudGltZSwgdGhpcy5zdGF0ZSwgYnVpbGRlcik7XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJsb2NrT3Bjb2RlIGV4dGVuZHMgVXBkYXRpbmdPcGNvZGUgaW1wbGVtZW50cyBCb3VuZHMge1xuICBwdWJsaWMgdHlwZSA9ICdibG9jayc7XG4gIHB1YmxpYyBuZXh0ID0gbnVsbDtcbiAgcHVibGljIHByZXYgPSBudWxsO1xuICByZWFkb25seSBjaGlsZHJlbjogTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT47XG5cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGJvdW5kczogTGl2ZUJsb2NrO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCBzdGF0ZTogUmVzdW1hYmxlVk1TdGF0ZTxJbnRlcm5hbFZNPixcbiAgICBwcm90ZWN0ZWQgcnVudGltZTogUnVudGltZUNvbnRleHQsXG4gICAgYm91bmRzOiBMaXZlQmxvY2ssXG4gICAgY2hpbGRyZW46IExpbmtlZExpc3Q8VXBkYXRpbmdPcGNvZGU+XG4gICkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgdGhpcy5ib3VuZHMgPSBib3VuZHM7XG4gIH1cblxuICBhYnN0cmFjdCBkaWRJbml0aWFsaXplQ2hpbGRyZW4oKTogdm9pZDtcblxuICBwYXJlbnRFbGVtZW50KCkge1xuICAgIHJldHVybiB0aGlzLmJvdW5kcy5wYXJlbnRFbGVtZW50KCk7XG4gIH1cblxuICBmaXJzdE5vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuYm91bmRzLmZpcnN0Tm9kZSgpO1xuICB9XG5cbiAgbGFzdE5vZGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuYm91bmRzLmxhc3ROb2RlKCk7XG4gIH1cblxuICBldmFsdWF0ZSh2bTogVXBkYXRpbmdWTSkge1xuICAgIHZtLnRyeSh0aGlzLmNoaWxkcmVuLCBudWxsKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJ5T3Bjb2RlIGV4dGVuZHMgQmxvY2tPcGNvZGUgaW1wbGVtZW50cyBFeGNlcHRpb25IYW5kbGVyIHtcbiAgcHVibGljIHR5cGUgPSAndHJ5JztcblxuICBwdWJsaWMgdGFnOiBUYWc7XG5cbiAgcHJpdmF0ZSBfdGFnOiBVcGRhdGFibGVUYWc7XG5cbiAgcHJvdGVjdGVkIGJvdW5kcyE6IFVwZGF0YWJsZUJsb2NrOyAvLyBIaWRlcyBwcm9wZXJ0eSBvbiBiYXNlIGNsYXNzXG5cbiAgY29uc3RydWN0b3IoXG4gICAgc3RhdGU6IFJlc3VtYWJsZVZNU3RhdGU8SW50ZXJuYWxWTT4sXG4gICAgcnVudGltZTogUnVudGltZUNvbnRleHQsXG4gICAgYm91bmRzOiBVcGRhdGFibGVCbG9jayxcbiAgICBjaGlsZHJlbjogTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT5cbiAgKSB7XG4gICAgc3VwZXIoc3RhdGUsIHJ1bnRpbWUsIGJvdW5kcywgY2hpbGRyZW4pO1xuICAgIHRoaXMudGFnID0gdGhpcy5fdGFnID0gY3JlYXRlVXBkYXRhYmxlVGFnKCk7XG4gIH1cblxuICBkaWRJbml0aWFsaXplQ2hpbGRyZW4oKSB7XG4gICAgdXBkYXRlKHRoaXMuX3RhZywgY29tYmluZVNsaWNlKHRoaXMuY2hpbGRyZW4pKTtcbiAgfVxuXG4gIGV2YWx1YXRlKHZtOiBVcGRhdGluZ1ZNKSB7XG4gICAgdm0udHJ5KHRoaXMuY2hpbGRyZW4sIHRoaXMpO1xuICB9XG5cbiAgaGFuZGxlRXhjZXB0aW9uKCkge1xuICAgIGxldCB7IHN0YXRlLCBib3VuZHMsIGNoaWxkcmVuLCBwcmV2LCBuZXh0LCBydW50aW1lIH0gPSB0aGlzO1xuXG4gICAgY2hpbGRyZW4uY2xlYXIoKTtcbiAgICBhc3luY1Jlc2V0KHRoaXMsIHJ1bnRpbWUuZW52KTtcblxuICAgIGxldCBlbGVtZW50U3RhY2sgPSBOZXdFbGVtZW50QnVpbGRlci5yZXN1bWUocnVudGltZS5lbnYsIGJvdW5kcyk7XG4gICAgbGV0IHZtID0gc3RhdGUucmVzdW1lKHJ1bnRpbWUsIGVsZW1lbnRTdGFjayk7XG5cbiAgICBsZXQgdXBkYXRpbmcgPSBuZXcgTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT4oKTtcblxuICAgIGxldCByZXN1bHQgPSB2bS5leGVjdXRlKHZtID0+IHtcbiAgICAgIHZtLnB1c2hVcGRhdGluZyh1cGRhdGluZyk7XG4gICAgICB2bS51cGRhdGVXaXRoKHRoaXMpO1xuICAgICAgdm0ucHVzaFVwZGF0aW5nKGNoaWxkcmVuKTtcbiAgICB9KTtcblxuICAgIGFzc29jaWF0ZSh0aGlzLCByZXN1bHQuZHJvcCk7XG5cbiAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgIHRoaXMubmV4dCA9IG5leHQ7XG4gIH1cbn1cblxuY2xhc3MgTGlzdFJldmFsaWRhdGlvbkRlbGVnYXRlIGltcGxlbWVudHMgSXRlcmF0b3JTeW5jaHJvbml6ZXJEZWxlZ2F0ZTxFbnZpcm9ubWVudD4ge1xuICBwcml2YXRlIG1hcDogTWFwPHVua25vd24sIEJsb2NrT3Bjb2RlPjtcbiAgcHJpdmF0ZSB1cGRhdGluZzogTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT47XG5cbiAgcHJpdmF0ZSBkaWRJbnNlcnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBkaWREZWxldGUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wY29kZTogTGlzdEJsb2NrT3Bjb2RlLCBwcml2YXRlIG1hcmtlcjogU2ltcGxlQ29tbWVudCkge1xuICAgIHRoaXMubWFwID0gb3Bjb2RlLm1hcDtcbiAgICB0aGlzLnVwZGF0aW5nID0gb3Bjb2RlWydjaGlsZHJlbiddO1xuICB9XG5cbiAgaW5zZXJ0KFxuICAgIF9lbnY6IEVudmlyb25tZW50LFxuICAgIGtleTogdW5rbm93bixcbiAgICBpdGVtOiBQYXRoUmVmZXJlbmNlPHVua25vd24+LFxuICAgIG1lbW86IFBhdGhSZWZlcmVuY2U8dW5rbm93bj4sXG4gICAgYmVmb3JlOiB1bmtub3duXG4gICkge1xuICAgIGxldCB7IG1hcCwgb3Bjb2RlLCB1cGRhdGluZyB9ID0gdGhpcztcbiAgICBsZXQgbmV4dFNpYmxpbmc6IE9wdGlvbjxTaW1wbGVOb2RlPiA9IG51bGw7XG4gICAgbGV0IHJlZmVyZW5jZTogT3B0aW9uPEJsb2NrT3Bjb2RlPiA9IG51bGw7XG5cbiAgICBpZiAodHlwZW9mIGJlZm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlZmVyZW5jZSA9IG1hcC5nZXQoYmVmb3JlKSE7XG4gICAgICBuZXh0U2libGluZyA9IHJlZmVyZW5jZVsnYm91bmRzJ10uZmlyc3ROb2RlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRTaWJsaW5nID0gdGhpcy5tYXJrZXI7XG4gICAgfVxuXG4gICAgbGV0IHZtID0gb3Bjb2RlLnZtRm9ySW5zZXJ0aW9uKG5leHRTaWJsaW5nKTtcbiAgICBsZXQgdHJ5T3Bjb2RlOiBPcHRpb248VHJ5T3Bjb2RlPiA9IG51bGw7XG5cbiAgICB2bS5leGVjdXRlKHZtID0+IHtcbiAgICAgIHRyeU9wY29kZSA9IHZtLml0ZXJhdGUobWVtbywgaXRlbSk7XG4gICAgICBtYXAuc2V0KGtleSwgdHJ5T3Bjb2RlKTtcbiAgICAgIHZtLnB1c2hVcGRhdGluZyhuZXcgTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT4oKSk7XG4gICAgICB2bS51cGRhdGVXaXRoKHRyeU9wY29kZSk7XG4gICAgICB2bS5wdXNoVXBkYXRpbmcodHJ5T3Bjb2RlLmNoaWxkcmVuKTtcbiAgICB9KTtcblxuICAgIHVwZGF0aW5nLmluc2VydEJlZm9yZSh0cnlPcGNvZGUhLCByZWZlcmVuY2UpO1xuXG4gICAgdGhpcy5kaWRJbnNlcnQgPSB0cnVlO1xuICB9XG5cbiAgcmV0YWluKFxuICAgIF9lbnY6IEVudmlyb25tZW50LFxuICAgIF9rZXk6IHVua25vd24sXG4gICAgX2l0ZW06IFBhdGhSZWZlcmVuY2U8dW5rbm93bj4sXG4gICAgX21lbW86IFBhdGhSZWZlcmVuY2U8dW5rbm93bj5cbiAgKSB7fVxuXG4gIG1vdmUoXG4gICAgX2VudjogRW52aXJvbm1lbnQsXG4gICAga2V5OiB1bmtub3duLFxuICAgIF9pdGVtOiBQYXRoUmVmZXJlbmNlPHVua25vd24+LFxuICAgIF9tZW1vOiBQYXRoUmVmZXJlbmNlPHVua25vd24+LFxuICAgIGJlZm9yZTogdW5rbm93blxuICApIHtcbiAgICBsZXQgeyBtYXAsIHVwZGF0aW5nIH0gPSB0aGlzO1xuXG4gICAgbGV0IGVudHJ5ID0gbWFwLmdldChrZXkpITtcblxuICAgIGlmIChiZWZvcmUgPT09IEVORCkge1xuICAgICAgbW92ZUJvdW5kcyhlbnRyeSwgdGhpcy5tYXJrZXIpO1xuICAgICAgdXBkYXRpbmcucmVtb3ZlKGVudHJ5KTtcbiAgICAgIHVwZGF0aW5nLmFwcGVuZChlbnRyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByZWZlcmVuY2UgPSBtYXAuZ2V0KGJlZm9yZSkhO1xuICAgICAgbW92ZUJvdW5kcyhlbnRyeSwgcmVmZXJlbmNlLmZpcnN0Tm9kZSgpKTtcbiAgICAgIHVwZGF0aW5nLnJlbW92ZShlbnRyeSk7XG4gICAgICB1cGRhdGluZy5pbnNlcnRCZWZvcmUoZW50cnksIHJlZmVyZW5jZSk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKGVudjogRW52aXJvbm1lbnQsIGtleTogdW5rbm93bikge1xuICAgIGxldCB7IG1hcCwgdXBkYXRpbmcgfSA9IHRoaXM7XG4gICAgbGV0IG9wY29kZSA9IG1hcC5nZXQoa2V5KSE7XG4gICAgZGV0YWNoKG9wY29kZSwgZW52KTtcbiAgICB1cGRhdGluZy5yZW1vdmUob3Bjb2RlKTtcbiAgICBtYXAuZGVsZXRlKGtleSk7XG5cbiAgICB0aGlzLmRpZERlbGV0ZSA9IHRydWU7XG4gIH1cblxuICBkb25lKCkge1xuICAgIHRoaXMub3Bjb2RlLmRpZEluaXRpYWxpemVDaGlsZHJlbih0aGlzLmRpZEluc2VydCB8fCB0aGlzLmRpZERlbGV0ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExpc3RCbG9ja09wY29kZSBleHRlbmRzIEJsb2NrT3Bjb2RlIHtcbiAgcHVibGljIHR5cGUgPSAnbGlzdC1ibG9jayc7XG4gIHB1YmxpYyBtYXAgPSBuZXcgTWFwPHVua25vd24sIEJsb2NrT3Bjb2RlPigpO1xuICBwdWJsaWMgYXJ0aWZhY3RzOiBJdGVyYXRpb25BcnRpZmFjdHM7XG4gIHB1YmxpYyB0YWc6IFRhZztcblxuICBwcml2YXRlIGxhc3RJdGVyYXRlZDogUmV2aXNpb24gPSBJTklUSUFMO1xuICBwcml2YXRlIF90YWc6IFVwZGF0YWJsZVRhZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdGF0ZTogUmVzdW1hYmxlVk1TdGF0ZTxJbnRlcm5hbFZNPixcbiAgICBydW50aW1lOiBSdW50aW1lQ29udGV4dCxcbiAgICBib3VuZHM6IExpdmVCbG9jayxcbiAgICBjaGlsZHJlbjogTGlua2VkTGlzdDxVcGRhdGluZ09wY29kZT4sXG4gICAgYXJ0aWZhY3RzOiBJdGVyYXRpb25BcnRpZmFjdHNcbiAgKSB7XG4gICAgc3VwZXIoc3RhdGUsIHJ1bnRpbWUsIGJvdW5kcywgY2hpbGRyZW4pO1xuICAgIHRoaXMuYXJ0aWZhY3RzID0gYXJ0aWZhY3RzO1xuICAgIGxldCBfdGFnID0gKHRoaXMuX3RhZyA9IGNyZWF0ZVVwZGF0YWJsZVRhZygpKTtcbiAgICB0aGlzLnRhZyA9IGNvbWJpbmUoW2FydGlmYWN0cy50YWcsIF90YWddKTtcbiAgfVxuXG4gIGRpZEluaXRpYWxpemVDaGlsZHJlbihsaXN0RGlkQ2hhbmdlID0gdHJ1ZSkge1xuICAgIHRoaXMubGFzdEl0ZXJhdGVkID0gdmFsdWUodGhpcy5hcnRpZmFjdHMudGFnKTtcblxuICAgIGlmIChsaXN0RGlkQ2hhbmdlKSB7XG4gICAgICB1cGRhdGUodGhpcy5fdGFnLCBjb21iaW5lU2xpY2UodGhpcy5jaGlsZHJlbikpO1xuICAgIH1cbiAgfVxuXG4gIGV2YWx1YXRlKHZtOiBVcGRhdGluZ1ZNKSB7XG4gICAgbGV0IHsgYXJ0aWZhY3RzLCBsYXN0SXRlcmF0ZWQgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXZhbGlkYXRlKGFydGlmYWN0cy50YWcsIGxhc3RJdGVyYXRlZCkpIHtcbiAgICAgIGxldCB7IGJvdW5kcyB9ID0gdGhpcztcbiAgICAgIGxldCB7IGRvbSB9ID0gdm07XG5cbiAgICAgIGxldCBtYXJrZXIgPSBkb20uY3JlYXRlQ29tbWVudCgnJyk7XG4gICAgICBkb20uaW5zZXJ0QWZ0ZXIoXG4gICAgICAgIGJvdW5kcy5wYXJlbnRFbGVtZW50KCksXG4gICAgICAgIG1hcmtlcixcbiAgICAgICAgZXhwZWN0KGJvdW5kcy5sYXN0Tm9kZSgpLCBcImNhbid0IGluc2VydCBhZnRlciBhbiBlbXB0eSBib3VuZHNcIilcbiAgICAgICk7XG5cbiAgICAgIGxldCB0YXJnZXQgPSBuZXcgTGlzdFJldmFsaWRhdGlvbkRlbGVnYXRlKHRoaXMsIG1hcmtlcik7XG4gICAgICBsZXQgc3luY2hyb25pemVyID0gbmV3IEl0ZXJhdG9yU3luY2hyb25pemVyKHsgdGFyZ2V0LCBhcnRpZmFjdHMsIGVudjogdm0uZW52IH0pO1xuXG4gICAgICBzeW5jaHJvbml6ZXIuc3luYygpO1xuXG4gICAgICB0aGlzLnBhcmVudEVsZW1lbnQoKS5yZW1vdmVDaGlsZChtYXJrZXIpO1xuICAgIH1cblxuICAgIC8vIFJ1biBub3ctdXBkYXRlZCB1cGRhdGluZyBvcGNvZGVzXG4gICAgc3VwZXIuZXZhbHVhdGUodm0pO1xuICB9XG5cbiAgdm1Gb3JJbnNlcnRpb24obmV4dFNpYmxpbmc6IE9wdGlvbjxTaW1wbGVOb2RlPik6IEludGVybmFsVk08Sml0T3JBb3RCbG9jaz4ge1xuICAgIGxldCB7IGJvdW5kcywgc3RhdGUsIHJ1bnRpbWUgfSA9IHRoaXM7XG5cbiAgICBsZXQgZWxlbWVudFN0YWNrID0gTmV3RWxlbWVudEJ1aWxkZXIuZm9ySW5pdGlhbFJlbmRlcihydW50aW1lLmVudiwge1xuICAgICAgZWxlbWVudDogYm91bmRzLnBhcmVudEVsZW1lbnQoKSxcbiAgICAgIG5leHRTaWJsaW5nLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN0YXRlLnJlc3VtZShydW50aW1lLCBlbGVtZW50U3RhY2spO1xuICB9XG59XG5cbmNsYXNzIFVwZGF0aW5nVk1GcmFtZSB7XG4gIHByaXZhdGUgY3VycmVudDogT3B0aW9uPFVwZGF0aW5nT3Bjb2RlPjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wczogVXBkYXRpbmdPcFNlcSwgcHJpdmF0ZSBleGNlcHRpb25IYW5kbGVyOiBPcHRpb248RXhjZXB0aW9uSGFuZGxlcj4pIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBvcHMuaGVhZCgpO1xuICB9XG5cbiAgZ290byhvcDogVXBkYXRpbmdPcGNvZGUpIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBvcDtcbiAgfVxuXG4gIG5leHRTdGF0ZW1lbnQoKTogT3B0aW9uPFVwZGF0aW5nT3Bjb2RlPiB7XG4gICAgbGV0IHsgY3VycmVudCwgb3BzIH0gPSB0aGlzO1xuICAgIGlmIChjdXJyZW50KSB0aGlzLmN1cnJlbnQgPSBvcHMubmV4dE5vZGUoY3VycmVudCk7XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH1cblxuICBoYW5kbGVFeGNlcHRpb24oKSB7XG4gICAgaWYgKHRoaXMuZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgdGhpcy5leGNlcHRpb25IYW5kbGVyLmhhbmRsZUV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==