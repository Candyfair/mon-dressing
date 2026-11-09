# Frog-à-porter — Data model

> Persistence: **expo-sqlite + Drizzle ORM**, local only (SPEC §11).
> Schema source of truth: `src/db/schema.ts`. Migrations generated with `npm run db:generate` (`drizzle-kit generate`) into `src/db/migrations/`, bundled and applied at startup (`migrate` in `src/db/DatabaseProvider.tsx`).
> Foreign keys are enabled on every connection (`PRAGMA foreign_keys = ON`); without it SQLite applies no cascade.
> **Any change to this model = level 1 review** (diff + exact commit message approved individually, see `CLAUDE.md`).

## 1. Conventions

- **Primary keys: UUID v4 as text** for every entity (future sync, SPEC §11.3). Never auto-increment.
- **Instants:** integer Unix milliseconds (`integer({ mode: 'timestamp_ms' })`), UTC.
- **Local calendar dates:** text `YYYY-MM-DD`, interpreted in the active wardrobe's time zone.
- **Local times of day:** text `HH:mm`.
- **Enums:** text columns typed as TypeScript string-literal unions (`$type<...>()`), values listed below.
- **Photo paths: relative** to the app documents directory (e.g. `photos/<garmentId>/original.jpg`). Never absolute.
- Booleans: integer 0/1 (`integer({ mode: 'boolean' })`).

## 2. Enums

Defined in `src/domain/types.ts` as `as const` arrays with derived union types. No SQL `CHECK` on enum columns (adding a value would require a table rebuild); `CHECK` constraints only on numeric bounds (`wearCount >= 0`, `maxWears >= 1`).

```ts
type Slot = 'top' | 'bottom' | 'onePiece' | 'midLayer' | 'outerLayer' | 'shoes';
type Location = 'stored' | 'airing' | 'onDryingRack' | 'dirty' | 'drying';
type CutoutStatus = 'pending' | 'done' | 'failed';
type Activity = 'office' | 'remote' | 'relax' | 'sport';
type CommuteMode = 'walking' | 'bike' | 'scooter' | 'publicTransport' | 'car' | 'motorbike';
type Occasion = 'everyday' | 'evening' | 'festive' | 'ceremony' | 'jobInterview';
type WeatherUsage = 'hot' | 'mild' | 'cool' | 'cold' | 'rain';
type Usage =                                    // SPEC §4.3, stored as "<group>.<value>"
  | `weather.${WeatherUsage}`
  | `activity.${Activity}`
  | `commute.${CommuteMode}`
  | `occasion.${Occasion}`;
type WardrobeKind = 'main' | 'secondary';
type GarmentEventType = 'locationChanged' | 'ironingChanged' | 'worn';
type EventSource = 'today' | 'eveningSort' | 'laundry' | 'wardrobe' | 'automatic'; // today = outfit validated on Today
type OutfitStatus = 'validated' | 'probable';
```

Engine-eligible (SPEC §8.1): `toIron = false` ∧ location `stored`, `airing` (from the morning after it was set), or `onDryingRack` when `settings.dryingRackCountsAsStorage`.

## 3. Tables

### `wardrobes`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `name` | text | "Principale", "Valise Bretagne"… |
| `kind` | text `WardrobeKind` | Only `main` has a UI in v1 |
| `cityName` | text, nullable | Displayed city; **null = not chosen yet** (onboarding or geolocation) |
| `latitude`, `longitude` | real, nullable | For Open-Meteo; null with `cityName` |
| `timeZone` | text | IANA, e.g. `Europe/Paris`; set from the device when the wardrobe is created |
| `createdAt` | integer ms | |

