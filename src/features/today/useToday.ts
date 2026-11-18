import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { db } from '../../db/client';
import { loadEngineGarments, yesterdayOutfit } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import { type EngineGarment, planDay, statementConflict } from '../../domain/engine';
import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import {
  chosenOutfit,
  emptyRows,
  initialChoice,
  missingPiece,
  type OutfitChoice,
  widenableRows,
} from './outfitChoice';
import { useDayWeather } from './useDayWeather';

/** A garment as Today shows it. */
export interface TodayPiece extends EngineGarment {
  // The garment's name, else its type (« Pull »).
  label: string;
  // Relative photo path (cutout, else original); null for the reference
  // wardrobe, which has no photos.
  photo: string | null;
}

function loadPieces(wardrobeId: string, typeLabel: (subtype: SubtypeKey) => string) {
  const real = loadEngineGarments(db, wardrobeId);
  // Development only: an empty wardrobe (fresh install) shows the reference one.
  const garments = real.length > 0 || !__DEV__ ? real : referenceWardrobe();
  const photos = new Map(garmentThumbnails(db, wardrobeId).map((row) => [row.id, row]));
  return new Map(
    garments.map((garment): [string, TodayPiece] => {
      const row = photos.get(garment.id);
      return [
        garment.id,
        {
          ...garment,
          label: row ? (row.name ?? typeLabel(row.subtype)) : garment.id,
          photo: row?.photoPath ?? null,
        },
      ];
    }),
  );
}

/**
 * Today's state: the day, the engine's suggestion and the user's choice on
 * top of it (local state: SQLite stays the only stored truth, SPEC §11.2).
 * Validating the outfit and freezing it come in S7.
 */
export function useToday() {
  const { t } = useTranslation();
  const day = useDayWeather();
  const { date, wardrobe, context, settings, forecast } = day;

  const load = useCallback(
    () => loadPieces(wardrobe.id, (subtype) => t(`subtypes.${subtype}`)),
    [wardrobe.id, t],
  );
  const [pieces, setPieces] = useState(load);
  // Back on Today: garments may have been added or edited. An unchanged
  // wardrobe keeps its object, so the current choice is not lost.
  useFocusEffect(
    useCallback(() => {
      const fresh = load();
      setPieces((current) =>
        JSON.stringify([...current]) === JSON.stringify([...fresh]) ? current : fresh,
      );
    }, [load]),
  );
  const plan = useMemo(
    () =>
      planDay({
        date,
        timeZone: wardrobe.timeZone,
        context,
        settings,
        forecast,
        garments: [...pieces.values()],
        yesterday: yesterdayOutfit(db, wardrobe.id, date),
      }),
    [date, wardrobe, context, settings, forecast, pieces],
  );

  // A new suggestion (the forecast arrived) starts the choice again.
  const [state, setState] = useState(() => ({
    suggestion: plan.suggestion,
    choice: initialChoice(plan.suggestion),
  }));
  let { choice } = state;
  if (state.suggestion !== plan.suggestion) {
    choice = initialChoice(plan.suggestion);
    setState({ suggestion: plan.suggestion, choice });
  }
  const setChoice = (update: (current: OutfitChoice) => OutfitChoice) =>
    setState((current) => ({ ...current, choice: update(current.choice) }));

  const outfit = chosenOutfit(choice, plan.suggestion, pieces);
  return {
    ...day,
    plan,
    pieces,
    choice,
    setChoice,
    outfit,
    missing: missingPiece(outfit),
    emptyRows: emptyRows(choice, plan.suggestion, pieces),
    widenableRows: widenableRows(choice, plan.suggestion, pieces),
    twoStatements: statementConflict(outfit, pieces),
  };
}
