import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, AppState } from 'react-native';

import { db } from '../../db/client';
import { loadEngineGarments, yesterdayOutfit } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
import {
  saveProbableOutfit,
  todayOutfit,
  type TodayOutfit,
  undoValidation,
  validateOutfit,
} from '../../db/repositories/outfits';
import type { SubtypeKey } from '../../domain/catalogue/subtypes';
import { type EngineGarment, statementConflict, suggestDay } from '../../domain/engine';
import {
  choiceFromSelection,
  chosenOutfit,
  emptyRows,
  frozenSuggestion,
  hiddenBottom,
  initialChoice,
  type KeptOutfit,
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
  // Development reference wardrobe: its garments are not in the database, so
  // nothing about the outfit is stored.
  reference: boolean;
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
  return { garments, looks, reference: garments !== real };
}

// The same content keeps its object, so that what depends on it stays put.
function keepIfSame<T>(current: T, fresh: T): T {
  return JSON.stringify(current) === JSON.stringify(fresh) ? current : fresh;
}

/**
 * Today's state: the day, the engine's suggestion and the user's choice on
 * top of it (local state: SQLite stays the only stored truth, SPEC §11.2).
 * Once validated, the outfit comes from the database and is frozen for the
 * day (SPEC §7); tapping the button again undoes the validation.
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
  const reload = useCallback(() => {
    const fresh = load();
    setLoaded((current) => ({
      garments: keepIfSame(current.garments, fresh.garments),
      looks: keepIfSame(current.looks, fresh.looks),
      reference: fresh.reference,
    }));
  }, [load]);

  // The day's validated outfit, read again for a new day or back on Today.
  const readFrozen = useCallback(
    () => ({ date, outfit: todayOutfit(db, wardrobe.id, date) }),
    [date, wardrobe.id],
  );
  const [frozenState, setFrozenState] = useState<{ date: string; outfit: TodayOutfit }>(readFrozen);
  let frozen = frozenState.outfit;
  if (frozenState.date !== date) {
    const fresh = readFrozen();
    frozen = fresh.outfit;
    setFrozenState(fresh);
  }

  // Back on Today: garments may have been added or edited. A new photo or name
  // only changes the display: the suggestion and the choice stay.
  useFocusEffect(
    useCallback(() => {
      reload();
      setFrozenState(readFrozen());
    }, [reload, readFrozen]),
  );
  const { garments, looks, reference } = loaded;
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

  // The bottom a validated dress hides is not worn, so not stored: it is kept
  // here for the day, until the app closes.
  const [keptBottom, setKeptBottom] = useState<{ date: string; id: string | null }>({
    date,
    id: null,
  });
  const frozenBottom = keptBottom.date === date ? keptBottom.id : null;

  // A frozen outfit is drawn from what was validated, not from the engine.
  const frozenSelection = frozen.status === 'validated' ? frozen.selection : null;
  const kept = useMemo<KeptOutfit | null>(
    () => (frozenSelection ? { selection: frozenSelection, hiddenBottom: frozenBottom } : null),
    [frozenSelection, frozenBottom],
  );
  const shown = useMemo(() => (kept ? frozenSuggestion(kept) : suggestion), [kept, suggestion]);

  // A new suggestion (the forecast arrived) starts the choice again; after an
  // undo, it starts from the outfit that was validated.
  const [state, setState] = useState<{
    suggestion: typeof shown;
    choice: OutfitChoice;
    carryOver: KeptOutfit | null;
  }>(() => ({ suggestion: shown, choice: initialChoice(shown), carryOver: null }));
  let { choice } = state;
  if (state.suggestion !== shown) {
    choice = state.carryOver ? choiceFromSelection(shown, state.carryOver) : initialChoice(shown);
    setState({ suggestion: shown, choice, carryOver: null });
  }
  // A gesture that ends after a new suggestion belongs to the old one.
  const setChoice = (update: (current: OutfitChoice) => OutfitChoice) =>
    setState((current) =>
      current.suggestion === shown ? { ...current, choice: update(current.choice) } : current,
    );

  const outfit = chosenOutfit(choice, shown, pieces);
  const missing = missingPiece(outfit);
  const isFrozen = frozenSelection !== null;

  const deps = () => ({ now: new Date(), newId: randomUUID });
  /** Validates the outfit shown; true when it is now frozen. */
  const validate = (): boolean => {
    if (reference || isFrozen || missing !== null) return false;
    const result = validateOutfit(
      db,
      { wardrobeId: wardrobe.id, date, context, selection: outfit },
      deps(),
    );
    if (!result.ok) return false;
    setKeptBottom({ date, id: hiddenBottom(choice, shown, pieces) });
    setFrozenState(readFrozen());
    reload();
    AccessibilityInfo.announceForAccessibility(t('today.validatedAnnouncement'));
    return true;
  };
  const undo = () => {
    if (reference || kept === null) return;
    if (!undoValidation(db, wardrobe.id, date, deps()).ok) return;
    setState((current) => ({ ...current, carryOver: kept }));
    setFrozenState(readFrozen());
    reload();
    AccessibilityInfo.announceForAccessibility(t('today.undoneAnnouncement'));
  };

  // Evening safety net (SPEC §8.5): the outfit shown when the app leaves the
  // screen, read from the latest render.
  const latest = useRef({ reference, isFrozen, outfit, missing, date, context });
  useEffect(() => {
    latest.current = { reference, isFrozen, outfit, missing, date, context };
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      const current = latest.current;
      if (appState !== 'background' || current.reference || current.isFrozen) return;
      saveProbableOutfit(
        db,
        {
          wardrobeId: wardrobe.id,
          date: current.date,
          context: current.context,
          selection: current.missing === null ? current.outfit : null,
        },
        { now: new Date(), newId: randomUUID },
      );
    });
    return () => subscription.remove();
  }, [wardrobe.id]);

  return {
    ...day,
    suggestion: shown,
    pieces,
    choice,
    setChoice,
    outfit,
    missing,
    frozen: isFrozen,
    validate,
    undo,
    emptyRows: isFrozen ? [] : emptyRows(choice, shown, pieces),
    widenableRows: isFrozen ? [] : widenableRows(choice, shown, pieces),
    twoStatements: statementConflict(outfit, pieces),
  };
}
