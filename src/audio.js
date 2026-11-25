/* WebAudio SFX — synthesized, no asset files (works offline & on Pages) */
(function () {
  'use strict';
  const DC = window.DC;

  let ctx = null, master = null, muted = false;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function now() { return ctx.currentTime; }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ctx) return;
    const t0 = now() + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.25 : vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, hp, delay) {
    if (!ctx) return;
    const t0 = now() + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp || 900;
    const g = ctx.createGain();
    g.gain.value = vol == null ? 0.2 : vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];

  const SFX = {
    clack: function (i) {
      const p = 0.9 + (i || 0) * 0.06;
      noise(0.075, 0.18, 1400 + (i || 0) * 90);
      tone(190 * p, 0.06, 'square', 0.10, 120 * p);
    },
    click: function () { tone(520, 0.04, 'triangle', 0.10, 620); noise(0.03, 0.05, 2400); },
    select: function () { tone(660, 0.05, 'triangle', 0.09); },
    error: function () { tone(180, 0.16, 'sawtooth', 0.10, 120); },
    hit: function (heavy) {
      noise(heavy ? 0.22 : 0.13, heavy ? 0.32 : 0.2, 180);
      tone(heavy ? 90 : 130, heavy ? 0.2 : 0.13, 'sine', 0.28, heavy ? 45 : 60);
    },
    block: function () { tone(300, 0.1, 'triangle', 0.14, 420); noise(0.08, 0.12, 3000); },
    heal: function () { tone(520, 0.18, 'sine', 0.16, 780); tone(780, 0.22, 'sine', 0.1, 1040, 0.05); },
    coin: function () { tone(1180, 0.07, 'square', 0.12); tone(1560, 0.12, 'square', 0.1, 1700, 0.05); },
    combo: function (n) {
      const step = SCALE[Math.min(SCALE.length - 1, Math.max(0, n - 1))];
      const f = 440 * Math.pow(2, step / 12);
      tone(f, 0.16, 'triangle', 0.2);
      tone(f * 2, 0.12, 'sine', 0.07, null, 0.01);
    },
    big: function () { tone(160, 0.5, 'sawtooth', 0.2, 60); tone(320, 0.4, 'sine', 0.12, 120); noise(0.4, 0.2, 200); },
    win: function () { [0, 4, 7, 12, 16].forEach(function (s, i) { tone(392 * Math.pow(2, s / 12), 0.3, 'triangle', 0.16, null, i * 0.09); }); },
    lose: function () { [0, -3, -7, -12].forEach(function (s, i) { tone(330 * Math.pow(2, s / 12), 0.45, 'sine', 0.18, null, i * 0.14); }); },
    turn: function () { tone(240, 0.14, 'triangle', 0.12, 360); },
    spark: function () { tone(880, 0.1, 'sine', 0.12, 1320); },
    boss: function () {
      tone(70, 0.9, 'sawtooth', 0.22, 44);
      tone(105, 0.7, 'square', 0.10, 60, 0.05);
      noise(0.7, 0.14, 140, 0.02);
    },
    event: function () { [0, 5, 7, 12].forEach(function (s, i) { tone(523 * Math.pow(2, s / 12), 0.22, 'triangle', 0.11, null, i * 0.06); }); },
    upgrade: function () { tone(660, 0.12, 'square', 0.12); tone(990, 0.16, 'square', 0.10, 1180, 0.08); tone(1320, 0.2, 'triangle', 0.09, null, 0.16); },
    shatter: function () { noise(0.3, 0.2, 2200); tone(220, 0.2, 'square', 0.06, 90); },
  };

  DC.Audio = {
    init: function () {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
      return !!c;
    },
    play: function (name, a) {
      if (muted) return;
      if (!ensure()) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      const fn = SFX[name];
      if (fn) { try { fn(a); } catch (e) {} }
    },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },
    available: function () { return !!(window.AudioContext || window.webkitAudioContext); },
  };
})();
