/* =========================================================
   Game controller: run lifecycle, screens wiring, save/load.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;
  const SAVE_KEY = 'dicechain.save.v2';
  const SET_KEY = 'dicechain.settings.v1';

  function ri(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[ri(arr.length)]; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  const Game = {
    state: {
      screen: 'title',
      run: null,
      combat: null,
      ui: { sel: null, busy: false, modal: null, reward: null, forge: null, shop: null, event: null, hist: [], tip: null, speed: 1 },
      lastCombat: null,
    },

    /* ---------------- boot ---------------- */
    boot: function () {
      try {
        const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}');
        if (s.muted) DC.Audio.setMuted(true);
        if (s.speed === 2) this.state.ui.speed = 2;
        DC.Speed = this.state.ui.speed;
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
        case 'pickclass': this.pickClass(d.id); break;
        case 'node': this.travel(d.nid); break;
        case 'hand': this.tapDie(parseInt(d.idx, 10)); break;
        case 'slot': this.tapSlot(parseInt(d.idx, 10)); break;
        case 'manip': this.manip(d.op); break;
        case 'undo': this.undo(); break;
        case 'speed': this.toggleSpeed(); break;
        case 'endturn': this.endTurn(); break;
        case 'target': this.setTarget(parseInt(d.i, 10)); break;
        case 'reward': this.takeReward(parseInt(d.i, 10)); break;
        case 'skipreward': this.skipReward(); break;
        case 'fdiedie': this.forgeSelectDie(parseInt(d.i, 10)); break;
        case 'fface': this.forgeSelectFace(parseInt(d.i, 10)); break;
        case 'fopt': this.forgeApply(parseInt(d.i, 10)); break;
        case 'forgeexit': this.forgeExit(); break;
        case 'buy': this.buy(parseInt(d.i, 10)); break;
        case 'rest': this.rest(parseInt(d.i, 10)); break;
        case 'choice': this.choice(parseInt(d.i, 10)); break;
        case 'leave': this.leaveNode(); break;
        case 'deck': s.ui.modal = s.ui.modal === 'deck' ? null : 'deck'; DC.Audio.play('click'); DC.UI.render(); break;
        case 'closedeck': s.ui.modal = null; DC.UI.render(); break;
        case 'help': s.ui.modal = s.ui.modal === 'help' ? null : 'help'; DC.UI.render(); break;
        case 'closehelp': s.ui.modal = null; DC.UI.render(); break;
        case 'sound':
          DC.Audio.setMuted(!DC.Audio.isMuted());
          try { localStorage.setItem(SET_KEY, JSON.stringify({ muted: DC.Audio.isMuted() })); } catch (e) {}
          DC.UI.render();
          break;
        default: break;
      }
    },

    /* ---------------- run setup ---------------- */
    newRun: function () {
      this.state.screen = 'class';
      this.state.run = null;
      this.state.combat = null;
      DC.UI.render();
    },

    pickClass: function (id) {
      const C = DC.CLASSES[id];
      const run = {
        cls: id,
        hp: C.hp, maxHp: C.hp,
        gold: 60,
        act: 1,
        dice: C.startDice.map(function (d) { return DC.Dice.make(d); }),
        relics: [],
        map: null,
        current: null,
        cleared: [],
        extraSpark: 0,
        stats: { kills: 0, turns: 0, dmg: 0 },
        startedAt: Date.now(),
        nodeSeq: 0,
      };
      run.map = DC.MapGen.gen(Math.random, 1);
      this.state.run = run;
      this.state.combat = null;
      this.goMap();
      DC.UI.toast(C.name + ' — 행운을 빈다');
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
      const n = r.act === 1 ? (Math.random() < 0.3 ? 2 : 1) : (Math.random() < 0.55 ? 2 : 1);
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
      const c = DC.Combat.create(r, spawns, kind);
      DC.Combat.attachBag(c, r.dice);
      c.hp = r.hp;
      c.maxHp = r.maxHp;
      this.state.combat = c;
      this.state.screen = 'combat';
      this.state.ui.sel = null;
      this.state.ui.busy = false;
      this.state.ui.hist = [];
      DC.UI.render();
      DC.Audio.play('turn');
      if (kind === 'boss') DC.UI.toast('보스 등장!');
      else if (kind === 'elite') DC.UI.toast('정예 조우!');
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
    combatWon: function () {
      const s = this.state;
      const c = s.combat;
      const r = s.run;
      r.hp = c.hp;
      r.stats.kills += c.enemies.filter(function (e) { return e.hp <= 0; }).length;
      r.stats.dmg += c.totalDamage;
      let gold = c.kind === 'boss' ? 95 + r.act * 12 : c.kind === 'elite' ? 45 + ri(15) : 16 + ri(9);
      gold += r.act * 4;
      if (r.relics.indexOf('contract') >= 0) gold = Math.round(gold * 1.4);
      r.gold += gold;
      const bossClear = c.kind === 'boss';
      s.combat = null;
      s.ui.reward = { gold: gold, options: this.makeRewardOptions(bossClear ? 4 : 3), boss: bossClear };
      s.screen = 'reward';
      s.ui.busy = false;
      DC.Audio.play('coin');
      this.save();
      DC.UI.render();
    },

    combatLost: function () {
      const s = this.state;
      if (s.combat) s.run.hp = 0;
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
        this.clearSave();
        DC.UI.render();
        return;
      }
      r.act += 1;
      r.hp = Math.min(r.maxHp, r.hp + 18);
      const tier = r.act >= 3 ? 3 : 2;
      const pool = DC.DICE_IDS.filter(function (id) { return DC.DICE[id].tier <= tier; });
      r.dice.push(DC.Dice.make(pool[Math.floor(Math.random() * pool.length)]));
      r.map = DC.MapGen.gen(Math.random, r.act);
      r.current = null;
      DC.UI.toast('ACT ' + r.act + ' — ' + ['', '', '가라앉은 성소', '운명의 정점'][r.act]);
      this.goMap();
    },

    addRelic: function (id) {
      const r = this.state.run;
      if (r.relics.indexOf(id) >= 0) { r.gold += 40; return; }
      r.relics.push(id);
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
    openShop: function (node) {
      const r = this.state.run;
      const disc = r.relics.indexOf('merchant') >= 0 ? 0.7 : 1;
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
      this.state.ui.shop = { items: items, node: node };
      this.state.screen = 'shop';
      DC.UI.render();
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
      const ev = pick(DC.EVENTS);
      let text = ev.text;
      if (ev.id === 'merchant' && r.gold < 45) text += ' (골드가 부족해 보인다…)';
      this.state.ui.event = { def: ev, text: text, node: node };
      this.state.screen = 'event';
      DC.UI.render();
    },

    choice: function (i) {
      const s = this.state;
      const r = s.run;
      const ev = s.ui.event;
      if (!ev) return;
      const ch = ev.def.choices[i];
      if (!ch) return;
      if (ch.need && ch.need.gold && r.gold < ch.need.gold) { DC.UI.toast('골드 부족'); return; }
      let msg = '';
      switch (ch.fn) {
        case 'leave': this.goMap(); return;
        case 'gamble':
          r.gold -= 30;
          if (Math.random() < 0.5) { r.gold += 90; msg = '대박! +90 골드'; DC.Audio.play('coin'); }
          else { msg = '제단은 조용했다… -30 골드'; DC.Audio.play('error'); }
          break;
        case 'cursedSword':
          this.addRelic('mask');
          r.maxHp = Math.max(20, r.maxHp - 8); r.hp = Math.min(r.hp, r.maxHp);
          msg = '광기의 가면 획득 · 최대 체력 -8';
          break;
        case 'gainDie': {
          const pool = DC.DICE_IDS.filter(function (id) { return DC.DICE[id].price > 0 && DC.DICE[id].tier <= 2; });
          const id = pick(pool);
          r.dice.push(DC.Dice.make(id));
          r.hp = Math.max(1, r.hp - 10);
          msg = DC.DICE[id].name + ' 획득 · 10 피해';
          break;
        }
        case 'heal35':
          r.hp = Math.min(r.maxHp, r.hp + Math.ceil(r.maxHp * 0.35));
          msg = '체력 회복'; DC.Audio.play('heal');
          break;
        case 'sparkMax':
          r.extraSpark += 1;
          msg = '최대 기세 +1';
          break;
        case 'buyEpicDie': {
          r.gold -= 45;
          const pool = DC.DICE_IDS.filter(function (id) { return DC.DICE[id].tier === 3; });
          const id = pick(pool);
          r.dice.push(DC.Dice.make(id));
          msg = DC.DICE[id].name + ' 획득!'; DC.Audio.play('coin');
          break;
        }
        case 'freeForge':
          s.ui.event = null;
          this.openForge(1, null);
          return;
      }
      DC.UI.toast(msg);
      s.ui.event = null;
      this.goMap();
    },

    leaveNode: function () { this.goMap(); },

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
      this.state.run = data.run;
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
      const sk = DC.CLASSES[c.cls].skills[si];
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
        if (s.screen === 'event') { Game.choice(0); continue; }
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