### `garments`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `wardrobeId` | text FK → wardrobes, on delete cascade | |
| `name` | text, nullable | Optional description used in accessible names ("Pull mérinos écru"); falls back to the type label |
| `slot` | text `Slot` | Derived from subtype, updated by "Changer de type" |
| `subtype` | text | Key into the subtype catalogue (§5) |
| `statementPiece` | boolean | Default false |
| `needsIroning` | boolean | "Se repasse" |
| `isFavorite` | boolean | |
| `isDemo` | boolean | Demo garment (SPEC §9.7); default false |
| `wearCount` | integer ≥ 0 | Since last wash. **Lifecycle module only** (§4) |
| `location` | text `Location` | **Lifecycle module only** (§4) |
| `locationSince` | integer ms | Airing "next morning" rule and drying timer. **Lifecycle module only** |
| `toIron` | boolean | "À repasser" flag, independent from location. **Lifecycle module only** |
| `photoOriginalPath` | text | Relative path |
| `photoCutoutPath` | text, nullable | Relative path, PNG with alpha |
| `cutoutStatus` | text `CutoutStatus` | |
| `useCutout` | boolean | User toggle "Détourée / Photo d'origine" (SPEC §10.3) |
| `createdAt`, `updatedAt` | integer ms | |

Indexes: `(wardrobeId, slot)`, `(wardrobeId, location)`.

### `garmentUsages`
Usages given by the user (SPEC §4.3). **No row in a group = all cases of that group.**
| Column | Type | Notes |
|---|---|---|
| `garmentId` | text FK → garments, cascade | PK part |
| `usage` | text `Usage` | PK part |

### `wearLimits`
"Ports avant lavage" per type (SPEC §8.2). Seeded from the catalogue's `defaultMaxWears`; "Revenir aux valeurs de départ" rewrites the seed values.
| Column | Type | Notes |
|---|---|---|
| `subtype` | text PK | Catalogue key |
| `maxWears` | integer ≥ 1 | |

### `weeklyProgram`
One row per weekday.
| Column | Type | Notes |
|---|---|---|
| `weekday` | integer PK | 1 = Monday … 7 = Sunday (ISO) |
| `activity` | text `Activity` | Onboarding offers office / remote / relax |

Commute modes, office times and lunch outing are global (`settings`).

### `dayOverrides`
One-off changes for a given date (SPEC §5.3). Null = inherit.
| Column | Type | Notes |
|---|---|---|
| `date` | text `YYYY-MM-DD` PK | |
| `activity` | text `Activity`, nullable | |
| `commuteModes` | text (JSON array of `CommuteMode`), nullable | |
| `occasion` | text `Occasion`, nullable | Default occasion is `everyday` |

### `outfits`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `wardrobeId` | text FK → wardrobes, cascade | |
| `date` | text `YYYY-MM-DD` | |
| `status` | text `OutfitStatus` | `probable` = outfit displayed when the app was last closed that day (evening safety net), upserted when Today goes to background |
| `activity` | text `Activity` | Context snapshot |
| `commuteModes` | text (JSON array) | Context snapshot |
| `occasion` | text `Occasion` | Context snapshot |
| `validatedAt` | integer ms, nullable | |
| `sortedAt` | integer ms, nullable | Evening sort done |
| `createdAt` | integer ms | |

Unique per (wardrobeId, date, status).

### `outfitItems`
| Column | Type | Notes |
|---|---|---|
| `outfitId` | text FK → outfits, cascade | PK part |
| `slot` | text `Slot` | PK part |
| `garmentId` | text FK → garments, set null | |

### `garmentEvents` — append-only history
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `garmentId` | text FK → garments, cascade | |
| `type` | text `GarmentEventType` | `worn` on validation (or when a probable outfit is sorted), `locationChanged` on every move, `ironingChanged` when `toIron` changes |
| `source` | text `EventSource` | Where the change came from; the washes-avoided counter counts `locationChanged` → `airing` with source `eveningSort` in the current month |
| `fromLocation`, `toLocation` | text `Location`, nullable | For `locationChanged` |
| `toIron` | boolean, nullable | New value, for `ironingChanged` |
| `outfitId` | text FK → outfits, nullable, on delete set null | For `worn` and evening-sort moves; history survives the outfit |
| `occurredAt` | integer ms | |
Index: `(garmentId, type, occurredAt)` (last `worn` per garment for the rotation, SPEC §7), `(type, occurredAt)`. **Never updated or deleted** except by cascade (garment) or set null (`outfitId`).

