import { _backburner, run } from '@ember/runloop';
import { set, setProperties, get, getProperties } from '@ember/object';
import { setOwner } from '@ember/application';
import buildOwner from './build-owner';
import { _setupAJAXHooks, _teardownAJAXHooks } from './settled';
import { _prepareOnerror } from './setup-onerror';
import Ember from 'ember';
import { assert } from '@ember/debug';
import global from './global';
import { getResolver } from './resolver';
import { getApplication } from './application';
import { Promise } from './-utils';
import getTestMetadata from './test-metadata';
import { registerDestructor, associateDestroyableChild } from '@ember/destroyable';
// eslint-disable-next-line require-jsdoc
export function isTestContext(context) {
    return typeof context.pauseTest === 'function' && typeof context.resumeTest === 'function';
}
let __test_context__;
/**
  Stores the provided context as the "global testing context".

  Generally setup automatically by `setupContext`.

  @public
  @param {Object} context the context to use
*/
export function setContext(context) {
    __test_context__ = context;
}
/**
  Retrive the "global testing context" as stored by `setContext`.

  @public
  @returns {Object} the previously stored testing context
*/
export function getContext() {
    return __test_context__;
}
/**
  Clear the "global testing context".

  Generally invoked from `teardownContext`.

  @public
*/
export function unsetContext() {
    __test_context__ = undefined;
}
/**
 * Returns a promise to be used to pauses the current test (due to being
 * returned from the test itself).  This is useful for debugging while testing
 * or for test-driving.  It allows you to inspect the state of your application
 * at any point.
 *
 * The test framework wrapper (e.g. `ember-qunit` or `ember-mocha`) should
 * ensure that when `pauseTest()` is used, any framework specific test timeouts
 * are disabled.
 *
 * @public
 * @returns {Promise<void>} resolves _only_ when `resumeTest()` is invoked
 * @example <caption>Usage via ember-qunit</caption>
 *
 * import { setupRenderingTest } from 'ember-qunit';
 * import { render, click, pauseTest } from '@ember/test-helpers';
 *
 *
 * module('awesome-sauce', function(hooks) {
 *   setupRenderingTest(hooks);
 *
 *   test('does something awesome', async function(assert) {
 *     await render(hbs`{{awesome-sauce}}`);
 *
 *     // added here to visualize / interact with the DOM prior
 *     // to the interaction below
 *     await pauseTest();
 *
 *     click('.some-selector');
 *
 *     assert.equal(this.element.textContent, 'this sauce is awesome!');
 *   });
 * });
 */
export function pauseTest() {
    let context = getContext();
    if (!context || !isTestContext(context)) {
        throw new Error('Cannot call `pauseTest` without having first called `setupTest` or `setupRenderingTest`.');
    }
    return context.pauseTest();
}
/**
  Resumes a test previously paused by `await pauseTest()`.

  @public
*/
export function resumeTest() {
    let context = getContext();
    if (!context || !isTestContext(context)) {
        throw new Error('Cannot call `resumeTest` without having first called `setupTest` or `setupRenderingTest`.');
    }
    context.resumeTest();
}
/**
  @private
  @param {Object} context the test context being cleaned up
*/
function cleanup(context) {
    _teardownAJAXHooks();
    Ember.testing = false;
    unsetContext();
    // this should not be required, but until https://github.com/emberjs/ember.js/pull/19106
    // lands in a 3.20 patch release
    context.owner.destroy();
}
/**
  Used by test framework addons to setup the provided context for testing.

  Responsible for:

  - sets the "global testing context" to the provided context (`setContext`)
  - create an owner object and set it on the provided context (e.g. `this.owner`)
  - setup `this.set`, `this.setProperties`, `this.get`, and `this.getProperties` to the provided context
  - setting up AJAX listeners
  - setting up `pauseTest` (also available as `this.pauseTest()`) and `resumeTest` helpers

  @public
  @param {Object} context the context to setup
  @param {Object} [options] options used to override defaults
  @param {Resolver} [options.resolver] a resolver to use for customizing normal resolution
  @returns {Promise<Object>} resolves with the context that was setup
*/
export default function setupContext(context, options = {}) {
    Ember.testing = true;
    setContext(context);
    let testMetadata = getTestMetadata(context);
    testMetadata.setupTypes.push('setupContext');
    _backburner.DEBUG = true;
    registerDestructor(context, cleanup);
    _prepareOnerror(context);
    return Promise.resolve()
        .then(() => {
        let application = getApplication();
        if (application) {
            return application.boot().then(() => { });
        }
        return;
    })
        .then(() => {
        let { resolver } = options;
        // This handles precendence, specifying a specific option of
        // resolver always trumps whatever is auto-detected, then we fallback to
        // the suite-wide registrations
        //
        // At some later time this can be extended to support specifying a custom
        // engine or application...
        if (resolver) {
            return buildOwner(null, resolver);
        }
        return buildOwner(getApplication(), getResolver());
    })
        .then(owner => {
        associateDestroyableChild(context, owner);
        Object.defineProperty(context, 'owner', {
            configurable: true,
            enumerable: true,
            value: owner,
            writable: false,
        });
        setOwner(context, owner);
        Object.defineProperty(context, 'set', {
            configurable: true,
            enumerable: true,
            value(key, value) {
                let ret = run(function () {
                    return set(context, key, value);
                });
                return ret;
            },
            writable: false,
        });
        Object.defineProperty(context, 'setProperties', {
            configurable: true,
            enumerable: true,
            value(hash) {
                let ret = run(function () {
                    return setProperties(context, hash);
                });
                return ret;
            },
            writable: false,
        });
        Object.defineProperty(context, 'get', {
            configurable: true,
            enumerable: true,
            value(key) {
                return get(context, key);
            },
            writable: false,
        });
        Object.defineProperty(context, 'getProperties', {
            configurable: true,
            enumerable: true,
            value(...args) {
                return getProperties(context, args);
            },
            writable: false,
        });
        let resume;
        context.resumeTest = function resumeTest() {
            assert('Testing has not been paused. There is nothing to resume.', Boolean(resume));
            resume();
            global.resumeTest = resume = undefined;
        };
        context.pauseTest = function pauseTest() {
            console.info('Testing paused. Use `resumeTest()` to continue.'); // eslint-disable-line no-console
            return new Promise(resolve => {
                resume = resolve;
                global.resumeTest = resumeTest;
            });
        };
        _setupAJAXHooks();
        return context;
    });
}
