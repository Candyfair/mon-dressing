import type { Usage } from '../types';
import {
  clearGroup,
  coversWholeGroup,
  hasAllTag,
  parseUsage,
  toggleUsage,
  USAGE_GROUPS,
} from './usageGroups';

describe('parseUsage', () => {
  it('splits every catalogue usage into its group and value', () => {
    for (const { group, usages } of USAGE_GROUPS) {
      for (const usage of usages) {
        expect(parseUsage(usage)).toEqual({ group, value: usage.split('.')[1] });
      }
    }
  });

  it('fails loudly on a value the catalogue does not know', () => {
    expect(() => parseUsage('weather.foggy' as Usage)).toThrow(/Unknown usage/);
    expect(() => parseUsage('mood.happy' as Usage)).toThrow(/Unknown usage/);
  });
});

describe('usage selection', () => {
  const picked = (...usages: Usage[]) => new Set<Usage>(usages);

  it('toggles a usage on and off', () => {
    const on = toggleUsage(picked(), 'weather.rain');
    expect([...on]).toEqual(['weather.rain']);
    expect([...toggleUsage(on, 'weather.rain')]).toEqual([]);
  });

  it('never keeps hot and cold together', () => {
    expect([...toggleUsage(picked('weather.hot', 'weather.rain'), 'weather.cold')].sort()).toEqual([
      'weather.cold',
      'weather.rain',
    ]);
    expect([...toggleUsage(picked('weather.cold'), 'weather.hot')]).toEqual(['weather.hot']);
  });

  it('keeps mild and cool next to hot or cold', () => {
    expect(toggleUsage(picked('weather.hot'), 'weather.mild').size).toBe(2);
  });

  it('clears one group with its "all" tag and leaves the others', () => {
    const usages = picked('weather.hot', 'weather.rain', 'commute.bike');
    expect(coversWholeGroup(usages, 'weather')).toBe(false);
    const cleared = clearGroup(usages, 'weather');
    expect(coversWholeGroup(cleared, 'weather')).toBe(true);
    expect([...cleared]).toEqual(['commute.bike']);
  });

  it('has an "all" tag everywhere but in the activity group', () => {
    expect(USAGE_GROUPS.filter(({ group }) => hasAllTag(group)).map(({ group }) => group)).toEqual([
      'weather',
      'commute',
      'occasion',
    ]);
  });
});
