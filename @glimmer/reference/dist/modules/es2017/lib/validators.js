import { assert } from '@glimmer/util';

const symbol = typeof Symbol !== 'undefined' ? Symbol : key => `__${key}${Math.floor(Math.random() * Date.now())}__`;
export const CONSTANT = 0;
export const INITIAL = 1;
export const VOLATILE = 9007199254740991; // MAX_INT
let $REVISION = INITIAL;
export function bump() {
    $REVISION++;
}
//////////
export const COMPUTE = symbol('TAG_COMPUTE');
//////////
/**
 * `value` receives a tag and returns an opaque Revision based on that tag. This
 * snapshot can then later be passed to `validate` with the same tag to
 * determine if the tag has changed at all since the time that `value` was
 * called.
 *
 * The current implementation returns the global revision count directly for
 * performance reasons. This is an implementation detail, and should not be
 * relied on directly by users of these APIs. Instead, Revisions should be
 * treated as if they are opaque/unknown, and should only be interacted with via
 * the `value`/`validate` API.
 *
 * @param tag
 */
export function value(_tag) {
    return $REVISION;
}
/**
 * `validate` receives a tag and a snapshot from a previous call to `value` with
 * the same tag, and determines if the tag is still valid compared to the
 * snapshot. If the tag's state has changed at all since then, `validate` will
 * return false, otherwise it will return true. This is used to determine if a
 * calculation related to the tags should be rerun.
 *
 * @param tag
 * @param snapshot
 */
