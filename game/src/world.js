// Gobble Dash — the run itself: the turkey, the farmer on its tail, the obstacles
// and pickups, the distance to the forest gate. Pure simulation: no drawing, no
// input, no sound here, so the screenshot scenes can drive it step by step.

import { GROUND_Y, OBSTACLES, PICKUPS, RUN, STAGES, STEP, TURKEY, VIEW } from './config.js';
import { makeRandom, pick, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_STUMBLE = 1;
export const EVENT_PICKUP = 2;
export const EVENT_GOLDEN = 4;
export const EVENT_PIE = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_CAUGHT = 32;
export const EVENT_SPOTTED = 64;

const KIND_HAY = 'hay';
const KIND_FENCE = 'fence';
const KIND_OVEN = 'oven';
const KIND_KNIFE_LOW = 'knife-low';
const KIND_KNIFE_HIGH = 'knife-high';

export function stageFor(distance) {
  let stage = STAGES[0];
  for (const candidate of STAGES) if (distance >= candidate.from) stage = candidate;
  return stage;
}

export function createWorld(seed) {
  const random = makeRandom(seed);
  return {
    random,
    time: 0,
    distance: 0,
    score: 0,
    lives: RUN.startLives,
    gap: RUN.startGap,
    speed: RUN.startSpeed,
    over: false,
    outcome: null, // 'caught' | 'escaped'
    turkey: {
      x: TURKEY.x,
      y: GROUND_Y - TURKEY.height,
      vy: 0,
      grounded: true,
      ducking: false,
      jumpsUsed: 0,
      coyote: 0,
      invulnerableUntil: -1,
      runCycle: 0,
    },
    obstacles: [],
    pickups: [],
    particles: [],
    spawnIn: 1.1, // seconds until the first obstacle appears
    shake: 0,
    flash: 0,
    message: null, // { text, until } — a floating banner like "SPOTTED!"
    best: 0,
  };
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed);
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
}

function currentSpeed(world) {
  return Math.min(RUN.maxSpeed, RUN.startSpeed + world.distance * RUN.speedPerMetre);
}

function spawnObstacle(world) {
  const distance = world.distance;
  const table = [KIND_HAY, KIND_FENCE];
  if (distance > 220) table.push(KIND_KNIFE_LOW, KIND_KNIFE_HIGH);
  if (distance > 380) table.push(KIND_OVEN, KIND_KNIFE_LOW);
  if (distance > 700) table.push(KIND_OVEN, KIND_KNIFE_HIGH, KIND_FENCE);
  const kind = pick(world.random, table);
  const def = kind === KIND_OVEN ? OBSTACLES.oven
    : kind === KIND_FENCE ? OBSTACLES.fence
    : kind === KIND_KNIFE_LOW || kind === KIND_KNIFE_HIGH ? OBSTACLES.knife
    : OBSTACLES.hay;
  const obstacle = {
    kind,
    x: VIEW.width + 40,
    y: GROUND_Y - def.height,
    width: def.width,
    height: def.height,
    // Knives bob: low ones hug the ground, high ones fly at head height.
    baseY: GROUND_Y - def.height,
    phase: world.random() * Math.PI * 2,
    passed: false,
    hit: false,
  };
  if (kind === KIND_KNIFE_HIGH) { obstacle.y = GROUND_Y - 96; obstacle.baseY = GROUND_Y - 96; }
  if (kind === KIND_KNIFE_LOW) { obstacle.y = GROUND_Y - 30; obstacle.baseY = GROUND_Y - 30; }
  world.obstacles.push(obstacle);

  // Corn often arcs over a jumpable obstacle, or lines the ground after a knife.
  const roll = world.random();
  if (roll < 0.55 && (kind === KIND_HAY || kind === KIND_FENCE || kind === KIND_OVEN)) {
    const cx = obstacle.x + def.width / 2;
    for (let i = -1; i <= 1; i += 1) {
      world.pickups.push({
        kind: 'corn', x: cx + i * 34, y: GROUND_Y - 150 + Math.abs(i) * 34,
        radius: PICKUPS.corn.radius, taken: false, spin: world.random() * Math.PI * 2,
      });
    }
  } else if (roll < 0.8) {
    const count = 3 + Math.floor(world.random() * 3);
    for (let i = 0; i < count; i += 1) {
      world.pickups.push({
        kind: world.random() < 0.1 ? 'golden' : 'corn',
        x: obstacle.x + 90 + i * 36, y: GROUND_Y - 26,
        radius: PICKUPS.corn.radius, taken: false, spin: world.random() * Math.PI * 2,
      });
    }
  }
  if (distance > 300 && world.random() < 0.04) {
    world.pickups.push({
      kind: 'pie', x: obstacle.x + 160, y: GROUND_Y - 130,
      radius: PICKUPS.pie.radius, taken: false, spin: 0,
    });
  }
}

