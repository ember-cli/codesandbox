"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const watcher_adapter_1 = __importDefault(require("./watcher_adapter"));
const heimdalljs_logger_1 = __importDefault(require("heimdalljs-logger"));
const logger = new heimdalljs_logger_1.default('broccoli:watcher');
// This Watcher handles all the Broccoli logic, such as debouncing. The
// WatcherAdapter handles I/O via the sane package, and could be pluggable in
// principle.
class Watcher extends events_1.EventEmitter {
    constructor(builder, watchedNodes, options = {}) {
        super();
        this.options = options;
        if (this.options.debounce == null) {
            this.options.debounce = 100;
        }
        this._currentBuild = Promise.resolve();
        this.builder = builder;
        this.watcherAdapter =
            this.options.watcherAdapter || new watcher_adapter_1.default(watchedNodes, this.options.saneOptions);
        this._rebuildScheduled = false;
        this._ready = false;
        this._quittingPromise = null;
        this._lifetime = null;
        this._changedFiles = [];
    }
    get currentBuild() {
        return this._currentBuild;
    }
    // TODO: this is an interim solution, pending a largely cleanup of this class.
    // Currently I can rely on understanding the various pieces of this class, to
    // know this is safe. This is not a good long term solution, but given
    // relatively little time to address this currently, it is "ok". I do plan,
    // as time permits to circle back, and do a more thorough refactoring of this
    // class, to ensure it is safe for future travelers.
    _updateCurrentBuild(promise) {
        this._currentBuild = promise;
        promise.catch(() => {
            /**
             * The watcher internally follows currentBuild, and outputs errors appropriately.
             * Since watcher.currentBuild is public API, we must allow public follows
             * to still be informed of rejections.  However we do not want `_currentBuild` itself
             * to trigger unhandled rejections.
             *
             * By catching errors here, but returning `promise` instead of the chain from
             * `promise.catch`, both goals are accomplished.
             */
        });
    }
    start() {
        if (this._lifetime != null) {
            throw new Error('Watcher.prototype.start() must not be called more than once');
        }
        this._lifetime = {};
        const lifetime = this._lifetime;
        lifetime.promise = new Promise((resolve, reject) => {
            lifetime.resolve = resolve;
            lifetime.reject = reject;
        });
        this.watcherAdapter.on('change', this._change.bind(this));
        this.watcherAdapter.on('error', this._error.bind(this));
        this._updateCurrentBuild((async () => {
            try {
                await this.watcherAdapter.watch();
                logger.debug('ready');
                this._ready = true;
            }
            catch (e) {
                this._error(e);
            }
            return this._build();
        })());
        return this._lifetime.promise;
    }
    async _change(event, filePath, root) {
        this._changedFiles.push(path_1.default.join(root, filePath));
        if (!this._ready) {
            logger.debug('change', 'ignored: before ready');
            return;
        }
        if (this._rebuildScheduled) {
            logger.debug('change', 'ignored: rebuild scheduled already');
            return;
        }
        logger.debug('change', event, filePath, root);
        this.emit('change', event, filePath, root);
        this._rebuildScheduled = true;
        try {
            // Wait for current build, and ignore build failure
            await this.currentBuild;
        }
        catch (e) {
            /* we don't care about failures in the last build, simply start the
             * next build once the last build has completed
             * */
        }
        if (this._quitting) {
            this._updateCurrentBuild(Promise.resolve());
            return;
        }
        this._updateCurrentBuild(new Promise((resolve, reject) => {
            logger.debug('debounce');
            this.emit('debounce');
            setTimeout(() => {
                // Only set _rebuildScheduled to false *after* the setTimeout so that
                // change events during the setTimeout don't trigger a second rebuild
                try {
                    this._rebuildScheduled = false;
                    resolve(this._build(path_1.default.join(root, filePath)));
                }
                catch (e) {
                    reject(e);
                }
            }, this.options.debounce);
        }));
    }
    _build(filePath) {
        logger.debug('buildStart');
        this.emit('buildStart');
        const start = process.hrtime();
        // This is to maintain backwards compatibility with broccoli-sane-watcher
        const annotation = {
            type: filePath ? 'rebuild' : 'initial',
            reason: 'watcher',
            primaryFile: filePath,
            changedFiles: this._changedFiles,
        };
        const buildPromise = this.builder.build(null, annotation);
        // Trigger change/error events. Importantly, if somebody else chains to
        // currentBuild, their callback will come after our events have
        // triggered, because we registered our callback first.
        buildPromise.then((results = {}) => {
            const end = process.hrtime(start);
            logger.debug('Build execution time: %ds %dms', end[0], Math.round(end[1] / 1e6));
            logger.debug('buildSuccess');
            // This property is added to keep compatibility for ember-cli
            // as it relied on broccoli-sane-watcher to add it:
            // https://github.com/ember-cli/broccoli-sane-watcher/blob/48860/index.js#L92-L95
            //
            // This is "undefined" during the initial build.
            results.filePath = filePath;
            this._changedFiles = [];
            this.emit('buildSuccess', results);
        }, (err) => {
            this._changedFiles = [];
            logger.debug('buildFailure');
            this.emit('buildFailure', err);
        });
        return buildPromise;
    }
    async _error(err) {
        if (this._quittingPromise) {
            logger.debug('error', 'ignored: already quitting');
            return this._quittingPromise;
        }
        logger.debug('error', err);
        this.emit('error', err);
        try {
            await this._quit();
        }
        catch (e) {
            // ignore errors that occur during quitting
        }
        if (this._lifetime && typeof this._lifetime.reject === 'function') {
            this._lifetime.reject(err);
        }
    }
    quit() {
        if (this._quittingPromise) {
            logger.debug('quit', 'ignored: already quitting');
            return this._quittingPromise;
        }
        const quitting = this._quit();
        if (this._lifetime && typeof this._lifetime.resolve === 'function') {
            this._lifetime.resolve(quitting);
            return this._lifetime.promise;
        }
        else {
            return quitting;
        }
    }
    _quit() {
        logger.debug('quitStart');
        this.emit('quitStart');
        this._quittingPromise = (async () => {
            try {
                await this.watcherAdapter.quit();
            }
            finally {
                try {
                    await this.currentBuild;
                }
                catch (e) {
                    // Wait for current build, and ignore build failure
                }
                logger.debug('quitEnd');
                this.emit('quitEnd');
            }
        })();
        return this._quittingPromise;
    }
}
module.exports = Watcher;
//# sourceMappingURL=watcher.js.map