/**
 * `#RRGGBB` or `rgba(r,g,b,a)` made at least `alpha` opaque: a colour that is
 * already more opaque keeps its own alpha.
 */
export function withMinAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hex) {
    // A hex colour is fully opaque already.
    return color;
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (rgba) {
    const own = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${Math.max(own, alpha)})`;
  }
  throw new Error(`Unsupported colour: ${color}`);
}

/**
 * A colour and its opacity apart: SVG gradient stops ignore the alpha of an
 * `rgba` colour and take it from `stopOpacity`.
 */
export function splitAlpha(color: string): { color: string; opacity: number } {
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(color);
  return rgba
    ? { color: `rgb(${rgba[1]},${rgba[2]},${rgba[3]})`, opacity: Number(rgba[4]) }
    : { color, opacity: 1 };
}
