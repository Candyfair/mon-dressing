// Minimal stand-ins for Reanimated, Worklets and Gesture Handler in Jest:
// their native initialisers do not run under jest-expo (Reanimated 4). Enough
// to render a component and drive it through its accessibility actions; the
// animations and gestures themselves are checked on device.
//
// Usage, at the top of a test file:
//   jest.mock('react-native-reanimated', () =>
//     jest.requireActual('../test/animationMocks').reanimated);
// and the same for `worklets` and `gestureHandler`.

import type { ReactNode } from 'react';
import { View } from 'react-native';

const identity = <T>(value: T) => value;
const easing = () => identity;

export const reanimated = {
  __esModule: true,
  default: { View },
  Easing: { out: easing, in: easing, inOut: easing, cubic: identity, quad: identity },
  Extrapolation: { CLAMP: 'clamp' },
  cancelAnimation: () => undefined,
  interpolate: () => 1,
  useAnimatedStyle: () => ({}),
  useReducedMotion: () => false,
  useSharedValue: <T>(initial: T) => {
    let value = initial;
    return {
      get: () => value,
      set: (next: T) => {
        value = next;
      },
    };
  },
  withSpring: identity,
  withTiming: identity,
};

export const worklets = {
  scheduleOnRN: <A extends unknown[]>(fn: (...args: A) => void, ...args: A) => fn(...args),
};

// Every builder method returns the builder, whatever it is called with.
function gestureBuilder(): unknown {
  const builder: object = new Proxy({}, { get: () => () => builder });
  return builder;
}

export const gestureHandler = {
  Gesture: {
    Pan: gestureBuilder,
    Tap: gestureBuilder,
    LongPress: gestureBuilder,
    Exclusive: gestureBuilder,
  },
  GestureDetector: ({ children }: { children: ReactNode }) => children,
};
