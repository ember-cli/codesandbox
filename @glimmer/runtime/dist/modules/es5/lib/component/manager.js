function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { MINIMAL_CAPABILITIES } from './interfaces';
import { UNDEFINED_REFERENCE } from '../references';
export var SimpleComponentManager = function () {
    function SimpleComponentManager() {
        _classCallCheck(this, SimpleComponentManager);
    }

    SimpleComponentManager.prototype.getCapabilities = function getCapabilities(_state) {
        return MINIMAL_CAPABILITIES;
    };

    SimpleComponentManager.prototype.prepareArgs = function prepareArgs(_state, _args) {
        throw new Error('Unimplemented prepareArgs in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.create = function create(_env, _state, _args, _dynamicScope, _caller, _hasDefaultBlock) {
        throw new Error('Unimplemented create in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.getSelf = function getSelf(_state) {
        return UNDEFINED_REFERENCE;
    };

    SimpleComponentManager.prototype.getTag = function getTag(_state) {
        throw new Error('Unimplemented getTag in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.didRenderLayout = function didRenderLayout(_state, _bounds) {
        throw new Error('Unimplemented didRenderLayout in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.didCreate = function didCreate(_state) {
        throw new Error('Unimplemented didCreate in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.update = function update(_state, _dynamicScope) {
        throw new Error('Unimplemented update in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.didUpdateLayout = function didUpdateLayout(_state, _bounds) {
        throw new Error('Unimplemented didUpdateLayout in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.didUpdate = function didUpdate(_state) {
        throw new Error('Unimplemented didUpdate in SimpleComponentManager');
    };

    SimpleComponentManager.prototype.getDestructor = function getDestructor(_state) {
        return null;
    };

    return SimpleComponentManager;
}();
export var TEMPLATE_ONLY_COMPONENT = {
    state: null,
    manager: new SimpleComponentManager()
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3J1bnRpbWUvbGliL2NvbXBvbmVudC9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBY0EsU0FBQSxvQkFBQSxRQUFBLGNBQUE7QUFFQSxTQUFBLG1CQUFBLFFBQUEsZUFBQTtBQUVBLFdBQU0sc0JBQU47QUFBQTtBQUFBO0FBQUE7O0FBQUEscUNBQ0UsZUFERiw0QkFDRSxNQURGLEVBQ2tEO0FBQzlDLGVBQUEsb0JBQUE7QUFDRCxLQUhIOztBQUFBLHFDQUtFLFdBTEYsd0JBS0UsTUFMRixFQUtFLEtBTEYsRUFLa0U7QUFDOUQsY0FBTSxJQUFOLEtBQU0sdURBQU47QUFDRCxLQVBIOztBQUFBLHFDQVNFLE1BVEYsbUJBU0UsSUFURixFQVNFLE1BVEYsRUFTRSxLQVRGLEVBU0UsYUFURixFQVNFLE9BVEYsRUFTRSxnQkFURixFQWU2QjtBQUV6QixjQUFNLElBQU4sS0FBTSxrREFBTjtBQUNELEtBbEJIOztBQUFBLHFDQW9CRSxPQXBCRixvQkFvQkUsTUFwQkYsRUFvQndDO0FBQ3BDLGVBQUEsbUJBQUE7QUFDRCxLQXRCSDs7QUFBQSxxQ0F3QkUsTUF4QkYsbUJBd0JFLE1BeEJGLEVBd0J1QztBQUNuQyxjQUFNLElBQU4sS0FBTSxrREFBTjtBQUNELEtBMUJIOztBQUFBLHFDQTRCRSxlQTVCRiw0QkE0QkUsTUE1QkYsRUE0QkUsT0E1QkYsRUE0QmlFO0FBQzdELGNBQU0sSUFBTixLQUFNLDJEQUFOO0FBQ0QsS0E5Qkg7O0FBQUEscUNBZ0NFLFNBaENGLHNCQWdDRSxNQWhDRixFQWdDMEM7QUFDdEMsY0FBTSxJQUFOLEtBQU0scURBQU47QUFDRCxLQWxDSDs7QUFBQSxxQ0FvQ0UsTUFwQ0YsbUJBb0NFLE1BcENGLEVBb0NFLGFBcENGLEVBb0M0RTtBQUN4RSxjQUFNLElBQU4sS0FBTSxrREFBTjtBQUNELEtBdENIOztBQUFBLHFDQXdDRSxlQXhDRiw0QkF3Q0UsTUF4Q0YsRUF3Q0UsT0F4Q0YsRUF3Q2lFO0FBQzdELGNBQU0sSUFBTixLQUFNLDJEQUFOO0FBQ0QsS0ExQ0g7O0FBQUEscUNBNENFLFNBNUNGLHNCQTRDRSxNQTVDRixFQTRDMEM7QUFDdEMsY0FBTSxJQUFOLEtBQU0scURBQU47QUFDRCxLQTlDSDs7QUFBQSxxQ0FnREUsYUFoREYsMEJBZ0RFLE1BaERGLEVBZ0Q4QztBQUMxQyxlQUFBLElBQUE7QUFDRCxLQWxESDs7QUFBQTtBQUFBO0FBcURBLE9BQU8sSUFBTSwwQkFBMEI7QUFDckMsV0FEcUMsSUFBQTtBQUVyQyxhQUFTLElBQUEsc0JBQUE7QUFGNEIsQ0FBaEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnRNYW5hZ2VyLFxuICBDb21wb25lbnREZWZpbml0aW9uU3RhdGUsXG4gIFZNQXJndW1lbnRzLFxuICBDb21wb25lbnRDYXBhYmlsaXRpZXMsXG4gIE9wdGlvbixcbiAgRHluYW1pY1Njb3BlLFxuICBDb21wb25lbnRJbnN0YW5jZVN0YXRlLFxuICBQcmVwYXJlZEFyZ3VtZW50cyxcbiAgQm91bmRzLFxuICBTeW1ib2xEZXN0cm95YWJsZSxcbiAgRGVzdHJveWFibGUsXG4gIEVudmlyb25tZW50LFxufSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IE1JTklNQUxfQ0FQQUJJTElUSUVTIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IFZlcnNpb25lZFBhdGhSZWZlcmVuY2UsIFRhZyB9IGZyb20gJ0BnbGltbWVyL3JlZmVyZW5jZSc7XG5pbXBvcnQgeyBVTkRFRklORURfUkVGRVJFTkNFIH0gZnJvbSAnLi4vcmVmZXJlbmNlcyc7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVDb21wb25lbnRNYW5hZ2VyIGltcGxlbWVudHMgQ29tcG9uZW50TWFuYWdlciB7XG4gIGdldENhcGFiaWxpdGllcyhfc3RhdGU6IENvbXBvbmVudERlZmluaXRpb25TdGF0ZSk6IENvbXBvbmVudENhcGFiaWxpdGllcyB7XG4gICAgcmV0dXJuIE1JTklNQUxfQ0FQQUJJTElUSUVTO1xuICB9XG5cbiAgcHJlcGFyZUFyZ3MoX3N0YXRlOiBDb21wb25lbnREZWZpbml0aW9uU3RhdGUsIF9hcmdzOiBWTUFyZ3VtZW50cyk6IE9wdGlvbjxQcmVwYXJlZEFyZ3VtZW50cz4ge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5pbXBsZW1lbnRlZCBwcmVwYXJlQXJncyBpbiBTaW1wbGVDb21wb25lbnRNYW5hZ2VyYCk7XG4gIH1cblxuICBjcmVhdGUoXG4gICAgX2VudjogRW52aXJvbm1lbnQsXG4gICAgX3N0YXRlOiBDb21wb25lbnREZWZpbml0aW9uU3RhdGUsXG4gICAgX2FyZ3M6IE9wdGlvbjxWTUFyZ3VtZW50cz4sXG4gICAgX2R5bmFtaWNTY29wZTogT3B0aW9uPER5bmFtaWNTY29wZT4sXG4gICAgX2NhbGxlcjogT3B0aW9uPFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+LFxuICAgIF9oYXNEZWZhdWx0QmxvY2s6IGJvb2xlYW5cbiAgKTogQ29tcG9uZW50SW5zdGFuY2VTdGF0ZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmltcGxlbWVudGVkIGNyZWF0ZSBpbiBTaW1wbGVDb21wb25lbnRNYW5hZ2VyYCk7XG4gIH1cblxuICBnZXRTZWxmKF9zdGF0ZTogQ29tcG9uZW50SW5zdGFuY2VTdGF0ZSk6IFZlcnNpb25lZFBhdGhSZWZlcmVuY2Uge1xuICAgIHJldHVybiBVTkRFRklORURfUkVGRVJFTkNFO1xuICB9XG5cbiAgZ2V0VGFnKF9zdGF0ZTogQ29tcG9uZW50SW5zdGFuY2VTdGF0ZSk6IFRhZyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmltcGxlbWVudGVkIGdldFRhZyBpbiBTaW1wbGVDb21wb25lbnRNYW5hZ2VyYCk7XG4gIH1cblxuICBkaWRSZW5kZXJMYXlvdXQoX3N0YXRlOiBDb21wb25lbnRJbnN0YW5jZVN0YXRlLCBfYm91bmRzOiBCb3VuZHMpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuaW1wbGVtZW50ZWQgZGlkUmVuZGVyTGF5b3V0IGluIFNpbXBsZUNvbXBvbmVudE1hbmFnZXJgKTtcbiAgfVxuXG4gIGRpZENyZWF0ZShfc3RhdGU6IENvbXBvbmVudEluc3RhbmNlU3RhdGUpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuaW1wbGVtZW50ZWQgZGlkQ3JlYXRlIGluIFNpbXBsZUNvbXBvbmVudE1hbmFnZXJgKTtcbiAgfVxuXG4gIHVwZGF0ZShfc3RhdGU6IENvbXBvbmVudEluc3RhbmNlU3RhdGUsIF9keW5hbWljU2NvcGU6IE9wdGlvbjxEeW5hbWljU2NvcGU+KTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmltcGxlbWVudGVkIHVwZGF0ZSBpbiBTaW1wbGVDb21wb25lbnRNYW5hZ2VyYCk7XG4gIH1cblxuICBkaWRVcGRhdGVMYXlvdXQoX3N0YXRlOiBDb21wb25lbnRJbnN0YW5jZVN0YXRlLCBfYm91bmRzOiBCb3VuZHMpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuaW1wbGVtZW50ZWQgZGlkVXBkYXRlTGF5b3V0IGluIFNpbXBsZUNvbXBvbmVudE1hbmFnZXJgKTtcbiAgfVxuXG4gIGRpZFVwZGF0ZShfc3RhdGU6IENvbXBvbmVudEluc3RhbmNlU3RhdGUpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuaW1wbGVtZW50ZWQgZGlkVXBkYXRlIGluIFNpbXBsZUNvbXBvbmVudE1hbmFnZXJgKTtcbiAgfVxuXG4gIGdldERlc3RydWN0b3IoX3N0YXRlOiBDb21wb25lbnRJbnN0YW5jZVN0YXRlKTogT3B0aW9uPFN5bWJvbERlc3Ryb3lhYmxlIHwgRGVzdHJveWFibGU+IHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgVEVNUExBVEVfT05MWV9DT01QT05FTlQgPSB7XG4gIHN0YXRlOiBudWxsLFxuICBtYW5hZ2VyOiBuZXcgU2ltcGxlQ29tcG9uZW50TWFuYWdlcigpLFxufTtcbiJdLCJzb3VyY2VSb290IjoiIn0=