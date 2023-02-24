import type { SwappableProxy } from './types';

/**
 * Creates a proxy object that initially points to the given object but whose
 * target can be substituted with another object later using its `setTarget`
 * method.
 *
 * @template Type - An object.
 * @param initialTarget - The initial object you want to wrap.
 * @returns The proxy object.
 */
export function createSwappableProxy<Type extends object>(
  initialTarget: Type,
): SwappableProxy<Type> {
  let target = initialTarget;

  /**
   * Changes the object that the proxy wraps.
   *
   * @param newTarget - The new object.
   */
  let setTarget = (newTarget: Type) => {
    target = newTarget;
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
