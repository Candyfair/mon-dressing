import {
  HEADER_MIN_TEXT_SCALE,
  temperatureScale,
  type TemperatureFit,
  topRowScale,
  weatherLinesScale,
  type WeatherLinesFit,
} from './headerFit';

const fit: TemperatureFit = {
  width: 328,
  reserved: 146,
  current: '9°',
  max: '→ 14°',
  currentSize: 82,
  currentTracking: -3.28,
  maxSize: 18,
  maxTracking: -0.52,
  gap: 6,
};

const lines: WeatherLinesFit = {
  texts: ['Pluie 53 % vers 13 h', 'Parapluie conseillé vers 11 h'],
  width: 150,
  fontSize: 13,
  lineHeight: 16,
  fixedHeight: 8,
  maxHeight: 70,
};

describe('weatherLinesScale', () => {
  it('keeps the design size when the lines fit', () => {
    expect(weatherLinesScale(lines)).toEqual({ scale: 1, clamped: false });
  });

  it('does not shrink lines that really fit', () => {
    const fit = weatherLinesScale({
      ...lines,
      texts: ['Pluie 53 % vers 13 h', 'Parapluie conseillé vers 13 h'],
      width: 134,
      fontSize: 13.78,
      lineHeight: 16.96,
    });
    expect(fit).toEqual({ scale: 1, clamped: false });
  });

  it('shrinks lines that would rise above their row', () => {
    const fit = weatherLinesScale({ ...lines, fontSize: 20.8, lineHeight: 25.6 });
    expect(fit.scale).toBeLessThan(1);
    expect(fit.clamped).toBe(false);
  });

  it('limits the lines only when the smallest size is still too high', () => {
    const fit = weatherLinesScale({ ...lines, width: 40, fontSize: 26, lineHeight: 32 });
    expect(fit).toEqual({ scale: HEADER_MIN_TEXT_SCALE, clamped: true });
  });
});

describe('topRowScale', () => {
  const row = { width: 288, fixedWidth: 113, dateWidth: 100, labelWidth: 50 };

  it('keeps the design size when the two texts fit', () => {
    expect(topRowScale(row)).toBe(1);
  });

  it('shrinks the two texts together', () => {
    expect(topRowScale({ ...row, dateWidth: 130, labelWidth: 70 })).toBeCloseTo(173 / 200);
  });

  it('never goes below the smallest readable size', () => {
    expect(topRowScale({ ...row, dateWidth: 400, labelWidth: 200 })).toBe(0.58);
  });
});

describe('temperatureScale', () => {
  it('keeps the design size when the temperatures fit', () => {
    expect(temperatureScale(fit)).toBe(1);
  });

  it('shrinks long values on a narrow screen', () => {
    const scale = temperatureScale({ ...fit, width: 288, current: '−12°', max: '→ −4°' });
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(HEADER_MIN_TEXT_SCALE);
  });

  it('never goes below the smallest readable size', () => {
    expect(temperatureScale({ ...fit, width: 150, current: '−12°' })).toBe(HEADER_MIN_TEXT_SCALE);
  });
});
