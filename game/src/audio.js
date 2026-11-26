// Sound: WebAudio oscillators only, no audio files. A low engine
// drone whose pitch follows the throttle, a chime when a ring is
// threaded, a soft thud on touchdown and a dull crunch on a crash.
// Everything is created lazily on the first user gesture, so the
// page never complains about audio before the player interacts.

export function createSound() {
  let ctx = null;
  let engineOsc = null;
  let engineOsc2 = null;
  let engineGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 52;
      engineOsc2 = ctx.createOscillator();
      engineOsc2.type = 'square';
      engineOsc2.frequency.value = 104;
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 320;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      engineOsc.connect(low);
      engineOsc2.connect(g2);
      g2.connect(low);
      low.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
      engineOsc2.start();
      return true;
    } catch {
      return false;
    }
  }

  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume();
  }

  // Called every frame while flying: the drone follows the throttle.
  // Silent until a user gesture has actually started the context.
  function engine(throttle, flying) {
    if (!ctx || muted || ctx.state !== 'running') return;
    const target = flying ? 0.045 + throttle * 0.075 : 0;
    engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.12);
    const f = 46 + throttle * 58;
    engineOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.1);
    engineOsc2.frequency.setTargetAtTime(f * 2.02, ctx.currentTime, 0.1);
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  return {
    unlock,
    engine,
    ring: () => {
      blip(660, 0.16, 'sine', 0.22);
      blip(990, 0.24, 'sine', 0.2, 0.09);
    },
    thud: () => {
      blip(70, 0.28, 'sine', 0.5);
      blip(140, 0.14, 'triangle', 0.2);
    },
    crunch: () => {
      blip(55, 0.5, 'sawtooth', 0.4);
      blip(38, 0.6, 'sine', 0.4, 0.05);
    },
    fanfare: () => {
      blip(523, 0.18, 'triangle', 0.25);
      blip(659, 0.18, 'triangle', 0.25, 0.14);
      blip(784, 0.34, 'triangle', 0.28, 0.28);
    },
    toggleMute() {
      muted = !muted;
      if (ctx && engineGain) engineGain.gain.value = 0;
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}
