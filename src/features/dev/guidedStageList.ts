// No fixture here: the dev tools and the hook import it without the
// reference wardrobe, which `guidedStages` loads lazily.

/**
 * Development only: the guided Today (design spec 03) on the reference
 * wardrobe, cut down to what a first use has. Nothing is stored.
 */
export const GUIDED_STAGES = ['off', 'empty', 'top', 'topAndBottom', 'bottomsInLaundry'] as const;
export type GuidedStage = (typeof GUIDED_STAGES)[number];

export interface DevGuided {
  stage: GuidedStage;
  // When the guided Today was turned on: garments added since then join it.
  since: Date;
}

/** Moves to a stage; the start time is kept while the guided Today stays on. */
export function moveToStage(current: DevGuided, stage: GuidedStage, now: Date): DevGuided {
  return { stage, since: current.stage === 'off' ? now : current.since };
}

export function nextGuidedStage(stage: GuidedStage): GuidedStage {
  return GUIDED_STAGES[(GUIDED_STAGES.indexOf(stage) + 1) % GUIDED_STAGES.length] ?? 'off';
}
