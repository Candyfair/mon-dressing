/** `#RRGGBB` or `rgba(r,g,b,a)` with its alpha replaced by `alpha`. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hex) {
    const [r, g, b] = hex.slice(1).map((part) => parseInt(part, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color);
  if (rgba) {
    return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${alpha})`;
  }
  throw new Error(`Unsupported colour: ${color}`);
}
