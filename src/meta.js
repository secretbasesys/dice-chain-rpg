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
      seen: { dice: [], relics: [], enemies: [] },
      classes: { warrior: 0, mage: 0, gambler: 0 },
      ach: {},
      lastAsc: 0,
      bestDepth: 3,
      daily: null,
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
    noteRelic: function (id) { const m = load(); if (once(m.seen.relics, id)) save(); },
    noteEnemy: function (key) { const m = load(); if (once(m.seen.enemies, key)) save(); },

    noteRunEnd: function (entry) {
      const m = load();
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
      save();
    },

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
      return DC.ACHIEVEMENTS.map(function (a) {
        return { id: a.id, name: a.name, desc: a.desc, done: !!m.ach[a.id] };
      });
    },

    progress: function () {
      const m = load();
      return {
        dice: m.seen.dice.length, diceTotal: DC.DICE_IDS.length,
        relics: m.seen.relics.length, relicTotal: DC.RELIC_IDS.length,
        enemies: m.seen.enemies.length, enemyTotal: Meta.enemyTotal(),
        ach: Object.keys(m.ach || {}).length, achTotal: DC.ACHIEVEMENTS.length,
      };
    },

    enemyTotal: function () {
      let n = 0;
      [1, 2, 3].forEach(function (a) { n += (DC.ENEMIES[a] || []).length + (DC.ELITES[a] || []).length; });
      return n + 5;
    },

    seen: function (kind, id) { return load().seen[kind].indexOf(id) >= 0; },
  };

  DC.Meta = Meta;
})();
