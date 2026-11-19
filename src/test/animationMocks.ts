// Minimal stand-ins for Reanimated, Worklets and Gesture Handler in Jest:
// their native initialisers do not run under jest-expo (Reanimated 4). Enough
// to render a component and drive it through its accessibility actions; the
// animations and gestures themselves are checked on device.
//
// Usage, at the top of a test file:
//   jest.mock('react-native-reanimated', () =>
//     jest.requireActual('../test/animationMocks').reanimated);
// and the same for `worklets` and `gestureHandler`.

import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

const identity = <T>(value: T) => value;
const easing = () => identity;

// What a test can set for the code under test.
export const animationControls = {
  reducedMotion: false,
  // Ends the running timings, as when they finish on their own.
  finishTimings() {
    pendingTimings.splice(0).forEach((finish) => finish(true));
  },
};

const pendingTimings: ((finished: boolean) => void)[] = [];

const layoutAnimation = { duration: () => undefined };

export const reanimated = {
  __esModule: true,
  FadeIn: layoutAnimation,
  FadeOut: layoutAnimation,
  default: { View },
  Easing: { out: easing, in: easing, inOut: easing, cubic: identity, quad: identity },
  Extrapolation: { CLAMP: 'clamp' },
  cancelAnimation: () => undefined,
  interpolate: () => 1,
  useAnimatedStyle: () => ({}),
  useReducedMotion: () => animationControls.reducedMotion,
  useSharedValue: function useSharedValue<T>(initial: T) {
    const [shared] = useState(() => {
      let value = initial;
      return {
        get: () => value,
        set: (next: T) => {
          value = next;
        },
      };
    });
    return shared;
  },
  withSpring: identity,
  withTiming: <T>(value: T, _config?: unknown, finish?: (finished: boolean) => void) => {
    if (finish) pendingTimings.push(finish);
    return value;
  },
};

export const worklets = {
  scheduleOnRN: <A extends unknown[]>(fn: (...args: A) => void, ...args: A) => fn(...args),
};

type GestureHandlers = Record<string, (...args: never[]) => void>;

// The handlers of the latest gesture of each kind, for tests to call.
export const recordedGestures: Record<string, GestureHandlers> = {};

// Every builder method returns the builder, whatever it is called with.
function gestureBuilder(kind: string): unknown {
  const handlers: GestureHandlers = {};
  recordedGestures[kind] = handlers;
  const builder: object = new Proxy(
    {},
    {
      get: (_target, method: string) => (argument: unknown) => {
        if (typeof argument === 'function') {
          handlers[method] = argument as GestureHandlers[string];
        }
        return builder;
      },
    },
  );
  return builder;
}

export const gestureHandler = {
  Gesture: {
    Pan: () => gestureBuilder('Pan'),
    Tap: () => gestureBuilder('Tap'),
    LongPress: () => gestureBuilder('LongPress'),
    Exclusive: () => gestureBuilder('Exclusive'),
  },
  GestureDetector: ({ children }: { children: ReactNode }) => children,
};
