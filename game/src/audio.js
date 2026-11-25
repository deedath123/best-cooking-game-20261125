// audio.js — all sound is synthesised with WebAudio. No audio files.
let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol || 0.12, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 3000;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol || 0.1, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.12, 760); },
  place() { tone(340, 0.09, 'triangle', 0.12, 260); },
  chop() { noiseBurst(0.07, 0.16, 1800); tone(180, 0.06, 'square', 0.05); },
  sizzle() { noiseBurst(0.35, 0.07, 5200); },
  ding() { tone(880, 0.18, 'sine', 0.14); tone(1320, 0.22, 'sine', 0.1); },
  coin() { tone(990, 0.09, 'square', 0.09); setTimeout(() => tone(1480, 0.16, 'square', 0.09), 70); },
  perfect() { tone(660, 0.1, 'sine', 0.12); setTimeout(() => tone(880, 0.1, 'sine', 0.12), 90); setTimeout(() => tone(1320, 0.2, 'sine', 0.12), 180); },
  burn() { tone(220, 0.3, 'sawtooth', 0.1, 110); },
  expire() { tone(330, 0.25, 'sawtooth', 0.09, 180); },
  rush() { tone(440, 0.12, 'square', 0.12); setTimeout(() => tone(587, 0.12, 'square', 0.12), 110); setTimeout(() => tone(880, 0.22, 'square', 0.12), 220); },
  click() { tone(700, 0.05, 'triangle', 0.08); },
  over() { tone(392, 0.2, 'triangle', 0.12); setTimeout(() => tone(311, 0.2, 'triangle', 0.12), 180); setTimeout(() => tone(262, 0.4, 'triangle', 0.12), 360); },
};
