import { QueryClient, useQuery } from '@tanstack/react-query';

import type { LocalDate } from '../../domain/time';
import { type Coordinates, type ForecastProvider, openMeteoProvider } from './openMeteo';

// TanStack Query holds the weather only (SPEC §11.2); in memory for now,
// offline persistence comes with the Today screen (S7).
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

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
