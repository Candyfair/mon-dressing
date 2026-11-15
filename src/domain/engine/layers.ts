import type { DayWeather } from '../weather';
import type { LayerSlot } from './types';

/**
 * Layer slots the weather calls for (SPEC §6.3, decided 2026-11-15):
 * Cool → layer 1; Cold → layers 1 and 2; Rain adds layer 2. Indoor days never
 * get layer 2. Unknown weather suggests none; the user can always add one.
 */
export function suggestedLayers(
  weather: DayWeather | null,
  indoorDay: boolean,
): Record<LayerSlot, boolean> {
  if (!weather) {
    return { midLayer: false, outerLayer: false };
  }
  const cold = weather.category === 'cold';
  return {
    midLayer: cold || weather.category === 'cool',
    outerLayer: !indoorDay && (cold || weather.rain),
  };
}

/**
 * Shoes belong to the default outfit unless the day is spent indoors
 * (decided 2026-11-15), with or without a forecast.
 */
export function shoesSuggested(indoorDay: boolean): boolean {
  return !indoorDay;
}
