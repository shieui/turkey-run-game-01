// All sound is synthesized with WebAudio — no audio files to fetch, so the game
// stays silent on the network. Every effect is a short oscillator/filter envelope.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone({ frequency, endFrequency, duration, type, volume, delay = 0 }) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function noise({ duration, volume, lowpass, delay = 0 }) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    jump() { tone({ frequency: 320, endFrequency: 660, duration: 0.16, type: 'sine', volume: 0.16 }); },
    doubleJump() { tone({ frequency: 520, endFrequency: 880, duration: 0.14, type: 'triangle', volume: 0.13 }); },
    corn() { tone({ frequency: 880, duration: 0.09, type: 'square', volume: 0.08 }); tone({ frequency: 1320, duration: 0.12, type: 'square', volume: 0.07, delay: 0.07 }); },
    golden() { [660, 880, 1100, 1320].forEach((f, i) => tone({ frequency: f, duration: 0.12, type: 'triangle', volume: 0.1, delay: i * 0.06 })); },
    pie() { tone({ frequency: 523, duration: 0.14, type: 'sine', volume: 0.12 }); tone({ frequency: 784, duration: 0.2, type: 'sine', volume: 0.12, delay: 0.12 }); },
    stumble() { noise({ duration: 0.22, volume: 0.22, lowpass: 900 }); tone({ frequency: 220, endFrequency: 90, duration: 0.25, type: 'sawtooth', volume: 0.12 }); },
    gobble() {
      // The turkey's signature: three quick descending clucks.
      [0, 0.09, 0.18].forEach((d, i) => {
        tone({ frequency: 420 - i * 60, endFrequency: 300 - i * 40, duration: 0.08, type: 'square', volume: 0.09, delay: d });
      });
    },
    spotted() { tone({ frequency: 140, endFrequency: 420, duration: 0.3, type: 'sawtooth', volume: 0.12 }); },
    caught() {
      [392, 311, 233, 175].forEach((f, i) => tone({ frequency: f, duration: 0.22, type: 'triangle', volume: 0.14, delay: i * 0.16 }));
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ frequency: f, duration: 0.24, type: 'triangle', volume: 0.13, delay: i * 0.11 }));
    },
    click() { tone({ frequency: 700, duration: 0.05, type: 'sine', volume: 0.08 }); },
  };
}
