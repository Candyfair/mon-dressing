import type { Slot } from '../types';

/**
 * The rows of the default outfit (design spec 03): what « Encore… » counts,
 * a missing silhouette stands for and the laundry slot stands in for.
 */
export const OUTFIT_ROWS = ['top', 'bottom', 'shoes'] as const;
export type OutfitRow = (typeof OUTFIT_ROWS)[number];

/**
 * The garments a row itself shows: a one-piece lives in the top row only
 * (the laundry slot).
 */
export const OUTFIT_ROW_SLOTS: Record<OutfitRow, readonly Slot[]> = {
  top: ['top', 'onePiece'],
  bottom: ['bottom'],
  shoes: ['shoes'],
};

/**
 * The garments that cover a row's need (« Encore… »): a one-piece stands for
 * a top and a bottom.
 */
export const OUTFIT_ROW_COVERS: Record<OutfitRow, readonly Slot[]> = {
  top: ['top', 'onePiece'],
  bottom: ['bottom', 'onePiece'],
  shoes: ['shoes'],
};
