import type { SkyLine } from './reminders';
import type { DayWeather } from './types';

/** The three visual ambiences of Today (design-system: pluie, soleil, froid). */
export type Ambience = 'rain' | 'sun' | 'cold';

/**
 * Snow is cold; rain or a cloudy sky is rain; a Cold day is cold; anything
 * else is sun (design-system "Trois ambiances météo").
 */
export function ambience(day: DayWeather, sky: SkyLine): Ambience {
  if (sky.kind === 'snow') return 'cold';
  if (day.rain || sky.kind === 'rain' || sky.kind === 'cloudy') return 'rain';
  if (day.category === 'cold') return 'cold';
  return 'sun';
}
