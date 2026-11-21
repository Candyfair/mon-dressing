import { SUBTYPES } from '../../domain/catalogue/subtypes';
import { addCategoryOf, typeSections } from './typeSections';

describe('type sections', () => {
  it('shows the recent types, then the others, without a category', () => {
    const sections = typeSections(null, ['jeans', 'tshirt']);
    expect(sections.category).toEqual([]);
    expect(sections.recent).toEqual(['jeans', 'tshirt']);
    expect(sections.others).not.toContain('jeans');
    expect(sections.others).toHaveLength(SUBTYPES.length - 2);
  });

  it('puts the category first, one-pieces with the tops, each type once', () => {
    const sections = typeSections('top', ['jeans', 'tshirt']);
    expect(sections.category).toEqual([
      'tshirt',
      'tankTop',
      'shirt',
      'blouse',
      'cottonTop',
      'woolTop',
      'dress',
      'jumpsuit',
      'dungarees',
    ]);
    expect(sections.recent).toEqual(['jeans']);
    const all = [...sections.category, ...sections.recent, ...sections.others];
    expect(all.sort()).toEqual(SUBTYPES.map((s) => s.key).sort());
  });

  it('keeps bottoms and shoes to their own types', () => {
    expect(typeSections('bottom', []).category).toEqual(['jeans', 'trousers', 'skirt', 'shorts']);
    expect(typeSections('shoes', []).category).not.toContain('jeans');
  });

  it('reads a route parameter', () => {
    expect(addCategoryOf('shoes')).toBe('shoes');
    expect(addCategoryOf('midLayer')).toBeNull();
    expect(addCategoryOf(undefined)).toBeNull();
    expect(addCategoryOf(['top'])).toBeNull();
  });
});
