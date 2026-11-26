/* WebAudio SFX — synthesized, no asset files (works offline & on Pages) */
(function () {
  'use strict';
  const DC = window.DC;

  let ctx = null, master = null, muted = false, sfxVol = 0.8, musicVol = 0.6;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55 * sfxVol;
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
  /* ---------------- procedural BGM (v1.6) ----------------
     Four-bar loops per scene, scheduled ahead on the audio clock.
     Everything is synthesized: no samples, no network. */
  const TRACKS = {
    title:  { root: 220.0, bpm: 62,  pad: [0, 5, 3, -2], wave: 'sine',     arp: [0, 2, 1, 2, 3, 2, 1, 2], vol: 0.30, bass: false, drums: false, arpGain: 0.045, padGain: 0.05 },
    camp:   { root: 174.6, bpm: 74,  pad: [0, 3, 5, 2],  wave: 'triangle', arp: [0, 1, 2, 3, 2, 1],    vol: 0.30, bass: true,  drums: false, arpGain: 0.05,  padGain: 0.055 },
    map:    { root: 196.0, bpm: 84,  pad: [0, 5, 3, 4],  wave: 'triangle', arp: [0, 2, 3, 2, 1, 3, 2, 1], vol: 0.30, bass: true, drums: false, arpGain: 0.05, padGain: 0.045 },
    combat: { root: 164.8, bpm: 116, pad: [0, 3, 5, 4],  wave: 'square',   arp: [0, 1, 2, 1, 3, 2, 1, 2], vol: 0.30, bass: true, drums: true,  arpGain: 0.035, padGain: 0.035 },
    boss:   { root: 146.8, bpm: 132, pad: [0, 1, 5, 4],  wave: 'sawtooth', arp: [0, 2, 1, 3, 0, 2, 3, 1], vol: 0.30, bass: true, drums: true,  arpGain: 0.03,  padGain: 0.03 },
  };
  const CHORD = { 0: [0, 3, 7], 1: [0, 1, 7], 2: [0, 4, 7], 3: [0, 5, 9], 4: [0, 4, 8], 5: [0, 3, 8], '-2': [-2, 2, 5] };

  let music = { mode: null, timer: null, step: 0, next: 0, bus: null, want: null };

  function busGain() {
    if (!music.bus) {
      music.bus = ctx.createGain();
      music.bus.gain.value = 0.0001;
      music.bus.connect(master);
    }
    return music.bus;
  }

  function mTone(freq, t0, dur, type, vol, slide) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.06, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(busGain());
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  function mNoise(t0, dur, vol, hp) {
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 6000;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(busGain());
    src.start(t0);
  }

  function semis(root, n) { return root * Math.pow(2, n / 12); }

  function playStep(T, step, t0) {
    const bar = Math.floor(step / 8) % 4;
    const chordKey = T.pad[bar];
    const tones = CHORD[String(chordKey)] || CHORD[0];
    const spb = 60 / T.bpm / 2;
    /* pad attack on the first step of each bar */
    if (step % 8 === 0) {
      tones.forEach(function (n, i) {
        mTone(semis(T.root, n) / 2, t0, spb * 7.4, 'sine', T.padGain * (i === 0 ? 1 : 0.7));
      });
    }
    /* arpeggio */
    const idx = T.arp[step % T.arp.length];
    const note = tones[idx % tones.length] + (idx >= tones.length ? 12 : 0);
    if (!(T.mode === 'calm' && step % 2 === 1)) {
      mTone(semis(T.root, note), t0, spb * 1.6, T.wave, T.arpGain);
    }
    /* bass on quarters */
    if (T.bass && step % 2 === 0) {
      mTone(semis(T.root, chordKey - 12), t0, spb * 1.8, 'triangle', T.padGain * 0.9);
    }
    /* drums */
    if (T.drums) {
      if (step % 8 === 0 || step % 8 === 6) mTone(58, t0, 0.13, 'sine', 0.09, 40);
      if (step % 2 === 1) mNoise(t0, 0.035, 0.028, 7200);
      if (step % 8 === 4) mNoise(t0, 0.11, 0.05, 2600);
    }
  }

  function tick() {
    if (!ctx || !music.mode || muted) return;
    const T = TRACKS[music.mode];
    if (!T) return;
    const spb = 60 / T.bpm / 2;
    if (music.next < ctx.currentTime - 0.5) music.next = ctx.currentTime + 0.05;
    while (music.next < ctx.currentTime + 0.35) {
      playStep(T, music.step, music.next);
      music.step++;
      music.next += spb;
    }
  }

  function startLoop() {
    if (music.timer) return;
    music.timer = setInterval(tick, 90);
  }

  DC.AudioMusic = {
    set: function (mode) {
      if (!ensure()) return;
      music.want = mode;
      if (ctx.state === 'suspended') return; // started on first gesture
      if (mode === music.mode) return;
      const bus = busGain();
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
      if (!mode) {
        bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        music.mode = null;
        return;
      }
      music.mode = mode;
      music.step = 0;
      music.next = t + 0.06;
      bus.gain.exponentialRampToValueAtTime(muted ? 0.0001 : Math.max(0.0001, musicVol * 1.6), t + 0.9);
      startLoop();
    },
    current: function () { return music.mode; },
  };


  const SFX = {
    clack: function (i) {
      const p = 0.9 + (i || 0) * 0.06;
      noise(0.075, 0.18, 1400 + (i || 0) * 90);
      tone(190 * p, 0.06, 'square', 0.10, 120 * p);
    },
    click: function () { tone(520, 0.04, 'triangle', 0.10, 620); noise(0.03, 0.05, 2400); },
    select: function () { tone(660, 0.05, 'triangle', 0.09); },
    error: function () { tone(180, 0.16, 'sawtooth', 0.10, 120); },
    hit: function (heavy, pitch) {
      const p = pitch || 1;
      noise(heavy ? 0.22 : 0.13, heavy ? 0.32 : 0.2, 180 * p);
      tone((heavy ? 90 : 130) * p, heavy ? 0.2 : 0.13, 'sine', 0.28, (heavy ? 45 : 60) * p);
      if (heavy) tone(220 * p, 0.16, 'square', 0.05, 70 * p, 0.01);
    },
    crit: function () {
      noise(0.26, 0.34, 160);
      tone(120, 0.24, 'sine', 0.3, 40);
      tone(1400, 0.1, 'square', 0.08, 900, 0.02);
      tone(2100, 0.14, 'triangle', 0.06, 1500, 0.05);
    },
    block: function () { tone(300, 0.1, 'triangle', 0.14, 420); noise(0.08, 0.12, 3000); },
    heal: function () { tone(520, 0.18, 'sine', 0.16, 780); tone(780, 0.22, 'sine', 0.1, 1040, 0.05); },
    coin: function () { tone(1180, 0.07, 'square', 0.12); tone(1560, 0.12, 'square', 0.1, 1700, 0.05); },
    combo: function (n) {
      const step = SCALE[Math.min(SCALE.length - 1, Math.max(0, n - 1))];
      const f = 440 * Math.pow(2, step / 12);
      tone(f, 0.16, 'triangle', 0.2);
      tone(f * 2, 0.12, 'sine', 0.07, null, 0.01);
      if (n >= 4) tone(f * 1.5, 0.2, 'sine', 0.05, null, 0.03);
      if (n >= 6) tone(f * 3, 0.24, 'triangle', 0.04, null, 0.06);
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
      if (c && music.want && !music.mode) DC.AudioMusic.set(music.want);
      return !!c;
    },
    play: function (name, a) {
      if (muted) return;
      if (!ensure()) return;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      const fn = SFX[name];
      if (fn) { try { fn(a); } catch (e) {} }
    },
    setVolumes: function (sfx, music2) {
      if (typeof sfx === 'number') sfxVol = Math.max(0, Math.min(1, sfx));
      if (typeof music2 === 'number') musicVol = Math.max(0, Math.min(1, music2));
      if (ctx && master) master.gain.value = 0.55 * sfxVol * (muted ? 0 : 1);
      if (ctx && music.bus) {
        const t = ctx.currentTime;
        music.bus.gain.cancelScheduledValues(t);
        music.bus.gain.setValueAtTime(Math.max(0.0001, music.bus.gain.value), t);
        music.bus.gain.exponentialRampToValueAtTime(muted || !music.mode ? 0.0001 : Math.max(0.0001, musicVol * 1.6), t + 0.3);
      }
    },
    setMuted: function (m) {
      muted = !!m;
      if (ctx && music.bus) {
        const t = ctx.currentTime;
        music.bus.gain.cancelScheduledValues(t);
        music.bus.gain.setValueAtTime(Math.max(0.0001, music.bus.gain.value), t);
        music.bus.gain.exponentialRampToValueAtTime(muted ? 0.0001 : (music.mode ? 1 : 0.0001), t + 0.35);
      }
    },
    isMuted: function () { return muted; },
    available: function () { return !!(window.AudioContext || window.webkitAudioContext); },
  };
})();
