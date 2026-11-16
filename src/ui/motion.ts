// Animation durations and curves, in one place (SPEC §14.1). Starting values,
// to be tuned on the Galaxy A06 and the iPhone 12 mini in the S6 prototype,
// then frozen. The design handoff has no motion tokens.

import { Easing } from 'react-native-reanimated';

export const motion = {
  carousel: {
    // Release: the piece settles on its new place.
    settle: { duration: 220, easing: Easing.out(Easing.cubic) },
    // The other proposals of the row fade out after the release (1 → 0).
    neighbourFadeOut: { duration: 180, easing: Easing.out(Easing.quad) },
    // ...and appear as soon as the drag starts.
    neighbourFadeIn: { duration: 90, easing: Easing.out(Easing.quad) },
    // Single compatible piece, or a release too short: back in place.
    bounce: { damping: 14, stiffness: 220, mass: 0.6 },
    // Reduced motion: cross-fade instead of the slide, each half.
    crossFade: { duration: 120, easing: Easing.inOut(Easing.quad) },
  },
} as const;
