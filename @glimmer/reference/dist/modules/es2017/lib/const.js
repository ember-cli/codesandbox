import { CONSTANT_TAG } from './validators';
import { UNDEFINED_REFERENCE } from './property';
export class ConstReference {
    constructor(inner) {
        this.inner = inner;
        this.tag = CONSTANT_TAG;
    }
    value() {
        return this.inner;
    }
    get(_key) {
        return UNDEFINED_REFERENCE;
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3JlZmVyZW5jZS9saWIvY29uc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxZQUFULFFBQWtDLGNBQWxDO0FBRUEsU0FBUyxtQkFBVCxRQUFvQyxZQUFwQztBQUVBLE9BQU0sTUFBTyxjQUFQLENBQXFCO0FBR3pCLGdCQUFzQixLQUF0QixFQUE4QjtBQUFSLGFBQUEsS0FBQSxHQUFBLEtBQUE7QUFGZixhQUFBLEdBQUEsR0FBVyxZQUFYO0FBRTJCO0FBRWxDLFlBQUs7QUFDSCxlQUFPLEtBQUssS0FBWjtBQUNEO0FBRUQsUUFBSSxJQUFKLEVBQWdCO0FBQ2QsZUFBTyxtQkFBUDtBQUNEO0FBWHdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ09OU1RBTlRfVEFHLCBUYWcgfSBmcm9tICcuL3ZhbGlkYXRvcnMnO1xuaW1wb3J0IHsgVmVyc2lvbmVkUGF0aFJlZmVyZW5jZSB9IGZyb20gJy4vcmVmZXJlbmNlJztcbmltcG9ydCB7IFVOREVGSU5FRF9SRUZFUkVOQ0UgfSBmcm9tICcuL3Byb3BlcnR5JztcblxuZXhwb3J0IGNsYXNzIENvbnN0UmVmZXJlbmNlPFQgPSB1bmtub3duPiBpbXBsZW1lbnRzIFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8VD4ge1xuICBwdWJsaWMgdGFnOiBUYWcgPSBDT05TVEFOVF9UQUc7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIGlubmVyOiBUKSB7fVxuXG4gIHZhbHVlKCk6IFQge1xuICAgIHJldHVybiB0aGlzLmlubmVyO1xuICB9XG5cbiAgZ2V0KF9rZXk6IHN0cmluZyk6IFZlcnNpb25lZFBhdGhSZWZlcmVuY2Uge1xuICAgIHJldHVybiBVTkRFRklORURfUkVGRVJFTkNFO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6IiJ9