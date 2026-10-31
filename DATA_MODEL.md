# Mon Dressing — Data model

> Persistence: **expo-sqlite + Drizzle ORM**, local only (SPEC §11).
> Schema source of truth: `src/db/schema.ts`. Migrations generated with `drizzle-kit generate`, bundled and applied at startup (`useMigrations`).
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

```ts
type Slot = 'top' | 'bottom' | 'onePiece' | 'midLayer' | 'outerLayer' | 'shoes';
type Formality = 'sport' | 'casual' | 'smart' | 'dressy';          // ordered
type Warmth = 1 | 2 | 3;
type Location = 'stored' | 'airing' | 'onDryingRack' | 'dirty' | 'drying' | 'toIron';
type CutoutStatus = 'pending' | 'done' | 'failed';
type CommuteMode = 'walking' | 'bike' | 'publicTransport' | 'car';
type WardrobeKind = 'main' | 'secondary' | 'demo';
type GarmentEventType = 'locationChanged' | 'worn';
type OutfitStatus = 'validated' | 'probable';
```

Available locations (engine-eligible): `stored`, `airing` (from the morning after it was set), `onDryingRack`.

## 3. Tables

### `wardrobes`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `name` | text | "Principale", "Démo", "Valise Bretagne"… |
| `kind` | text `WardrobeKind` | `demo` is deleted as a whole when leaving demo mode |
| `cityName` | text | Displayed city |
| `latitude`, `longitude` | real | For Open-Meteo |
| `timeZone` | text | IANA, e.g. `Europe/Paris` |
| `createdAt` | integer ms | |

### `garments`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `wardrobeId` | text FK → wardrobes, on delete cascade | |
| `name` | text, nullable | Optional label; UI falls back to subtype label |
| `slot` | text `Slot` | Derived from subtype at creation, editable |
| `subtype` | text | Key into the subtype catalogue (§5) |
| `warmth` | integer `Warmth` | |
| `formality` | text `Formality` | |
| `waterproof` | boolean | |
| `bikeFriendly` | boolean | |
| `technical` | boolean | Sports linked via `garmentSports` |
| `statementPiece` | boolean | Default false |
| `needsIroning` | boolean | |
| `material` | text, nullable | |
| `maxWears` | integer ≥ 1 | Default from subtype + material |
| `wearCount` | integer ≥ 0 | Since last wash |
| `isFavorite` | boolean | |
| `location` | text `Location` | **Written only by the lifecycle module** (§4) |
| `locationSince` | integer ms | Used for the airing "next morning" rule and drying timer |
| `photoOriginalPath` | text | Relative path |
| `photoCutoutPath` | text, nullable | Relative path, PNG with alpha |
| `cutoutStatus` | text `CutoutStatus` | |
| `useCutout` | boolean | User toggle cutout / original (SPEC §10.3) |
| `createdAt`, `updatedAt` | integer ms | |

Indexes: `(wardrobeId, slot)`, `(wardrobeId, location)`.

### `sports`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `name` | text unique | User-created ("Vélo de route", "Rando"…) |
| `createdAt` | integer ms | |

### `garmentSports`
| Column | Type | Notes |
|---|---|---|
| `garmentId` | text FK → garments, cascade | PK part |
| `sportId` | text FK → sports, cascade | PK part |

### `activities`
User-customisable presets (seeded at first launch).
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `presetKey` | text, nullable | `office`, `remote`, `weekend`, `holidays`, `proEvent`, `outdoorSport` — null for user-created |
| `label` | text | Localised at seed time, editable |
| `formalityMin`, `formalityMax` | text `Formality` | Accepted range |
| `freshRequired` | boolean | Relative-wear threshold applies (SPEC §7) |
| `imposedSlot` | text `Slot`, nullable | e.g. `midLayer` for `proEvent` |
| `imposedFormalityMin` | text `Formality`, nullable | e.g. `dressy` |
| `requiresTechnical` | boolean | `outdoorSport` |
| `isOutdoorDay` | boolean | Whole active day is a constraining window (SPEC §6.2) |
| `sortOrder` | integer | |

