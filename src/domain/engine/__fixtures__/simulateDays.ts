import { addDays, type LocalDate, zonedInstant } from '../../time';
import type { EngineGarment, OutfitSelection } from '../types';

/**
 * In-memory "as if worn" (dev screen and tests): outfit n of `history` is
 * worn at 08:00 on `start` + n days. The lifecycle module is not involved,
 * nothing is written; there is no evening sort, so pieces stay stored.
 */
export function simulateWorn(
  garments: readonly EngineGarment[],
  history: readonly OutfitSelection[],
  start: LocalDate,
  timeZone: string,
): EngineGarment[] {
  return history.reduce<EngineGarment[]>(
    (current, outfit, day) => {
      const worn = new Set(Object.values(outfit));
      const wornAt = zonedInstant(addDays(start, day), '08:00', timeZone);
      return current.map((garment) =>
        worn.has(garment.id)
          ? { ...garment, lastWornAt: wornAt, wearCount: garment.wearCount + 1 }
          : garment,
      );
    },
    [...garments],
  );
}
