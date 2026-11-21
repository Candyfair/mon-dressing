import { joinList } from './joinList';

describe('joinList', () => {
  it('joins with commas and a last « et »', () => {
    expect(joinList([], 'et')).toBe('');
    expect(joinList(['à pied'], 'et')).toBe('à pied');
    expect(joinList(['à pied', 'à vélo'], 'et')).toBe('à pied et à vélo');
    expect(joinList(['à pied', 'à vélo', 'en voiture'], 'et')).toBe('à pied, à vélo et en voiture');
  });
});