### `weeklyProgram`
One row per weekday.
| Column | Type | Notes |
|---|---|---|
| `weekday` | integer PK | 1 = Monday … 7 = Sunday (ISO) |
| `activityId` | text FK → activities | |
| `commuteModes` | text (JSON array of `CommuteMode`) | One or more; may be empty for remote days |
| `departureTime`, `returnTime` | text `HH:mm`, nullable | Default 08:30 / 18:30 |
| `lunchOutingEnabled` | boolean | |
| `lunchStart`, `lunchEnd` | text `HH:mm` | Default 12:00 / 14:00 |
| `activeDayStart`, `activeDayEnd` | text `HH:mm` | Used when `isOutdoorDay`, default 09:00 / 19:00 |

### `dayOverrides`
One-off changes for a given date (SPEC §5.3). Same shape as `weeklyProgram` with all columns nullable (null = inherit), plus:
| Column | Type | Notes |
|---|---|---|
| `date` | text `YYYY-MM-DD` PK | |
| `sportId` | text FK → sports, nullable | Sport of the day for `outdoorSport` |

### `outfits`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `wardrobeId` | text FK → wardrobes, cascade | |
| `date` | text `YYYY-MM-DD` | Unique per (wardrobeId, date, status = validated) |
| `status` | text `OutfitStatus` | `probable` = last consulted outfit kept as evening safety net |
| `activityId` | text FK → activities | Context snapshot |
| `commuteModes` | text (JSON array) | Context snapshot |
| `validatedAt` | integer ms, nullable | |
| `sortedAt` | integer ms, nullable | Evening sort done |
| `createdAt` | integer ms | |

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
| `type` | text `GarmentEventType` | `worn` on validation, `locationChanged` on every move |
| `fromLocation`, `toLocation` | text `Location`, nullable | For `locationChanged` |
| `outfitId` | text FK → outfits, nullable | For `worn` |
| `occurredAt` | integer ms | |
Index: `(garmentId, occurredAt)`. **Never updated or deleted** except by cascade.

### `settings` — single row (`id = 'singleton'`)
| Column | Type | Notes |
|---|---|---|
| `activeWardrobeId` | text FK → wardrobes | |
| `airingEnabled` | boolean, nullable | **null = not asked yet** (just-in-time prompt) |
| `autoPutAway` | boolean, nullable | **null = not asked yet** |
| `dryingDelayHours` | integer | Default 24 |
| `eveningSortTime` | text `HH:mm` | Default `20:00` |
| `eveningNotification` | boolean | Default false |
| `useGeolocation` | boolean | |
| `language` | text | `fr` / `en` |
| `onboardingCompletedAt` | integer ms, nullable | |
| `hintsSeen` | text (JSON array) | One-time hints (long press…) |

Weather is **not** stored in SQLite: TanStack Query cache only.

## 4. Invariants

| Invariant | Enforcement |
|---|---|
| `garments.location`, `locationSince`, `wearCount` are written **only** by `src/domain/lifecycle/` | Pre-commit check (grep) + code review level 1 |
| Every location change writes a `garmentEvents` row **in the same transaction** | Lifecycle module API is the only entry point; tested |
| Entering `drying` resets `wearCount` to 0 | State machine tests |
| `shoes` never enter `airing`, `dirty`, `drying`, `toIron`, `onDryingRack` | State machine tests |
| `toIron` only reachable from `drying` with `needsIroning = true` | State machine tests |
| Photo paths are relative | Unit test on the photo storage helper |
| At most one `validated` outfit per wardrobe and date | Unique partial index + test |

## 5. Subtype catalogue (code, not a table)

`src/domain/catalogue/subtypes.ts` — versioned TypeScript constant, one entry per subtype:

```ts
interface SubtypeDefaults {
  key: string;            // 'tshirt', 'shirt', 'jeans', 'dress', 'raincoat', 'ankleBoots'…
  slot: Slot;
  warmth: Warmth;
  formality: Formality;
  waterproof: boolean;
  bikeFriendly: boolean;
  technical: boolean;
  needsIroning: boolean;
  defaultMaxWears: number; // calibrated on the official ADEME list (SPEC §14.1)
  icon: string;
}
```
Material adjusts `defaultMaxWears` through a separate small table in the same module (e.g. merino wool raises it). Values are an open item until S3.

## 6. Migration policy

- Generate with `drizzle-kit generate`; never edit a migration once committed and run on a device.
- Every migration is tested on a copy of a real database (Candice's inventory) before merge.
- Destructive changes (drop/rename column) require an explicit data-preservation step and a Plan Mode session.
