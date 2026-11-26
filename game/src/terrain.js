// Procedural valley: one height function plus the features the
// missions need — rings, a flattened runway strip, a river, a town
// and patchwork fields. Everything is derived from the seed, so a
// screenshot seed replays the same valley every time.

import { WORLD, RING_COUNT, DROP_TARGET_X } from './config.js';
import { fbm1, mulberry32 } from './rng.js';

function rawHeight(x, seed) {
  const rolling = 26 * fbm1(x * 0.0011, seed, 3) + 9 * fbm1(x * 0.0042, seed + 7, 2);
  return WORLD.groundBase + rolling;
}

function blend(a, b, t) {
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}

export function buildTerrain(seed) {
  const rand = mulberry32(seed * 7919 + 13);

  function heightAt(x) {
    let h = rawHeight(x, seed);
    // The river cuts a shallow channel through the valley floor.
    const dRiver = Math.abs(x - WORLD.riverX);
    if (dRiver < 130) h -= 14 * (1 - dRiver / 130);
    // Pinefield runway: a dead-flat strip at a fixed elevation, with
    // short ramps blending back into the rolling ground.
    const ramp = 260;
    let t = 1;
    if (x >= WORLD.runwayX0 && x <= WORLD.runwayX1) t = 0;
    else if (x > WORLD.runwayX0 - ramp && x < WORLD.runwayX0) t = (WORLD.runwayX0 - x) / ramp;
    else if (x > WORLD.runwayX1 && x < WORLD.runwayX1 + ramp) t = (x - WORLD.runwayX1) / ramp;
    if (t < 1) h = blend(WORLD.runwayAlt, h, t);
    // The town sits on a gently levelled shelf.
    if (x > WORLD.townX0 && x < WORLD.townX1) {
      h = blend(h, WORLD.groundBase + 4, 0.55);
    }
    return Math.max(6, h);
  }

  // Ring Run: six hoops arcing across the valley, heights that reward
  // a steady climb and a gentle descent.
  const ringAlts = [95, 130, 105, 150, 120, 85];
  const rings = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const x = 900 + i * 620;
    rings.push({ x, alt: ringAlts[i], radius: 26, passed: false });
  }

  // Patchwork fields: rectangles of colour laid on the ground.
  const fieldPalette = ['#c9b458', '#a8824f', '#8fae6b', '#b7a04a'];
  const fields = [];
  let fx = 420;
  while (fx < WORLD.worldEnd - 300) {
    const w = 160 + rand() * 260;
    if (fx + w < WORLD.runwayX0 - 120 && !(fx < WORLD.riverX + 160 && fx + w > WORLD.riverX - 160)) {
      fields.push({
        x0: fx,
        x1: fx + w,
        colour: fieldPalette[Math.floor(rand() * fieldPalette.length)],
      });
    }
    fx += w + 60 + rand() * 140;
  }

  // Town houses along the shelf, each with a roof colour and height.
  const houses = [];
  for (let x = WORLD.townX0 + 40; x < WORLD.townX1 - 40; x += 46 + rand() * 30) {
    houses.push({
      x,
      w: 26 + rand() * 14,
      h: 16 + rand() * 14,
      roof: rand() < 0.5 ? '#b0503a' : '#4a6b8a',
      wall: rand() < 0.5 ? '#e8dcc0' : '#d8c49a',
    });
  }

  // Clouds drift far above the valley; the renderer moves them slowly.
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    clouds.push({
      x: rand() * WORLD.worldEnd,
      alt: 230 + rand() * 130,
      scale: 0.7 + rand() * 1.1,
      speed: 2 + rand() * 4,
    });
  }

  return {
    seed,
    heightAt,
    rings,
    fields,
    houses,
    clouds,
    runway: { x0: WORLD.runwayX0, x1: WORLD.runwayX1, alt: WORLD.runwayAlt },
    riverX: WORLD.riverX,
    dropTargetX: DROP_TARGET_X,
    townX0: WORLD.townX0,
    townX1: WORLD.townX1,
  };
}
