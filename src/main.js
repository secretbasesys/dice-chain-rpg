/* =========================================================
   Game controller: run lifecycle, screens wiring, save/load.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;
  const SAVE_KEY = 'dicechain.save.v2';
  const SET_KEY = 'dicechain.settings.v1';

  /* ---------------- seeded RNG (v1.7) ---------------- */
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todaySeed() {
    const d = new Date();
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'DAILY-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  DC.rng = Math.random;
  DC.setSeed = function (seed) {
    if (!seed) { DC.rng = Math.random; DC.seedLabel = null; return null; }
    const s = String(seed).trim();
    if (!s) { DC.rng = Math.random; DC.seedLabel = null; return null; }
    const real = s.toUpperCase() === 'DAILY' ? todaySeed() : s;
    DC.rng = mulberry32(hashSeed(real));
    DC.seedLabel = real;
    return real;
  };
  DC.todaySeed = todaySeed;
  DC.seedDisplay = function (seed) {
    if (!seed) return '무작위';
    const t = String(seed);
    if (t.indexOf('DAILY-') === 0) return '일일 ' + Number(t.slice(10, 12)) + '/' + Number(t.slice(12, 14));
    return t.toUpperCase().slice(0, 10);
  };

  function ri(n) { return Math.floor(DC.rng() * n); }
  function pick(arr) { return arr[ri(arr.length)]; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  const Game = {
    state: {
      screen: 'title',
      run: null,
      combat: null,
      ui: { sel: null, busy: false, modal: null, reward: null, forge: null, shop: null, event: null, hist: [], tip: null, speed: 1, asc: 0 },
      lastCombat: null,
    },

    /* ---------------- boot ---------------- */
    boot: function () {
      try {
        const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}');
        if (s.muted) DC.Audio.setMuted(true);
        if (s.speed === 2) this.state.ui.speed = 2;
        DC.Speed = this.state.ui.speed;
        const m = DC.Meta.get();
        this.state.ui.asc = Math.min(m.unlockedAsc || 0, 5);
      } catch (e) {}
      this.bind();
      DC.UI.render();
    },

    bind: function () {
      const self = this;
      document.addEventListener('click', function (e) {
        const tipEl = e.target.closest('[data-tip]');
        const actEl = e.target.closest('[data-act]');
        if (tipEl && tipEl !== actEl) { DC.UI.showTip(tipEl); return; }
        if (!actEl) { DC.UI.hideTip(); return; }
        const act = actEl.getAttribute('data-act');
        const d = actEl.dataset;
        if (actEl.hasAttribute('disabled')) return;
        if (DC.UI._suppressClick && Date.now() < DC.UI._suppressClick) return;
        DC.Audio.init();
        DC.UI.hideTip();
        try { self.dispatch(act, d, actEl, e); } catch (err) {
          console.error('[dispatch]', act, err);
          DC.UI.toast('오류: ' + (err && err.message));
        }
      });
      document.addEventListener('input', function (e) {
        if (e.target && e.target.id === 'seed-input') self.state.ui.seed = e.target.value;
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { self.state.ui.modal = null; DC.UI.hideTip(); DC.UI.render(); }
        if (self.state.screen === 'combat' && !self.state.ui.busy) {
          if (e.key === 'Enter') self.endTurn();
          if (e.key === 'z' || e.key === 'Z') self.undo();
          if (e.key >= '1' && e.key <= '9') self.tapDie(parseInt(e.key, 10) - 1);
        }
      });
      window.addEventListener('resize', function () { if (self.state.screen === 'map') DC.UI.drawMapEdges(); });
    },

    dispatch: function (act, d, el, ev) {
      const s = this.state;
      switch (act) {
        case 'newrun': this.newRun(); break;
        case 'resume': this.resume(); break;
        case 'title': s.screen = 'title'; s.ui.modal = null; DC.UI.render(); break;
        case 'retryseed': s.ui.seed = (s.run && s.run.seed) || s.ui.seed || ''; s.ui.challenge = (s.run && s.run.challenge) || 'none'; this.newRun(); break;
        case 'pickclass': this.pickClass(d.id); break;
        case 'asc': this.cycleAsc(parseInt(d.dir, 10)); break;
        case 'codex': this.state.ui.modal = 'codex'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'closecodex': this.state.ui.modal = null; DC.UI.render(); break;
        case 'node': this.travel(d.nid); break;
        case 'hand': this.tapDie(parseInt(d.idx, 10)); break;
        case 'slot': this.tapSlot(parseInt(d.idx, 10)); break;
        case 'manip': this.manip(d.op); break;
        case 'undo': this.undo(); break;
        case 'speed': this.toggleSpeed(); break;
        case 'log': s.ui.logOpen = !s.ui.logOpen; DC.Audio.play('click'); DC.UI.render(); break;
        case 'challenge': s.ui.modal = s.ui.modal === 'challenge' ? null : 'challenge'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'pickchallenge': s.ui.challenge = d.id || 'none'; s.ui.modal = null; DC.Audio.play('click'); DC.UI.render(); break;
        case 'closechallenge': s.ui.modal = null; DC.UI.render(); break;
        case 'daily': s.ui.seed = DC.todaySeed(); DC.Audio.play('click'); DC.UI.render(); DC.UI.toast('오늘의 시드로 고정했습니다'); break;
        case 'clearseed': s.ui.seed = ''; DC.UI.render(); break;
        case 'history': s.ui.modal = s.ui.modal === 'history' ? null : 'history'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'closehistory': s.ui.modal = null; DC.UI.render(); break;
        case 'copyseed':
          if (s.run && s.run.seed) {
            try { navigator.clipboard.writeText(s.run.seed); DC.UI.toast('시드 복사: ' + s.run.seed); }
            catch (e) { DC.UI.toast('시드: ' + s.run.seed); }
          } else DC.UI.toast('시드가 없는 런입니다');
          break;
        case 'closetut': DC.Meta.setTut(); s.ui.modal = null; DC.UI.render(); break;
        case 'endturn': this.endTurn(); break;
        case 'target': this.setTarget(parseInt(d.i, 10)); break;
        case 'reward': this.takeReward(parseInt(d.i, 10)); break;
        case 'skipreward': this.skipReward(); break;
        case 'fdiedie': this.forgeSelectDie(parseInt(d.i, 10)); break;
        case 'fface': this.forgeSelectFace(parseInt(d.i, 10)); break;
        case 'fopt': this.forgeApply(parseInt(d.i, 10)); break;
        case 'forgeexit': this.forgeExit(); break;
        case 'buy': this.buy(parseInt(d.i, 10)); break;
        case 'rerollshop': this.rerollShop(); break;
        case 'rest': this.rest(parseInt(d.i, 10)); break;
        case 'choice': this.choice(parseInt(d.i, 10)); break;
        case 'upskill': this.upSkill(parseInt(d.i, 10)); break;
        case 'closeskills': this.finishSkill(); break;
        case 'leave': this.leaveNode(); break;
        case 'deck': s.ui.modal = s.ui.modal === 'deck' ? null : 'deck'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'closedeck': s.ui.modal = null; DC.UI.render(); break;
        case 'help': s.ui.modal = s.ui.modal === 'help' ? null : 'help'; DC.UI.render(); break;
        case 'closehelp': s.ui.modal = null; DC.UI.render(); break;
        case 'helptab': s.ui.helpTab = d.tab || 'basic'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'sound':
          DC.Audio.setMuted(!DC.Audio.isMuted());
          try { localStorage.setItem(SET_KEY, JSON.stringify({ muted: DC.Audio.isMuted() })); } catch (e) {}
          DC.UI.render();
          break;
        default: break;
      }
    },

    /* ---------------- run setup ---------------- */
    cycleAsc: function (dir) {
      const m = DC.Meta.get();
      const max = Math.min(5, m.unlockedAsc || 0);
      const cur = this.state.ui.asc || 0;
      let next = cur + (dir || 0);
      if (next < 0) next = 0;
      if (next > max) next = max;
      this.state.ui.asc = next;
      DC.Audio.play('click');
      DC.UI.render();
    },

    newRun: function () {
      this.state.screen = 'class';
      this.state.run = null;
      this.state.combat = null;
      DC.UI.render();
    },

    pickClass: function (id) {
      const C = DC.CLASSES[id];
      const asc = this.state.ui.asc || 0;
      const seed = DC.setSeed(this.state.ui.seed || '');
      const ch = DC.challengeById(this.state.ui.challenge || 'none');
      const cmod = Object.assign({}, ch.mod || {});
      if (cmod.hpMul) { /* applied below to maxHp */ }
      const mod = DC.ascMod(asc);
      const run = {
        cls: id,
        asc: asc,
        hp: Math.max(20, Math.round(C.hp * (1 + (cmod.hpMul || 0)))),
        maxHp: Math.max(20, Math.round(C.hp * (1 + (cmod.hpMul || 0)))),
        gold: Math.max(20, 60 + (mod.gold || 0)),
        act: 1,
        dice: C.startDice.map(function (d) { return DC.Dice.make(d); }),
        skills: C.skills.map(function () { return 0; }),
        relics: [],
        seenEvents: [],
        map: null,
        current: null,
        cleared: [],
        extraSpark: 0,
        stats: { kills: 0, turns: 0, dmg: 0 },
        startedAt: Date.now(),
        nodeSeq: 0,
        seed: seed || null,
        challenge: ch.id,
        cmod: cmod,
      };
      run.map = DC.MapGen.gen(DC.rng, 1);
      DC.Meta.noteRunStart(asc);
      run.dice.forEach(function (d) { DC.Meta.noteDie(d.id); });
      this.state.run = run;
      this.state.combat = null;
      this.goMap();
      DC.UI.toast(C.name + ' — 행운을 빈다');
      if (!DC.Meta.tutSeen()) { this.state.ui.modal = 'tut'; DC.UI.render(); }
    },

    goMap: function () {
      this.state.screen = 'map';
      this.state.combat = null;
      this.state.ui.sel = null;
      this.state.ui.busy = false;
      this.save();
      DC.UI.render();
    },

    /* ---------------- map ---------------- */
    travel: function (nid) {
      const r = this.state.run;
      if (!r || this.state.screen !== 'map') return;
      const avail = DC.MapGen.available(r.map);
      if (avail.indexOf(nid) < 0) { DC.UI.toast('갈 수 없는 곳입니다'); return; }
      if (this.state.ui.busy) return;
      const node = r.map.nodes[nid];
      r.map.current = nid;
      r.cleared.push(nid);
      DC.Audio.play('click');
      this.enterNode(node);
    },

    enterNode: function (node) {
      const r = this.state.run;
      const type = node.type;
      if (type === 'combat') this.startCombat('combat');
      else if (type === 'elite') this.startCombat('elite');
      else if (type === 'boss') this.startCombat('boss');
      else if (type === 'forge') this.openForge(2, node);
      else if (type === 'shop') this.openShop(node);
      else if (type === 'rest') { this.state.screen = 'rest'; DC.UI.render(); }
      else if (type === 'mystery') this.openEvent(node);
      else this.goMap();
    },

    spawnsFor: function (kind) {
      const r = this.state.run;
      if (kind === 'boss') return [DC.BOSSES[r.act]];
      if (kind === 'elite') return [DC.ELITES[r.act][0]];
      const pool = DC.ENEMIES[r.act];
      const n = r.act === 1 ? (DC.rng() < 0.3 ? 2 : 1) : (DC.rng() < 0.55 ? 2 : 1);
      const out = [];
      const used = [];
      for (let i = 0; i < n; i++) {
        let e = pick(pool);
        let guard = 0;
        while (used.indexOf(e.id) >= 0 && guard++ < 10) e = pick(pool);
        used.push(e.id);
        out.push(e);
      }
      return out;
    },

    startCombat: function (kind) {
      const r = this.state.run;
      const spawns = this.spawnsFor(kind);
      spawns.forEach(function (sp) { DC.Meta.noteEnemy(sp.id); });
      const c = DC.Combat.create(r, spawns, kind);
      DC.Combat.attachBag(c, r.dice);
      c.hp = r.hp;
      c.maxHp = r.maxHp;
      this.state.combat = c;
      this.state.screen = 'combat';
      this.state.ui.sel = null;
      this.state.ui.busy = false;
      this.state.ui.hist = [];
      DC.UI.clearToast();
      DC.UI.render();
      DC.Audio.play('turn');
      if (kind === 'boss') {
        const lines = DC.BOSSES[r.act].lines;
        DC.Audio.play('boss');
        setTimeout(function () { DC.FX.banner(lines.appear, 'boss'); }, 350);
        DC.UI.toast('보스 등장!');
      } else if (kind === 'elite') DC.UI.toast('정예 조우!');
    },

    pushHist: function () {
      const c = this.state.combat;
      if (!c) return;
      const ui = this.state.ui;
      ui.hist = ui.hist || [];
      ui.hist.push(DC.Combat.snapshot(c));
      if (ui.hist.length > 24) ui.hist.shift();
    },

    undo: function () {
      const s = this.state;
      const c = s.combat;
      if (!c || s.ui.busy) return;
      const hist = s.ui.hist || [];
      if (!hist.length) { DC.UI.toast('되돌릴 동작이 없습니다'); DC.Audio.play('error'); return; }
      const snap = hist.pop();
      DC.Combat.restore(c, snap);
      s.ui.sel = null;
      s.run.hp = c.hp;
      DC.Audio.play('reroll');
      DC.UI.render();
      DC.FX.flash('rgba(107,199,255,.10)');
    },

    toggleSpeed: function () {
      const s = this.state;
      s.ui.speed = s.ui.speed === 2 ? 1 : 2;
      DC.Speed = s.ui.speed;
      try {
        const cur = JSON.parse(localStorage.getItem(SET_KEY) || '{}');
        cur.speed = s.ui.speed;
        localStorage.setItem(SET_KEY, JSON.stringify(cur));
      } catch (e) {}
      DC.Audio.play('click');
      DC.UI.render();
    },

    setTarget: function (i) {
      const c = this.state.combat;
      if (!c || c.phase !== 'player') return;
      if (!c.enemies[i] || c.enemies[i].hp <= 0) return;
      c.target = i;
      DC.Audio.play('select');
      DC.UI.render();
    },

    tapDie: function (i) {
      const s = this.state;
      const c = s.combat;
      if (!c || s.ui.busy || c.phase !== 'player') return;
      const h = c.hand[i];
      if (!h) return;
      if (h.used) { DC.UI.toast('이미 사용한 주사위'); DC.Audio.play('error'); return; }
      if (h.locked) { DC.UI.toast('봉인된 주사위입니다'); DC.Audio.play('error'); return; }
      s.ui.sel = s.ui.sel === i ? null : i;
      DC.Audio.play('clack', i);
      DC.UI.render();
    },

    tapSlot: function (slotIdx) {
      const s = this.state;
      const c = s.combat;
      if (!c || s.ui.busy || c.phase !== 'player') return;
      const sel = s.ui.sel;
      if (sel != null) { this.play(sel, slotIdx); return; }
      // one-tap: auto-place the best valid die
      const cands = [];
      c.hand.forEach(function (h, i) {
        if (DC.Combat.canPlay(c, i, slotIdx).ok) cands.push({ i: i, v: h.v, k: h.k });
      });
      if (!cands.length) {
        const req = DC.REQ[DC.CLASSES[c.cls].skills[slotIdx].req];
        DC.UI.toast(req.n + ' 조건에 맞는 주사위가 없습니다');
        DC.Audio.play('error');
        return;
      }
      cands.sort(function (a, b) { return b.v - a.v; });
      this.play(cands[0].i, slotIdx);
    },

    play: function (hIdx, sIdx, fast) {
      const s = this.state;
      const c = s.combat;
      if (!c || c.phase !== 'player') return false;
      const chk = DC.Combat.canPlay(c, hIdx, sIdx);
      if (!chk.ok) { DC.UI.toast(chk.why); DC.Audio.play('error'); return false; }
      this.pushHist();
      const res = DC.Combat.play(c, hIdx, sIdx);
      if (!res.ok) { DC.UI.toast(res.why); DC.Audio.play('error'); return false; }
      s.ui.sel = null;
      if (fast) return true;
      s.ui.busy = true;
      DC.UI.render();
      const self = this;
      DC.UI.animate(res.events, function () {
        s.ui.busy = false;
        if (c.phase === 'won') self.combatWon();
        else if (c.phase === 'lost') self.combatLost();
        else DC.UI.render();
      });
      return true;
    },

    manip: function (op) {
      const s = this.state;
      const c = s.combat;
      if (!c || s.ui.busy || c.phase !== 'player') return;
      if (s.ui.sel == null) { DC.UI.toast('먼저 주사위를 탭하세요'); DC.Audio.play('error'); return; }
      const before = c.hand[s.ui.sel];
      if (op === 'reroll' || op === 'plus' || op === 'minus' || op === 'flip' || op === 'copy') this.pushHist();
      const res = DC.Combat.manip(c, op, s.ui.sel);
      if (!res.ok) { DC.UI.toast(res.why); DC.Audio.play('error'); return; }
      DC.Audio.play('clack', 2);
      DC.UI.render();
      // little visual feedback on the tray die
      const el = document.querySelector('[data-act="hand"][data-idx="' + s.ui.sel + '"]');
      if (el) { el.classList.add('bump'); DC.FX.floatAt(el, (op === 'plus' ? '+1' : op === 'minus' ? '-1' : op === 'flip' ? '7-x' : op === 'copy' ? '복제' : '재굴림'), 'nudge'); }
      const el2 = document.querySelector('[data-act="hand"][data-idx="' + (c.hand.length - 1) + '"]');
      if (op === 'copy' && el2) el2.classList.add('bump');
    },

    endTurn: function () {
      const s = this.state;
      const c = s.combat;
      const r = s.run;
      if (!c || s.ui.busy || c.phase !== 'player') return;
      s.ui.busy = true;
      s.ui.sel = null;
      s.ui.hist = [];
      const res = DC.Combat.enemyPhase(c);
      r.hp = c.hp;
      DC.UI.render();
      const self = this;
      DC.UI.animate(res.events, function () {
        if (c.phase === 'won') { s.ui.busy = false; return self.combatWon(); }
        if (c.phase === 'lost') { s.ui.busy = false; return self.combatLost(); }
        setTimeout(function () {
          const r2 = DC.Combat.startTurn(c);
          r.stats.turns++;
          s.ui.hist = [];
          if (c.phase === 'won') { s.ui.busy = false; return self.combatWon(); }
          s.ui.busy = false;
          DC.UI.render();
        }, 320);
      });
    },

    /* ---------------- combat resolution ---------------- */
    recordRun: function (win) {
      const r = this.state.run;
      if (!r) return;
      DC.Meta.noteRunEnd({
        t: Date.now(),
        cls: r.cls,
        asc: r.asc || 0,
        seed: r.seed || null,
        challenge: r.challenge || 'none',
        win: !!win,
        act: r.act,
        kills: (r.stats && r.stats.kills) || 0,
        dmg: (r.stats && r.stats.dmg) || 0,
        maxCombo: r.maxCombo || 0,
        gold: r.gold,
        dice: r.dice.map(function (d) { return d.name; }),
        relics: r.relics.map(function (id) { return DC.RELICS[id] ? DC.RELICS[id].name : id; }),
      });
    },

    combatWon: function () {
      const s = this.state;
      const c = s.combat;
      const r = s.run;
      r.hp = c.hp;
      r.stats.kills += c.enemies.filter(function (e) { return e.hp <= 0; }).length;
      r.stats.dmg += c.totalDamage;
      r.maxCombo = Math.max(r.maxCombo || 0, c.maxCombo || 0);
      let gold = c.kind === 'boss' ? 95 + r.act * 12 : c.kind === 'elite' ? 45 + ri(15) : 16 + ri(9);
      gold += r.act * 4;
      if (r.relics.indexOf('contract') >= 0) gold = Math.round(gold * 1.4);
      if (r.relics.indexOf('miser') >= 0) gold = Math.round(gold * 1.25);
      if (r.cmod && r.cmod.gold) gold = Math.round(gold * r.cmod.gold);
      r.gold += gold;
      const bossClear = c.kind === 'boss';
      s.combat = null;
      s.ui.reward = { gold: gold, options: this.makeRewardOptions(bossClear ? 4 : 3), boss: bossClear };
      s.screen = 'reward';
      s.ui.busy = false;
      DC.Meta.noteBestAct(r.act);
      DC.Audio.play('coin');
      this.save();
      DC.UI.render();
    },

    combatLost: function () {
      const s = this.state;
      if (s.combat) s.run.hp = 0;
      if (s.run) {
        DC.Meta.noteBestAct(s.run.act);
        DC.Meta.check({ win: false, cls: s.run.cls, asc: s.run.asc || 0, maxCombo: s.run.maxCombo || 0, dmg: s.run.stats.dmg || 0, challenge: s.run.challenge, relics: s.run.relics.length, seed: s.run.seed });
        this.recordRun(false);
      }
      s.screen = 'gameover';
      s.combat = null;
      s.ui.busy = false;
      this.clearSave();
      DC.UI.render();
    },

    makeRewardOptions: function (n) {
      const r = this.state.run;
      const out = [];
      const owned = r.relics.slice();
      const relicPool = shuffle(DC.RELIC_IDS.filter(function (id) { return owned.indexOf(id) < 0; }));
      const diePool = shuffle(DC.DICE_IDS.filter(function (id) { return DC.DICE[id].tier <= (r.act >= 3 ? 3 : r.act >= 2 ? 2 : 1) && DC.DICE[id].price > 0; }));
      const kinds = [];
      if (relicPool.length) kinds.push('relic');
      if (diePool.length) kinds.push('die');
      kinds.push('forge');
      if ((r.skills || []).some(function (v) { return v < 1; })) kinds.push('skill');
      for (let i = 0; i < n; i++) {
        let kind = kinds[i % kinds.length];
        if (kind === 'relic' && relicPool.length) {
          const id = relicPool.pop();
          const R = DC.RELICS[id];
          out.push({ kind: 'relic', id: id, name: R.name, desc: R.desc, ic: R.ic, c: R.c, kindLabel: '유물' });
        } else if (kind === 'die' && diePool.length) {
          const id = diePool.pop();
          const D = DC.DICE[id];
          out.push({ kind: 'die', id: id, name: D.name, desc: D.tag + ' 주사위', faces: D.faces, ic: 'dice', c: D.c, kindLabel: '주사위' });
        } else if (kind === 'skill' && (r.skills || []).some(function (v) { return v < 1; })) {
          out.push({ kind: 'skill', name: '각성의 서', desc: '스킬 하나를 각성시킵니다', ic: 'book', c: '#fbbf24', kindLabel: '각성' });
        } else {
          out.push({ kind: 'forge', name: '단조 도구', desc: '주사위 면을 1회 바꿉니다 (무료)', ic: 'anvil', c: '#fb923c', kindLabel: '단조' });
        }
      }
      return out;
    },

    takeReward: function (i) {
      const s = this.state;
      const rw = s.ui.reward;
      if (!rw || !rw.options[i]) return;
      const o = rw.options[i];
      const r = s.run;
      if (o.kind === 'relic') this.addRelic(o.id);
      else if (o.kind === 'die') r.dice.push(DC.Dice.make(o.id));
      else if (o.kind === 'forge') { s.ui.reward = null; this.openForge(1, null); return; }
      else if (o.kind === 'skill') { this.openSkills(false); return; }
      DC.Audio.play('coin');
      s.ui.reward = null;
      if (rw.boss) this.advanceAct();
      else this.goMap();
    },

    skipReward: function () {
      const s = this.state;
      const rw = s.ui.reward;
      if (!rw) return;
      s.run.gold += 20;
      s.ui.reward = null;
      if (rw.boss) this.advanceAct();
      else this.goMap();
    },

    advanceAct: function () {
      const r = this.state.run;
      if (r.act >= 3) {
        this.state.screen = 'win';
        const res = DC.Meta.noteWin(r.cls, r.asc || 0);
        this.state.ui.winInfo = res;
        const gained = DC.Meta.check({ win: true, cls: r.cls, asc: r.asc || 0, maxCombo: r.maxCombo || 0, dmg: r.stats.dmg || 0, challenge: r.challenge, relics: r.relics.length, seed: r.seed });
        this.state.ui.newAch = gained;
        this.recordRun(true);
        r.dice.forEach(function (d) { DC.Meta.noteDie(d.id); });
        this.clearSave();
        DC.UI.render();
        return;
      }
      r.act += 1;
      r.hp = Math.min(r.maxHp, r.hp + 18);
      const tier = r.act >= 3 ? 3 : 2;
      const pool = DC.DICE_IDS.filter(function (id) { return DC.DICE[id].tier <= tier; });
      r.dice.push(DC.Dice.make(pool[Math.floor(DC.rng() * pool.length)]));
      r.map = DC.MapGen.gen(DC.rng, r.act);
      r.current = null;
      DC.UI.toast('ACT ' + r.act + ' — ' + ['', '', '가라앉은 성소', '운명의 정점'][r.act]);
      this.goMap();
    },

    addRelic: function (id) {
      const r = this.state.run;
      if (r.relics.indexOf(id) >= 0) { r.gold += 40; return; }
      r.relics.push(id);
      DC.Meta.noteRelic(id);
      if (id === 'contract') { r.maxHp = Math.max(20, r.maxHp - 12); r.hp = Math.min(r.hp, r.maxHp); }
      if (id === 'gamblersHand') r.extraSpark = 0; // handled per combat
      DC.UI.toast('유물 획득: ' + DC.RELICS[id].name);
    },

    /* ---------------- forge ---------------- */
    openForge: function (free, node) {
      const s = this.state;
      s.screen = 'forge';
      s.ui.forge = { free: free, dieIdx: 0, faceIdx: null, options: [], node: node };
      this.state.ui.busy = false;
      DC.UI.render();
    },

    forgeSelectDie: function (di) {
      const f = this.state.ui.forge;
      f.dieIdx = di;
      f.faceIdx = null;
      f.options = [];
      DC.Audio.play('select');
      DC.UI.render();
    },

    forgeSelectFace: function (fi) {
      const s = this.state;
      const f = s.ui.forge;
      const die = s.run.dice[f.dieIdx];
      if (!die) return;
      f.faceIdx = fi;
      const cur = die.faces[fi];
      const pool = DC.FACE_POOL.filter(function (o) { return !(o.k === cur.k && o.v === cur.v); });
      f.options = shuffle(pool).slice(0, 5).map(function (o) {
        return { k: o.k, v: o.v, cost: Math.round(o.cost * (1 + 0.25 * (s.run.act - 1))) };
      });
      DC.Audio.play('select');
      DC.UI.render();
    },

    forgeApply: function (oi) {
      const s = this.state;
      const f = s.ui.forge;
      const die = s.run.dice[f.dieIdx];
      const o = f.options[oi];
      if (!die || !o || f.faceIdx == null) return;
      const cost = f.free > 0 ? 0 : o.cost;
      if (s.run.gold < cost) { DC.UI.toast('골드 부족'); DC.Audio.play('error'); return; }
      if (f.free > 0) f.free -= 1; else s.run.gold -= cost;
      DC.Dice.setFace(die, f.faceIdx, { k: o.k, v: o.v });
      DC.Audio.play('hit', true);
      DC.FX.flash('rgba(251,146,60,.25)');
      DC.UI.toast(DC.KINDS[o.k].n + ' ' + o.v + ' 면으로 단조!');
      f.faceIdx = null;
      f.options = [];
      DC.UI.render();
    },

    forgeExit: function () {
      this.state.ui.forge = null;
      this.goMap();
    },

    /* ---------------- shop ---------------- */
    openShop: function (node, keep) {
      const r = this.state.run;
      const prev = this.state.ui.shop;
      const rerolls = keep && prev ? (prev.rerolls || 0) : 0;
      const ascPrice = 1 + (DC.ascMod(r.asc || 0).price || 0);
      const disc = (r.relics.indexOf('merchant') >= 0 ? 0.7 : 1) * ascPrice * (1 + ((r.cmod || {}).price || 0));
      const tierMax = r.act >= 3 ? 3 : r.act >= 2 ? 2 : 1;
      const diePool = shuffle(DC.DICE_IDS.filter(function (id) { return DC.DICE[id].price > 0 && DC.DICE[id].tier <= tierMax; }));
      const relicPool = shuffle(DC.RELIC_IDS.filter(function (id) { return r.relics.indexOf(id) < 0; }));
      const items = [];
      for (let i = 0; i < 2 && diePool.length; i++) {
        const id = diePool.pop();
        const D = DC.DICE[id];
        items.push({ kind: 'die', id: id, name: D.name, desc: D.tag + ' 주사위 · 6면', faces: D.faces, price: Math.round(D.price * disc), ic: 'dice', c: D.c });
      }
      for (let i = 0; i < 2 && relicPool.length; i++) {
        const id = relicPool.pop();
        const R = DC.RELICS[id];
        items.push({ kind: 'relic', id: id, name: R.name, desc: R.desc, price: Math.round(R.price * disc), ic: R.ic, c: R.c });
      }
      items.push({ kind: 'forge', name: '단조 도구', desc: '주사위 면을 1회 바꿉니다 (무료)', price: Math.round(40 * disc), ic: 'anvil', c: '#fb923c' });
      items.push({ kind: 'heal', name: '회복 물약', desc: '체력 25 회복', price: Math.round(32 * disc), ic: 'heart', c: '#f472b6' });
      const canSkill = (r.skills || []).some(function (v) { return v < 1; });
      if (canSkill) items.push({ kind: 'skill', name: '각성의 서', desc: '스킬 하나를 영구히 각성시킵니다', price: Math.round(78 * disc), ic: 'book', c: '#fbbf24' });
      this.state.ui.shop = { items: items, node: node, rerolls: rerolls };
      this.state.screen = 'shop';
      DC.UI.render();
    },

    rerollShop: function () {
      const s = this.state;
      const sh = s.ui.shop;
      if (!sh) return;
      const cost = 20;
      if ((sh.rerolls || 0) >= 2) { DC.UI.toast('재고 변경은 2회까지'); return; }
      if (s.run.gold < cost) { DC.UI.toast('골드 부족'); DC.Audio.play('error'); return; }
      s.run.gold -= cost;
      sh.rerolls = (sh.rerolls || 0) + 1;
      DC.Audio.play('coin');
      this.openShop(sh.node, true);
    },

    buy: function (i) {
      const s = this.state;
      const sh = s.ui.shop;
      const it = sh && sh.items[i];
      if (!it || it.sold) return;
      if (s.run.gold < it.price) { DC.UI.toast('골드 부족'); DC.Audio.play('error'); return; }
      s.run.gold -= it.price;
      it.sold = true;
      if (it.kind === 'die') s.run.dice.push(DC.Dice.make(it.id));
      else if (it.kind === 'relic') this.addRelic(it.id);
      else if (it.kind === 'heal') { s.run.hp = Math.min(s.run.maxHp, s.run.hp + 25); }
      else if (it.kind === 'forge') { DC.Audio.play('coin'); this.openForge(1, sh.node); return; }
      else if (it.kind === 'skill') { DC.Audio.play('coin'); this.openSkills(true); return; }
      DC.Audio.play('coin');
      DC.UI.render();
    },

    /* ---------------- rest / event ---------------- */
    rest: function (i) {
      const s = this.state;
      const r = s.run;
      if (i === 0) { r.hp = Math.min(r.maxHp, r.hp + Math.ceil(r.maxHp * 0.4)); DC.Audio.play('heal'); this.goMap(); }
      else if (i === 1) { r.maxHp += 8; r.hp = Math.min(r.maxHp, r.hp + 8); DC.Audio.play('heal'); this.goMap(); }
      else { this.openForge(1, null); }
    },

    openEvent: function (node) {
      const r = this.state.run;
      const unseen = DC.EVENTS.filter(function (e) { return (r.seenEvents || []).indexOf(e.id) < 0; });
      const pool = unseen.length ? unseen : DC.EVENTS.filter(function (e) { return e.id !== 'merchant'; });
      const ev = pick(pool);
      this.state.ui.event = { def: ev, text: ev.text, node: node, result: null, after: null };
      this.state.screen = 'event';
      DC.UI.render();
    },

    /* effect model for events */
    applyEff: function (eff) {
      const r = this.state.run;
      if (!eff) return '';
      const parts = [];
      const sign = function (n) { return (n > 0 ? '+' : '') + n; };
      if (eff.gold) {
        r.gold = Math.max(0, r.gold + eff.gold);
        parts.push(sign(eff.gold) + ' 골드');
      }
      if (eff.maxHp) {
        r.maxHp = Math.max(20, r.maxHp + eff.maxHp);
        r.hp = Math.min(r.hp, r.maxHp);
        parts.push(sign(eff.maxHp) + ' 최대 체력');
      }
      if (eff.healPct) {
        const before = r.hp;
        r.hp = Math.min(r.maxHp, r.hp + Math.ceil(r.maxHp * eff.healPct));
        if (r.hp > before) parts.push('+' + (r.hp - before) + ' 체력');
      }
      if (eff.selfDmgFlat) {
        const before = r.hp;
        r.hp = Math.max(1, r.hp - eff.selfDmgFlat);
        parts.push('-' + (before - r.hp) + ' 체력');
      }
      if (eff.sparkMax) { r.extraSpark += eff.sparkMax; parts.push(sign(eff.sparkMax) + ' 최대 기세'); }
      if (eff.forge) parts.push('무료 단조 ' + eff.forge + '회');
      if (eff.relic) {
        const owned = r.relics || [];
        const pool = DC.RELIC_IDS.filter(function (id) { return owned.indexOf(id) < 0; });
        if (pool.length) {
          const id = pick(pool);
          this.addRelic(id);
          parts.push('유물 「' + DC.RELICS[id].name + '」');
        } else { r.gold += 60; parts.push('+60 골드'); }
      }
      if (eff.dice) {
        const tierMax = eff.dice === 'tier3' ? 3 : (r.act >= 3 ? 3 : r.act >= 2 ? 2 : 1);
        const pool = DC.DICE_IDS.filter(function (id) { return DC.DICE[id].price > 0 && DC.DICE[id].tier <= tierMax; });
        const n = typeof eff.dice === 'number' ? eff.dice : 1;
        for (let i = 0; i < n; i++) {
          const id = pick(pool);
          r.dice.push(DC.Dice.make(id));
          parts.push('주사위 「' + DC.DICE[id].name + '」');
        }
      }
      if (eff.copyDie) {
        const src = pick(r.dice);
        r.dice.push(DC.Dice.clone(src));
        parts.push('주사위 「' + src.name + '」 복제');
      }
      if (eff.removeDie) {
        if (r.dice.length > 3) {
          const idx = ri(r.dice.length);
          const name = r.dice[idx].name;
          r.dice.splice(idx, 1);
          parts.push('주사위 「' + name + '」 분실');
        }
      }
      if (eff.curseFace) {
        for (let i = 0; i < eff.curseFace; i++) {
          const d = pick(r.dice);
          const fi = ri(d.faces.length);
          DC.Dice.setFace(d, fi, { k: 'curse', v: 1 + ri(2) });
          parts.push('「' + d.name + '」에 저주 면');
        }
      }
      if (eff.upgradeFace) {
        for (let i = 0; i < eff.upgradeFace; i++) {
          const d = pick(r.dice);
          const fi = ri(d.faces.length);
          if (DC.Dice.upgradeFace(d, fi)) parts.push('「' + d.name + '」 면 강화');
        }
      }
      return parts;
    },

    choice: function (i) {
      const s = this.state;
      const r = s.run;
      const holder = s.ui.event;
      if (!holder) return;
      const ch = holder.def.choices[i];
      if (!ch) return;
      if (ch.need && ch.need.gold && r.gold < ch.need.gold) { DC.UI.toast('골드 부족'); return; }

      if (ch.next) {
        DC.Audio.play('click');
        s.ui.event = { def: ch.next, text: ch.next.text, node: holder.node, result: null, after: null };
        DC.UI.render();
        return;
      }

      let eff = ch.eff || {};
      let result = ch.result || '';
      if (ch.chance) {
        const roll = DC.rng();
        let acc = 0, hit = ch.chance[ch.chance.length - 1];
        for (let k = 0; k < ch.chance.length; k++) {
          acc += ch.chance[k].p;
          if (roll <= acc) { hit = ch.chance[k]; break; }
        }
        eff = hit.eff || {};
        result = hit.result || '';
      }
      const gains = this.applyEff(eff);
      r.seenEvents = (r.seenEvents || []).concat([holder.def.id || holder.def.name]);
      s.ui.event = {
        def: holder.def, text: holder.text, node: holder.node,
        result: result, gains: gains,
        after: ch.thenForge || (eff.forge ? { forge: eff.forge } : null),
      };
      DC.Audio.play(eff.selfDmgFlat ? 'error' : 'event');
      this.save();
      DC.UI.render();
    },

    /* ---------------- skill upgrades ---------------- */
    openSkills: function (paid) {
      const s = this.state;
      s.ui.modal = 'skills';
      s.ui.skillPaid = !!paid;
      s.ui.skillBack = s.screen;
      DC.Audio.play('click');
      DC.UI.render();
    },

    finishSkill: function () {
      const s = this.state;
      s.ui.modal = null;
      s.ui.skillPaid = false;
      const back = s.ui.skillBack;
      s.ui.skillBack = null;
      if (back === 'reward' || s.screen === 'reward') {
        const rw = s.ui.reward;
        s.ui.reward = null;
        if (rw && rw.boss) this.advanceAct();
        else this.goMap();
        return;
      }
      DC.UI.render();
    },

    upSkill: function (i) {
      const s = this.state;
      const r = s.run;
      if (!r || !r.skills) return;
      if (r.skills[i] >= 1) { DC.UI.toast('이미 각성한 스킬입니다'); return; }
      r.skills[i] = 1;
      const sk = DC.getSkill(r.cls, i, 1);
      DC.Audio.play('upgrade');
      DC.FX.flash('rgba(251,191,36,.22)');
      DC.UI.toast('스킬 각성: ' + sk.name);
      this.save();
      this.finishSkill();
    },
    leaveNode: function () {
      const s = this.state;
      const ev = s.ui.event;
      if (ev && ev.after && ev.after.forge) {
        s.ui.event = null;
        this.openForge(ev.after.forge, null);
        return;
      }
      s.ui.event = null;
      this.goMap();
    },

    /* ---------------- save ---------------- */
    save: function () {
      const s = this.state;
      if (!s.run || s.screen === 'win' || s.screen === 'gameover') return;
      try {
        const data = {
          v: 2,
          run: {
            cls: s.run.cls, hp: s.run.hp, maxHp: s.run.maxHp, gold: s.run.gold, act: s.run.act,
            dice: s.run.dice, relics: s.run.relics, map: s.run.map, current: s.run.current,
            cleared: s.run.cleared, extraSpark: s.run.extraSpark, stats: s.run.stats, startedAt: s.run.startedAt,
            skills: s.run.skills, seenEvents: s.run.seenEvents, asc: s.run.asc,
          },
          savedAt: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (e) {}
    },

    hasSave: function () {
      try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    },

    clearSave: function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    },

    resume: function () {
      let data = null;
      try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
      if (!data || !data.run) { DC.UI.toast('저장된 게임이 없습니다'); this.newRun(); return; }
      const rr = data.run;
      rr.skills = rr.skills || [0, 0, 0, 0, 0];
      rr.seenEvents = rr.seenEvents || [];
      rr.asc = rr.asc || 0;
      rr.maxCombo = rr.maxCombo || 0;
      if (rr.seed) DC.setSeed(rr.seed);
      this.state.run = rr;
      this.state.combat = null;
      this.state.screen = 'map';
      this.state.ui.busy = false;
      this.state.ui.sel = null;
      DC.UI.toast('이어서 진행합니다');
      DC.UI.render();
    },
  };

  DC.Game = Game;

  /* ---------------- headless test helpers ---------------- */
  const Test = {
    /* greedy evaluator: score a (die, slot) pair like a decent human would */
    scorePair: function (c, hi, si) {
      const h = c.hand[hi];
      const sk = DC.Combat.skill(c, si);
      const fx = sk.fx;
      const nm = DC.Combat.nextMult(c);
      const nAlive = DC.Combat.alive(c).length;
      const tgt = DC.Combat.target(c);
      const tgtHp = tgt ? tgt.hp + tgt.block : 99;
      let s = 0;
      if (fx.type === 'attack') s = h.v * fx.ratio * nm;
      else if (fx.type === 'aoe') s = h.v * fx.ratio * nm * Math.max(1, nAlive) * 0.85;
      else if (fx.type === 'chain') s = h.v * fx.ratio * nm * (1 + 0.6 * Math.min(1, nAlive - 1));
      else if (fx.type === 'multi') s = h.v * fx.ratio * nm * Math.max(1, c.combo + 1);
      else if (fx.type === 'block') s = h.v * fx.ratio * (1.05 - c.hp / c.maxHp);
      else if (fx.type === 'mult') s = 22 + c.hand.filter(function (x) { return !x.used; }).length * 4;
      else if (fx.type === 'spark') s = 12;
      else if (fx.type === 'buff') s = 16;
      else if (fx.type === 'mix') {
        const f = c.flask || { fire: 0, poison: 0, bolt: 0 };
        const n = (f.fire || 0) + (f.poison || 0) + (f.bolt || 0);
        s = n ? h.v * 1.1 * n * nm + 6 + n * 4 : 2;
      }
      if (h.k === 'fire' || h.k === 'venom') s *= 1.15;
      if (h.k === 'leech' && c.hp < c.maxHp * 0.55) s *= 1.3;
      if (h.k === 'curse') s *= 0.35;
      if (tgtHp <= s * 1.2) s += 8; // lethal bias
      return s;
    },

    botTurn: function () {
      const s = Game.state, c = s.combat;
      if (!c || c.phase !== 'player') return false;
      let guard = 0;
      while (guard++ < 24) {
        let best = null;
        for (let si = 0; si < c.slots.length; si++) {
          if (c.slots[si].handIdx !== null) continue;
          for (let hi = 0; hi < c.hand.length; hi++) {
            if (!DC.Combat.canPlay(c, hi, si).ok) continue;
            const sc = Test.scorePair(c, hi, si);
            if (!best || sc > best.sc) best = { hi: hi, si: si, sc: sc };
          }
        }
        if (!best) break;
        Game.play(best.hi, best.si, true);
        if (c.phase !== 'player') break;
      }
      // spend leftover sparks to unlock a slot
      let sparksTries = 0;
      while (c.sparks > 0 && sparksTries++ < 6 && c.phase === 'player') {
        let done = false;
        for (let si = 0; si < c.slots.length; si++) {
          if (c.slots[si].handIdx !== null) continue;
          const req = DC.REQ[DC.CLASSES[c.cls].skills[si].req];
          for (let hi = 0; hi < c.hand.length; hi++) {
            const h = c.hand[hi];
            if (h.used || h.locked) continue;
            for (let d = -2; d <= 2; d++) {
              if (!d) continue;
              const nv = h.v + d;
              if (nv < 1 || nv > 6) continue;
              if (req.test(nv) && !req.test(h.v)) { DC.Combat.manip(c, d > 0 ? 'plus' : 'minus', hi); done = true; break; }
            }
            if (done) break;
          }
          if (done) break;
        }
        if (!done) break;
      }
      // re-play anything the nudges unlocked
      let again = 0;
      while (again++ < 6) {
        let best = null;
        for (let si = 0; si < c.slots.length; si++) {
          if (c.slots[si].handIdx !== null) continue;
          for (let hi = 0; hi < c.hand.length; hi++) {
            if (!DC.Combat.canPlay(c, hi, si).ok) continue;
            const sc = Test.scorePair(c, hi, si);
            if (!best || sc > best.sc) best = { hi: hi, si: si, sc: sc };
          }
        }
        if (!best) break;
        Game.play(best.hi, best.si, true);
        if (c.phase !== 'player') break;
      }
      if (c.phase === 'player') DC.Combat.endTurn(c);
      return true;
    },

    autoCombat: function (maxTurns) {
      const s = Game.state;
      const c = s.combat;
      if (!c) return;
      let n = 0;
      while (c.phase === 'player' && n++ < (maxTurns || 40)) {
        Test.botTurn();
        if (c.phase === 'player') DC.Combat.startTurn(c);
      }
      s.run.hp = c.hp;
      s.run.stats.dmg += c.totalDamage;
    },

    autoRun: function (cls, maxSteps) {
      Game.newRun();
      Game.pickClass(cls || 'warrior');
      const s = Game.state;
      let steps = 0;
      const log = [];
      while (steps++ < (maxSteps || 600)) {
        if (s.screen === 'win' || s.screen === 'gameover') break;
        if (s.screen === 'combat') {
          Test.autoCombat(50);
          const c = s.combat;
          if (c.phase === 'won') Game.combatWon();
          else if (c.phase === 'lost') Game.combatLost();
          continue;
        }
        if (s.screen === 'reward') { Game.takeReward(0); continue; }
        if (s.screen === 'map') {
          const avail = DC.MapGen.available(s.run.map);
          if (!avail.length) break;
          Game.travel(avail[0]);
          continue;
        }
        if (s.screen === 'forge') { Game.forgeExit(); continue; }
        if (s.screen === 'shop') { Game.leaveNode(); continue; }
        if (s.screen === 'rest') { Game.rest(0); continue; }
        if (s.screen === 'event') {
          if (s.ui.event && s.ui.event.result) Game.leaveNode();
          else Game.choice(0);
          continue;
        }
        break;
      }
      return { screen: s.screen, act: s.run ? s.run.act : 0, hp: s.run ? s.run.hp : 0, steps: steps, kills: s.run ? s.run.stats.kills : 0 };
    },

    sim: function (runs, cls) {
      const out = { runs: runs, wins: 0, acts: {}, cls: cls || 'mixed', details: [] };
      const classes = cls ? [cls] : DC.CLASS_IDS;
      for (let i = 0; i < runs; i++) {
        const c = classes[i % classes.length];
        const res = Test.autoRun(c, 800);
        if (res.screen === 'win') out.wins++;
        out.acts[res.act] = (out.acts[res.act] || 0) + 1;
        out.details.push(c + ':' + res.screen + '@' + res.act);
      }
      return out;
    },
  };
  DC.test = Test;

  window.addEventListener('DOMContentLoaded', function () { Game.boot(); });
  if (document.readyState !== 'loading') Game.boot();
})();
