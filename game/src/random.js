// A tiny seeded random source so a screenshot seed always replays the same run.
// Mulberry32-style: a small, well-known mixing recipe, written out here in full.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` using the seeded source. */
export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** A number in [min, max) from the seeded source. */
export function range(random, min, max) {
  return min + random() * (max - min);
}