function turkeyBox(world) {
  const t = world.turkey;
  const height = t.ducking ? TURKEY.duckHeight : TURKEY.height;
  const top = t.ducking ? GROUND_Y - TURKEY.duckHeight : t.y;
  return {
    x: t.x + 7, y: top + 4,
    width: TURKEY.width - 14, height: height - 4,
  };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function burst(world, x, y, count, colour) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      x, y,
      vx: range(world.random, -140, 140),
      vy: range(world.random, -260, -40),
      life: range(world.random, 0.35, 0.8),
      maxLife: 0.8,
      size: range(world.random, 3, 7),
      colour,
    });
  }
}

export function jump(world) {
  const t = world.turkey;
  if (world.over) return false;
  if (t.grounded || t.coyote > 0) {
    t.vy = TURKEY.jumpVelocity;
    t.grounded = false;
    t.coyote = 0;
    t.jumpsUsed = 1;
    t.ducking = false;
    return true;
  }
  if (t.jumpsUsed < 2) {
    t.vy = TURKEY.doubleJumpVelocity;
    t.jumpsUsed = 2;
    burst(world, t.x + TURKEY.width / 2, t.y + TURKEY.height, 6, '#ffffff');
    return true;
  }
  return false;
}

export function setDuck(world, ducking) {
  const t = world.turkey;
  t.ducking = ducking && t.grounded;
}

/**
 * Advance the run one fixed step. `move` is -1, 0 or 1 (unused: the turkey always
 * runs forward; kept for the autopilot's shape) and `duck` holds the duck key.
 * Returns a bitmask of EVENT_* flags raised this step.
 */
