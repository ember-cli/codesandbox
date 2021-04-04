'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Registry = function () {
    function Registry(options) {
        _classCallCheck(this, Registry);

        this._registrations = {};
        this._registeredOptions = {};
        this._registeredInjections = {};
        if (options && options.fallback) {
            this._fallback = options.fallback;
        }
    }

    Registry.prototype.register = function register(specifier, factoryDefinition, options) {
        this._registrations[specifier] = factoryDefinition;
        if (options) {
            this._registeredOptions[specifier] = options;
        }
    };

    Registry.prototype.registration = function registration(specifier) {
        var registration = this._registrations[specifier];
        if (registration === undefined && this._fallback) {
            registration = this._fallback.registration(specifier);
        }
        return registration;
    };

    Registry.prototype.unregister = function unregister(specifier) {
        delete this._registrations[specifier];
        delete this._registeredOptions[specifier];
        delete this._registeredInjections[specifier];
    };

    Registry.prototype.registerOption = function registerOption(specifier, option, value) {
        var options = this._registeredOptions[specifier];
        if (!options) {
            options = {};
            this._registeredOptions[specifier] = options;
        }
        options[option] = value;
    };

    Registry.prototype.registeredOption = function registeredOption(specifier, option) {
        var result = void 0;
        var options = this.registeredOptions(specifier);
        if (options) {
            result = options[option];
        }
        if (result === undefined && this._fallback !== undefined) {
            result = this._fallback.registeredOption(specifier, option);
        }
        return result;
    };

    Registry.prototype.registeredOptions = function registeredOptions(specifier) {
        var options = this._registeredOptions[specifier];
        if (options === undefined) {
            var _specifier$split = specifier.split(':'),
                type = _specifier$split[0];

            options = this._registeredOptions[type];
        }
        return options;
    };

    Registry.prototype.unregisterOption = function unregisterOption(specifier, option) {
        var options = this._registeredOptions[specifier];
        if (options) {
            delete options[option];
        }
    };

    Registry.prototype.registerInjection = function registerInjection(specifier, property, source) {
        var injections = this._registeredInjections[specifier];
        if (injections === undefined) {
            this._registeredInjections[specifier] = injections = [];
        }
        injections.push({
            property: property,
            source: source
        });
    };

    Registry.prototype.registeredInjections = function registeredInjections(specifier) {
        var _specifier$split2 = specifier.split(':'),
            type = _specifier$split2[0];

        var injections = this._fallback ? this._fallback.registeredInjections(specifier) : [];
        Array.prototype.push.apply(injections, this._registeredInjections[type]);
        Array.prototype.push.apply(injections, this._registeredInjections[specifier]);
        return injections;
    };

    return Registry;
}();

