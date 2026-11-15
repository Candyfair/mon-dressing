import { useQuery } from '@tanstack/react-query';

import type { LocalDate } from '../../domain/time';
import { type Coordinates, type ForecastProvider, openMeteoProvider } from './openMeteo';

const STALE_MS = 30 * 60 * 1000;

/**
 * The forecast of a wardrobe's city, fetched at app open and cached. The
 * local date is part of the key so a new day fetches again.
 */
export function useForecast(
  coordinates: Coordinates | null,
  date: LocalDate,
  provider: ForecastProvider = openMeteoProvider,
) {
  return useQuery({
    queryKey: ['forecast', coordinates?.latitude, coordinates?.longitude, date],
    queryFn: () =>
      coordinates ? provider(coordinates) : Promise.reject(new Error('No city chosen')),
    enabled: coordinates !== null,
    staleTime: STALE_MS,
  });
}
