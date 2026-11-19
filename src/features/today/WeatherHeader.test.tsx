import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import '../../i18n';
import type { DayContext } from '../../domain/types';
import type { HeaderTemperatures, WeatherLines } from '../../domain/weather';
import { typography } from '../../ui/tokens';
import { HEADER_LINES_MAX_MULTIPLIER, HEADER_TOP_MAX_MULTIPLIER } from './headerFit';
import { WeatherHeader } from './WeatherHeader';

let mockFontScale = 1;

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 320, height: 640, scale: 2, fontScale: mockFontScale }),
}));

const CONTEXT = { activity: 'remote', commuteModes: ['bike'] } as unknown as DayContext;
const TEMPERATURES = { current: 9, max: 14 } as HeaderTemperatures;
const LINES: WeatherLines = {
  sky: { kind: 'cloudy' },
  advice: { kind: 'glovesAndScarf' },
};

function header(lines = LINES, temperatures = TEMPERATURES, width = 288) {
  return (
    <WeatherHeader
      width={width}
      date="Mer. 30 sept."
      context={CONTEXT}
      temperatures={temperatures}
      lines={lines}
    />
  );
}

async function layout(testID: string, size: { width?: number; height?: number }) {
  await fireEvent(screen.getByTestId(testID, { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0, ...size } },
  });
}

const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);
const lineSize = () =>
  StyleSheet.flatten(screen.getByText('Nuageux').props.style).fontSize as number;

describe('WeatherHeader', () => {
  beforeEach(() => {
    mockFontScale = 1;
  });

  it('measures and shows the top row with the same text size limit', async () => {
    await render(header());
    for (const testID of ['measure-date', 'measure-program', 'header-date', 'header-program']) {
      const text = screen.getByTestId(testID, { includeHiddenElements: true });
      expect(text.props.maxFontSizeMultiplier).toBe(HEADER_TOP_MAX_MULTIPLIER);
    }
  });

  it('stops following the system text size at the limit of the weather lines', async () => {
    mockFontScale = HEADER_LINES_MAX_MULTIPLIER;
    const view = await render(header());
    const atLimit = lineSize();
    mockFontScale = 3;
    await view.rerender(header());
    expect(lineSize()).toBe(atLimit);
    expect(screen.getByText('Nuageux').props.maxFontSizeMultiplier).toBe(
      HEADER_LINES_MAX_MULTIPLIER,
    );
  });

  it('shrinks the date and the program by the same scale', async () => {
    await render(header());
    await layout('measure-date', { width: 200 });
    await layout('measure-program', { width: 100 });
    const scale = styleOf('header-date').fontSize / typography.date.fontSize;
    expect(scale).toBeLessThan(1);
    expect(styleOf('header-program').fontSize / typography.chip.fontSize).toBeCloseTo(scale);
  });

  it('keeps short weather lines at their design size', async () => {
    await render(header());
    expect(lineSize()).toBe(typography.weatherLine.fontSize);
    expect(screen.getByText('Nuageux').props.numberOfLines).toBeUndefined();
  });

  it.each([1, 1.06])('keeps lines that fit at their size (system text %s)', async (fontScale) => {
    mockFontScale = fontScale;
    await render(
      header(
        {
          sky: { kind: 'rain', probability: 53, at: '13:00' },
          advice: { kind: 'umbrella', at: '13:00' },
        } as WeatherLines,
        { current: 14, max: 18 } as HeaderTemperatures,
        328,
      ),
    );
    const line = screen.getByText('Pluie 53 % vers 13 h');
    expect(StyleSheet.flatten(line.props.style).fontSize).toBe(typography.weatherLine.fontSize);
  });

  it('keeps two double lines at their size', async () => {
    await render(
      header(
        {
          sky: { kind: 'sunnyAllDay' },
          advice: { kind: 'heat', at: '12:00' },
        } as WeatherLines,
        { current: 21, max: 30 } as HeaderTemperatures,
        328,
      ),
    );
    const line = screen.getByText('Ensoleillé toute la journée');
    expect(StyleSheet.flatten(line.props.style).fontSize).toBe(typography.weatherLine.fontSize);
  });

  it('shrinks the weather lines when they would reach the top row', async () => {
    mockFontScale = 1.3;
    await render(
      header({
        sky: { kind: 'sunnyAllDay' },
        advice: { kind: 'glovesAndScarf' },
      }),
    );
    const size = StyleSheet.flatten(screen.getByText('Ensoleillé toute la journée').props.style);
    expect(size.fontSize).toBeLessThan(typography.weatherLine.fontSize);
  });
});
