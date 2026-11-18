import { useMemo, useState } from 'react';

import { db } from '../../db/client';
import { dayProgram } from '../../db/repositories/program';
import { getSettings } from '../../db/repositories/settings';
import { getActiveWardrobe } from '../../db/repositories/wardrobes';
import { planWeather, resolveDayContext } from '../../domain/engine';
import { localDate } from '../../domain/time';
import type { DayContext } from '../../domain/types';
import { headerTemperatures } from '../../domain/weather';
import { useForecast } from '../weather/useForecast';

/**
 * Today's date, program and weather, read once when Today opens: shared by
 * the Today screen and the tab bar (its tint in the dark theme). The
 * forecast is cached by TanStack Query, so both read the same fetch.
 */
export function useDayWeather() {
  // Fixed for the session: a new day at midnight is handled with the
  // evening sort (S7).
  const [now] = useState(() => new Date());
  const settings = useMemo(() => getSettings(db), []);
  const wardrobe = useMemo(() => getActiveWardrobe(db), []);
  const date = localDate(now, wardrobe.timeZone);

  const context = useMemo((): DayContext => {
    const program = dayProgram(db, date);
    return (
      resolveDayContext(program.weekdayActivity, program.override, settings.commuteModes) ?? {
        // No weekly program before onboarding (S9): an office day until then.
        activity: 'office',
        commuteModes: settings.commuteModes,
        occasion: 'everyday',
      }
    );
  }, [date, settings]);

  const coordinates =
    wardrobe.latitude !== null && wardrobe.longitude !== null
      ? { latitude: wardrobe.latitude, longitude: wardrobe.longitude }
      : null;
  const forecast = useForecast(coordinates, date).data ?? null;

  const weather = useMemo(
    () => planWeather({ date, timeZone: wardrobe.timeZone, context, settings, forecast }),
    [date, wardrobe.timeZone, context, settings, forecast],
  );
  const temperatures = useMemo(
    () => (forecast ? headerTemperatures(forecast, now, wardrobe.timeZone) : null),
    [forecast, now, wardrobe.timeZone],
  );

  return { now, date, settings, wardrobe, context, forecast, weather, temperatures };
}
