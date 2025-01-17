import type { SwappableProxy } from './types';

/**
 * A portion of Node's EventEmitter interface that `createEventEmitterProxy`
 * expects its `target` to support.
 */
type EventEmitterLike = {
  eventNames: () => (string | symbol)[];
  // The `rawListeners` method returns an array of `Function`s.
  // eslint-disable-next-line @typescript-eslint/ban-types
  rawListeners(eventName: string | symbol): Function[];
  removeAllListeners(event?: string | symbol): EventEmitterLike;
};

const filterNoop = () => true;
const internalEvents: (string | symbol)[] = ['newListener', 'removeListener'];
const externalEventFilter = (name: string | symbol) =>
  !internalEvents.includes(name);

/**
 * Creates a proxy object that initially points to the given object but whose
 * target can be substituted with another object later using its `setTarget`
 * method. In addition, when the target is changed, event listeners which have
 * been attached to the target will be detached and migrated to the new target.
 *
 * @template Type - An object that implements at least `eventNames`, `rawListeners`,
 * and `removeAllListeners` from [Node's EventEmitter interface](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/events.d.ts).
 * @param initialTarget - The initial object you want to wrap.
 * @param opts - The options.
 * @param opts.eventFilter - Usually, listeners for all events will be migrated
 * from old targets to new targets, but this function can be used to select
 * which events you want to migrate. If you pass `'skipInternal'`, then
 * `newListener` and `removeListener` will be excluded.
 * @returns The proxy object.
 */
export function createEventEmitterProxy<Type extends EventEmitterLike>(
  initialTarget: Type,
  {
    eventFilter: givenEventFilter = filterNoop,
  }: {
    eventFilter?: ((eventName: string | symbol) => boolean) | 'skipInternal';
  } = {},
): SwappableProxy<Type> {
  // parse options
  const eventFilter =
    givenEventFilter === 'skipInternal'
      ? externalEventFilter
      : givenEventFilter;

  if (typeof eventFilter !== 'function') {
    throw new Error('createEventEmitterProxy - Invalid eventFilter');
  }

  let target = initialTarget;

  /**
   * Changes the object that the proxy wraps.
   *
   * @param newTarget - The new object.
   */
  let setTarget = (newTarget: Type) => {
    const oldTarget = target;
    target = newTarget;
    // migrate listeners
    oldTarget
      .eventNames()
      .filter(eventFilter)
      .forEach((name) => {
        oldTarget.rawListeners(name).forEach((handler) => {
          // @ts-expect-error `rawListeners` returns `Function[]`, but `on`
          // takes `(...args: any[]) => void`.
          newTarget.on(name, handler);
        });
      });
    // remove old
    oldTarget.removeAllListeners();
  };

  const proxy = new Proxy<Type>(target, {
    // @ts-expect-error We are providing a different signature than the `get`
    // option as defined in the Proxy interface; specifically, we've limited
    // `name` so that it can't be arbitrary. Theoretically this is inaccurate,
    // but because we've constrained what the `target` can be, that effectively
    // constraints the allowed properties as well.
    get(
      _target: Type,
      name: 'setTarget' | keyof Type,
      receiver: SwappableProxy<Type>,
    ): unknown {
      // override `setTarget` access
      if (name === 'setTarget') {
        return setTarget;
      }

      const value = target[name];
      if (value instanceof Function) {
        return function (this: unknown, ...args: any[]) {
          // This function may be either bound to something or nothing.
          // eslint-disable-next-line no-invalid-this
          return value.apply(this === receiver ? target : this, args);
        };
      }
      return value;
    },
    // @ts-expect-error We are providing a different signature than the `set`
    // option as defined in the Proxy interface; specifically, we've limited
    // `name` so that it can't be arbitrary. Theoretically this is inaccurate,
    // but because we've constrained what the `target` can be, that effectively
    // constraints the allowed properties as well.
    set(
      _target: Type,
      name: 'setTarget' | keyof Type,
      // This setter takes either the `setTarget` function, the value of a a
      // known property of Type, or something else. However, the type of this value
      // depends on the property given, and getting TypeScript to figure this
      // out is seriously difficult. It doesn't ultimately matter, however,
      // as the setter is not visible to consumers.
      value: any,
    ): boolean {
      // allow `setTarget` overrides
      if (name === 'setTarget') {
        setTarget = value;
        return true;
      }
      target[name] = value;
      return true;
    },
  });

  // Typecast: The return type of the Proxy constructor is defined to be the
  // same as the provided type parameter. This is naive, however, as it does not
  // account for the proxy trapping and responding to arbitrary properties; in
  // our case, we trap `setTarget`, so this means our final proxy object
  // contains a property on top of the underlying object's properties.
  return proxy as SwappableProxy<Type>;
}