### `settings` — single row (`id = 'singleton'`)
Created with the main wardrobe on first launch by `ensureDefaults` (`src/db/bootstrap.ts`, idempotent); every default below is a column default in the schema.

| Column | Type | Notes |
|---|---|---|
| `activeWardrobeId` | text FK → wardrobes | |
| `commuteModes` | text (JSON array of `CommuteMode`) | "Trajet du bureau" |
| `officeDepartureTime`, `officeReturnTime` | text `HH:mm` | Default 08:30 / 18:30 |
| `lunchOutingEnabled` | boolean | "Je sors le midi"; window 11:00–15:00. Default false |
| `activeDayStart`, `activeDayEnd` | text `HH:mm` | Relax / sport days, default 09:00 / 20:00 |
| `outfitReadyTime` | text `HH:mm` | "Tenue prête à", default 07:00 |
| `eveningSortTime` | text `HH:mm` | Default 20:00 |
| `airingEnabled` | boolean, nullable | **null = not asked yet** (just-in-time prompt) |
| `dryingRackCountsAsStorage` | boolean | "L'étendoir sert de rangement", default true |
| `dryingDelayHours` | integer | Default 24 |
| `morningNotification`, `eveningSortNotification`, `laundryDryNotification` | boolean | Default false (opt-in) |
| `useGeolocation` | boolean | |
| `language` | text | `fr` / `en` |
| `onboardingCompletedAt` | integer ms, nullable | |
| `demoCleanupOfferedAt` | integer ms, nullable | Set when the "delete demo garments?" prompt has been shown (SPEC §9.7) |
| `hintsSeen` | text (JSON array) | One-time hints (long press…) |

Weather is **not** stored in SQLite: TanStack Query cache only.

## 4. Invariants

| Invariant | Enforcement |
|---|---|
| `garments.location`, `locationSince`, `toIron`, `wearCount` are written **only** by `src/domain/lifecycle/` | Pre-commit check (grep) + code review level 1 |
| Every location or ironing change writes a `garmentEvents` row **in the same transaction** | Lifecycle module API is the only entry point; tested |
| Entering `drying` resets `wearCount` to 0 and sets `toIron = needsIroning` | State machine tests |
| `drying` → `onDryingRack` only (automatic after `dryingDelayHours`, or "Déjà sec ?") | State machine tests |
| `shoes` never enter `airing`, `dirty`, `drying`, `onDryingRack`, and never get `toIron` | State machine tests |
| A garment with `toIron = true` is never engine-eligible | Engine tests |
| Demo garments can be inserted only when the wardrobe has no garment | Demo service test |
| Photo paths are relative | Unit test on the photo storage helper |
| At most one outfit per wardrobe, date and status | Unique index + test |

## 5. Subtype catalogue (code, not a table)

`src/domain/catalogue/subtypes.ts` — versioned TypeScript constant, one entry per subtype:

```ts
interface Subtype {
  key: string;             // 'tshirt', 'shirt', 'jeans', 'dress', 'raincoat', 'ankleBoots'…
  slot: Slot;
  defaultMaxWears: number; // starting wear limit, from the official ADEME list (SPEC §14.1)
  icon: string;
}
```
The catalogue carries **no usage, warmth or formality**: the app never infers usages from the type (SPEC §4.2). Starting values are an open item until S3.

## 6. Migration policy

- Generate with `drizzle-kit generate`; never edit a migration once committed and run on a device.
- Every migration is tested on a copy of a real database (Candice's inventory) before merge.
- Destructive changes (drop/rename column) require an explicit data-preservation step and a Plan Mode session.
