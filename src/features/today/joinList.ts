/** « à pied », « à pied et à vélo », « à pied, à vélo et en voiture ». */
export function joinList(items: readonly string[], and: string): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}
