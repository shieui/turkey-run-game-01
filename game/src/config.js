// Gobble Dash — every number that tunes the game lives here, so the rest of the
// code reads like the rules of the escape instead of a pile of magic numbers.

export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 462;
export const STEP = 1 / 60;

export const TURKEY = {
  x: 170,
  width: 52,
  height: 46,
  duckHeight: 26,
  jumpVelocity: -700,
  doubleJumpVelocity: -600,
  gravity: 1600,
  coyoteSeconds: 0.09,
};

export const RUN = {
  startSpeed: 250,
  maxSpeed: 520,
  // Speed grows with distance so the escape gets harder the further you get.
  speedPerMetre: 0.16,
  metresPerPixel: 0.045,
  escapeDistance: 1500,
  startLives: 3,
  startGap: 150, // pixels between the turkey and the farmer when the run begins
  minGap: 26, // the farmer is on your tail feathers — one more stumble and you are caught
  maxGap: 260,
  gapRecoverPerSecond: 14,
  gapRecoverPerCorn: 4,
  stumbleGapLoss: 52,
  cornScore: 50,
  goldenCornScore: 150,
  pieScore: 100,
  surviveScorePerSecond: 12,
};

// Where each stage of the escape begins (in metres) and what it looks like.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    sky: ['#ffd98a', '#ff9d5c'],
    ground: '#8a5a2b',
    grass: '#7fae4c',
    accent: '#c96f2e',
    label: 'Dawn in the farmyard — run!',
  },
  {
    name: 'THE BARN',
    from: 500,
    sky: ['#e8b06a', '#b45a3a'],
    ground: '#6e4520',
    grass: '#a8873f',
    accent: '#8a4b2a',
    label: 'Through the barn — mind the knives!',
  },
  {
    name: 'THE KITCHEN',
    from: 1000,
    sky: ['#d98a5f', '#8a3d2e'],
    ground: '#5a3a28',
    grass: '#b0703a',
    accent: '#7a2e22',
    label: 'The kitchen! The oven is lit — almost free!',
  },
  {
    name: 'THE FOREST GATE',
    from: 1450,
    sky: ['#a8d08a', '#5e8f4e'],
    ground: '#4a5a2e',
    grass: '#5e8f4e',
    accent: '#3e6b34',
    label: 'The forest gate — freedom!',
  },
];

export const OBSTACLES = {
  hay: { width: 54, height: 44, kind: 'hay' },
  fence: { width: 46, height: 58, kind: 'fence' },
  oven: { width: 74, height: 96, kind: 'oven' },
  knife: { width: 20, height: 74, kind: 'knife' }, // a blade swinging from above
};

export const PICKUPS = {
  corn: { radius: 14, kind: 'corn' },
  golden: { radius: 15, kind: 'golden' },
  pie: { radius: 17, kind: 'pie' },
};