export function validate(tag, snapshot) {
    return snapshot >= tag[COMPUTE]();
}
const TYPE = symbol('TAG_TYPE');
export let ALLOW_CYCLES;
if (false) {
    ALLOW_CYCLES = new WeakSet();
}
export class MonomorphicTagImpl {
    constructor(type) {
        this.revision = INITIAL;
        this.lastChecked = INITIAL;
        this.lastValue = INITIAL;
        this.isUpdating = false;
        this.subtag = null;
        this.subtags = null;
        this[TYPE] = type;
    }
    [COMPUTE]() {
        let { lastChecked } = this;
        if (lastChecked !== $REVISION) {
            this.isUpdating = true;
            this.lastChecked = $REVISION;
            try {
                let { subtags, subtag, revision } = this;
                if (subtag !== null) {
                    revision = Math.max(revision, subtag[COMPUTE]());
                }
                if (subtags !== null) {
                    for (let i = 0; i < subtags.length; i++) {
                        let value = subtags[i][COMPUTE]();
                        revision = Math.max(value, revision);
                    }
                }
                this.lastValue = revision;
            } finally {
                this.isUpdating = false;
            }
        }
        if (this.isUpdating === true) {
            if (false && !ALLOW_CYCLES.has(this)) {
                throw new Error('Cycles in tags are not allowed');
            }
            this.lastChecked = ++$REVISION;
        }
        return this.lastValue;
    }
    static update(_tag, subtag) {
        if (false) {
            (false && assert(_tag[TYPE] === 1 /* Updatable */, 'Attempted to update a tag that was not updatable'));
        }
        // TODO: TS 3.7 should allow us to do this via assertion
        let tag = _tag;
        if (subtag === CONSTANT_TAG) {
            tag.subtag = null;
        } else {
            tag.subtag = subtag;
            // subtag could be another type of tag, e.g. CURRENT_TAG or VOLATILE_TAG.
            // If so, lastChecked/lastValue will be undefined, result in these being
            // NaN. This is fine, it will force the system to recompute.
            tag.lastChecked = Math.min(tag.lastChecked, subtag.lastChecked);
            tag.lastValue = Math.max(tag.lastValue, subtag.lastValue);
        }
    }
    static dirty(tag) {
        if (false) {
            (false && assert(tag[TYPE] === 1 /* Updatable */ || tag[TYPE] === 0 /* Dirtyable */, 'Attempted to dirty a tag that was not dirtyable'));
        }
        tag.revision = ++$REVISION;
    }
}
export const dirty = MonomorphicTagImpl.dirty;
export const update = MonomorphicTagImpl.update;
//////////
export function createTag() {
    return new MonomorphicTagImpl(0 /* Dirtyable */);
}
export function createUpdatableTag() {
    return new MonomorphicTagImpl(1 /* Updatable */);
}
//////////
export const CONSTANT_TAG = new MonomorphicTagImpl(3 /* Constant */);
export function isConst({ tag }) {
    return tag === CONSTANT_TAG;
}
export function isConstTag(tag) {
    return tag === CONSTANT_TAG;
}
//////////
class VolatileTag {
    [COMPUTE]() {
        return VOLATILE;
    }
}
export const VOLATILE_TAG = new VolatileTag();
//////////
class CurrentTag {
    [COMPUTE]() {
        return $REVISION;
    }
}
export const CURRENT_TAG = new CurrentTag();
//////////
export function combineTagged(tagged) {
    let optimized = [];
    for (let i = 0, l = tagged.length; i < l; i++) {
        let tag = tagged[i].tag;
        if (tag === CONSTANT_TAG) continue;
        optimized.push(tag);
    }
    return _combine(optimized);
}
export function combineSlice(slice) {
    let optimized = [];
    let node = slice.head();
    while (node !== null) {
        let tag = node.tag;
        if (tag !== CONSTANT_TAG) optimized.push(tag);
        node = slice.nextNode(node);
    }
    return _combine(optimized);
}
export function combine(tags) {
    let optimized = [];
    for (let i = 0, l = tags.length; i < l; i++) {
        let tag = tags[i];
        if (tag === CONSTANT_TAG) continue;
        optimized.push(tag);
    }
    return _combine(optimized);
}
function _combine(tags) {
    switch (tags.length) {
        case 0:
            return CONSTANT_TAG;
        case 1:
            return tags[0];
        default:
            let tag = new MonomorphicTagImpl(2 /* Combinator */);
            tag.subtags = tags;
            return tag;
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3JlZmVyZW5jZS9saWIvdmFsaWRhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFnQyxNQUFoQyxRQUE4QyxlQUE5Qzs7QUFZQSxNQUFNLFNBQ0osT0FBTyxNQUFQLEtBQWtCLFdBQWxCLEdBQ0ksTUFESixHQUVLLEdBQUQsSUFBaUIsS0FBSyxHQUFHLEdBQUcsS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLEtBQUssR0FBTCxFQUEzQixDQUFzQyxJQUh4RTtBQVNBLE9BQU8sTUFBTSxXQUFxQixDQUEzQjtBQUNQLE9BQU8sTUFBTSxVQUFvQixDQUExQjtBQUNQLE9BQU8sTUFBTSxXQUFxQixnQkFBM0IsQyxDQUE2QztBQUVwRCxJQUFJLFlBQVksT0FBaEI7QUFFQSxPQUFNLFNBQVUsSUFBVixHQUFjO0FBQ2xCO0FBQ0Q7QUFFRDtBQUVBLE9BQU8sTUFBTSxVQUF5QixPQUFPLGFBQVAsQ0FBL0I7QUFnQlA7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFjQSxPQUFNLFNBQVUsS0FBVixDQUFnQixJQUFoQixFQUF5QjtBQUM3QixXQUFPLFNBQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7O0FBVUEsT0FBTSxTQUFVLFFBQVYsQ0FBbUIsR0FBbkIsRUFBNkIsUUFBN0IsRUFBK0M7QUFDbkQsV0FBTyxZQUFZLElBQUksT0FBSixHQUFuQjtBQUNEO0FBaUJELE1BQU0sT0FBc0IsT0FBTyxVQUFQLENBQTVCO0FBRUEsT0FBTyxJQUFJLFlBQUo7QUFFUCxXQUFXO0FBQ1QsbUJBQWUsSUFBSSxPQUFKLEVBQWY7QUFDRDtBQXFCRCxPQUFNLE1BQU8sa0JBQVAsQ0FBeUI7QUFXN0IsZ0JBQVksSUFBWixFQUFxQztBQVY3QixhQUFBLFFBQUEsR0FBVyxPQUFYO0FBQ0EsYUFBQSxXQUFBLEdBQWMsT0FBZDtBQUNBLGFBQUEsU0FBQSxHQUFZLE9BQVo7QUFFQSxhQUFBLFVBQUEsR0FBYSxLQUFiO0FBQ0Es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QjtBQUVBLFNBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLEtBQUssTUFBekIsRUFBaUMsSUFBSSxDQUFyQyxFQUF3QyxHQUF4QyxFQUE2QztBQUMzQyxZQUFJLE1BQU0sS0FBSyxDQUFMLENBQVY7QUFDQSxZQUFJLFFBQVEsWUFBWixFQUEwQjtBQUMxQixrQkFBVSxJQUFWLENBQWUsR0FBZjtBQUNEO0FBRUQsV0FBTyxTQUFTLFNBQVQsQ0FBUDtBQUNEO0FBRUQsU0FBUyxRQUFULENBQWtCLElBQWxCLEVBQTZCO0FBQzNCLFlBQVEsS0FBSyxNQUFiO0FBQ0UsYUFBSyxDQUFMO0FBQ0UsbUJBQU8sWUFBUDtBQUNGLGFBQUssQ0FBTDtBQUNFLG1CQUFPLEtBQUssQ0FBTCxDQUFQO0FBQ0Y7QUFDRSxnQkFBSSxNQUFNLElBQUksa0JBQUosQ0FBc0IsQ0FBdEIsQ0FBc0IsZ0JBQXRCLENBQVY7QUFDQyxnQkFBWSxPQUFaLEdBQXNCLElBQXRCO0FBQ0QsbUJBQU8sR0FBUDtBQVJKO0FBVUQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTbGljZSwgTGlua2VkTGlzdE5vZGUsIGFzc2VydCB9IGZyb20gJ0BnbGltbWVyL3V0aWwnO1xuaW1wb3J0IHsgREVCVUcgfSBmcm9tICdAZ2xpbW1lci9sb2NhbC1kZWJ1Zy1mbGFncyc7XG5cbi8vLy8vLy8vLy9cblxuLy8gdXRpbHNcbnR5cGUgVW5pb25Ub0ludGVyc2VjdGlvbjxVPiA9IChVIGV4dGVuZHMgYW55ID8gKGs6IFUpID0+IHZvaWQgOiBuZXZlcikgZXh0ZW5kcyAoKFxuICBrOiBpbmZlciBJXG4pID0+IHZvaWQpXG4gID8gSVxuICA6IG5ldmVyO1xuXG5jb25zdCBzeW1ib2wgPVxuICB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJ1xuICAgID8gU3ltYm9sXG4gICAgOiAoa2V5OiBzdHJpbmcpID0+IGBfXyR7a2V5fSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogRGF0ZS5ub3coKSl9X19gIGFzIGFueTtcblxuLy8vLy8vLy8vL1xuXG5leHBvcnQgdHlwZSBSZXZpc2lvbiA9IG51bWJlcjtcblxuZXhwb3J0IGNvbnN0IENPTlNUQU5UOiBSZXZpc2lvbiA9IDA7XG5leHBvcnQgY29uc3QgSU5JVElBTDogUmV2aXNpb24gPSAxO1xuZXhwb3J0IGNvbnN0IFZPTEFUSUxFOiBSZXZpc2lvbiA9IDkwMDcxOTkyNTQ3NDA5OTE7IC8vIE1BWF9JTlRcblxubGV0ICRSRVZJU0lPTiA9IElOSVRJQUw7XG5cbmV4cG9ydCBmdW5jdGlvbiBidW1wKCkge1xuICAkUkVWSVNJT04rKztcbn1cblxuLy8vLy8vLy8vL1xuXG5leHBvcnQgY29uc3QgQ09NUFVURTogdW5pcXVlIHN5bWJvbCA9IHN5bWJvbCgnVEFHX0NPTVBVVEUnKTtcblxuZXhwb3J0IGludGVyZmFjZSBFbnRpdHlUYWc8VD4ge1xuICBbQ09NUFVURV0oKTogVDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYWcgZXh0ZW5kcyBFbnRpdHlUYWc8UmV2aXNpb24+IHt9XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW50aXR5VGFnZ2VkPFQ+IHtcbiAgdGFnOiBFbnRpdHlUYWc8VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFnZ2VkIHtcbiAgdGFnOiBUYWc7XG59XG5cbi8vLy8vLy8vLy9cblxuLyoqXG4gKiBgdmFsdWVgIHJlY2VpdmVzIGEgdGFnIGFuZCByZXR1cm5zIGFuIG9wYXF1ZSBSZXZpc2lvbiBiYXNlZCBvbiB0aGF0IHRhZy4gVGhpc1xuICogc25hcHNob3QgY2FuIHRoZW4gbGF0ZXIgYmUgcGFzc2VkIHRvIGB2YWxpZGF0ZWAgd2l0aCB0aGUgc2FtZSB0YWcgdG9cbiAqIGRldGVybWluZSBpZiB0aGUgdGFnIGhhcyBjaGFuZ2VkIGF0IGFsbCBzaW5jZSB0aGUgdGltZSB0aGF0IGB2YWx1ZWAgd2FzXG4gKiBjYWxsZWQuXG4gKlxuICogVGhlIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gcmV0dXJucyB0aGUgZ2xvYmFsIHJldmlzaW9uIGNvdW50IGRpcmVjdGx5IGZvclxuICogcGVyZm9ybWFuY2UgcmVhc29ucy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBkZXRhaWwsIGFuZCBzaG91bGQgbm90IGJlXG4gKiByZWxpZWQgb24gZGlyZWN0bHkgYnkgdXNlcnMgb2YgdGhlc2UgQVBJcy4gSW5zdGVhZCwgUmV2aXNpb25zIHNob3VsZCBiZVxuICogdHJlYXRlZCBhcyBpZiB0aGV5IGFyZSBvcGFxdWUvdW5rbm93biwgYW5kIHNob3VsZCBvbmx5IGJlIGludGVyYWN0ZWQgd2l0aCB2aWFcbiAqIHRoZSBgdmFsdWVgL2B2YWxpZGF0ZWAgQVBJLlxuICpcbiAqIEBwYXJhbSB0YWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbHVlKF90YWc6IFRhZyk6IFJldmlzaW9uIHtcbiAgcmV0dXJuICRSRVZJU0lPTjtcbn1cblxuLyoqXG4gKiBgdmFsaWRhdGVgIHJlY2VpdmVzIGEgdGFnIGFuZCBhIHNuYXBzaG90IGZyb20gYSBwcmV2aW91cyBjYWxsIHRvIGB2YWx1ZWAgd2l0aFxuICogdGhlIHNhbWUgdGFnLCBhbmQgZGV0ZXJtaW5lcyBpZiB0aGUgdGFnIGlzIHN0aWxsIHZhbGlkIGNvbXBhcmVkIHRvIHRoZVxuICogc25hcHNob3QuIElmIHRoZSB0YWcncyBzdGF0ZSBoYXMgY2hhbmdlZCBhdCBhbGwgc2luY2UgdGhlbiwgYHZhbGlkYXRlYCB3aWxsXG4gKiByZXR1cm4gZmFsc2UsIG90aGVyd2lzZSBpdCB3aWxsIHJldHVybiB0cnVlLiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGFcbiAqIGNhbGN1bGF0aW9uIHJlbGF0ZWQgdG8gdGhlIHRhZ3Mgc2hvdWxkIGJlIHJlcnVuLlxuICpcbiAqIEBwYXJhbSB0YWdcbiAqIEBwYXJhbSBzbmFwc2hvdFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGUodGFnOiBUYWcsIHNuYXBzaG90OiBSZXZpc2lvbikge1xuICByZXR1cm4gc25hcHNob3QgPj0gdGFnW0NPTVBVVEVdKCk7XG59XG5cbi8vLy8vLy8vLy9cblxuLyoqXG4gKiBUaGlzIGVudW0gcmVwcmVzZW50cyBhbGwgb2YgdGhlIHBvc3NpYmxlIHRhZyB0eXBlcyBmb3IgdGhlIG1vbm9tb3JwaGljIHRhZyBjbGFzcy5cbiAqIE90aGVyIGN1c3RvbSB0YWcgY2xhc3NlcyBjYW4gZXhpc3QsIHN1Y2ggYXMgQ3VycmVudFRhZyBhbmQgVm9sYXRpbGVUYWcsIGJ1dCBmb3JcbiAqIHBlcmZvcm1hbmNlIHJlYXNvbnMsIGFueSB0eXBlIG9mIHRhZyB0aGF0IGlzIG1lYW50IHRvIGJlIHVzZWQgZnJlcXVlbnRseSBzaG91bGRcbiAqIGJlIGFkZGVkIHRvIHRoZSBtb25vbW9ycGhpYyB0YWcuXG4gKi9cbmNvbnN0IGVudW0gTW9ub21vcnBoaWNUYWdUeXBlcyB7XG4gIERpcnR5YWJsZSxcbiAgVXBkYXRhYmxlLFxuICBDb21iaW5hdG9yLFxuICBDb25zdGFudCxcbn1cblxuY29uc3QgVFlQRTogdW5pcXVlIHN5bWJvbCA9IHN5bWJvbCgnVEFHX1RZUEUnKTtcblxuZXhwb3J0IGxldCBBTExPV19DWUNMRVM6IFdlYWtTZXQ8VXBkYXRhYmxlVGFnPjtcblxuaWYgKERFQlVHKSB7XG4gIEFMTE9XX0NZQ0xFUyA9IG5ldyBXZWFrU2V0KCk7XG59XG5cbmludGVyZmFjZSBNb25vbW9ycGhpY1RhZ0Jhc2U8VCBleHRlbmRzIE1vbm9tb3JwaGljVGFnVHlwZXM+IGV4dGVuZHMgVGFnIHtcbiAgW1RZUEVdOiBUO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpcnR5YWJsZVRhZyBleHRlbmRzIE1vbm9tb3JwaGljVGFnQmFzZTxNb25vbW9ycGhpY1RhZ1R5cGVzLkRpcnR5YWJsZT4ge31cbmV4cG9ydCBpbnRlcmZhY2UgVXBkYXRhYmxlVGFnIGV4dGVuZHMgTW9ub21vcnBoaWNUYWdCYXNlPE1vbm9tb3JwaGljVGFnVHlwZXMuVXBkYXRhYmxlPiB7fVxuZXhwb3J0IGludGVyZmFjZSBDb21iaW5hdG9yVGFnIGV4dGVuZHMgTW9ub21vcnBoaWNUYWdCYXNlPE1vbm9tb3JwaGljVGFnVHlwZXMuQ29tYmluYXRvcj4ge31cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RhbnRUYWcgZXh0ZW5kcyBNb25vbW9ycGhpY1RhZ0Jhc2U8TW9ub21vcnBoaWNUYWdUeXBlcy5Db25zdGFudD4ge31cblxuaW50ZXJmYWNlIE1vbm9tb3JwaGljVGFnTWFwcGluZyB7XG4gIFtNb25vbW9ycGhpY1RhZ1R5cGVzLkRpcnR5YWJsZV06IERpcnR5YWJsZVRhZztcbiAgW01vbm9tb3JwaGljVGFnVHlwZXMuVXBkYXRhYmxlXTogVXBkYXRhYmxlVGFnO1xuICBbTW9ub21vcnBoaWNUYWdUeXBlcy5Db21iaW5hdG9yXTogQ29tYmluYXRvclRhZztcbiAgW01vbm9tb3JwaGljVGFnVHlwZXMuQ29uc3RhbnRdOiBDb25zdGFudFRhZztcbn1cblxudHlwZSBNb25vbW9ycGhpY1RhZyA9IFVuaW9uVG9JbnRlcnNlY3Rpb248TW9ub21vcnBoaWNUYWdNYXBwaW5nW01vbm9tb3JwaGljVGFnVHlwZXNdPjtcbnR5cGUgTW9ub21vcnBoaWNUYWdUeXBlID0gVW5pb25Ub0ludGVyc2VjdGlvbjxNb25vbW9ycGhpY1RhZ1R5cGVzPjtcblxuZXhwb3J0IGNsYXNzIE1vbm9tb3JwaGljVGFnSW1wbCBpbXBsZW1lbnRzIE1vbm9tb3JwaGljVGFnIHtcbiAgcHJpdmF0ZSByZXZpc2lvbiA9IElOSVRJQUw7XG4gIHByaXZhdGUgbGFzdENoZWNrZWQgPSBJTklUSUFMO1xuICBwcml2YXRlIGxhc3RWYWx1ZSA9IElOSVRJQUw7XG5cbiAgcHJpdmF0ZSBpc1VwZGF0aW5nID0gZmFsc2U7XG4gIHByaXZhdGUgc3VidGFnOiBUYWcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdWJ0YWdzOiBUYWdbXSB8IG51bGwgPSBudWxsO1xuXG4gIFtUWVBFXTogTW9ub21vcnBoaWNUYWdUeXBlO1xuXG4gIGNvbnN0cnVjdG9yKHR5cGU6IE1vbm9tb3JwaGljVGFnVHlwZXMpIHtcbiAgICB0aGlzW1RZUEVdID0gdHlwZSBhcyBNb25vbW9ycGhpY1RhZ1R5cGU7XG4gIH1cblxuICBbQ09NUFVURV0oKTogUmV2aXNpb24ge1xuICAgIGxldCB7IGxhc3RDaGVja2VkIH0gPSB0aGlzO1xuXG4gICAgaWYgKGxhc3RDaGVja2VkICE9PSAkUkVWSVNJT04pIHtcbiAgICAgIHRoaXMuaXNVcGRhdGluZyA9IHRydWU7XG4gICAgICB0aGlzLmxhc3RDaGVja2VkID0gJFJFVklTSU9OO1xuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgeyBzdWJ0YWdzLCBzdWJ0YWcsIHJldmlzaW9uIH0gPSB0aGlzO1xuXG4gICAgICAgIGlmIChzdWJ0YWcgIT09IG51bGwpIHtcbiAgICAgICAgICByZXZpc2lvbiA9IE1hdGgubWF4KHJldmlzaW9uLCBzdWJ0YWdbQ09NUFVURV0oKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VidGFncyAhPT0gbnVsbCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3VidGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHZhbHVlID0gc3VidGFnc1tpXVtDT01QVVRFXSgpO1xuICAgICAgICAgICAgcmV2aXNpb24gPSBNYXRoLm1heCh2YWx1ZSwgcmV2aXNpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGFzdFZhbHVlID0gcmV2aXNpb247XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLmlzVXBkYXRpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc1VwZGF0aW5nID09PSB0cnVlKSB7XG4gICAgICBpZiAoREVCVUcgJiYgIUFMTE9XX0NZQ0xFUy5oYXModGhpcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsZXMgaW4gdGFncyBhcmUgbm90IGFsbG93ZWQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sYXN0Q2hlY2tlZCA9ICsrJFJFVklTSU9OO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmxhc3RWYWx1ZTtcbiAgfVxuXG4gIHN0YXRpYyB1cGRhdGUoX3RhZzogVXBkYXRhYmxlVGFnLCBzdWJ0YWc6IFRhZykge1xuICAgIGlmIChERUJVRykge1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBfdGFnW1RZUEVdID09PSBNb25vbW9ycGhpY1RhZ1R5cGVzLlVwZGF0YWJsZSxcbiAgICAgICAgJ0F0dGVtcHRlZCB0byB1cGRhdGUgYSB0YWcgdGhhdCB3YXMgbm90IHVwZGF0YWJsZSdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVFMgMy43IHNob3VsZCBhbGxvdyB1cyB0byBkbyB0aGlzIHZpYSBhc3NlcnRpb25cbiAgICBsZXQgdGFnID0gX3RhZyBhcyBNb25vbW9ycGhpY1RhZ0ltcGw7XG5cbiAgICBpZiAoc3VidGFnID09PSBDT05TVEFOVF9UQUcpIHtcbiAgICAgIHRhZy5zdWJ0YWcgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWcuc3VidGFnID0gc3VidGFnO1xuXG4gICAgICAvLyBzdWJ0YWcgY291bGQgYmUgYW5vdGhlciB0eXBlIG9mIHRhZywgZS5nLiBDVVJSRU5UX1RBRyBvciBWT0xBVElMRV9UQUcuXG4gICAgICAvLyBJZiBzbywgbGFzdENoZWNrZWQvbGFzdFZhbHVlIHdpbGwgYmUgdW5kZWZpbmVkLCByZXN1bHQgaW4gdGhlc2UgYmVpbmdcbiAgICAgIC8vIE5hTi4gVGhpcyBpcyBmaW5lLCBpdCB3aWxsIGZvcmNlIHRoZSBzeXN0ZW0gdG8gcmVjb21wdXRlLlxuICAgICAgdGFnLmxhc3RDaGVja2VkID0gTWF0aC5taW4odGFnLmxhc3RDaGVja2VkLCAoc3VidGFnIGFzIGFueSkubGFzdENoZWNrZWQpO1xuICAgICAgdGFnLmxhc3RWYWx1ZSA9IE1hdGgubWF4KHRhZy5sYXN0VmFsdWUsIChzdWJ0YWcgYXMgYW55KS5sYXN0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBkaXJ0eSh0YWc6IERpcnR5YWJsZVRhZyB8IFVwZGF0YWJsZVRhZykge1xuICAgIGlmIChERUJVRykge1xuICAgICAgYXNzZXJ0KFxuICAgICAgICB0YWdbVFlQRV0gPT09IE1vbm9tb3JwaGljVGFnVHlwZXMuVXBkYXRhYmxlIHx8IHRhZ1tUWVBFXSA9PT0gTW9ub21vcnBoaWNUYWdUeXBlcy5EaXJ0eWFibGUsXG4gICAgICAgICdBdHRlbXB0ZWQgdG8gZGlydHkgYSB0YWcgdGhhdCB3YXMgbm90IGRpcnR5YWJsZSdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgKHRhZyBhcyBNb25vbW9ycGhpY1RhZ0ltcGwpLnJldmlzaW9uID0gKyskUkVWSVNJT047XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRpcnR5ID0gTW9ub21vcnBoaWNUYWdJbXBsLmRpcnR5O1xuZXhwb3J0IGNvbnN0IHVwZGF0ZSA9IE1vbm9tb3JwaGljVGFnSW1wbC51cGRhdGU7XG5cbi8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRhZygpOiBEaXJ0eWFibGVUYWcge1xuICByZXR1cm4gbmV3IE1vbm9tb3JwaGljVGFnSW1wbChNb25vbW9ycGhpY1RhZ1R5cGVzLkRpcnR5YWJsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVcGRhdGFibGVUYWcoKTogVXBkYXRhYmxlVGFnIHtcbiAgcmV0dXJuIG5ldyBNb25vbW9ycGhpY1RhZ0ltcGwoTW9ub21vcnBoaWNUYWdUeXBlcy5VcGRhdGFibGUpO1xufVxuXG4vLy8vLy8vLy8vXG5cbmV4cG9ydCBjb25zdCBDT05TVEFOVF9UQUcgPSBuZXcgTW9ub21vcnBoaWNUYWdJbXBsKE1vbm9tb3JwaGljVGFnVHlwZXMuQ29uc3RhbnQpIGFzIENvbnN0YW50VGFnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNDb25zdCh7IHRhZyB9OiBUYWdnZWQpOiBib29sZWFuIHtcbiAgcmV0dXJuIHRhZyA9PT0gQ09OU1RBTlRfVEFHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb25zdFRhZyh0YWc6IFRhZyk6IHRhZyBpcyBDb25zdGFudFRhZyB7XG4gIHJldHVybiB0YWcgPT09IENPTlNUQU5UX1RBRztcbn1cblxuLy8vLy8vLy8vL1xuXG5jbGFzcyBWb2xhdGlsZVRhZyBpbXBsZW1lbnRzIFRhZyB7XG4gIFtDT01QVVRFXSgpIHtcbiAgICByZXR1cm4gVk9MQVRJTEU7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFZPTEFUSUxFX1RBRyA9IG5ldyBWb2xhdGlsZVRhZygpO1xuXG4vLy8vLy8vLy8vXG5cbmNsYXNzIEN1cnJlbnRUYWcgaW1wbGVtZW50cyBDdXJyZW50VGFnIHtcbiAgW0NPTVBVVEVdKCkge1xuICAgIHJldHVybiAkUkVWSVNJT047XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IENVUlJFTlRfVEFHID0gbmV3IEN1cnJlbnRUYWcoKTtcblxuLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZVRhZ2dlZCh0YWdnZWQ6IFJlYWRvbmx5QXJyYXk8VGFnZ2VkPik6IFRhZyB7XG4gIGxldCBvcHRpbWl6ZWQ6IFRhZ1tdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSB0YWdnZWQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbGV0IHRhZyA9IHRhZ2dlZFtpXS50YWc7XG4gICAgaWYgKHRhZyA9PT0gQ09OU1RBTlRfVEFHKSBjb250aW51ZTtcbiAgICBvcHRpbWl6ZWQucHVzaCh0YWcpO1xuICB9XG5cbiAgcmV0dXJuIF9jb21iaW5lKG9wdGltaXplZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lU2xpY2Uoc2xpY2U6IFNsaWNlPFRhZ2dlZCAmIExpbmtlZExpc3ROb2RlPik6IFRhZyB7XG4gIGxldCBvcHRpbWl6ZWQ6IFRhZ1tdID0gW107XG5cbiAgbGV0IG5vZGUgPSBzbGljZS5oZWFkKCk7XG5cbiAgd2hpbGUgKG5vZGUgIT09IG51bGwpIHtcbiAgICBsZXQgdGFnID0gbm9kZS50YWc7XG5cbiAgICBpZiAodGFnICE9PSBDT05TVEFOVF9UQUcpIG9wdGltaXplZC5wdXNoKHRhZyk7XG5cbiAgICBub2RlID0gc2xpY2UubmV4dE5vZGUobm9kZSk7XG4gIH1cblxuICByZXR1cm4gX2NvbWJpbmUob3B0aW1pemVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmUodGFnczogVGFnW10pOiBUYWcge1xuICBsZXQgb3B0aW1pemVkOiBUYWdbXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwLCBsID0gdGFncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBsZXQgdGFnID0gdGFnc1tpXTtcbiAgICBpZiAodGFnID09PSBDT05TVEFOVF9UQUcpIGNvbnRpbnVlO1xuICAgIG9wdGltaXplZC5wdXNoKHRhZyk7XG4gIH1cblxuICByZXR1cm4gX2NvbWJpbmUob3B0aW1pemVkKTtcbn1cblxuZnVuY3Rpb24gX2NvbWJpbmUodGFnczogVGFnW10pOiBUYWcge1xuICBzd2l0Y2ggKHRhZ3MubGVuZ3RoKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIENPTlNUQU5UX1RBRztcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gdGFnc1swXTtcbiAgICBkZWZhdWx0OlxuICAgICAgbGV0IHRhZyA9IG5ldyBNb25vbW9ycGhpY1RhZ0ltcGwoTW9ub21vcnBoaWNUYWdUeXBlcy5Db21iaW5hdG9yKSBhcyBDb21iaW5hdG9yVGFnO1xuICAgICAgKHRhZyBhcyBhbnkpLnN1YnRhZ3MgPSB0YWdzO1xuICAgICAgcmV0dXJuIHRhZztcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==