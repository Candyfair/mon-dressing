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
  // Outfit validation (design/specs/01-aujourdhui.md « Validation de la tenue »).
  validation: {
    // « Je porte cette tenue »: squashed under the finger...
    pressIn: { duration: 120, easing: Easing.out(Easing.quad) },
    // ...then 0.9 → 1.18 → 1 on release (the peak at 45 %).
    release: { duration: 340, peak: 0.45 },
    // A ring leaves the button (and the stamp's frame, at the impact).
    ring: { duration: 620, easing: Easing.out(Easing.quad) },
    // Dots thrown around the button, slowed down like by friction.
    burst: { duration: 570, count: 14 },
    // The lock replaces the check while the stamp is still shown.
    lockDelay: 1500,
    checkOut: { duration: 160, easing: Easing.out(Easing.quad) },
    lockIn: { duration: 320, easing: Easing.bezier(0.34, 1.56, 0.64, 1) },
    // The button stretches to the left into the « Portée aujourd’hui » pill
    // and goes up astride the outline; its label fades in...
    stretch: { duration: 420, easing: Easing.bezier(0.34, 1.4, 0.64, 1) },
    labelIn: { duration: 200, delay: 160, easing: Easing.out(Easing.quad) },
    // ...and on undo, the label fades out and the pill shrinks back.
    labelOut: { duration: 120, easing: Easing.out(Easing.quad) },
    shrink: { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) },
    // After an undo, the check draws itself again (once the pill shrank).
    checkDraw: { duration: 300, delay: 160, easing: Easing.out(Easing.quad) },
    // The outfit becomes complete: the fill grows from the centre, then a
    // ring leaves and the button bounces (1 → 1.12 → 1).
    activation: { duration: 380, easing: Easing.bezier(0.34, 1.56, 0.64, 1) },
    activationRingDelay: 220,
    activationBounce: 380,
    // An incomplete outfit: the first tap stretches the button to the left
    // into « Il manque un bas · Valider quand même ? », which folds back
    // after about 4 s without a second tap. To tune on the device.
    askOpen: { duration: 320, easing: Easing.bezier(0.34, 1.3, 0.64, 1) },
    askLabelIn: { duration: 180, delay: 120, easing: Easing.out(Easing.quad) },
    askHold: 4000,
    askClose: { duration: 260, easing: Easing.bezier(0.4, 0, 0.2, 1) },
    // The stamp falls on the outfit (2.6 → 0.94 → 1, -14° → -8°)...
    stampDrop: { duration: 320, easing: Easing.bezier(0.55, 0, 0.8, 0.2) },
    // ...hits it (the pieces shake, a second frame leaves)...
    impact: 200,
    shake: { duration: 220 },
    stampRing: { duration: 460, easing: Easing.out(Easing.quad) },
    // ...stays readable about 2 s, then fades away.
    stampHold: 2300,
    stampOut: { duration: 400, easing: Easing.inOut(Easing.quad) },
    veilIn: { duration: 220, easing: Easing.out(Easing.quad) },
    veilOut: { duration: 360, easing: Easing.inOut(Easing.quad) },
    // Reduced motion: the stamp only fades in and out.
    stampFade: { duration: 260, easing: Easing.inOut(Easing.quad) },
    // The hand-drawn outline around the locked outfit, drawn once the stamp
    // has hit the outfit, before the pill comes onto it.
    outlineDelay: 500,
    outlineDraw: { duration: 760, easing: Easing.bezier(0.5, 0.1, 0.3, 1) },
    outlineSecondDelay: 120,
    outlineErase: { duration: 300, easing: Easing.in(Easing.quad) },
    outlineFade: { duration: 200, easing: Easing.inOut(Easing.quad) },
  },
} as const;