exports.default = Registry;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvcmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7MkJBd0NFO3NCQUFZLEFBQXlCOzhCQUNuQyxBQUFJOzthQUFDLEFBQWMsaUJBQUcsQUFBRSxBQUFDLEFBQ3pCLEFBQUk7YUFBQyxBQUFrQixxQkFBRyxBQUFFLEFBQUMsQUFDN0IsQUFBSTthQUFDLEFBQXFCLHdCQUFHLEFBQUUsQUFBQyxBQUNoQyxBQUFFLEFBQUM7WUFBQyxBQUFPLFdBQUksQUFBTyxRQUFDLEFBQVEsQUFBQyxVQUFDLEFBQUMsQUFDaEMsQUFBSTtpQkFBQyxBQUFTLFlBQUcsQUFBTyxRQUFDLEFBQVEsQUFBQyxBQUNwQyxBQUFDLEFBQ0g7QUFBQzs7O3VCQUVELEFBQVEsNkJBQUMsQUFBaUIsV0FBRSxBQUF5QyxtQkFBRSxBQUE2QixTQUNsRyxBQUFJO2FBQUMsQUFBYyxlQUFDLEFBQVMsQUFBQyxhQUFHLEFBQWlCLEFBQUMsQUFDbkQsQUFBRSxBQUFDO1lBQUMsQUFBTyxBQUFDLFNBQUMsQUFBQyxBQUNaLEFBQUk7aUJBQUMsQUFBa0IsbUJBQUMsQUFBUyxBQUFDLGFBQUcsQUFBTyxBQUFDLEFBQy9DLEFBQUMsQUFDSDtBQUFDOzs7dUJBRUQsQUFBWSxxQ0FBQyxBQUFpQixXQUM1QjtZQUFJLEFBQVksZUFBRyxBQUFJLEtBQUMsQUFBYyxlQUFDLEFBQVMsQUFBQyxBQUFDLEFBQ2xELEFBQUUsQUFBQztZQUFDLEFBQVksaUJBQUssQUFBUyxhQUFJLEFBQUksS0FBQyxBQUFTLEFBQUMsV0FBQyxBQUFDLEFBQ2pELEFBQVk7MkJBQUcsQUFBSSxLQUFDLEFBQVMsVUFBQyxBQUFZLGFBQUMsQUFBUyxBQUFDLEFBQUMsQUFDeEQsQUFBQztBQUNELEFBQU07ZUFBQyxBQUFZLEFBQUMsQUFDdEIsQUFBQzs7O3VCQUVELEFBQVUsaUNBQUMsQUFBaUIsV0FDMUI7ZUFBTyxBQUFJLEtBQUMs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QkFBQyxBQUFTLEFBQUMsYUFBRyxBQUFFLEFBQUMsQUFDbkcsQUFBSztjQUFDLEFBQVMsVUFBQyxBQUFJLEtBQUMsQUFBSyxNQUFDLEFBQVUsWUFBRSxBQUFJLEtBQUMsQUFBcUIsc0JBQUMsQUFBSSxBQUFDLEFBQUMsQUFBQyxBQUN6RSxBQUFLO2NBQUMsQUFBUyxVQUFDLEFBQUksS0FBQyxBQUFLLE1BQUMsQUFBVSxZQUFFLEFBQUksS0FBQyxBQUFxQixzQkFBQyxBQUFTLEFBQUMsQUFBQyxBQUFDLEFBQzlFLEFBQU07ZUFBQyxBQUFVLEFBQUMsQUFDcEIsQUFBQyxBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGljdCB9IGZyb20gJy4vZGljdCc7XG5pbXBvcnQgeyBGYWN0b3J5LCBGYWN0b3J5RGVmaW5pdGlvbiB9IGZyb20gJy4vZmFjdG9yeSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVnaXN0cmF0aW9uT3B0aW9ucyB7XG4gIHNpbmdsZXRvbj86IGJvb2xlYW47XG4gIGluc3RhbnRpYXRlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmplY3Rpb24ge1xuICBwcm9wZXJ0eTogc3RyaW5nLFxuICBzb3VyY2U6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lzdHJ5V3JpdGVyIHtcbiAgcmVnaXN0ZXIoc3BlY2lmaWVyOiBzdHJpbmcsIGZhY3Rvcnk6IGFueSwgb3B0aW9ucz86IFJlZ2lzdHJhdGlvbk9wdGlvbnMpOiB2b2lkO1xuICB1bnJlZ2lzdGVyKHNwZWNpZmllcjogc3RyaW5nKTogdm9pZDtcbiAgcmVnaXN0ZXJPcHRpb24oc3BlY2lmaWVyOiBzdHJpbmcsIG9wdGlvbjogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZDtcbiAgdW5yZWdpc3Rlck9wdGlvbihzcGVjaWZpZXI6IHN0cmluZywgb3B0aW9uOiBzdHJpbmcpOiB2b2lkO1xuICByZWdpc3RlckluamVjdGlvbihzcGVjaWZpZXI6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgc291cmNlOiBzdHJpbmcpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lzdHJ5UmVhZGVyIHtcbiAgcmVnaXN0cmF0aW9uKHNwZWNpZmllcjogc3RyaW5nKTogYW55O1xuICByZWdpc3RlcmVkT3B0aW9uKHNwZWNpZmllcjogc3RyaW5nLCBvcHRpb246IHN0cmluZyk6IGFueTtcbiAgcmVnaXN0ZXJlZE9wdGlvbnMoc3BlY2lmaWVyOiBzdHJpbmcpOiBhbnk7XG4gIHJlZ2lzdGVyZWRJbmplY3Rpb25zKHNwZWNpZmllcjogc3RyaW5nKTogSW5qZWN0aW9uW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVnaXN0cnlPcHRpb25zIHtcbiAgZmFsbGJhY2s/OiBSZWdpc3RyeVJlYWRlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWdpc3RyeUFjY2Vzc29yIGV4dGVuZHMgUmVnaXN0cnlSZWFkZXIsIFJlZ2lzdHJ5V3JpdGVyIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlZ2lzdHJ5IGltcGxlbWVudHMgUmVnaXN0cnlBY2Nlc3NvciB7XG4gIHByaXZhdGUgX3JlZ2lzdHJhdGlvbnM6IERpY3Q8RmFjdG9yeURlZmluaXRpb248YW55Pj47XG4gIHByaXZhdGUgX3JlZ2lzdGVyZWRPcHRpb25zOiBEaWN0PGFueT47XG4gIHByaXZhdGUgX3JlZ2lzdGVyZWRJbmplY3Rpb25zOiBEaWN0PEluamVjdGlvbltdPjtcbiAgcHJpdmF0ZSBfZmFsbGJhY2s6IFJlZ2lzdHJ5UmVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBSZWdpc3RyeU9wdGlvbnMpIHtcbiAgICB0aGlzLl9yZWdpc3RyYXRpb25zID0ge307XG4gICAgdGhpcy5fcmVnaXN0ZXJlZE9wdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9yZWdpc3RlcmVkSW5qZWN0aW9ucyA9IHt9O1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZmFsbGJhY2spIHtcbiAgICAgIHRoaXMuX2ZhbGxiYWNrID0gb3B0aW9ucy5mYWxsYmFjaztcbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihzcGVjaWZpZXI6IHN0cmluZywgZmFjdG9yeURlZmluaXRpb246IEZhY3RvcnlEZWZpbml0aW9uPGFueT4sIG9wdGlvbnM/OiBSZWdpc3RyYXRpb25PcHRpb25zKTogdm9pZCB7XG4gICAgdGhpcy5fcmVnaXN0cmF0aW9uc1tzcGVjaWZpZXJdID0gZmFjdG9yeURlZmluaXRpb247XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX3JlZ2lzdGVyZWRPcHRpb25zW3NwZWNpZmllcl0gPSBvcHRpb25zO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdHJhdGlvbihzcGVjaWZpZXI6IHN0cmluZyk6IEZhY3RvcnlEZWZpbml0aW9uPGFueT4ge1xuICAgIGxldCByZWdpc3RyYXRpb24gPSB0aGlzLl9yZWdpc3RyYXRpb25zW3NwZWNpZmllcl07XG4gICAgaWYgKHJlZ2lzdHJhdGlvbiA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX2ZhbGxiYWNrKSB7XG4gICAgICByZWdpc3RyYXRpb24gPSB0aGlzLl9mYWxsYmFjay5yZWdpc3RyYXRpb24oc3BlY2lmaWVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZ2lzdHJhdGlvbjtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoc3BlY2lmaWVyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBkZWxldGUgdGhpcy5fcmVnaXN0cmF0aW9uc1tzcGVjaWZpZXJdO1xuICAgIGRlbGV0ZSB0aGlzLl9yZWdpc3RlcmVkT3B0aW9uc1tzcGVjaWZpZXJdO1xuICAgIGRlbGV0ZSB0aGlzLl9yZWdpc3RlcmVkSW5qZWN0aW9uc1tzcGVjaWZpZXJdO1xuICB9XG5cbiAgcmVnaXN0ZXJPcHRpb24oc3BlY2lmaWVyOiBzdHJpbmcsIG9wdGlvbjogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgbGV0IG9wdGlvbnMgPSB0aGlzLl9yZWdpc3RlcmVkT3B0aW9uc1tzcGVjaWZpZXJdO1xuXG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgICB0aGlzLl9yZWdpc3RlcmVkT3B0aW9uc1tzcGVjaWZpZXJdID0gb3B0aW9ucztcbiAgICB9XG5cbiAgICBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJlZ2lzdGVyZWRPcHRpb24oc3BlY2lmaWVyOiBzdHJpbmcsIG9wdGlvbjogc3RyaW5nKTogYW55IHtcbiAgICBsZXQgcmVzdWx0OiBCb29sZWFuO1xuICAgIGxldCBvcHRpb25zID0gdGhpcy5yZWdpc3RlcmVkT3B0aW9ucyhzcGVjaWZpZXIpO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIHJlc3VsdCA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQgJiYgdGhpcy5fZmFsbGJhY2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fZmFsbGJhY2sucmVnaXN0ZXJlZE9wdGlvbihzcGVjaWZpZXIsIG9wdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJlZ2lzdGVyZWRPcHRpb25zKHNwZWNpZmllcjogc3RyaW5nKTogYW55IHtcbiAgICBsZXQgb3B0aW9ucyA9IHRoaXMuX3JlZ2lzdGVyZWRPcHRpb25zW3NwZWNpZmllcl07XG4gICAgaWYgKG9wdGlvbnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IFt0eXBlXSA9IHNwZWNpZmllci5zcGxpdCgnOicpO1xuICAgICAgb3B0aW9ucyA9IHRoaXMuX3JlZ2lzdGVyZWRPcHRpb25zW3R5cGVdO1xuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuXG4gIHVucmVnaXN0ZXJPcHRpb24oc3BlY2lmaWVyOiBzdHJpbmcsIG9wdGlvbjogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IG9wdGlvbnMgPSB0aGlzLl9yZWdpc3RlcmVkT3B0aW9uc1tzcGVjaWZpZXJdO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIGRlbGV0ZSBvcHRpb25zW29wdGlvbl07XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJJbmplY3Rpb24oc3BlY2lmaWVyOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IGluamVjdGlvbnMgPSB0aGlzLl9yZWdpc3RlcmVkSW5qZWN0aW9uc1tzcGVjaWZpZXJdO1xuICAgIGlmIChpbmplY3Rpb25zID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3JlZ2lzdGVyZWRJbmplY3Rpb25zW3NwZWNpZmllcl0gPSBpbmplY3Rpb25zID0gW107XG4gICAgfVxuICAgIGluamVjdGlvbnMucHVzaCh7XG4gICAgICBwcm9wZXJ0eSxcbiAgICAgIHNvdXJjZVxuICAgIH0pO1xuICB9XG5cbiAgcmVnaXN0ZXJlZEluamVjdGlvbnMoc3BlY2lmaWVyOiBzdHJpbmcpOiBJbmplY3Rpb25bXSB7XG4gICAgbGV0IFt0eXBlXSA9IHNwZWNpZmllci5zcGxpdCgnOicpO1xuICAgIGxldCBpbmplY3Rpb25zOiBJbmplY3Rpb25bXSA9IHRoaXMuX2ZhbGxiYWNrID8gdGhpcy5fZmFsbGJhY2sucmVnaXN0ZXJlZEluamVjdGlvbnMoc3BlY2lmaWVyKSA6IFtdO1xuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGluamVjdGlvbnMsIHRoaXMuX3JlZ2lzdGVyZWRJbmplY3Rpb25zW3R5cGVdKTtcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShpbmplY3Rpb25zLCB0aGlzLl9yZWdpc3RlcmVkSW5qZWN0aW9uc1tzcGVjaWZpZXJdKTtcbiAgICByZXR1cm4gaW5qZWN0aW9ucztcbiAgfVxufVxuIl19