// Drizzle schema, single source of truth for the database (DATA_MODEL.md §3).
// Level 1 review: any change here needs a migration and Candice's approval.
//
// No `$defaultFn` for ids or instants: this file is also loaded by drizzle-kit
// (Node) and the tests, so ids and `now` are injected by the callers instead.
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import type { SubtypeKey } from '../domain/catalogue/subtypes';
import type {
  Activity,
  CommuteMode,
  CutoutStatus,
  EventSource,
  GarmentEventType,
  Language,
  Location,
  Occasion,
  OutfitStatus,
  Slot,
  Usage,
  WardrobeKind,
} from '../domain/types';

export const wardrobes = sqliteTable('wardrobes', {
  id: text().primaryKey(),
  name: text().notNull(),
  kind: text().$type<WardrobeKind>().notNull(),
  // Null until the city is chosen (onboarding or geolocation).
  cityName: text(),
  latitude: real(),
  longitude: real(),
  timeZone: text().notNull(),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
});

export const garments = sqliteTable(
  'garments',
  {
    id: text().primaryKey(),
    wardrobeId: text()
      .notNull()
      .references(() => wardrobes.id, { onDelete: 'cascade' }),
    name: text(),
    slot: text().$type<Slot>().notNull(),
    subtype: text().$type<SubtypeKey>().notNull(),
    statementPiece: integer({ mode: 'boolean' }).notNull().default(false),
    needsIroning: integer({ mode: 'boolean' }).notNull().default(false),
    isFavorite: integer({ mode: 'boolean' }).notNull().default(false),
    isDemo: integer({ mode: 'boolean' }).notNull().default(false),
    // Lifecycle columns: written only by src/domain/lifecycle/ (DATA_MODEL.md §4).
    // The SQL defaults are a safety net; locationSince has none on purpose.
    wearCount: integer().notNull().default(0),
    location: text().$type<Location>().notNull().default('stored'),
    locationSince: integer({ mode: 'timestamp_ms' }).notNull(),
    toIron: integer({ mode: 'boolean' }).notNull().default(false),
    photoOriginalPath: text().notNull(),
    photoCutoutPath: text(),
    cutoutStatus: text().$type<CutoutStatus>().notNull().default('pending'),
    useCutout: integer({ mode: 'boolean' }).notNull().default(true),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    index('garments_wardrobe_slot_idx').on(t.wardrobeId, t.slot),
    index('garments_wardrobe_location_idx').on(t.wardrobeId, t.location),
    check('garments_wear_count_check', sql`${t.wearCount} >= 0`),
  ],
);

// No row in a group = every case of that group (SPEC §4.3).
export const garmentUsages = sqliteTable(
  'garmentUsages',
  {
    garmentId: text()
      .notNull()
      .references(() => garments.id, { onDelete: 'cascade' }),
    usage: text().$type<Usage>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.garmentId, t.usage] })],
);

export const wearLimits = sqliteTable(
  'wearLimits',
  {
    subtype: text().$type<SubtypeKey>().primaryKey(),
    maxWears: integer().notNull(),
  },
  (t) => [check('wear_limits_max_wears_check', sql`${t.maxWears} >= 1`)],
);

export const weeklyProgram = sqliteTable('weeklyProgram', {
  // ISO weekday: 1 = Monday … 7 = Sunday.
  weekday: integer().primaryKey(),
  activity: text().$type<Activity>().notNull(),
});

// One-off changes for a date (SPEC §5.3). Null = inherit.
export const dayOverrides = sqliteTable('dayOverrides', {
  date: text().primaryKey(),
  activity: text().$type<Activity>(),
  commuteModes: text({ mode: 'json' }).$type<CommuteMode[]>(),
  occasion: text().$type<Occasion>(),
});

