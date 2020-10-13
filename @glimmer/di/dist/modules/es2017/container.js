export default class Container {
    constructor(registry, resolver = null) {
        this._registry = registry;
        this._resolver = resolver;
        this._lookups = {};
        this._factoryDefinitionLookups = {};
    }
    factoryFor(specifier) {
        let factoryDefinition = this._factoryDefinitionLookups[specifier];
        if (!factoryDefinition) {
            if (this._resolver) {
                factoryDefinition = this._resolver.retrieve(specifier);
            }
            if (!factoryDefinition) {
                factoryDefinition = this._registry.registration(specifier);
            }
            if (factoryDefinition) {
                this._factoryDefinitionLookups[specifier] = factoryDefinition;
            }
        }
        if (!factoryDefinition) {
            return;
        }
        return this.buildFactory(specifier, factoryDefinition);
    }
    lookup(specifier) {
        let singleton = (this._registry.registeredOption(specifier, 'singleton') !== false);
        if (singleton && this._lookups[specifier]) {
            return this._lookups[specifier];
        }
        let factory = this.factoryFor(specifier);
        if (!factory) {
            return;
        }
        if (this._registry.registeredOption(specifier, 'instantiate') === false) {
            return factory.class;
        }
        let object = factory.create();
        if (singleton && object) {
            this._lookups[specifier] = object;
        }
        return object;
    }
    defaultInjections(specifier) {
        return {};
    }
    buildInjections(specifier) {
        let hash = this.defaultInjections(specifier);
        let injections = this._registry.registeredInjections(specifier);
        let injection;
        for (let i = 0; i < injections.length; i++) {
            injection = injections[i];
            hash[injection.property] = this.lookup(injection.source);
        }
        return hash;
    }
    buildFactory(specifier, factoryDefinition) {
        let injections = this.buildInjections(specifier);
        return {
            class: factoryDefinition,
            create(options) {
                let mergedOptions = Object.assign({}, injections, options);
                return factoryDefinition.create(mergedOptions);
            }
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxNQUFNLENBQUMsT0FBTztJQU1aLFlBQVksUUFBd0IsRUFBRSxXQUFxQixJQUFJO1FBQzdELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVELFVBQVUsQ0FBQyxTQUFpQjtRQUMxQixJQUFJLGlCQUFpQixHQUEyQixJQUFJLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFMUYsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDdkIsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO1lBQ2hFLENBQUM7UUFDSCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdkIsTUFBTSxDQUFDO1FBQ1QsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxNQUFNLENBQUMsU0FBaUI7UUFDdEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUVwRixFQUFFLENBQUMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQztRQUV6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFOUIsRUFBRSxDQUFDLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELGlCQUFpQixDQUFDLFNBQWlCO1FBQ2pDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU8sZUFBZSxDQUFDLFNBQWlCO1FBQ3ZDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxJQUFJLFVBQVUsR0FBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3RSxJQUFJLFNBQW9CLENBQUM7UUFFekIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0MsU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVPLFlBQVksQ0FBQyxTQUFpQixFQUFFLGlCQUF5QztRQUMvRSxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWpELE1BQU0sQ0FBQztZQUNMLEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsTUFBTSxDQUFDLE9BQU87Z0JBQ1osSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUUzRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pELENBQUM7U0FDRixDQUFBO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmFjdG9yeSwgRmFjdG9yeURlZmluaXRpb24gfSBmcm9tICcuL2ZhY3RvcnknO1xuaW1wb3J0IHsgUmVnaXN0cnlSZWFkZXIsIEluamVjdGlvbiB9IGZyb20gJy4vcmVnaXN0cnknO1xuaW1wb3J0IHsgUmVzb2x2ZXIgfSBmcm9tICcuL3Jlc29sdmVyJztcbmltcG9ydCB7IERpY3QgfSBmcm9tICcuL2RpY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb250YWluZXIge1xuICBwcml2YXRlIF9yZWdpc3RyeTogUmVnaXN0cnlSZWFkZXI7XG4gIHByaXZhdGUgX3Jlc29sdmVyOiBSZXNvbHZlcjtcbiAgcHJpdmF0ZSBfbG9va3VwczogRGljdDxhbnk+O1xuICBwcml2YXRlIF9mYWN0b3J5RGVmaW5pdGlvbkxvb2t1cHM6IERpY3Q8RmFjdG9yeURlZmluaXRpb248YW55Pj47XG5cbiAgY29uc3RydWN0b3IocmVnaXN0cnk6IFJlZ2lzdHJ5UmVhZGVyLCByZXNvbHZlcjogUmVzb2x2ZXIgPSBudWxsKSB7XG4gICAgdGhpcy5fcmVnaXN0cnkgPSByZWdpc3RyeTtcbiAgICB0aGlzLl9yZXNvbHZlciA9IHJlc29sdmVyO1xuICAgIHRoaXMuX2xvb2t1cHMgPSB7fTtcbiAgICB0aGlzLl9mYWN0b3J5RGVmaW5pdGlvbkxvb2t1cHMgPSB7fTtcbiAgfVxuXG4gIGZhY3RvcnlGb3Ioc3BlY2lmaWVyOiBzdHJpbmcpOiBGYWN0b3J5PGFueT4ge1xuICAgIGxldCBmYWN0b3J5RGVmaW5pdGlvbjogRmFjdG9yeURlZmluaXRpb248YW55PiA9IHRoaXMuX2ZhY3RvcnlEZWZpbml0aW9uTG9va3Vwc1tzcGVjaWZpZXJdO1xuXG4gICAgaWYgKCFmYWN0b3J5RGVmaW5pdGlvbikge1xuICAgICAgaWYgKHRoaXMuX3Jlc29sdmVyKSB7XG4gICAgICAgIGZhY3RvcnlEZWZpbml0aW9uID0gdGhpcy5fcmVzb2x2ZXIucmV0cmlldmUoc3BlY2lmaWVyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmYWN0b3J5RGVmaW5pdGlvbikge1xuICAgICAgICBmYWN0b3J5RGVmaW5pdGlvbiA9IHRoaXMuX3JlZ2lzdHJ5LnJlZ2lzdHJhdGlvbihzcGVjaWZpZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmFjdG9yeURlZmluaXRpb24pIHtcbiAgICAgICAgdGhpcy5fZmFjdG9yeURlZmluaXRpb25Mb29rdXBzW3NwZWNpZmllcl0gPSBmYWN0b3J5RGVmaW5pdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWZhY3RvcnlEZWZpbml0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGRGYWN0b3J5KHNwZWNpZmllciwgZmFjdG9yeURlZmluaXRpb24pO1xuICB9XG5cbiAgbG9va3VwKHNwZWNpZmllcjogc3RyaW5nKTogYW55IHtcbiAgICBsZXQgc2luZ2xldG9uID0gKHRoaXMuX3JlZ2lzdHJ5LnJlZ2lzdGVyZWRPcHRpb24oc3BlY2lmaWVyLCAnc2luZ2xldG9uJykgIT09IGZhbHNlKTtcblxuICAgIGlmIChzaW5nbGV0b24gJiYgdGhpcy5fbG9va3Vwc1tzcGVjaWZpZXJdKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbG9va3Vwc1tzcGVjaWZpZXJdO1xuICAgIH1cblxuICAgIGxldCBmYWN0b3J5ID0gdGhpcy5mYWN0b3J5Rm9yKHNwZWNpZmllcik7XG4gICAgaWYgKCFmYWN0b3J5KSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHRoaXMuX3JlZ2lzdHJ5LnJlZ2lzdGVyZWRPcHRpb24oc3BlY2lmaWVyLCAnaW5zdGFudGlhdGUnKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5LmNsYXNzO1xuICAgIH1cblxuICAgIGxldCBvYmplY3QgPSBmYWN0b3J5LmNyZWF0ZSgpO1xuXG4gICAgaWYgKHNpbmdsZXRvbiAmJiBvYmplY3QpIHtcbiAgICAgIHRoaXMuX2xvb2t1cHNbc3BlY2lmaWVyXSA9IG9iamVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZGVmYXVsdEluamVjdGlvbnMoc3BlY2lmaWVyOiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbmplY3Rpb25zKHNwZWNpZmllcjogc3RyaW5nKTogT2JqZWN0IHtcbiAgICBsZXQgaGFzaCA9IHRoaXMuZGVmYXVsdEluamVjdGlvbnMoc3BlY2lmaWVyKTtcbiAgICBsZXQgaW5qZWN0aW9uczogSW5qZWN0aW9uW10gPSB0aGlzLl9yZWdpc3RyeS5yZWdpc3RlcmVkSW5qZWN0aW9ucyhzcGVjaWZpZXIpO1xuICAgIGxldCBpbmplY3Rpb246IEluamVjdGlvbjtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5qZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaW5qZWN0aW9uID0gaW5qZWN0aW9uc1tpXTtcbiAgICAgIGhhc2hbaW5qZWN0aW9uLnByb3BlcnR5XSA9IHRoaXMubG9va3VwKGluamVjdGlvbi5zb3VyY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEZhY3Rvcnkoc3BlY2lmaWVyOiBzdHJpbmcsIGZhY3RvcnlEZWZpbml0aW9uOiBGYWN0b3J5RGVmaW5pdGlvbjxhbnk+KTogRmFjdG9yeTxhbnk+IHtcbiAgICBsZXQgaW5qZWN0aW9ucyA9IHRoaXMuYnVpbGRJbmplY3Rpb25zKHNwZWNpZmllcik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6IGZhY3RvcnlEZWZpbml0aW9uLFxuICAgICAgY3JlYXRlKG9wdGlvbnMpIHtcbiAgICAgICAgbGV0IG1lcmdlZE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBpbmplY3Rpb25zLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gZmFjdG9yeURlZmluaXRpb24uY3JlYXRlKG1lcmdlZE9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19