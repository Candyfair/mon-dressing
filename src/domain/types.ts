// Domain enums (DATA_MODEL.md §2). Each union is derived from a const array so
// the values can be iterated (tests, exhaustive checks) without repeating them.

export const SLOTS = ['top', 'bottom', 'onePiece', 'midLayer', 'outerLayer', 'shoes'] as const;
export type Slot = (typeof SLOTS)[number];

export const LOCATIONS = ['stored', 'airing', 'onDryingRack', 'dirty', 'drying'] as const;
export type Location = (typeof LOCATIONS)[number];

export const CUTOUT_STATUSES = ['pending', 'done', 'failed'] as const;
export type CutoutStatus = (typeof CUTOUT_STATUSES)[number];

/** How a cutout ended, as written on its garment. */
export type CutoutOutcome = { status: 'done'; path: string } | { status: 'failed' };
// The cutout starts at capture time, so it may already be over when the
// garment is created.
export type NewGarmentCutout = { status: 'pending' } | CutoutOutcome;

export const ACTIVITIES = ['office', 'remote', 'relax', 'sport'] as const;
export type Activity = (typeof ACTIVITIES)[number];

export const COMMUTE_MODES = [
  'walking',
  'bike',
  'scooter',
  'publicTransport',
  'car',
  'motorbike',
] as const;
export type CommuteMode = (typeof COMMUTE_MODES)[number];

export const OCCASIONS = ['everyday', 'festive', 'ceremony', 'jobInterview'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const WEATHER_USAGES = ['hot', 'mild', 'cool', 'cold', 'rain'] as const;
export type WeatherUsage = (typeof WEATHER_USAGES)[number];

// Stored as "<group>.<value>" (SPEC §4.3).
export type Usage =
  | `weather.${WeatherUsage}`
  | `activity.${Activity}`
  | `commute.${CommuteMode}`
  | `occasion.${Occasion}`;

export const WARDROBE_KINDS = ['main', 'secondary'] as const;
export type WardrobeKind = (typeof WARDROBE_KINDS)[number];

export const GARMENT_EVENT_TYPES = ['locationChanged', 'ironingChanged', 'worn'] as const;
export type GarmentEventType = (typeof GARMENT_EVENT_TYPES)[number];

// `today` = outfit validated on Today (the `worn` events of that outfit).
export const EVENT_SOURCES = ['today', 'eveningSort', 'laundry', 'wardrobe', 'automatic'] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const OUTFIT_STATUSES = ['validated', 'probable'] as const;
export type OutfitStatus = (typeof OUTFIT_STATUSES)[number];

// How fast outfits rotate (settings.rotationPace, SPEC §7 step 4): `long`
// spreads pieces over a longer recency cap, `short` brings them back sooner.
export const ROTATION_PACES = ['long', 'short'] as const;
export type RotationPace = (typeof ROTATION_PACES)[number];

// Language of the UI (settings.language).
export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** What today is made of (SPEC §5.1), once the weekly program and the override are merged. */
export interface DayContext {
  activity: Activity;
  // Empty on days without a commute (remote, relax, sport unless overridden).
  commuteModes: readonly CommuteMode[];
  occasion: Occasion;
}

// Felt-temperature categories, the first four weather usages (SPEC §6.3).
export type FeltCategory = Exclude<WeatherUsage, 'rain'>;
