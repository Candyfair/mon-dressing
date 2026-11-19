import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { db } from '../../db/client';
import { loadEngineGarments, yesterdayOutfit } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import { type EngineGarment, statementConflict, suggestDay } from '../../domain/engine';
import {
  chosenOutfit,
  emptyRows,
  initialChoice,
  missingPiece,
  type OutfitChoice,
  widenableRows,
} from './outfitChoice';
import { useDayWeather } from './useDayWeather';

/** What only the display needs: it never changes the suggestion. */
interface PieceLook {
  // The garment's name, else its type (« Pull »).
  label: string;
  // Relative photo path (cutout, else original); null for the reference
  // wardrobe, which has no photos.
  photo: string | null;
}

/** A garment as Today shows it. */
export interface TodayPiece extends EngineGarment, PieceLook {}

interface LoadedWardrobe {
  garments: readonly EngineGarment[];
  looks: Readonly<Record<string, PieceLook>>;
}

function loadWardrobe(
  wardrobeId: string,
  typeLabel: (subtype: SubtypeKey) => string,
): LoadedWardrobe {
  const real = loadEngineGarments(db, wardrobeId);
  let garments: readonly EngineGarment[] = real;
  // Development only: an empty wardrobe (fresh install) shows the reference one.
  if (__DEV__ && real.length === 0) {
    const fixtures =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- only loaded in development
      require('../../domain/engine/__fixtures__/wardrobe') as typeof import('../../domain/engine/__fixtures__/wardrobe');
    garments = fixtures.referenceWardrobe();
  }
  const looks = Object.fromEntries(
    garmentThumbnails(db, wardrobeId).map((row): [string, PieceLook] => [
      row.id,
      { label: row.name ?? typeLabel(row.subtype), photo: row.photoPath },
    ]),
  );
  return { garments, looks };
}

// The same content keeps its object, so that what depends on it stays put.
function keepIfSame<T>(current: T, fresh: T): T {
  return JSON.stringify(current) === JSON.stringify(fresh) ? current : fresh;
}

/**
 * Today's state: the day, the engine's suggestion and the user's choice on
 * top of it (local state: SQLite stays the only stored truth, SPEC §11.2).
 * Validating the outfit and freezing it come in S7.
 */
export function useToday() {
  const { t } = useTranslation();
  const day = useDayWeather();
  const { date, wardrobe, context, settings, weather } = day;

  const load = useCallback(
    () => loadWardrobe(wardrobe.id, (subtype) => t(`subtypes.${subtype}`)),
    [wardrobe.id, t],
  );
  const [loaded, setLoaded] = useState(load);
  // Back on Today: garments may have been added or edited. A new photo or name
  // only changes the display: the suggestion and the choice stay.
  useFocusEffect(
    useCallback(() => {
      const fresh = load();
      setLoaded((current) => ({
        garments: keepIfSame(current.garments, fresh.garments),
        looks: keepIfSame(current.looks, fresh.looks),
      }));
    }, [load]),
  );
  const { garments, looks } = loaded;
  const pieces = useMemo(
    () =>
      new Map(
        garments.map((garment): [string, TodayPiece] => [
          garment.id,
          { ...garment, ...(looks[garment.id] ?? { label: garment.id, photo: null }) },
        ]),
      ),
    [garments, looks],
  );
  const suggestion = useMemo(
    () =>
      suggestDay(
        {
          date,
          timeZone: wardrobe.timeZone,
          garments,
          context,
          settings,
          yesterday: yesterdayOutfit(db, wardrobe.id, date),
        },
        weather,
      ),
    [date, wardrobe, garments, context, weather, settings],
  );

  // A new suggestion (the forecast arrived) starts the choice again.
  const [state, setState] = useState(() => ({
    suggestion,
    choice: initialChoice(suggestion),
  }));
  let { choice } = state;
  if (state.suggestion !== suggestion) {
    choice = initialChoice(suggestion);
    setState({ suggestion, choice });
  }
  // A gesture that ends after a new suggestion belongs to the old one.
  const setChoice = (update: (current: OutfitChoice) => OutfitChoice) =>
    setState((current) =>
      current.suggestion === suggestion ? { ...current, choice: update(current.choice) } : current,
    );

  const outfit = chosenOutfit(choice, suggestion, pieces);
  return {
    ...day,
    suggestion,
    pieces,
    choice,
    setChoice,
    outfit,
    missing: missingPiece(outfit),
    emptyRows: emptyRows(choice, suggestion, pieces),
    widenableRows: widenableRows(choice, suggestion, pieces),
    twoStatements: statementConflict(outfit, pieces),
  };
}
