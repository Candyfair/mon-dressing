import { SUBTYPES } from '../domain/catalogue/subtypes';
import i18n from '.';
import fr from './locales/fr.json';

describe('French locale', () => {
  it('labels every catalogue type, and nothing else', () => {
    expect(Object.keys(fr.subtypes).sort()).toEqual(SUBTYPES.map((s) => s.key).sort());
  });

  it('is ready synchronously', () => {
    expect(i18n.t('subtypes.cottonTop')).toBe('Haut en coton');
  });

  it('only accepts known keys', () => {
    // @ts-expect-error: unknown key, rejected by the typed resources.
    expect(i18n.t('subtypes.unknown')).toBe('subtypes.unknown');
  });
});