export const outfits = sqliteTable(
  'outfits',
  {
    id: text().primaryKey(),
    wardrobeId: text()
      .notNull()
      .references(() => wardrobes.id, { onDelete: 'cascade' }),
    date: text().notNull(),
    status: text().$type<OutfitStatus>().notNull(),
    activity: text().$type<Activity>().notNull(),
    commuteModes: text({ mode: 'json' }).$type<CommuteMode[]>().notNull(),
    occasion: text().$type<Occasion>().notNull(),
    validatedAt: integer({ mode: 'timestamp_ms' }),
    sortedAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [uniqueIndex('outfits_wardrobe_date_status_idx').on(t.wardrobeId, t.date, t.status)],
);

export const outfitItems = sqliteTable(
  'outfitItems',
  {
    outfitId: text()
      .notNull()
      .references(() => outfits.id, { onDelete: 'cascade' }),
    slot: text().$type<Slot>().notNull(),
    garmentId: text().references(() => garments.id, { onDelete: 'set null' }),
  },
  (t) => [primaryKey({ columns: [t.outfitId, t.slot] })],
);

// Append-only history: never updated or deleted, except by cascade or set null.
export const garmentEvents = sqliteTable(
  'garmentEvents',
  {
    id: text().primaryKey(),
    garmentId: text()
      .notNull()
      .references(() => garments.id, { onDelete: 'cascade' }),
    type: text().$type<GarmentEventType>().notNull(),
    source: text().$type<EventSource>().notNull(),
    fromLocation: text().$type<Location>(),
    toLocation: text().$type<Location>(),
    toIron: integer({ mode: 'boolean' }),
    outfitId: text().references(() => outfits.id, { onDelete: 'set null' }),
    occurredAt: integer({ mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [
    index('garment_events_garment_type_occurred_idx').on(t.garmentId, t.type, t.occurredAt),
    index('garment_events_type_occurred_idx').on(t.type, t.occurredAt),
  ],
);

export const SETTINGS_ID = 'singleton';

// Single row. Defaults from DATA_MODEL.md §3 live here so the bootstrap only
// provides the id and the active wardrobe.
export const settings = sqliteTable('settings', {
  id: text().primaryKey().$type<typeof SETTINGS_ID>(),
  activeWardrobeId: text()
    .notNull()
    .references(() => wardrobes.id),
  commuteModes: text({ mode: 'json' }).$type<CommuteMode[]>().notNull().default([]),
  officeDepartureTime: text().notNull().default('08:30'),
  officeReturnTime: text().notNull().default('18:30'),
  lunchOutingEnabled: integer({ mode: 'boolean' }).notNull().default(false),
  activeDayStart: text().notNull().default('09:00'),
  activeDayEnd: text().notNull().default('20:00'),
  outfitReadyTime: text().notNull().default('07:00'),
  eveningSortTime: text().notNull().default('20:00'),
  // Null = not asked yet (just-in-time prompt, SPEC §8.3).
  airingEnabled: integer({ mode: 'boolean' }),
  dryingRackCountsAsStorage: integer({ mode: 'boolean' }).notNull().default(true),
  dryingDelayHours: integer().notNull().default(24),
  morningNotification: integer({ mode: 'boolean' }).notNull().default(false),
  eveningSortNotification: integer({ mode: 'boolean' }).notNull().default(false),
  laundryDryNotification: integer({ mode: 'boolean' }).notNull().default(false),
  useGeolocation: integer({ mode: 'boolean' }).notNull().default(false),
  language: text().$type<Language>().notNull().default('fr'),
  onboardingCompletedAt: integer({ mode: 'timestamp_ms' }),
  demoCleanupOfferedAt: integer({ mode: 'timestamp_ms' }),
  hintsSeen: text({ mode: 'json' }).$type<string[]>().notNull().default([]),
});

export type Wardrobe = typeof wardrobes.$inferSelect;
export type Garment = typeof garments.$inferSelect;
export type NewGarment = typeof garments.$inferInsert;
export type GarmentUsage = typeof garmentUsages.$inferSelect;
export type WearLimit = typeof wearLimits.$inferSelect;
export type WeeklyProgramDay = typeof weeklyProgram.$inferSelect;
export type DayOverride = typeof dayOverrides.$inferSelect;
export type Outfit = typeof outfits.$inferSelect;
export type OutfitItem = typeof outfitItems.$inferSelect;
export type GarmentEvent = typeof garmentEvents.$inferSelect;
export type Settings = typeof settings.$inferSelect;
