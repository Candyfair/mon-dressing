import { INSTRUMENT_SANS_ADVANCES, SPACE_GROTESK_ADVANCES } from './headerFontWidths';

// The header is designed down to 320 pt wide screens.
// How far the header's texts may shrink to stay whole on a narrow screen or
// with a large system text size.
export const HEADER_MIN_TEXT_SCALE = 0.6;
const TOP_ROW_MIN_SCALE = 0.58;
// Largest system text size followed by the header: beyond it, the longest
// date and program (top row) or four lines of text (weather) no longer fit.
export const HEADER_TOP_MAX_MULTIPLIER = 1.35;
export const HEADER_LINES_MAX_MULTIPLIER = 1.6;

// For a character missing from the width tables.
const DEFAULT_CHARACTER_WIDTH = 0.6;

// Kerning and rounding can make a line slightly wider than its advances.
const LINE_WIDTH_SAFETY = 1.01;
const LINE_SCALE_STEP = 0.08;
const MAX_LINE_STEP = Math.round((1 - HEADER_MIN_TEXT_SCALE) / LINE_SCALE_STEP);
// Measured widths are rounded: keeps the last letter away from the edge.
const TOP_ROW_SAFETY = 2;

export interface WeatherLinesFit {
  texts: readonly string[];
  // Width of each text, and the font after the system text size.
  width: number;
  fontSize: number;
  lineHeight: number;
  // Height taken by everything but the text.
  fixedHeight: number;
  maxHeight: number;
}

export interface WeatherLinesScale {
  scale: number;
  // Even the smallest size is too high: each text is limited in lines.
  clamped: boolean;
}

function advanceWidth(text: string, advances: Readonly<Record<string, number>>): number {
  return [...text].reduce(
    (total, character) => total + (advances[character] ?? DEFAULT_CHARACTER_WIDTH),
    0,
  );
}

function lineTextWidth(text: string, fontSize: number): number {
  return advanceWidth(text, INSTRUMENT_SANS_ADVANCES) * fontSize * LINE_WIDTH_SAFETY;
}

function wrappedRows(text: string, fontSize: number, width: number): number {
  const spaceWidth = lineTextWidth(' ', fontSize);
  let rows = 1;
  let used = 0;
  for (const word of text.split(' ')) {
    const wordWidth = lineTextWidth(word, fontSize);
    const withSpace = used === 0 ? wordWidth : used + spaceWidth + wordWidth;
    if (withSpace <= width) {
      used = withSpace;
    } else {
      const wordRows = Math.ceil(wordWidth / width);
      rows += used === 0 ? wordRows - 1 : wordRows;
      used = wordWidth - (wordRows - 1) * width;
    }
  }
  return rows;
}

/** The largest size at which the weather lines stay inside their row. */
export function weatherLinesScale(fit: WeatherLinesFit): WeatherLinesScale {
  for (let step = 0; step <= MAX_LINE_STEP; step += 1) {
    const scale = 1 - step * LINE_SCALE_STEP;
    const rows = fit.texts.reduce(
      (total, text) => total + wrappedRows(text, fit.fontSize * scale, fit.width),
      0,
    );
    if (rows * fit.lineHeight * scale + fit.fixedHeight <= fit.maxHeight) {
      return { scale, clamped: false };
    }
  }
  return { scale: HEADER_MIN_TEXT_SCALE, clamped: true };
}

export interface TopRowFit {
  width: number;
  // Everything that keeps its size: settings button, gaps, frame of the chip.
  fixedWidth: number;
  dateWidth: number;
  labelWidth: number;
}

/** One scale for the date and the program, so that neither pays for the other. */
export function topRowScale({ width, fixedWidth, dateWidth, labelWidth }: TopRowFit): number {
  const available = width - fixedWidth - TOP_ROW_SAFETY;
  return Math.min(1, Math.max(TOP_ROW_MIN_SCALE, available / (dateWidth + labelWidth)));
}

export interface TemperatureFit {
  // Width of the whole header.
  width: number;
  // Width the weather lines keep, and the space before them.
  reserved: number;
  current: string;
  max: string;
  currentSize: number;
  currentTracking: number;
  maxSize: number;
  maxTracking: number;
  gap: number;
}

function textWidth(text: string, fontSize: number, tracking: number): number {
  return advanceWidth(text, SPACE_GROTESK_ADVANCES) * fontSize + [...text].length * tracking;
}

/** Width of the temperatures at their design size. */
export function temperaturesWidth(fit: TemperatureFit): number {
  return (
    textWidth(fit.current, fit.currentSize, fit.currentTracking) +
    fit.gap +
    textWidth(fit.max, fit.maxSize, fit.maxTracking)
  );
}

/**
 * Scale of the temperatures, so that they leave the weather lines their room:
 * 1 whenever they fit, smaller on a narrow screen or with long values.
 */
export function temperatureScale(fit: TemperatureFit): number {
  const available = fit.width - fit.reserved;
  return Math.min(1, Math.max(HEADER_MIN_TEXT_SCALE, available / temperaturesWidth(fit)));
}
