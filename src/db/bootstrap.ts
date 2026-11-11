import { eq } from 'drizzle-orm';

import { defaultWearLimits } from '../domain/catalogue/subtypes';
import { SETTINGS_ID, settings, wardrobes, wearLimits } from './schema';
import type { SyncDatabase } from './types';

export interface BootstrapDeps {
  now: Date;
  newId: () => string;
  // IANA time zone of the device, e.g. "Europe/Paris".
  timeZone: string;
}

// Placeholder until the wardrobe name goes through i18n (level 2 review).
const MAIN_WARDROBE_NAME = 'Principale';

/**
 * Runs at every launch, idempotent:
 * - first launch: creates the main wardrobe and the settings row;
 * - every launch: gives each catalogue type its starting wear limit if it has
 *   none yet (types added by a newer catalogue), keeping the user's values.
 */
export function ensureDefaults(db: SyncDatabase, { now, newId, timeZone }: BootstrapDeps): void {
  db.transaction((tx) => {
    const existing = tx
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID))
      .get();
    if (!existing) {
      const wardrobeId = newId();
      tx.insert(wardrobes)
        .values({
          id: wardrobeId,
          name: MAIN_WARDROBE_NAME,
          kind: 'main',
          timeZone,
          createdAt: now,
        })
        .run();
      // Every other setting takes its default from the schema.
      tx.insert(settings).values({ id: SETTINGS_ID, activeWardrobeId: wardrobeId }).run();
    }

    tx.insert(wearLimits).values(defaultWearLimits()).onConflictDoNothing().run();
  });
}
