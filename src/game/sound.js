let ctx;
let _muted = false;

function getCtx() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.05) {
  if (_muted) return;
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch {
    /* audio is optional */
  }
}

export function setMuted(v) {
  _muted = v;
}

export function isMuted() {
  return _muted;
}

export function playPunch() {
  tone(180 + Math.random() * 60, 0.14);
}

export function playImpact() {
  tone(520, 0.08, 'square', 0.04);
}

export function playCountdown(n) {
  const freqs = { 3: 330, 2: 380, 1: 440 };
  tone(freqs[n] || 440, 0.22, 'sine', 0.09);
}

export function playFight() {
  tone(660, 0.2, 'sine', 0.1);
  setTimeout(() => tone(880, 0.25, 'sine', 0.08), 160);
}

export function playCombo(level) {
  if (level >= 10) {
    tone(880, 0.1, 'square', 0.06);
    setTimeout(() => tone(1100, 0.15, 'square', 0.06), 100);
  } else if (level >= 5) {
    tone(660, 0.12, 'square', 0.06);
  } else {
    tone(550, 0.1, 'square', 0.05);
  }
}

export function playKO() {
  [0, 130, 260, 420].forEach((delay, i) =>
    setTimeout(() => tone(440 - i * 55, 0.35, 'sine', 0.09), delay)
  );
}

// Legacy alias — kept for backward compat
export function beep(freq, dur) {
  tone(freq, dur);
}
