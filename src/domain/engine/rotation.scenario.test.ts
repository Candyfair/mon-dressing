import { addDays, zonedInstant } from '../time';
import type { DayContext, RotationPace } from '../types';
import type { DayWeather } from '../weather';
import { makeGarment } from './__fixtures__/makeGarment';
import { sameOutfit } from './defaultOutfit';
import { suggest } from './suggest';
import type { EngineGarment, OutfitSelection } from './types';

// SPEC §7 verification, rotation scenario: same context every day, no
// laundry; each morning the default outfit is validated (worn).
const TZ = 'Europe/Paris';
const CONTEXT: DayContext = { activity: 'office', commuteModes: ['walking'], occasion: 'everyday' };
const MILD: DayWeather = {
  category: 'mild',
  rain: false,
  indoorOnly: false,
  minFelt: 18,
  windows: [],
  conditions: ['mild'],
};

function wardrobe(): EngineGarment[] {
  const pieces: EngineGarment[] = [
    makeGarment({ id: 'favTop', slot: 'top', isFavorite: true }),
    makeGarment({ id: 'favBottom', slot: 'bottom', isFavorite: true }),
  ];
  for (let index = 1; index <= 5; index += 1) {
    pieces.push(makeGarment({ id: `top${index}`, slot: 'top' }));
  }
  for (let index = 1; index <= 2; index += 1) {
    pieces.push(makeGarment({ id: `bottom${index}`, slot: 'bottom' }));
  }
  pieces.push(makeGarment({ id: 'sneakers', slot: 'shoes' }));
  pieces.push(makeGarment({ id: 'boots', slot: 'shoes' }));
  // No wear limit in the way: the scenario is about rotation only.
  return pieces.map((piece) => ({ ...piece, maxWears: piece.maxWears === null ? null : 99 }));
}

function simulate(days: number, pace: RotationPace): OutfitSelection[] {
  let garments = wardrobe();
  let yesterday: OutfitSelection | null = null;
  const outfits: OutfitSelection[] = [];
  for (let day = 0; day < days; day += 1) {
    const date = addDays('2026-11-16', day);
    const { outfit } = suggest({
      date,
      timeZone: TZ,
      garments,
      context: CONTEXT,
      weather: MILD,
      settings: { dryingRackCountsAsStorage: true, rotationPace: pace },
      yesterday,
    });
    const worn = new Set(Object.values(outfit));
    const wornAt = zonedInstant(date, '08:00', TZ);
    garments = garments.map((garment) =>
      worn.has(garment.id)
        ? { ...garment, lastWornAt: wornAt, wearCount: garment.wearCount + 1 }
        : garment,
    );
    outfits.push(outfit);
    yesterday = outfit;
  }
  return outfits;
}

function countWears(outfits: readonly OutfitSelection[], id: string): number {
  return outfits.filter((outfit) => Object.values(outfit).includes(id)).length;
}

describe.each<RotationPace>(['long', 'short'])('rotation scenario (%s pace)', (pace) => {
  it('never proposes the same outfit two days in a row over 5 days', () => {
    const outfits = simulate(5, pace);
    for (let day = 1; day < outfits.length; day += 1) {
      expect(sameOutfit(outfits[day], outfits[day - 1])).toBe(false);
    }
  });

  it('brings favourites back more often, but not every day', () => {
    const outfits = simulate(30, pace);
    const favTop = countWears(outfits, 'favTop');
    const otherTops = [1, 2, 3, 4, 5].map((index) => countWears(outfits, `top${index}`));
    expect(favTop).toBeGreaterThan(Math.max(...otherTops));
    expect(favTop).toBeLessThan(outfits.length / 2);
    for (let day = 1; day < outfits.length; day += 1) {
      expect(outfits[day].top === 'favTop' && outfits[day - 1].top === 'favTop').toBe(false);
    }
  });
});
