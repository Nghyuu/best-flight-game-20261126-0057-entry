// Valley Run — shared constants for the whole game.
// One place for every number the other modules agree on, so tuning
// the feel of the plane never means hunting through the renderer.

export const VIEW = { width: 1280, height: 800 };

// World units are metres. The camera shows about 580 px of width
// worth of world per screen at the default zoom.
export const WORLD = {
  pxPerMetre: 2.1,
  groundBase: 40,
  runwayX0: 5200,
  runwayX1: 5840,
  runwayAlt: 38,
  riverX: 2350,
  townX0: 3050,
  townX1: 3750,
  worldEnd: 7000,
};

export const PLANE = {
  cruiseSpeed: 62, // m/s at full throttle, level
  minSpeed: 22,
  maxSpeed: 95,
  stallSpeed: 30,
  climbRate: 26, // m/s of vertical speed at full climb
  sinkRate: 14,
  pitchMaxUp: 24, // degrees
  pitchMaxDown: -18,
  pitchRate: 55, // degrees per second of input
  throttleRate: 0.9, // per second of input
  fuelCapacity: 100,
  fuelBurnIdle: 0.22, // per second
  fuelBurnFull: 1.05, // per second at full throttle
  safeTouchdown: 3.2, // m/s of vertical speed a landing may carry
  hardTouchdown: 7.5, // m/s that wrecks the undercarriage
  crashSpeed: 11, // m/s of vertical speed that ends the flight
};

export const COLOURS = {
  skyTop: '#7fb6e8',
  skyMid: '#a8cdea',
  skyLow: '#d9e9f2',
  sun: '#ffd76e',
  ridgeFar: '#8fa8c4',
  ridgeNear: '#6f8aa8',
  grass: '#7fae5a',
  grassDark: '#6d9c4c',
  fieldA: '#c9b458',
  fieldB: '#a8824f',
  fieldC: '#8fae6b',
  river: '#5d9ecf',
  runway: '#5a5f66',
  runwayMark: '#f2f2e8',
  ring: '#ffcf3d',
  ringGlow: 'rgba(255,207,61,0.35)',
  planeBody: '#e8442e',
  planeWing: '#f4f1e6',
  planeTrim: '#2e4a6b',
  hudPanel: 'rgba(12,26,40,0.72)',
  hudText: '#eaf4ff',
  hudAmber: '#ffcf3d',
  hudGreen: '#7be495',
  hudRed: '#ff6b5e',
};

export const MISSIONS = [
  {
    id: 'rings',
    key: '1',
    name: 'Ring Run',
    blurb: 'Thread all six valley rings. Smooth throttle, gentle turns.',
    objective: 'Fly through 6 rings',
  },
  {
    id: 'landing',
    key: '2',
    name: 'Gentle Landing',
    blurb: 'Bring her down on the strip at Pinefield. Soft and slow.',
    objective: 'Land on the runway, vertical speed under 3 m/s',
  },
  {
    id: 'cargo',
    key: '3',
    name: 'Cargo Drop',
    blurb: 'Drop the supply crate on the meadow marker. SPACE to release.',
    objective: 'Drop the crate as close to the marker as you can',
  },
];

export const RING_COUNT = 6;
export const DROP_TARGET_X = 3400;
export const SCORE = { ring: 250, landingBase: 400, landingSoft: 300, dropBase: 500 };
