// Gobble Dash — the screenshot scenes behind ?shot=start|play|end. Each one plays
// the real rules forward from a fresh world for a fixed number of steps, steered by
// a simple autopilot (jump the ground hazards, duck the high knives, grab the corn),
// so the frame is what a real game looks like and the same seed always gives the
// same frame. The end scene's pilot is clumsy on purpose: it reacts late and never
// ducks, so the farmer catches it, as a hurried player would be.

import { GROUND_Y, RUN, STEP, VIEW } from './config.js';
import { jump, resetWorld, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 3;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 300;
const SAMPLE = STEP;

/** The next obstacle the turkey has not passed yet, if any is close ahead. */
function nextHazard(world) {
  const front = world.turkey.x + 52;
  let nearest = null;
  for (const obstacle of world.obstacles) {
    if (obstacle.x + obstacle.width < front) continue;
    if (obstacle.x > front + 320) continue;
    if (nearest === null || obstacle.x < nearest.x) nearest = obstacle;
  }
  return nearest;
}

/**
 * Decide this frame's move. `horizon` is how far ahead the pilot reacts (a short
 * horizon is a late, clumsy player); `ducks` says whether it ever ducks.
 * Returns { jumpNow, duck }.
 */
function autopilot(world, horizon, ducks) {
  const hazard = nextHazard(world);
  if (!hazard) return { jumpNow: false, duck: false };
  const gap = hazard.x - (world.turkey.x + 52);
  if (hazard.kind === 'knife-high') {
    return { jumpNow: false, duck: ducks && gap < 170 && gap > -30 };
  }
  const jumpNow = world.turkey.grounded && gap < horizon && gap > -10;
  return { jumpNow, duck: false };
}

/** Idle the farmyard behind the title screen: the turkey runs in place, nothing spawns. */
function attract(world, seconds) {
  for (let t = 0; t < seconds; t += SAMPLE) {
    world.time += SAMPLE;
    world.distance += 250 * SAMPLE * RUN.metresPerPixel;
    world.turkey.runCycle += SAMPLE * 9;
  }
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world, seed = 1) {
  resetWorld(world, seed);
  if (name !== 'play' && name !== 'end') {
    world.spawnIn = 9999;
    attract(world, START_SECONDS);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const clumsy = name === 'end';
  const limit = clumsy ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = clumsy ? 42 : 100;
  for (let elapsed = 0; elapsed < limit; elapsed += SAMPLE) {
    const move = autopilot(world, horizon, !clumsy);
    if (move.jumpNow) jump(world);
    const events = stepWorld(world, SAMPLE, move.duck);
    if (world.over) break;
    void events;
  }
  const over = world.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.score) };
}

export { GROUND_Y, VIEW };
