declare type AsyncFunction<A extends Array<any>, PromiseReturn> = (...args: A) => Promise<PromiseReturn>;
declare type CoroutineGenerator<T> = Generator<any, T, any>;
declare type CoroutineFunction<A extends Array<any>, T> = (...args: A) => CoroutineGenerator<T>;
/**
 * A convenient utility function to simplify waiting for async. Can be used
 * in both decorator and function form. When applied to an async function, it
 * will cause tests to wait until the returned promise has resolves. When
 * applied to a generator function, it will cause tests to wait until the
 * returned iterator has run to completion, which is useful for wrapping
 * ember-concurrency task functions.
 *
 *
 * @public
 * @param promise {Function} An async function or a generator function
 * @param label {string} An optional string to identify the promise
 *
 * @example
 *
 * import Component from '@ember/component';
 * import { waitFor } from 'ember-test-waiters';
 *
 * export default Component.extend({
 *   doAsyncStuff: waitFor(async function doAsyncStuff() {
 *     await somethingAsync();
 *   }
 * });
 *
 * @example
 *
 * import Component from '@ember/component';
 * import { waitFor } from 'ember-test-waiters';
 *
 * export default class Friendz extends Component {
 *   @waitFor
 *   async doAsyncStuff() {
 *     await somethingAsync();
 *   }
 * }
 *
 * @example
 *
 * import Component from '@ember/component';
 * import { task } from 'ember-concurrency';
 * import { waitFor } from 'ember-test-waiters';
 *
 * export default Component.extend({
 *   doTaskStuff: task(waitFor(function* doTaskStuff() {
 *     yield somethingAsync();
 *   }
 * });
 *
 * @example
 *
 * import Component from '@ember/component';
 * import { task } from 'ember-concurrency-decorators';
 * import { waitFor } from 'ember-test-waiters';
 *
 * export default class Friendz extends Component {
 *   @task
 *   @waitFor
 *   *doTaskStuff() {
 *     yield somethingAsync();
 *   }
 * }
 *
 */
export default function waitFor(fn: AsyncFunction<any[], any>, label?: string): Function;
export default function waitFor(fn: CoroutineFunction<any[], any>, label?: string): CoroutineFunction<any[], any>;
export default function waitFor(target: object, _key: string, descriptor: PropertyDescriptor, label?: string): PropertyDescriptor;
export {};