export function stepWorld(world, dt, duck) {
  if (world.over) return EVENT_NONE;
  let events = EVENT_NONE;
  const t = world.turkey;
  world.time += dt;
  world.speed = currentSpeed(world);
  const scroll = world.speed * dt;
  world.distance += scroll * RUN.metresPerPixel;
  world.score += RUN.surviveScorePerSecond * dt;

  // The farmer gains whenever you stumble, and slowly loses ground while you run clean.
  world.gap = Math.min(RUN.maxGap, world.gap + RUN.gapRecoverPerSecond * dt);
  if (world.gap <= RUN.minGap + 60 && world.message === null) {
    world.message = { text: 'HE IS RIGHT BEHIND YOU!', until: world.time + 1.6 };
    events |= EVENT_SPOTTED;
  }
  if (world.message && world.time > world.message.until) world.message = null;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 3);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 2);

  // Turkey physics: gravity, landing, coyote time.
  t.vy += TURKEY.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y - TURKEY.height) {
    t.y = GROUND_Y - TURKEY.height;
    t.vy = 0;
    if (!t.grounded) burst(world, t.x + 26, GROUND_Y, 4, '#c9a06a');
    t.grounded = true;
    t.jumpsUsed = 0;
  } else if (t.grounded) {
    t.grounded = false;
    t.coyote = TURKEY.coyoteSeconds;
  }
  if (t.coyote > 0) t.coyote -= dt;
  t.ducking = duck && t.grounded;
  t.runCycle += dt * (t.grounded ? world.speed / 28 : 0);
  t.invulnerableUntil = Math.max(-1, t.invulnerableUntil - dt);

  // Spawn: keep a gap behind the last obstacle that shrinks as the run speeds up.
  world.spawnIn -= dt;
  const last = world.obstacles[world.obstacles.length - 1];
  const spacing = Math.max(230, 560 - world.distance * 0.14);
  if (world.spawnIn <= 0 && (!last || last.x < VIEW.width - spacing + world.random() * 120)) {
    spawnObstacle(world);
    world.spawnIn = range(world.random, 0.55, 1.15);
  }

  // Move everything with the world.
  for (const obstacle of world.obstacles) {
    obstacle.x -= scroll;
    if (obstacle.kind === KIND_KNIFE_LOW || obstacle.kind === KIND_KNIFE_HIGH) {
      obstacle.y = obstacle.baseY + Math.sin(world.time * 5 + obstacle.phase) * 8;
    }
  }
  for (const pickup of world.pickups) {
    pickup.x -= scroll;
    pickup.spin += dt * 4;
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -80);
  world.pickups = world.pickups.filter((p) => p.x + p.radius > -40 && !p.taken);

  // Pickups.
  const box = turkeyBox(world);
  for (const pickup of world.pickups) {
    if (pickup.taken) continue;
    const dx = pickup.x - (box.x + box.width / 2);
    const dy = pickup.y - (box.y + box.height / 2);
    if (dx * dx + dy * dy < (pickup.radius + 26) * (pickup.radius + 26)) {
      pickup.taken = true;
      if (pickup.kind === 'corn') {
        world.score += RUN.cornScore;
        world.gap = Math.min(RUN.maxGap, world.gap + RUN.gapRecoverPerCorn);
        events |= EVENT_PICKUP;
      } else if (pickup.kind === 'golden') {
        world.score += RUN.goldenCornScore;
        world.gap = Math.min(RUN.maxGap, world.gap + RUN.gapRecoverPerCorn * 2);
        events |= EVENT_GOLDEN;
      } else {
        world.score += RUN.pieScore;
        world.lives = Math.min(5, world.lives + 1);
        events |= EVENT_PIE;
      }
      burst(world, pickup.x, pickup.y, 8, pickup.kind === 'pie' ? '#ff8fb0' : '#ffd94a');
    }
  }

  // Obstacles: pass them for a little score, hit them and stumble.
  for (const obstacle of world.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < t.x) {
      obstacle.passed = true;
      world.score += 10;
    }
    if (obstacle.hit || t.invulnerableUntil > 0) continue;
    const hitbox = {
      x: obstacle.x + 4, y: obstacle.y + 4,
      width: obstacle.width - 8, height: obstacle.height - 4,
    };
    if (boxesOverlap(box, hitbox)) {
      obstacle.hit = true;
      world.lives -= 1;
      world.gap = Math.max(0, world.gap - RUN.stumbleGapLoss);
      t.invulnerableUntil = 1.2;
      world.shake = 1;
      world.flash = 1;
      burst(world, t.x + 26, t.y + 20, 16, '#ffffff');
      burst(world, t.x + 26, t.y + 20, 8, '#c96f2e');
      events |= EVENT_STUMBLE;
      if (world.lives <= 0 || world.gap <= RUN.minGap) {
        world.over = true;
        world.outcome = 'caught';
        events |= EVENT_CAUGHT;
        return events;
      }
    }
  }

  // The forest gate: survive the full distance and you are free.
  if (world.distance >= RUN.escapeDistance) {
    world.over = true;
    world.outcome = 'escaped';
    events |= EVENT_ESCAPED;
  }

  // Particles drift and fade.
  for (const particle of world.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 500 * dt;
    particle.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);

  return events;
}

export { STEP };
