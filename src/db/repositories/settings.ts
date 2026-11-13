import { eq } from 'drizzle-orm';

import { SETTINGS_ID, settings } from '../schema';
import type { SyncDatabase } from '../types';

/** The wardrobe new garments go to. The settings row exists once the database is ready. */
export function activeWardrobeId(db: SyncDatabase): string {
  const row = db
    .select({ id: settings.activeWardrobeId })
    .from(settings)
    .where(eq(settings.id, SETTINGS_ID))
    .get();
  if (!row) {
    throw new Error('Settings row missing: ensureDefaults has not run');
  }
  return row.id;
}
