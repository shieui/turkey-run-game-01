// Gobble Dash — keyboard and mouse, kept apart from the simulation so the game
// can be driven by real players and by the screenshot autopilot alike.

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);

export function createInput(canvas, hooks) {
  const state = {
    duckHeld: false,
    jumpQueued: false,
    clickQueued: false,
    anyKeyQueued: false,
    restartQueued: false,
    pauseQueued: false,
    muteQueued: false,
  };

  function onKeyDown(event) {
    if (event.repeat) return;
    if (JUMP_KEYS.has(event.code)) {
      state.jumpQueued = true;
      state.anyKeyQueued = true;
      event.preventDefault();
    } else if (DUCK_KEYS.has(event.code)) {
      state.duckHeld = true;
      event.preventDefault();
    } else if (event.code === 'KeyR') {
      state.restartQueued = true;
      state.anyKeyQueued = true;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      state.pauseQueued = true;
    } else if (event.code === 'KeyM') {
      state.muteQueued = true;
    } else if (event.code === 'Enter') {
      state.anyKeyQueued = true;
    }
  }

  function onKeyUp(event) {
    if (DUCK_KEYS.has(event.code)) state.duckHeld = false;
  }

  function onPointerDown(event) {
    state.clickQueued = true;
    state.anyKeyQueued = true;
    if (hooks && hooks.onPointer) hooks.onPointer(event);
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    state,
    consumeJump() {
      const queued = state.jumpQueued || state.clickQueued;
      state.jumpQueued = false;
      state.clickQueued = false;
      return queued;
    },
    consumeAnyKey() {
      const queued = state.anyKeyQueued;
      state.anyKeyQueued = false;
      return queued;
    },
    consumeRestart() {
      const queued = state.restartQueued;
      state.restartQueued = false;
      return queued;
    },
    consumePause() {
      const queued = state.pauseQueued;
      state.pauseQueued = false;
      return queued;
    },
    consumeMute() {
      const queued = state.muteQueued;
      state.muteQueued = false;
      return queued;
    },
    isDuckHeld() { return state.duckHeld; },
  };
}
