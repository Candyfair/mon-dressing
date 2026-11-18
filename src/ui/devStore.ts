import { useSyncExternalStore } from 'react';

/** A value shared by the development tools, outside React (S6 prototype). */
export function createDevStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const get = () => value;
  return {
    get,
    set(next: T) {
      value = next;
      listeners.forEach((listener) => listener());
    },
    use: () => useSyncExternalStore(subscribe, get),
  };
}
