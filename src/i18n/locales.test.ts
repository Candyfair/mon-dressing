import { SUBTYPES } from '../domain/catalogue/subtypes';
import { USAGE_GROUPS } from '../domain/catalogue/usageGroups';
import i18n from '.';
import fr from './locales/fr.json';

describe('French locale', () => {
  it('labels every catalogue type, and nothing else', () => {
    expect(Object.keys(fr.subtypes).sort()).toEqual(SUBTYPES.map((s) => s.key).sort());
  });

  it('labels every usage and usage group, and nothing else', () => {
    const { groups, ...byGroup } = fr.usages;
    expect(Object.keys(groups)).toEqual(USAGE_GROUPS.map((g) => g.group));
    const labelled = Object.entries(byGroup).flatMap(([group, values]) =>
      Object.keys(values).map((value) => `${group}.${value}`),
    );
    expect(labelled.sort()).toEqual(USAGE_GROUPS.flatMap((g) => g.usages).sort());
  });

  it('plurals the burst counter', () => {
    expect(i18n.t('add.addedCount', { count: 1 })).toBe('1 pièce ajoutée, voir');
    expect(i18n.t('add.addedCount', { count: 3 })).toBe('3 pièces ajoutées, voir');
  });

  it('is ready synchronously', () => {
    expect(i18n.t('subtypes.cottonTop')).toBe('Haut en coton');
  });

  it('only accepts known keys', () => {
    // @ts-expect-error: unknown key, rejected by the typed resources.
    expect(i18n.t('subtypes.unknown')).toBe('subtypes.unknown');
  });
});
