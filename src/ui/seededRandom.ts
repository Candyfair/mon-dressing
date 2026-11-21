/**
 * A small fixed-seed generator for hand-made looks (ink specks, burst dots,
 * a hand-drawn line): the same seed always gives the same drawing. Returns
 * numbers in [0, 1). Not for anything that needs real randomness.
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
