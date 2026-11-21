import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import type { EngineGarment } from '../../domain/engine';
import type { Slot } from '../../domain/types';

/**
 * Development only: the guided Today (design spec 03) on the reference
 * wardrobe, cut down to what a first use has. Nothing is stored.
 */
export const GUIDED_STAGES = ['off', 'empty', 'top', 'topAndBottom'] as const;
export type GuidedStage = (typeof GUIDED_STAGES)[number];

// One-pieces are left out: they would stand for the missing bottom.
const SLOTS: Record<Exclude<GuidedStage, 'off'>, readonly Slot[]> = {
  empty: [],
  top: ['top', 'midLayer', 'outerLayer'],
  topAndBottom: ['top', 'midLayer', 'outerLayer', 'bottom'],
};

/** The reference wardrobe at a stage: all of it when the guided Today is off. */
export function devWardrobe(stage: GuidedStage): EngineGarment[] {
  const all = referenceWardrobe();
  return stage === 'off' ? all : all.filter((garment) => SLOTS[stage].includes(garment.slot));
}

export function nextGuidedStage(stage: GuidedStage): GuidedStage {
  return GUIDED_STAGES[(GUIDED_STAGES.indexOf(stage) + 1) % GUIDED_STAGES.length] ?? 'off';
}
