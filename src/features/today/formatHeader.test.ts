import i18n from '../../i18n';
import { formatDegrees, formatShortDate } from './formatHeader';

const t = i18n.t.bind(i18n);

describe('header formatting', () => {
  it('writes the short date of the mockups', () => {
    expect(formatShortDate('2026-10-26', t)).toBe('Lun. 26 oct.');
    expect(formatShortDate('2026-06-12', t)).toBe('Ven. 12 juin');
    expect(formatShortDate('2026-12-13', t)).toBe('Dim. 13 déc.');
  });

  it('writes temperatures with a true minus sign', () => {
    expect(formatDegrees(9)).toBe('9°');
    expect(formatDegrees(-2)).toBe('−2°');
    expect(formatDegrees(0)).toBe('0°');
  });
});
