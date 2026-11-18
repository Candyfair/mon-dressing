import type { TFunction } from 'i18next';

import type { TodayPiece } from './useToday';

type Described = Pick<
  TodayPiece,
  'label' | 'statementPiece' | 'location' | 'wearCount' | 'maxWears'
>;

/**
 * A piece's name and state for screen readers: « Pull mérinos écru, au
 * balcon, porté 3 fois sur 10 ». The place in the outfit is added by the caller.
 */
export function pieceDescription(piece: Described, t: TFunction): string {
  const parts = [piece.label];
  if (piece.statementPiece) {
    parts.push(t('today.state.statementPiece'));
  }
  if (piece.location === 'airing' || piece.location === 'onDryingRack') {
    parts.push(t(`today.state.${piece.location}`));
  }
  if (piece.wearCount > 0 && piece.maxWears !== null) {
    parts.push(t('today.state.worn', { count: piece.wearCount, max: piece.maxWears }));
  }
  return parts.join(', ');
}
