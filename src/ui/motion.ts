// Animation durations and curves, in one place. Frozen after the S6 prototype
// (SPEC §14.2). The design handoff has no motion tokens.

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
  tabs: {
    // The hanger changes between its two looks.
    select: { duration: 200, easing: Easing.inOut(Easing.quad) },
    // The selection is a soft bubble: its front edge pulls ahead, its back
    // edge catches up, and both overshoot a little on arrival.
    bubbleFront: { stiffness: 150, damping: 15, mass: 1 },
    bubbleBack: { stiffness: 90, damping: 11, mass: 1 },
    // Halfway between the two: the pace of the bubble's centre.
    bubbleCentre: { stiffness: 120, damping: 13, mass: 1 },
    // Back to the shape of a side tab, without bouncing.
    bubbleSettle: { stiffness: 120, damping: 22, mass: 1 },
    // Fade between the screens of two tabs.
    screenFade: 150,
  },
  radial: {
    // How long a piece is held before the fan opens.
    longPress: 100,
    // The discs leave the finger for their places.
    open: { stiffness: 260, damping: 22, mass: 0.8 },
    // Reduced motion: the menu only fades in.
    fade: { duration: 120, easing: Easing.out(Easing.quad) },
    close: { duration: 120, easing: Easing.out(Easing.quad) },
    // The disc under the finger swells softly, a little past its size...
    hover: { stiffness: 170, damping: 13, mass: 0.9 },
    // ...and sinks back without bouncing.
    hoverOut: { stiffness: 140, damping: 20, mass: 0.9 },
    // Its colour answers at once, ahead of the movement.
    hoverTone: { duration: 110, easing: Easing.out(Easing.quad) },
    // The discs drift apart like a wave: the further, the later.
    driftHovered: { stiffness: 150, damping: 14, mass: 0.9 },
    driftNear: { stiffness: 110, damping: 12, mass: 1 },
    driftFar: { stiffness: 80, damping: 11, mass: 1 },
    // While hovered, the discs float slowly around their place.
    float: { duration: 3200, easing: Easing.linear },
    floatFade: { duration: 320, easing: Easing.inOut(Easing.quad) },
  },
} as const;
