import { DEBUG } from '@glimmer/env';
import { ARGS_SET } from './component';
/**
 * This factory function returns a component manager class with common behavior
 * that can be extend to add Glimmer.js- or Ember.js-specific functionality. As
 * these environments converge, the need for two component manager
 * implementations (and thus this factory) should go away.
 */
export default function BaseComponentManager(setOwner, getOwner, capabilities) {
    return class {
        constructor(owner) {
            this.capabilities = capabilities;
            setOwner(this, owner);
        }
        static create(attrs) {
            let owner = getOwner(attrs);
            return new this(owner);
        }
        createComponent(ComponentClass, args) {
            if (DEBUG) {
                ARGS_SET.set(args.named, true);
            }
            return new ComponentClass(getOwner(this), args.named);
        }
        getContext(component) {
            return component;
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1jb21wb25lbnQtbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL2NvbXBvbmVudC9hZGRvbi8tcHJpdmF0ZS9iYXNlLWNvbXBvbmVudC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDckMsT0FBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFvQnREOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE9BQU8sVUFBVSxvQkFBb0IsQ0FDMUMsUUFBa0IsRUFDbEIsUUFBa0IsRUFDbEIsWUFBeUM7SUFFekMsT0FBTztRQVFMLFlBQVksS0FBYztZQUYxQixpQkFBWSxHQUFHLFlBQVksQ0FBQztZQUcxQixRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFURCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQVM7WUFDckIsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVCLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQVFELGVBQWUsQ0FDYixjQUE2QyxFQUM3QyxJQUEwQjtZQUUxQixJQUFJLEtBQUssRUFBRTtnQkFDVCxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDaEM7WUFFRCxPQUFPLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELFVBQVUsQ0FBQyxTQUEyQjtZQUNwQyxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBERUJVRyB9IGZyb20gJ0BnbGltbWVyL2Vudic7XG5pbXBvcnQgQmFzZUNvbXBvbmVudCwgeyBBUkdTX1NFVCB9IGZyb20gJy4vY29tcG9uZW50JztcblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRNYW5hZ2VyQXJncyB7XG4gIG5hbWVkOiBvYmplY3Q7XG4gIHBvc2l0aW9uYWw6IGFueVtdO1xufVxuXG5leHBvcnQgdHlwZSBTZXRPd25lciA9IChvYmo6IHt9LCBvd25lcjogdW5rbm93bikgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIEdldE93bmVyID0gKG9iajoge30pID0+IHVua25vd247XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3VzdG9tQ29tcG9uZW50Q2FwYWJpbGl0aWVzIHtcbiAgYXN5bmNMaWZlY3ljbGVDYWxsYmFja3M6IGJvb2xlYW47XG4gIGRlc3RydWN0b3I6IGJvb2xlYW47XG4gIHVwZGF0ZUhvb2s6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RydWN0b3I8VD4ge1xuICBuZXcgKG93bmVyOiB1bmtub3duLCBhcmdzOiB7fSk6IFQ7XG59XG5cbi8qKlxuICogVGhpcyBmYWN0b3J5IGZ1bmN0aW9uIHJldHVybnMgYSBjb21wb25lbnQgbWFuYWdlciBjbGFzcyB3aXRoIGNvbW1vbiBiZWhhdmlvclxuICogdGhhdCBjYW4gYmUgZXh0ZW5kIHRvIGFkZCBHbGltbWVyLmpzLSBvciBFbWJlci5qcy1zcGVjaWZpYyBmdW5jdGlvbmFsaXR5LiBBc1xuICogdGhlc2UgZW52aXJvbm1lbnRzIGNvbnZlcmdlLCB0aGUgbmVlZCBmb3IgdHdvIGNvbXBvbmVudCBtYW5hZ2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgKGFuZCB0aHVzIHRoaXMgZmFjdG9yeSkgc2hvdWxkIGdvIGF3YXkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEJhc2VDb21wb25lbnRNYW5hZ2VyPEdsaW1tZXJDb21wb25lbnQgZXh0ZW5kcyBCYXNlQ29tcG9uZW50PihcbiAgc2V0T3duZXI6IFNldE93bmVyLFxuICBnZXRPd25lcjogR2V0T3duZXIsXG4gIGNhcGFiaWxpdGllczogQ3VzdG9tQ29tcG9uZW50Q2FwYWJpbGl0aWVzXG4pIHtcbiAgcmV0dXJuIGNsYXNzIHtcbiAgICBzdGF0aWMgY3JlYXRlKGF0dHJzOiB7fSkge1xuICAgICAgbGV0IG93bmVyID0gZ2V0T3duZXIoYXR0cnMpO1xuICAgICAgcmV0dXJuIG5ldyB0aGlzKG93bmVyKTtcbiAgICB9XG5cbiAgICBjYXBhYmlsaXRpZXMgPSBjYXBhYmlsaXRpZXM7XG5cbiAgICBjb25zdHJ1Y3Rvcihvd25lcjogdW5rbm93bikge1xuICAgICAgc2V0T3duZXIodGhpcywgb3duZXIpO1xuICAgIH1cblxuICAgIGNyZWF0ZUNvbXBvbmVudChcbiAgICAgIENvbXBvbmVudENsYXNzOiBDb25zdHJ1Y3RvcjxHbGltbWVyQ29tcG9uZW50PixcbiAgICAgIGFyZ3M6IENvbXBvbmVudE1hbmFnZXJBcmdzXG4gICAgKTogR2xpbW1lckNvbXBvbmVudCB7XG4gICAgICBpZiAoREVCVUcpIHtcbiAgICAgICAgQVJHU19TRVQuc2V0KGFyZ3MubmFtZWQsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IENvbXBvbmVudENsYXNzKGdldE93bmVyKHRoaXMpLCBhcmdzLm5hbWVkKTtcbiAgICB9XG5cbiAgICBnZXRDb250ZXh0KGNvbXBvbmVudDogR2xpbW1lckNvbXBvbmVudCkge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICB9XG4gIH07XG59XG4iXX0=