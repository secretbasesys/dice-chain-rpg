/* =========================================================
   Meta progression: ascension unlocks, codex, achievements.
   Stored in localStorage, survives runs.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;
  const KEY = 'dicechain.meta.v2';

  const blank = function () {
    return {
      v: 2,
      runs: 0, wins: 0, bestAct: 1,
      unlockedAsc: 0,          // highest ascension level selectable
      seen: { dice: [], relics: [], enemies: [], events: [] },
      classes: { warrior: 0, mage: 0, gambler: 0 },
      ach: {},
      lastAsc: 0,
      bestDepth: 3,
      bestCombo: 0, bestDmg: 0,
      daily: null,
      dailyLog: [],
      dailyStreak: 0,
      history: [],
      tut: 0,
    };
  };

  let meta = null;

  function load() {
    if (meta) return meta;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      meta = Object.assign(blank(), raw || {});
      meta.seen = Object.assign(blank().seen, meta.seen || {});
      meta.classes = Object.assign(blank().classes, meta.classes || {});
      meta.history = Array.isArray(meta.history) ? meta.history : [];
    } catch (e) { meta = blank(); }
    return meta;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) {}
  }

  function once(list, id) {
    if (list.indexOf(id) < 0) { list.push(id); return true; }
    return false;
  }

  const Meta = {
    get: load,
    save: save,

    noteRunStart: function (asc) {
      const m = load();
      m.runs += 1;
      m.lastAsc = asc || 0;
      save();
    },

    noteDie: function (id) { const m = load(); if (once(m.seen.dice, id)) save(); },
    noteEvent: function (id) { const m = load(); if (once(m.seen.events, id)) save(); },
    noteRelic: function (id) { const m = load(); if (once(m.seen.relics, id)) save(); },
    noteEnemy: function (key) { const m = load(); if (once(m.seen.enemies, key)) save(); },

    noteRunEnd: function (entry) {
      const m = load();
      m.bestCombo = Math.max(m.bestCombo || 0, entry.maxCombo || 0);
      m.bestDmg = Math.max(m.bestDmg || 0, entry.dmg || 0);
      m.history.unshift(entry);
      if (m.history.length > 30) m.history.length = 30;
      save();
    },

    history: function () { return load().history || []; },

    daily: function () { return load().daily || null; },

    tutSeen: function () { return !!load().tut; },

    setTut: function () { const m = load(); m.tut = 1; save(); },

    noteDaily: function (rec) {
      const m = load();
      m.daily = rec;
      m.dailyLog = Array.isArray(m.dailyLog) ? m.dailyLog : [];
      const score = (rec.act || 0) * 120 + (rec.kills || 0) * 6 + Math.round((rec.dmg || 0) / 10) + (rec.win ? 300 : 0);
      const entry = { day: rec.day, win: !!rec.win, act: rec.act || 0, score: score, cls: rec.cls, t: rec.t || Date.now() };
      const i = m.dailyLog.findIndex(function (d) { return d.day === rec.day; });
      if (i >= 0) { if (score > (m.dailyLog[i].score || 0) || (entry.win && !m.dailyLog[i].win)) m.dailyLog[i] = entry; }
      else m.dailyLog.push(entry);
      m.dailyLog = m.dailyLog.slice(-40);
      /* streak: consecutive days cleared, counted back from the latest cleared day */
      const days = {};
      m.dailyLog.forEach(function (d) { if (d.win) days[d.day] = true; });
      let streak = 0;
      const now = new Date();
      for (let k = 0; k < 40; k++) {
        const dt = new Date(now.getTime() - k * 86400000);
        const key = 'DAILY-' + dt.getFullYear() + ('0' + (dt.getMonth() + 1)).slice(-2) + ('0' + dt.getDate()).slice(-2);
        if (days[key]) streak++;
        else if (k > 0) break;
      }
      m.dailyStreak = streak;
      save();
    },

    dailyLog: function () { return load().dailyLog || []; },
    dailyStreak: function () { return load().dailyStreak || 0; },

    noteDepth: function (act) {
      const m = load();
      m.bestDepth = Math.max(m.bestDepth || 3, act || 3);
      save();
    },

    noteWin: function (cls, asc) {
      const m = load();
      m.wins += 1;
      m.classes[cls] = (m.classes[cls] || 0) + 1;
      const next = Math.min(10, (asc || 0) + 1);
      const unlocked = next > m.unlockedAsc;
      if (unlocked) m.unlockedAsc = next;
      save();
      return { unlocked: unlocked, level: m.unlockedAsc };
    },

    noteBestAct: function (act) {
      const m = load();
      if (act > m.bestAct) { m.bestAct = act; save(); }
    },

    /* achievement check — call with a context object */
    check: function (ctx) {
      const m = load();
      const got = [];
      const A = DC.ACHIEVEMENTS;
      A.forEach(function (a) {
        if (m.ach[a.id]) return;
        let ok = false;
        try { ok = !!a.test(ctx, m); } catch (e) { ok = false; }
        if (ok) { m.ach[a.id] = Date.now(); got.push(a); }
      });
      if (got.length) save();
      return got;
    },

    achList: function () {
      const m = load();
      const prog = {
        chain6: [m.bestCombo || 0, 6], chain8: [m.bestCombo || 0, 8],
        dmg1000: [m.bestDmg || 0, 1000], codex: [(m.seen.dice || []).length, 12],
        relicHunter: [(m.seen.relics || []).length, 18], asc10: [m.unlockedAsc || 0, 10],
        asc3: [m.unlockedAsc || 0, 3],
      };
      return DC.ACHIEVEMENTS.map(function (a) {
        const p = prog[a.id];
        return { id: a.id, name: a.name, desc: a.desc, done: !!m.ach[a.id], prog: p && !m.ach[a.id] ? p : null };
      });
    },

    progress: function () {
      const m = load();
      return {
        dice: m.seen.dice.length, diceTotal: DC.DICE_IDS.length,
        relics: m.seen.relics.length, relicTotal: DC.RELIC_IDS.length,
        enemies: m.seen.enemies.length, enemyTotal: Meta.enemyTotal(),
        events: (m.seen.events || []).length, eventTotal: DC.EVENTS.length,
        ach: Object.keys(m.ach || {}).length, achTotal: DC.ACHIEVEMENTS.length,
      };
    },

    enemyTotal: function () {
      let n = 0;
      [1, 2, 3].forEach(function (a) { n += (DC.ENEMIES[a] || []).length + (DC.ELITES[a] || []).length; });
      return n + 6;
    },

    seen: function (kind, id) { return load().seen[kind].indexOf(id) >= 0; },
  };

  DC.Meta = Meta;
})();
