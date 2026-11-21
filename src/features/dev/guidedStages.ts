import { inDirtyBasket, referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import type { EngineGarment } from '../../domain/engine';
import type { Slot } from '../../domain/types';
import type { DevGuided, GuidedStage } from './guidedStageList';

// One-pieces are left out: they would stand for the missing bottom.
const SLOTS: Record<Exclude<GuidedStage, 'off'>, readonly Slot[]> = {
  empty: [],
  top: ['top', 'midLayer', 'outerLayer'],
  topAndBottom: ['top', 'midLayer', 'outerLayer', 'bottom'],
  // Every bottom goes to the laundry basket (AR4).
  bottomsInLaundry: ['top', 'midLayer', 'outerLayer', 'bottom', 'shoes'],
};

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
