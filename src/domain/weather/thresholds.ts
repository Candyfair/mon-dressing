// Weather rules approved by Candice on 2026-11-15 (SPEC §6.3, §14.2).
// Every number the weather evaluation relies on lives here.

/** Lower bound (inclusive) of each felt category, °C; below `cool` is cold. */
export const FELT_CATEGORY_FLOORS = { cool: 10, mild: 17, hot: 22 } as const;

/** A window gets the Rain condition from this probability (%). */
export const RAIN_PROBABILITY_THRESHOLD = 40;

/** Rain is looked for this long before and after a commute. */
export const COMMUTE_RAIN_MARGIN_MINUTES = 60;

/** How long a commute's felt temperature is looked at, from the departure time. */
export const COMMUTE_DURATION_MINUTES = 60;

/** Added to the felt temperature of bike commutes (relative wind). */
export const BIKE_FELT_CORRECTION = -3;

/** "Je sors le midi" (SPEC §5.2). */
export const LUNCH_WINDOW = { start: '11:00', end: '15:00' } as const;

// Reminders (SPEC §6.4).
/** Frost: air temperature at or below this value (°C) in a morning window. */
export const FROST_TEMPERATURE = 0;
/** Morning ends here for the frost reminder. */
export const MORNING_END = '12:00';
/** Gloves and scarf: felt temperature below this value (°C) on an exposed commute. */
export const GLOVES_FELT_TEMPERATURE = 5;
/** Heat: felt temperature at or above this value (°C) in a window. */
export const HEAT_FELT_TEMPERATURE = 30;
