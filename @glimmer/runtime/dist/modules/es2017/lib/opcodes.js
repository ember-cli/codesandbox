import { initializeGuid, fillNulls, assert } from '@glimmer/util';

import { $pc, $sp, $ra, $fp } from '@glimmer/vm';
// these import bindings will be stripped from build

import { DESTRUCTOR_STACK, INNER_VM, STACKS } from './symbols';
import { CURSOR_STACK } from './vm/element-builder';
import { isScopeReference } from './environment';
export class AppendOpcodes {
    constructor() {
        this.evaluateOpcode = fillNulls(90 /* Size */).slice();
    }
    add(name, evaluate, kind = 'syscall') {
        this.evaluateOpcode[name] = {
            syscall: kind !== 'machine',
            evaluate
        };
    }
    debugBefore(vm, opcode) {
        let params = undefined;
        let opName = undefined;
        if (false) {
            let pos = vm[INNER_VM].fetchRegister($pc) - opcode.size;
            [opName, params] = [];
            // console.log(`${typePos(vm['pc'])}.`);
            console.log(`${pos}. ${''}`);
            let debugParams = [];
            for (let prop in params) {
                debugParams.push(prop, '=', params[prop]);
            }
            console.log(...debugParams);
        }
        let sp;
        if (false) {
            sp = vm.fetchValue($sp);
        }

        return {
            sp: sp,
            pc: vm.fetchValue($pc),
            name: opName,
            params,
            type: opcode.type,
            isMachine: opcode.isMachine,
            size: opcode.size,
            state: undefined
        };
    }
    debugAfter(vm, pre) {
        let { sp, type, isMachine, pc } = pre;
        if (false) {
            let meta = type;
            let actualChange = vm.fetchValue($sp) - sp;
            if (meta && meta.check && typeof meta.stackChange === 'number' && meta.stackChange !== actualChange) {
                throw new Error(`Error in ${pre.name}:\n\n${pc}. ${''}\n\nStack changed by ${actualChange}, expected ${meta.stackChange}`);
            }
            console.log('%c -> pc: %d, ra: %d, fp: %d, sp: %d, s0: %O, s1: %O, t0: %O, t1: %O, v0: %O', 'color: orange', vm[INNER_VM].registers[$pc], vm[INNER_VM].registers[$ra], vm[INNER_VM].registers[$fp], vm[INNER_VM].registers[$sp], vm['s0'], vm['s1'], vm['t0'], vm['t1'], vm['v0']);
            console.log('%c -> eval stack', 'color: red', vm.stack.toArray());
            console.log('%c -> block stack', 'color: magenta', vm.elements().debugBlocks());
            console.log('%c -> destructor stack', 'color: violet', vm[DESTRUCTOR_STACK].toArray());
            if (vm[STACKS].scope.current === null) {
                console.log('%c -> scope', 'color: green', 'null');
            } else {
                console.log('%c -> scope', 'color: green', vm.scope().slots.map(s => isScopeReference(s) ? s.value() : s));
            }
            console.log('%c -> elements', 'color: blue', vm.elements()[CURSOR_STACK].current.element);
            console.log('%c -> constructing', 'color: aqua', vm.elements()['constructing']);
        }
    }
    evaluate(vm, opcode, type) {
        let operation = this.evaluateOpcode[type];
        if (operation.syscall) {
            (false && assert(!opcode.isMachine, `BUG: Mismatch between operation.syscall (${operation.syscall}) and opcode.isMachine (${opcode.isMachine}) for ${opcode.type}`));

            operation.evaluate(vm, opcode);
        } else {
            (false && assert(opcode.isMachine, `BUG: Mismatch between operation.syscall (${operation.syscall}) and opcode.isMachine (${opcode.isMachine}) for ${opcode.type}`));

            operation.evaluate(vm[INNER_VM], opcode);
        }
    }
}
export const APPEND_OPCODES = new AppendOpcodes();
export class AbstractOpcode {
    constructor() {
        initializeGuid(this);
    }
}
export class UpdatingOpcode extends AbstractOpcode {
    constructor() {
        super(...arguments);
        this.next = null;
        this.prev = null;
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3J1bnRpbWUvbGliL29wY29kZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsU0FBcUMsY0FBckMsRUFBcUQsU0FBckQsRUFBZ0UsTUFBaEUsUUFBOEUsZUFBOUU7O0FBRUEsU0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixFQUF3QixHQUF4QixRQUFtQyxhQUFuQztBQUlBOztBQUVBLFNBQVMsZ0JBQVQsRUFBMkIsUUFBM0IsRUFBZ0QsTUFBaEQsUUFBOEQsV0FBOUQ7QUFFQSxTQUFTLFlBQVQsUUFBNkIsc0JBQTdCO0FBQ0EsU0FBUyxnQkFBVCxRQUFpQyxlQUFqQztBQWtDQSxPQUFNLE1BQU8sYUFBUCxDQUFvQjtBQUExQixrQkFBQTtBQUNVLGFBQUEsY0FBQSxHQUE2QixVQUFTLEVBQVQsQ0FBUyxVQUFULEVBQTZCLEtBQTdCLEVBQTdCO0FBNEhUO0FBdkhDLFFBQ0UsSUFERixFQUVFLFFBRkYsRUFHRSxPQUFPLFNBSFQsRUFHa0I7QUFFaEIsYUFBSyxjQUFMLENBQW9CLElBQXBCLElBQXNDO0FBQ3BDLHFCQUFTLFNBQVMsU0FEa0I7QUFFcEM7QUFGb0MsU0FBdEM7QUFJRDtBQUVELGdCQUFZLEVBQVosRUFBbUMsTUFBbkMsRUFBb0Q7QUFDbEQsWUFBSSxTQUFzQixTQUExQjtBQUNBLFlBQUksU0FBNkIsU0FBakM7QUFFQSxtQkFBVztBQUNULGdCQUFJLE1BQU0sR0FBRyxRQUFILEVBQWEsYUFBYixDQUEyQixHQUEzQixJQUFrQyxPQUFPLElBQW5EO0FBRUEsYUFBQyxNQUFELEVBQVMsTUFBVDtBQUVBO0FBQ0Esb0JBQVEsR0FBUixDQUFZLEdBQUcsR0FBRyxLQUFOLEVBQW9DLEVBQWhEO0FBRUEsZ0JBQUksY0FBYyxFQUFsQjtBQUNBLGlCQUFLLElBQUksSUFBVCxJQUFpQixNQUFqQixFQUF5QjtBQUN2Qiw0QkFBWSxJQUFaLENBQWlCLElBQWpCLEVBQXVCLEdBQXZCLEVB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LFVBQVUsT0FBTywyQkFBMkIsT0FBTyxTQUFTLFNBQVMsT0FBTyxJQUFJLEVBRjlILENBRHFCOztBQUtyQixzQkFBVSxRQUFWLENBQW1CLEVBQW5CLEVBQXVCLE1BQXZCO0FBQ0QsU0FORCxNQU1PO0FBQUEsc0JBQ0wsT0FDRSxPQUFPLFNBRFQsRUFFRSw0Q0FBNEMsVUFBVSxPQUFPLDJCQUEyQixPQUFPLFNBQVMsU0FBUyxPQUFPLElBQUksRUFGOUgsQ0FESzs7QUFLTCxzQkFBVSxRQUFWLENBQW1CLEdBQUcsUUFBSCxDQUFuQixFQUFpQyxNQUFqQztBQUNEO0FBQ0Y7QUE1SHVCO0FBK0gxQixPQUFPLE1BQU0saUJBQWlCLElBQUksYUFBSixFQUF2QjtBQUVQLE9BQU0sTUFBZ0IsY0FBaEIsQ0FBOEI7QUFJbEMsa0JBQUE7QUFDRSx1QkFBZSxJQUFmO0FBQ0Q7QUFOaUM7QUFTcEMsT0FBTSxNQUFnQixjQUFoQixTQUF1QyxjQUF2QyxDQUFxRDtBQUEzRCxrQkFBQTs7QUFHRSxhQUFBLElBQUEsR0FBK0IsSUFBL0I7QUFDQSxhQUFBLElBQUEsR0FBK0IsSUFBL0I7QUFHRDtBQVAwRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvd0xldmVsVk0sIFZNLCBVcGRhdGluZ1ZNIH0gZnJvbSAnLi92bSc7XG5cbmltcG9ydCB7IE9wdGlvbiwgU2xpY2UgYXMgTGlzdFNsaWNlLCBpbml0aWFsaXplR3VpZCwgZmlsbE51bGxzLCBhc3NlcnQgfSBmcm9tICdAZ2xpbW1lci91dGlsJztcbmltcG9ydCB7IHJlY29yZFN0YWNrU2l6ZSwgb3Bjb2RlTWV0YWRhdGEgfSBmcm9tICdAZ2xpbW1lci9kZWJ1Zyc7XG5pbXBvcnQgeyAkcGMsICRzcCwgJHJhLCAkZnAgfSBmcm9tICdAZ2xpbW1lci92bSc7XG5pbXBvcnQgeyBUYWcgfSBmcm9tICdAZ2xpbW1lci9yZWZlcmVuY2UnO1xuaW1wb3J0IHsgUnVudGltZU9wLCBPcCwgSml0T3JBb3RCbG9jaywgTWF5YmUsIERpY3QgfSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IERFQlVHLCBERVZNT0RFIH0gZnJvbSAnQGdsaW1tZXIvbG9jYWwtZGVidWctZmxhZ3MnO1xuLy8gdGhlc2UgaW1wb3J0IGJpbmRpbmdzIHdpbGwgYmUgc3RyaXBwZWQgZnJvbSBidWlsZFxuaW1wb3J0IHsgZGVidWcsIGxvZ09wY29kZSB9IGZyb20gJ0BnbGltbWVyL29wY29kZS1jb21waWxlcic7XG5pbXBvcnQgeyBERVNUUlVDVE9SX1NUQUNLLCBJTk5FUl9WTSwgQ09OU1RBTlRTLCBTVEFDS1MgfSBmcm9tICcuL3N5bWJvbHMnO1xuaW1wb3J0IHsgSW50ZXJuYWxWTSwgSW50ZXJuYWxKaXRWTSB9IGZyb20gJy4vdm0vYXBwZW5kJztcbmltcG9ydCB7IENVUlNPUl9TVEFDSyB9IGZyb20gJy4vdm0vZWxlbWVudC1idWlsZGVyJztcbmltcG9ydCB7IGlzU2NvcGVSZWZlcmVuY2UgfSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuZXhwb3J0IGludGVyZmFjZSBPcGNvZGVKU09OIHtcbiAgdHlwZTogbnVtYmVyIHwgc3RyaW5nO1xuICBndWlkPzogT3B0aW9uPG51bWJlcj47XG4gIGRlb3B0ZWQ/OiBib29sZWFuO1xuICBhcmdzPzogc3RyaW5nW107XG4gIGRldGFpbHM/OiBEaWN0PE9wdGlvbjxzdHJpbmc+PjtcbiAgY2hpbGRyZW4/OiBPcGNvZGVKU09OW107XG59XG5cbmV4cG9ydCB0eXBlIE9wZXJhbmQxID0gbnVtYmVyO1xuZXhwb3J0IHR5cGUgT3BlcmFuZDIgPSBudW1iZXI7XG5leHBvcnQgdHlwZSBPcGVyYW5kMyA9IG51bWJlcjtcblxuZXhwb3J0IHR5cGUgU3lzY2FsbCA9ICh2bTogSW50ZXJuYWxWTTxKaXRPckFvdEJsb2NrPiwgb3Bjb2RlOiBSdW50aW1lT3ApID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBKaXRTeXNjYWxsID0gKHZtOiBJbnRlcm5hbEppdFZNLCBvcGNvZGU6IFJ1bnRpbWVPcCkgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIE1hY2hpbmVPcGNvZGUgPSAodm06IExvd0xldmVsVk0sIG9wY29kZTogUnVudGltZU9wKSA9PiB2b2lkO1xuXG5leHBvcnQgdHlwZSBFdmFsdWF0ZSA9XG4gIHwgeyBzeXNjYWxsOiB0cnVlOyBldmFsdWF0ZTogU3lzY2FsbCB9XG4gIHwgeyBzeXNjYWxsOiBmYWxzZTsgZXZhbHVhdGU6IE1hY2hpbmVPcGNvZGUgfTtcblxuZXhwb3J0IHR5cGUgRGVidWdTdGF0ZSA9IHtcbiAgcGM6IG51bWJlcjtcbiAgc3A6IG51bWJlcjtcbiAgdHlwZTogbnVtYmVyO1xuICBpc01hY2hpbmU6IDAgfCAxO1xuICBzaXplOiBudW1iZXI7XG4gIHBhcmFtcz86IE1heWJlPERpY3Q+O1xuICBuYW1lPzogc3RyaW5nO1xuICBzdGF0ZTogdW5rbm93bjtcbn07XG5cbmV4cG9ydCBjbGFzcyBBcHBlbmRPcGNvZGVzIHtcbiAgcHJpdmF0ZSBldmFsdWF0ZU9wY29kZTogRXZhbHVhdGVbXSA9IGZpbGxOdWxsczxFdmFsdWF0ZT4oT3AuU2l6ZSkuc2xpY2UoKTtcblxuICBhZGQ8TmFtZSBleHRlbmRzIE9wPihuYW1lOiBOYW1lLCBldmFsdWF0ZTogU3lzY2FsbCk6IHZvaWQ7XG4gIGFkZDxOYW1lIGV4dGVuZHMgT3A+KG5hbWU6IE5hbWUsIGV2YWx1YXRlOiBNYWNoaW5lT3Bjb2RlLCBraW5kOiAnbWFjaGluZScpOiB2b2lkO1xuICBhZGQ8TmFtZSBleHRlbmRzIE9wPihuYW1lOiBOYW1lLCBldmFsdWF0ZTogSml0U3lzY2FsbCwga2luZDogJ2ppdCcpOiB2b2lkO1xuICBhZGQ8TmFtZSBleHRlbmRzIE9wPihcbiAgICBuYW1lOiBOYW1lLFxuICAgIGV2YWx1YXRlOiBTeXNjYWxsIHwgSml0U3lzY2FsbCB8IE1hY2hpbmVPcGNvZGUsXG4gICAga2luZCA9ICdzeXNjYWxsJ1xuICApOiB2b2lkIHtcbiAgICB0aGlzLmV2YWx1YXRlT3Bjb2RlW25hbWUgYXMgbnVtYmVyXSA9IHtcbiAgICAgIHN5c2NhbGw6IGtpbmQgIT09ICdtYWNoaW5lJyxcbiAgICAgIGV2YWx1YXRlLFxuICAgIH0gYXMgRXZhbHVhdGU7XG4gIH1cblxuICBkZWJ1Z0JlZm9yZSh2bTogVk08Sml0T3JBb3RCbG9jaz4sIG9wY29kZTogUnVudGltZU9wKTogRGVidWdTdGF0ZSB7XG4gICAgbGV0IHBhcmFtczogTWF5YmU8RGljdD4gPSB1bmRlZmluZWQ7XG4gICAgbGV0IG9wTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKERFQlVHKSB7XG4gICAgICBsZXQgcG9zID0gdm1bSU5ORVJfVk1dLmZldGNoUmVnaXN0ZXIoJHBjKSAtIG9wY29kZS5zaXplO1xuXG4gICAgICBbb3BOYW1lLCBwYXJhbXNdID0gZGVidWcodm1bQ09OU1RBTlRTXSwgdm0ucnVudGltZS5yZXNvbHZlciwgb3Bjb2RlLCBvcGNvZGUuaXNNYWNoaW5lKTtcblxuICAgICAgLy8gY29uc29sZS5sb2coYCR7dHlwZVBvcyh2bVsncGMnXSl9LmApO1xuICAgICAgY29uc29sZS5sb2coYCR7cG9zfS4gJHtsb2dPcGNvZGUob3BOYW1lLCBwYXJhbXMpfWApO1xuXG4gICAgICBsZXQgZGVidWdQYXJhbXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHByb3AgaW4gcGFyYW1zKSB7XG4gICAgICAgIGRlYnVnUGFyYW1zLnB1c2gocHJvcCwgJz0nLCBwYXJhbXNbcHJvcF0pO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyguLi5kZWJ1Z1BhcmFtcyk7XG4gICAgfVxuXG4gICAgbGV0IHNwOiBudW1iZXI7XG5cbiAgICBpZiAoREVWTU9ERSkge1xuICAgICAgc3AgPSB2bS5mZXRjaFZhbHVlKCRzcCk7XG4gICAgfVxuXG4gICAgcmVjb3JkU3RhY2tTaXplKHZtLmZldGNoVmFsdWUoJHNwKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNwOiBzcCEsXG4gICAgICBwYzogdm0uZmV0Y2hWYWx1ZSgkcGMpLFxuICAgICAgbmFtZTogb3BOYW1lLFxuICAgICAgcGFyYW1zLFxuICAgICAgdHlwZTogb3Bjb2RlLnR5cGUsXG4gICAgICBpc01hY2hpbmU6IG9wY29kZS5pc01hY2hpbmUsXG4gICAgICBzaXplOiBvcGNvZGUuc2l6ZSxcbiAgICAgIHN0YXRlOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGRlYnVnQWZ0ZXIodm06IFZNPEppdE9yQW90QmxvY2s+LCBwcmU6IERlYnVnU3RhdGUpIHtcbiAgICBsZXQgeyBzcCwgdHlwZSwgaXNNYWNoaW5lLCBwYyB9ID0gcHJlO1xuXG4gICAgaWYgKERFQlVHKSB7XG4gICAgICBsZXQgbWV0YSA9IG9wY29kZU1ldGFkYXRhKHR5cGUsIGlzTWFjaGluZSk7XG4gICAgICBsZXQgYWN0dWFsQ2hhbmdlID0gdm0uZmV0Y2hWYWx1ZSgkc3ApIC0gc3AhO1xuICAgICAgaWYgKFxuICAgICAgICBtZXRhICYmXG4gICAgICAgIG1ldGEuY2hlY2sgJiZcbiAgICAgICAgdHlwZW9mIG1ldGEuc3RhY2tDaGFuZ2UhID09PSAnbnVtYmVyJyAmJlxuICAgICAgICBtZXRhLnN0YWNrQ2hhbmdlISAhPT0gYWN0dWFsQ2hhbmdlXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFcnJvciBpbiAke3ByZS5uYW1lfTpcXG5cXG4ke3BjfS4gJHtsb2dPcGNvZGUoXG4gICAgICAgICAgICBwcmUubmFtZSEsXG4gICAgICAgICAgICBwcmUucGFyYW1zIVxuICAgICAgICAgICl9XFxuXFxuU3RhY2sgY2hhbmdlZCBieSAke2FjdHVhbENoYW5nZX0sIGV4cGVjdGVkICR7bWV0YS5zdGFja0NoYW5nZSF9YFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgJyVjIC0+IHBjOiAlZCwgcmE6ICVkLCBmcDogJWQsIHNwOiAlZCwgczA6ICVPLCBzMTogJU8sIHQwOiAlTywgdDE6ICVPLCB2MDogJU8nLFxuICAgICAgICAnY29sb3I6IG9yYW5nZScsXG4gICAgICAgIHZtW0lOTkVSX1ZNXS5yZWdpc3RlcnNbJHBjXSxcbiAgICAgICAgdm1bSU5ORVJfVk1dLnJlZ2lzdGVyc1skcmFdLFxuICAgICAgICB2bVtJTk5FUl9WTV0ucmVnaXN0ZXJzWyRmcF0sXG4gICAgICAgIHZtW0lOTkVSX1ZNXS5yZWdpc3RlcnNbJHNwXSxcbiAgICAgICAgdm1bJ3MwJ10sXG4gICAgICAgIHZtWydzMSddLFxuICAgICAgICB2bVsndDAnXSxcbiAgICAgICAgdm1bJ3QxJ10sXG4gICAgICAgIHZtWyd2MCddXG4gICAgICApO1xuICAgICAgY29uc29sZS5sb2coJyVjIC0+IGV2YWwgc3RhY2snLCAnY29sb3I6IHJlZCcsIHZtLnN0YWNrLnRvQXJyYXkoKSk7XG4gICAgICBjb25zb2xlLmxvZygnJWMgLT4gYmxvY2sgc3RhY2snLCAnY29sb3I6IG1hZ2VudGEnLCB2bS5lbGVtZW50cygpLmRlYnVnQmxvY2tzKCkpO1xuICAgICAgY29uc29sZS5sb2coJyVjIC0+IGRlc3RydWN0b3Igc3RhY2snLCAnY29sb3I6IHZpb2xldCcsIHZtW0RFU1RSVUNUT1JfU1RBQ0tdLnRvQXJyYXkoKSk7XG4gICAgICBpZiAodm1bU1RBQ0tTXS5zY29wZS5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCclYyAtPiBzY29wZScsICdjb2xvcjogZ3JlZW4nLCAnbnVsbCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgJyVjIC0+IHNjb3BlJyxcbiAgICAgICAgICAnY29sb3I6IGdyZWVuJyxcbiAgICAgICAgICB2bS5zY29wZSgpLnNsb3RzLm1hcChzID0+IChpc1Njb3BlUmVmZXJlbmNlKHMpID8gcy52YWx1ZSgpIDogcykpXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCclYyAtPiBlbGVtZW50cycsICdjb2xvcjogYmx1ZScsIHZtLmVsZW1lbnRzKClbQ1VSU09SX1NUQUNLXS5jdXJyZW50IS5lbGVtZW50KTtcblxuICAgICAgY29uc29sZS5sb2coJyVjIC0+IGNvbnN0cnVjdGluZycsICdjb2xvcjogYXF1YScsIHZtLmVsZW1lbnRzKClbJ2NvbnN0cnVjdGluZyddKTtcbiAgICB9XG4gIH1cblxuICBldmFsdWF0ZSh2bTogVk08Sml0T3JBb3RCbG9jaz4sIG9wY29kZTogUnVudGltZU9wLCB0eXBlOiBudW1iZXIpIHtcbiAgICBsZXQgb3BlcmF0aW9uID0gdGhpcy5ldmFsdWF0ZU9wY29kZVt0eXBlXTtcblxuICAgIGlmIChvcGVyYXRpb24uc3lzY2FsbCkge1xuICAgICAgYXNzZXJ0KFxuICAgICAgICAhb3Bjb2RlLmlzTWFjaGluZSxcbiAgICAgICAgYEJVRzogTWlzbWF0Y2ggYmV0d2VlbiBvcGVyYXRpb24uc3lzY2FsbCAoJHtvcGVyYXRpb24uc3lzY2FsbH0pIGFuZCBvcGNvZGUuaXNNYWNoaW5lICgke29wY29kZS5pc01hY2hpbmV9KSBmb3IgJHtvcGNvZGUudHlwZX1gXG4gICAgICApO1xuICAgICAgb3BlcmF0aW9uLmV2YWx1YXRlKHZtLCBvcGNvZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIG9wY29kZS5pc01hY2hpbmUsXG4gICAgICAgIGBCVUc6IE1pc21hdGNoIGJldHdlZW4gb3BlcmF0aW9uLnN5c2NhbGwgKCR7b3BlcmF0aW9uLnN5c2NhbGx9KSBhbmQgb3Bjb2RlLmlzTWFjaGluZSAoJHtvcGNvZGUuaXNNYWNoaW5lfSkgZm9yICR7b3Bjb2RlLnR5cGV9YFxuICAgICAgKTtcbiAgICAgIG9wZXJhdGlvbi5ldmFsdWF0ZSh2bVtJTk5FUl9WTV0sIG9wY29kZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBBUFBFTkRfT1BDT0RFUyA9IG5ldyBBcHBlbmRPcGNvZGVzKCk7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBYnN0cmFjdE9wY29kZSB7XG4gIHB1YmxpYyBhYnN0cmFjdCB0eXBlOiBzdHJpbmc7XG4gIHB1YmxpYyBfZ3VpZCE6IG51bWJlcjsgLy8gU2V0IGJ5IGluaXRpYWxpemVHdWlkKCkgaW4gdGhlIGNvbnN0cnVjdG9yXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaW5pdGlhbGl6ZUd1aWQodGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFVwZGF0aW5nT3Bjb2RlIGV4dGVuZHMgQWJzdHJhY3RPcGNvZGUge1xuICBwdWJsaWMgYWJzdHJhY3QgdGFnOiBUYWc7XG5cbiAgbmV4dDogT3B0aW9uPFVwZGF0aW5nT3Bjb2RlPiA9IG51bGw7XG4gIHByZXY6IE9wdGlvbjxVcGRhdGluZ09wY29kZT4gPSBudWxsO1xuXG4gIGFic3RyYWN0IGV2YWx1YXRlKHZtOiBVcGRhdGluZ1ZNKTogdm9pZDtcbn1cblxuZXhwb3J0IHR5cGUgVXBkYXRpbmdPcFNlcSA9IExpc3RTbGljZTxVcGRhdGluZ09wY29kZT47XG4iXSwic291cmNlUm9vdCI6IiJ9