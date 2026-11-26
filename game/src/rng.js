// Seeded randomness: one small deterministic generator plus 1D value
// noise, so the same seed always grows the same valley. The game never
// touches Math.random for world layout, only for cosmetic flutter.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash1(n) {
  let h = (n | 0) * 374761393 + 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

// 1D value noise in [-1, 1], continuous, seeded by an integer offset.
export function valueNoise1(x, seedOffset) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = hash1(xi + seedOffset * 1013) * 2 - 1;
  const b = hash1(xi + 1 + seedOffset * 1013) * 2 - 1;
  return a + (b - a) * smooth(xf);
}

// A few octaves of value noise, still in roughly [-1, 1].
export function fbm1(x, seedOffset, octaves) {
  let total = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    total += valueNoise1(x * freq, seedOffset + o * 57) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return total / norm;
}
