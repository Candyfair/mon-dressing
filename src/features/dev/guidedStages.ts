import { inDirtyBasket, referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import type { EngineGarment } from '../../domain/engine';
import type { Slot } from '../../domain/types';

/**
 * Development only: the guided Today (design spec 03) on the reference
 * wardrobe, cut down to what a first use has. Nothing is stored.
 */
export const GUIDED_STAGES = ['off', 'empty', 'top', 'topAndBottom', 'bottomsInLaundry'] as const;
export type GuidedStage = (typeof GUIDED_STAGES)[number];

// One-pieces are left out: they would stand for the missing bottom.
const SLOTS: Record<Exclude<GuidedStage, 'off'>, readonly Slot[]> = {
  empty: [],
  top: ['top', 'midLayer', 'outerLayer'],
  topAndBottom: ['top', 'midLayer', 'outerLayer', 'bottom'],
  // Every bottom goes to the laundry basket (AR4).
  bottomsInLaundry: ['top', 'midLayer', 'outerLayer', 'bottom', 'shoes'],
};

export interface DevGuided {
  stage: GuidedStage;
  // When the guided Today was turned on: garments added since then join it.
  since: Date;
}

/**
 * The reference wardrobe at a stage, with the real garments added since the
 * guided Today was turned on, so that adding a piece shows it at once. All
 * of the reference wardrobe when the guided Today is off.
 */
export function devWardrobe(
  { stage, since }: DevGuided,
  real: readonly EngineGarment[],
): EngineGarment[] {
  const all = referenceWardrobe();
  if (stage === 'off') return all;
  return [
    ...all
      .filter((garment) => SLOTS[stage].includes(garment.slot))
      .map((garment) =>
        stage === 'bottomsInLaundry' && garment.slot === 'bottom'
          ? inDirtyBasket(garment)
          : garment,
      ),
    ...real.filter((garment) => garment.createdAt >= since),
  ];
}

/** Moves to a stage; the start time is kept while the guided Today stays on. */
export function moveToStage(current: DevGuided, stage: GuidedStage, now: Date): DevGuided {
  return { stage, since: current.stage === 'off' ? now : current.since };
}

export function nextGuidedStage(stage: GuidedStage): GuidedStage {
  return GUIDED_STAGES[(GUIDED_STAGES.indexOf(stage) + 1) % GUIDED_STAGES.length] ?? 'off';
}
