import { SUBTYPES } from '../../domain/catalogue/subtypes';
import { typeSections } from './typeSections';

describe('type sections', () => {
  it('shows the recent types, then every type in a fixed order of sections', () => {
    const { recent, sections } = typeSections(['jeans', 'tshirt']);
    expect(recent).toEqual(['jeans', 'tshirt']);
    expect(sections.map((section) => section.key)).toEqual([
      'tops',
      'bottoms',
      'onePieces',
      'outerwear',
      'shoes',
    ]);
  });

  it('puts the mid layers with the tops, and each type in one section', () => {
    const { sections } = typeSections([]);
    const of = (key: string) => sections.find((section) => section.key === key)?.subtypes;
    expect(of('tops')).toEqual([
      'tshirt',
      'tankTop',
      'shirt',
      'blouse',
      'cottonTop',
      'woolTop',
      'sweatshirt',
      'sweater',
      'cardigan',
      'blazer',
    ]);
    expect(of('bottoms')).toEqual(['jeans', 'trousers', 'skirt', 'shorts']);
    expect(of('onePieces')).toEqual(['dress', 'jumpsuit', 'dungarees']);
    expect(of('outerwear')).toEqual(['jacket', 'coat', 'raincoat']);
    expect(of('shoes')).toEqual(['sneakers', 'ankleBoots', 'shoes']);
    const all = sections.flatMap((section) => section.subtypes);
    expect(all.sort()).toEqual(SUBTYPES.map((s) => s.key).sort());
  });

  it('keeps a recent type in its section too', () => {
    const { sections } = typeSections(['jeans']);
    expect(sections.find((section) => section.key === 'bottoms')?.subtypes).toContain('jeans');
  });
});
