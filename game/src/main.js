// Gobble Dash — the frame loop and the screens. It wires input, sound and the
// world together, resizes the canvas to the window, and honours ?shot= so a
// screenshot is a deterministic render of a real run.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld, jump, stepWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_GOLDEN, EVENT_PICKUP, EVENT_PIE, EVENT_SPOTTED, EVENT_STUMBLE } from './world.js';
import { draw, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const audio = createAudio();
const world = createWorld(seed);
let screen = SCREEN_TITLE;
let paused = false;
let best = 0;
let lastTime = 0;
let accumulator = 0;
const FIXED = 1 / 60;

function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.clientWidth || window.innerWidth;
  const ch = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const scale = Math.min(cw / VIEW.width, ch / VIEW.height);
  const ox = (cw - VIEW.width * scale) / 2;
  const oy = (ch - VIEW.height * scale) / 2;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function startRun() {
  world.best = best;
  const fresh = createWorld(seed + Math.floor(Math.random() * 100000));
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
  world.best = best;
  screen = SCREEN_PLAY;
  paused = false;
  audio.unlock();
  audio.gobble();
  announce('The run begins. Outrun the farmer!');
}

function endRun() {
  screen = SCREEN_OVER;
  best = Math.max(best, Math.floor(world.score));
  if (world.outcome === 'escaped') {
    audio.escaped();
    announce(`You escaped! Score ${Math.floor(world.score)}. Press R to run again.`);
  } else {
    audio.caught();
    announce(`Caught! Score ${Math.floor(world.score)}. Press R to run again.`);
  }
}

const input = createInput(canvas, {
  onPointer() { audio.unlock(); },
});

function handleEvents(events) {
  if (events & EVENT_PICKUP) audio.corn();
  if (events & EVENT_GOLDEN) audio.golden();
  if (events & EVENT_PIE) audio.pie();
  if (events & EVENT_STUMBLE) audio.stumble();
  if (events & EVENT_SPOTTED) audio.spotted();
  if (events & EVENT_ESCAPED) endRun();
  if (events & EVENT_CAUGHT) endRun();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.1) dt = 0.1;

  if (input.consumeMute()) {
    const muted = audio.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }

  if (screen === SCREEN_TITLE) {
    // Attract mode: the yard scrolls and the turkey runs in place behind the title.
    world.time += dt;
    world.distance += 90 * dt * 0.045;
    world.turkey.runCycle += dt * 9;
    if (input.consumeAnyKey() || input.consumeJump()) startRun();
  } else if (screen === SCREEN_PLAY) {
    if (input.consumePause()) {
      paused = !paused;
      announce(paused ? 'Paused.' : 'Running.');
    }
    if (!paused) {
      if (input.consumeJump()) {
        if (jump(world)) {
          if (world.turkey.jumpsUsed === 2) audio.doubleJump();
          else audio.jump();
        }
      }
      accumulator += dt;
      while (accumulator >= FIXED) {
        accumulator -= FIXED;
        const events = stepWorld(world, FIXED, input.isDuckHeld());
        handleEvents(events);
        if (world.over) break;
      }
    }
  } else if (screen === SCREEN_OVER) {
    if (input.consumeRestart() || input.consumeAnyKey()) startRun();
  }

  draw(ctx, world, screen, paused);
}

if (shotName) {
  // Screenshot mode: stage one deterministic scene and draw it once.
  fitCanvas();
  const staged = stageShot(shotName, world, seed);
  screen = staged.screen;
  best = staged.best;
  draw(ctx, world, screen, false);
  document.title = `Gobble Dash — ${shotName}`;
} else {
  window.addEventListener('resize', fitCanvas);
  fitCanvas();
  announce('Gobble Dash. Press Space or click to run.');
  requestAnimationFrame(frame);
}
