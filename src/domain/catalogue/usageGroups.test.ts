import type { Usage } from '../types';
import { parseUsage, USAGE_GROUPS } from './usageGroups';

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
