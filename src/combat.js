/* =========================================================
   Combat engine — the heart of Dice Chain.
   Turn: roll bag -> assign dice to skill slots (req checks) ->
   manipulate with sparks -> chain combos -> end turn -> enemy intents.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  function has(c, id) { return c.relics && c.relics.indexOf(id) >= 0; }

  /* abyss anomaly modifiers (v5.0) */
  function abyss(c) { return (c.abyss && c.abyss.mod) || null; }

  function synOn(c, id) {
    if (!DC.synergiesFor) return false;
    return DC.synergiesFor(c.relics).some(function (sy) { return sy.id === id; });
  }

  function alive(c) { return c.enemies.filter(function (e) { return e.hp > 0; }); }

  function mult(c) {
    const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
    const base = 1 + step * Math.max(0, c.combo - 1);
    const cap = has(c, 'rupture') ? 5.0 : DC.BAL.comboCap;
    return Math.min(cap + 0.5, base + c.multBonus);
  }

  function target(c) {
    const e = c.enemies[c.target];
    if (e && e.hp > 0) return e;
    const a = alive(c);
    return a[0] || null;
  }

  function pickTargets(c, n) {
    const a = alive(c);
    const t = target(c);
    const out = [];
    if (t) out.push(t);
    a.forEach(function (e) { if (e !== t && out.length < n) out.push(e); });
    return out;
  }

  function mkEnemy(spawn, scale, act) {
    const abyss = Math.max(0, (act || 1) - 3);
    const hp = Math.max(1, Math.round(spawn.hp * (scale || 1) * (1 + 0.26 * ((act || 1) - 1)) * (1 + 0.18 * abyss)));
    return {
      id: DC.uid('e'), key: spawn.id, name: spawn.name, art: spawn.art, c: spawn.c,
      hp: hp, maxHp: hp, block: 0,
      st: { burn: 0, poison: 0, weak: 0, vuln: 0, str: 0 },
      intents: spawn.intents,
      actMul: (1 + 0.15 * ((act || 1) - 1)) * (1 + 0.12 * abyss),
      intentIdx: Math.floor(DC.rng() * spawn.intents.length),
      gimmick: spawn.gimmick || null,
      lines: spawn.lines || null,
      title: spawn.title || null,
      add: !!spawn.add,
      dead: false,
    };
  }

  function skillOf(c, idx) {
    if (c.customSkills && c.customSkills[idx]) return c.customSkills[idx];
    return DC.getSkill(c.cls, idx, (c.skillLv || [])[idx] || 0);
  }

  function intentOf(e) {
    if (!e || e.hp <= 0) return null;
    const it = e.intents[e.intentIdx % e.intents.length];
    const out = Object.assign({}, it);
    if (out.k === 'attack') {
      let v = out.v + (e.st.str || 0);
      if (e.actMul) v = Math.round(v * e.actMul * (e.ascAtk || 1));
      if (e.st.weak > 0) v = Math.round(v * DC.BAL.weakMult);
      out.v = Math.max(1, Math.round(v));
    }
    return out;
  }

  function intentText(it) {
    if (!it) return '';
    switch (it.k) {
      case 'attack': return (it.hits > 1 ? it.v + '×' + it.hits : String(it.v)) + ' 피해';
      case 'defend': return '방어 ' + it.v;
      case 'buff': return '힘 +' + it.v;
      case 'debuff': return (DC.STATUS[it.s] ? DC.STATUS[it.s].n : '약화') + ' ' + it.v;
      case 'curse': return '주사위 ' + it.n + '개 봉인';
      case 'drain': return it.v + ' 흡혈';
      default: return '???';
    }
  }

  function intentIcon(it) {
    if (!it) return 'dice';
    return { attack: 'sword', defend: 'shield', buff: 'up', debuff: 'down', curse: 'lock', drain: 'blood' }[it.k] || 'dice';
  }

  /* ---------- damage helpers ---------- */
  function hitEnemy(c, e, amount, opts, ev) {
    if (!e || e.hp <= 0) return 0;
    let dmg = amount;
    if (e.st.vuln > 0) dmg = Math.round(dmg * DC.BAL.vulnMult);
    dmg = Math.max(0, Math.round(dmg));
    const absorbed = Math.min(e.block, dmg);
    e.block -= absorbed;
    const real = dmg - absorbed;
    e.hp = Math.max(0, e.hp - real);
    ev.push({ t: 'edmg', eid: e.id, amount: dmg, absorbed: absorbed, heavy: dmg >= 18, kind: opts && opts.kind });
    if (has(c, 'vampireFang')) {
      const heal = Math.round(real * 0.08);
      if (heal > 0) { c.hp = Math.min(c.maxHp, c.hp + heal); ev.push({ t: 'heal', amount: heal }); }
    }
    /* boss: revive once */
    const g = e.gimmick;
    if (e.hp <= 0 && g && g.kind === 'revive' && !e.gRevived) {
      e.gRevived = true;
      e.hp = Math.max(1, Math.round(e.maxHp * g.hpPct));
      e.block += g.block || 0;
      e.st.burn = 0; e.st.poison = 0; e.st.weak = 0; e.st.vuln = 0;
      if (e.lines) ev.push({ t: 'bossline', text: e.lines.half });
      ev.push({ t: 'eheal', eid: e.id, amount: e.hp });
      ev.push({ t: 'gimmick', eid: e.id, kind: 'revive' });
      return dmg;
    }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      ev.push({ t: 'kill', eid: e.id });
      if (e.lines) ev.push({ t: 'bossline', text: e.lines.die, soft: true });
      if (has(c, 'grail')) { c.hp = Math.min(c.maxHp, c.hp + 6); ev.push({ t: 'heal', amount: 6 }); }
    }
    /* boss: mirror — reflects a share of the damage back at the player */
    if (g && g.kind === 'mirror' && real > 0) {
      const back = Math.max(1, Math.round(real * (g.pct || 0.2)));
      hitPlayer(c, back, ev, { kind: 'mirror' });
      ev.push({ t: 'msg', text: '거울 반사 — ' + back + ' 피해' });
    }
    /* boss: split at threshold */
    if (g && g.kind === 'split' && !e.gSplit && e.hp > 0 && e.hp <= e.maxHp * g.at) {
      e.gSplit = true;
      if (e.lines) ev.push({ t: 'bossline', text: e.lines.half });
      (g.adds || []).forEach(function (key) {
        const pool = DC.ENEMIES[c.act] || [];
        const sp = pool.filter(function (x) { return x.id === key; })[0];
        if (!sp) return;
        const add = mkEnemy(sp, 0.45, c.act);
        add.name = '여왕의 아이';
        add.add = true;
        c.enemies.push(add);
        ev.push({ t: 'spawn', eid: add.id });
      });
      ev.push({ t: 'gimmick', eid: e.id, kind: 'split' });
    }
    return dmg;
  }

  function hitPlayer(c, amount, ev, opts) {
    let dmg = Math.round(amount);
    if (opts && opts.raw !== true && has(c, 'glassCannon')) dmg = Math.round(dmg * 1.5);
    if (opts && opts.raw !== true && abyss(c) && abyss(c).taken) dmg = Math.round(dmg * (1 + abyss(c).taken));
    if (c.statuses.vuln > 0) dmg = Math.round(dmg * DC.BAL.vulnMult);
    const absorbed = Math.min(c.block, dmg);
    c.block -= absorbed;
    const real = Math.max(0, dmg - absorbed);
    c.hp = Math.max(0, c.hp - real);
    ev.push({ t: 'pdam', amount: dmg, absorbed: absorbed, real: real, kind: opts && opts.kind });
    if (c.hp <= 0) c.phase = 'lost';
    return real;
  }

  function gainBlock(c, amount) {
    let v = Math.round(amount * (has(c, 'wrist') ? 1.25 : 1) * (has(c, 'warDrum') ? 0.75 : 1));
    c.block += v;
    return v;
  }

  function healPlayer(c, amount, ev) {
    const before = c.hp;
    let amt = amount;
    if (synOn(c, 'bloodMoon')) amt = amt * 1.5;
    c.hp = Math.min(c.maxHp, c.hp + Math.round(amt));
    const d = c.hp - before;
    if (d > 0) ev.push({ t: 'heal', amount: d });
    return d;
  }

  function faceColor(k) { return (DC.KINDS[k] || DC.KINDS.blank).c; }

  /* ---------- battle log ---------- */
  function pushLog(c, entry) {
    if (!c.battleLog) c.battleLog = [];
    c.battleLog.push(entry);
    if (c.battleLog.length > 40) c.battleLog.shift();
  }

  /* ---------- alchemist flask ---------- */
  const ESS = { fire: 'fire', venom: 'poison', bolt: 'bolt' };
  function flaskTotal(f) { return f ? (f.fire || 0) + (f.poison || 0) + (f.bolt || 0) : 0; }
  DC.flaskTotal = flaskTotal;

  function brew(c, k, v, ev) {
    const e = ESS[k];
    const f = c.flask;
    if (!e || !f) return;
    if (flaskTotal(f) >= 3) return;
    f[e] += 1;
    ev.push({ t: 'flask', e: e, n: flaskTotal(f) });
    if (flaskTotal(f) < 3) return;
    /* three essences -> a potion */
    const all = alive(c);
    if (f.fire === 3) {
      all.forEach(function (en) { hitEnemy(c, en, Math.round(7 + v * 1.6), { kind: 'fire' }, ev); });
      ev.push({ t: 'msg', text: '폭발 비약! 모든 적 피해' });
    } else if (f.poison === 3) {
      all.forEach(function (en) { en.st.poison += 2; ev.push({ t: 'status', eid: en.id, s: 'poison', amount: 2 }); });
      const b = gainBlock(c, 6); ev.push({ t: 'pblock', amount: b });
      ev.push({ t: 'msg', text: '부식 비약! 맹독 + 방어' });
    } else if (f.bolt === 3) {
      pickTargets(c, 2).forEach(function (en) { hitEnemy(c, en, Math.round(6 + v * 1.4), { kind: 'bolt' }, ev); });
      c.sparks += 1; ev.push({ t: 'spark', amount: 1 });
      ev.push({ t: 'msg', text: '감전 비약! 연쇄 감전' });
    } else {
      healPlayer(c, 4, ev);
      const b = gainBlock(c, 6); ev.push({ t: 'pblock', amount: b });
      const t = target(c);
      if (t) { t.st.vuln += 1; ev.push({ t: 'status', eid: t.id, s: 'vuln', amount: 1 }); }
      ev.push({ t: 'msg', text: '균형 비약! 회복 + 취약' });
    }
    c.flask = { fire: 0, poison: 0, bolt: 0 };
    ev.push({ t: 'flask', e: 'clear', n: 0 });
  }
  DC.brew = brew;

  /* ---------- the effect resolver ---------- */
  function resolve(c, hand, skill, ev) {
    const v = hand.v, k = hand.k, fx = skill.fx;
    const m = mult(c);
    const who = target(c);
    const weakP = c.statuses.weak > 0 ? DC.BAL.weakMult : 1;
    let mainDone = false;

    function atk(targetEnemy, ratio, bonus, opts) {
      let d = (v * ratio + (bonus || 0) + (c.statuses.str || 0)) * m * weakP;
      if (k === 'slash') d *= 1.0;
      if (fx.verdict) d += (c.verdict || 0) * fx.verdict;
      if (has(c, 'scale') && v % 2 === 1) d *= 1.4;
      if (has(c, 'pledge') && v % 2 === 0) d *= 1.4;
      if (c.cls === 'gambler' && c.combo >= 3 && !(opts && opts.noDouble)) d += 3;
      if (has(c, 'flameHeart') && (k === 'fire' || (opts && opts.fire))) d *= 1.6;
      if (synOn(c, 'storm') && (k === 'fire' || k === 'bolt' || (opts && opts.fire))) d *= 1.15;
      if (c.prevV != null && c.prevV === v) d *= 1.25;
      if ((c.sameVal || 1) >= 3) d *= 1.15;
      if ((c.sameVal || 1) >= 4) d *= 1.15;
      if (c.cmod && c.cmod.dmg) d *= c.cmod.dmg;
      if (has(c, 'vanguard') && c.turn === 1) d *= 1.5;
      if (has(c, 'duelist') && alive(c).length === 1) d *= 1.25;
      if (has(c, 'bloodPact')) d *= 1.35;
      if (has(c, 'glassCannon')) d *= 1.5;
      if (has(c, 'executioner') && targetEnemy && targetEnemy.hp > 0 && targetEnemy.hp <= targetEnemy.maxHp * 0.3) d *= 1.4;
      if (abyss(c) && abyss(c).dmg) d *= 1 + abyss(c).dmg;
      let dmg = Math.max(1, Math.round(d));
      const hits = (has(c, 'karma') && c.combo >= 4 && !(opts && opts.noDouble)) ? 2 : 1;
      for (let i = 0; i < hits; i++) {
        if (targetEnemy && targetEnemy.hp > 0) hitEnemy(c, targetEnemy, dmg, { kind: k }, ev);
      }
      return dmg * hits;
    }

    switch (fx.type) {
      case 'attack': {
        if (who) atk(who, fx.ratio, (skill.id === 'dagger' ? (c.combo - 1) * (fx.comboBonus || 0) : 0) + (fx.reflect ? Math.floor(c.block / 2) : 0), { fire: !!fx.burn });
        if (fx.burn && who) { who.st.burn += Math.max(1, Math.floor(v / 2) + (has(c, 'flameHeart') ? 1 : 0)); ev.push({ t: 'status', eid: who.id, s: 'burn', amount: Math.max(1, Math.floor(v / 2)) }); }
        if (fx.status && who) {
          Object.keys(fx.status).forEach(function (s) { who.st[s] += fx.status[s]; ev.push({ t: 'status', eid: who.id, s: s, amount: fx.status[s] }); });
        }
        if (fx.selfDmg) hitPlayer(c, fx.selfDmg, ev, { kind: 'self', raw: true });
        mainDone = true;
        break;
      }
      case 'aoe': {
        const vbonus = fx.verdictSpend ? Math.min(c.verdict || 0, 6) * fx.verdictSpend : 0;
        alive(c).forEach(function (e) { atk(e, fx.ratio, vbonus, { fire: !!fx.burn, noDouble: false }); });
        if (vbonus) {
          c.verdict = 0;
          ev.push({ t: 'msg', text: '심판 소모 — +' + vbonus + ' 피해' });
        }
        if (fx.burn) {
          alive(c).forEach(function (e) { e.st.burn += fx.burn; ev.push({ t: 'status', eid: e.id, s: 'burn', amount: fx.burn }); });
        }
        mainDone = true;
        break;
      }
      case 'block': {
        const b = gainBlock(c, v * fx.ratio);
        ev.push({ t: 'pblock', amount: b });
        if (fx.heal) healPlayer(c, fx.heal, ev);
        mainDone = true;
        break;
      }
      case 'chain': {
        const n = 1 + (has(c, 'conductor') ? 1 : 0);
        const ts = pickTargets(c, n + 1);
        ts.forEach(function (e, i) {
          const ratio = i === 0 ? fx.ratio : fx.ratio * 0.6;
          atk(e, ratio, 0, { noDouble: true });
        });
        mainDone = true;
        break;
      }
      case 'mult': {
        c.multBonus += fx.add;
        if (fx.dmgRatio && who) atk(who, fx.dmgRatio, 0, { noDouble: true });
        ev.push({ t: 'msg', text: '증폭 +' + fx.add.toFixed(1) });
        mainDone = true;
        break;
      }
      case 'buff': {
        c.statuses.str += fx.str || 0;
        const b = gainBlock(c, fx.block || 0);
        ev.push({ t: 'msg', text: '힘 +' + (fx.str || 0) });
        ev.push({ t: 'pblock', amount: b });
        mainDone = true;
        break;
      }
      case 'verdict': {
        c.verdict = Math.min(6, (c.verdict || 0) + (fx.gain || 1));
        const b = gainBlock(c, fx.block || 0);
        if (b) ev.push({ t: 'pblock', amount: b });
        ev.push({ t: 'vstack', n: c.verdict });
        mainDone = true;
        break;
      }
      case 'spark': {        c.sparks += fx.amount || 0;
        ev.push({ t: 'spark', amount: fx.amount || 0 });
        const b = gainBlock(c, fx.block || 0);
        if (b) ev.push({ t: 'pblock', amount: b });
        mainDone = true;
        break;
      }
      case 'mix': {
        const f = c.flask || { fire: 0, poison: 0, bolt: 0 };
        const n = flaskTotal(f);
        if (who && n > 0) atk(who, (fx.ratio || 1.0) * n, 0, { fire: f.fire > 0 });
        const b = gainBlock(c, (fx.block || 2) * n);
        if (b) ev.push({ t: 'pblock', amount: b });
        c.flask = { fire: 0, poison: 0, bolt: 0 };
        ev.push({ t: 'flask', e: 'clear', n: 0 });
        ev.push({ t: 'msg', text: n ? '촉매! 정수 ' + n + ' 소모' : '촉매 — 플라스크가 비었다' });
        mainDone = true;
        break;
      }
      case 'multi': {
        const hits = Math.max(1, Math.min(8, c.combo));
        for (let i = 0; i < hits; i++) {
          const t2 = alive(c)[i % Math.max(1, alive(c).length)];
          if (t2) atk(t2, fx.ratio, 0, { noDouble: true });
        }
        ev.push({ t: 'msg', text: hits + '연타!' });
        mainDone = true;
        break;
      }
    }

    /* paladin: verdict stacks from defensive skills / holy faces */
    if (fx.verdictGain) {
      c.verdict = Math.min(6, (c.verdict || 0) + fx.verdictGain);
      ev.push({ t: 'vstack', n: c.verdict });
    }

    /* face riders (dice identity!) */
    if (k === 'fire' && fx.type !== 'attack' && fx.type !== 'aoe') {
      if (who) { who.st.burn += Math.max(1, Math.floor(v / 2)); ev.push({ t: 'status', eid: who.id, s: 'burn', amount: Math.max(1, Math.floor(v / 2)) }); }
    } else if (k === 'bolt') {
      const extra = pickTargets(c, 3).filter(function (e) { return !who || e !== who; })[0];
      if (extra) { hitEnemy(c, extra, Math.max(1, Math.round((v / 2) * m)), { kind: 'bolt' }, ev); ev.push({ t: 'chain' }); }
      if (synOn(c, 'storm')) {
        const t3 = pickTargets(c, 2).filter(function (e) { return !who || e !== who; })[0] || who;
        if (t3) { hitEnemy(c, t3, 4, { kind: 'bolt' }, ev); ev.push({ t: 'chain' }); }
      }
    } else if (k === 'venom') {
      if (who) { who.st.poison += Math.max(1, Math.floor(v / 2)); ev.push({ t: 'status', eid: who.id, s: 'poison', amount: Math.max(1, Math.floor(v / 2)) }); }
    } else if (k === 'leech') {
      healPlayer(c, Math.ceil(v / 2), ev);
    } else if (k === 'holy') {
      const b = gainBlock(c, Math.ceil(v / 2) + 1);
      ev.push({ t: 'pblock', amount: b });
      if (c.cls === 'paladin') {
        c.verdict = Math.min(6, (c.verdict || 0) + 1);
        ev.push({ t: 'vstack', n: c.verdict });
      }
    } else if (k === 'guard' && fx.type !== 'block') {
      const b = gainBlock(c, Math.ceil(v / 2));
      ev.push({ t: 'pblock', amount: b });
    } else if (k === 'mult') {
      if (fx.type !== 'mult') { c.multBonus += 0.5; ev.push({ t: 'msg', text: '증폭 +0.5' }); }
    } else if (k === 'curse') {
      const self = Math.ceil(v / 2);
      const real = hitPlayer(c, self, ev, { kind: 'curse', raw: true });
      ev.push({ t: 'msg', text: '저주! ' + real + ' 피해' });
    } else if (k === 'blank') {
      ev.push({ t: 'msg', text: '공허 — 효과 없음' });
    }

    if (c.cls === 'alchemist') brew(c, k, v, ev);
    if (c.cls === 'mage' && (k === 'fire' || k === 'bolt')) healPlayer(c, 2, ev);

    /* relic: spark on 6 / even */
    if (v === 6 && has(c, 'sixBless')) { c.sparks += 1; ev.push({ t: 'spark', amount: 1 }); }
    if (v === 6 && synOn(c, 'fate')) {
      const bf = gainBlock(c, 3);
      ev.push({ t: 'pblock', amount: bf });
    }
    if (v === 6 && has(c, 'sixGuard')) {
      const b6 = gainBlock(c, 4);
      ev.push({ t: 'pblock', amount: b6 });
    }
    if (fx.type === 'block' && has(c, 'engine') && !c.engineUsed) {
      c.engineUsed = true;
      c.sparks += 1;
      ev.push({ t: 'spark', amount: 1 });
      ev.push({ t: 'msg', text: '톱니 심장 — 기세 +1' });
    }
    if (v % 2 === 0 && has(c, 'luckyCoin') && c.luckyCoinUsed < 2) { c.luckyCoinUsed++; c.sparks += 1; ev.push({ t: 'spark', amount: 1 }); }
    return mainDone;
  }

  /* ---------- state snapshots (undo) ---------- */
  const SNAP_KEYS = ['enemies', 'hand', 'slots', 'combo', 'multBonus', 'sparks', 'block', 'hp',
    'statuses', 'phase', 'totalDamage', 'rerollsThisTurn', 'luckyCoinUsed', 'turn', 'chainLog', 'flask', 'verdict', 'engineUsed', 'sameVal'];

  /* ---------- public API ---------- */
  const Combat = {
    snapshot: function (c) {
      const o = {};
      SNAP_KEYS.forEach(function (k) { o[k] = c[k]; });
      return JSON.stringify(o);
    },

    restore: function (c, snap) {
      const o = JSON.parse(snap);
      SNAP_KEYS.forEach(function (k) { if (k in o) c[k] = o[k]; });
      return c;
    },

    create: function (run, spawns, kind) {
      const c = {
        kind: kind || 'combat',
        act: run.act,
        relics: (run.relics || []).slice(),
        cls: run.cls,
        cmod: run.cmod || null,
        abyss: run.abyss || null,
        hp: run.hp,
        maxHp: run.maxHp,
        block: 0,
        statuses: { str: 0, weak: 0, vuln: 0 },
        combo: 0,
        multBonus: 0,
        sparks: 0,
        maxSparks: 0,
        hand: [],
        slots: [],
        turn: 0,
        phase: 'player',
        target: 0,
        enemies: [],
        log: [],
        rerollsThisTurn: 0,
        luckyCoinUsed: 0,
        totalDamage: 0,
        maxCombo: 0,
        chainLog: [],
        skillLv: (run.skills || []).slice(),
        customSkills: run.customSkills ? JSON.parse(JSON.stringify(run.customSkills)) : {},
        flask: { fire: 0, poison: 0, bolt: 0 },
        verdict: 0,
        sameVal: 1,
        seedNote: null,
      };
      const cls = DC.CLASSES[run.cls];
      c.maxSparks = cls.sparks + (has(c, 'gamblersHand') ? 1 : 0);
      if (has(c, 'warDrum')) c.maxSparks += 2;
      if (has(c, 'pact')) c.maxSparks += 2;
      if (has(c, 'rupture')) c.maxSparks = Math.max(0, c.maxSparks - 1);
      if (has(c, 'doubleRoll') || has(c, 'timeLoop')) c.freeRerolls = has(c, 'timeLoop') ? 2 : 1;
      if (abyss(c) && abyss(c).freeReroll) c.freeRerolls = Math.max(c.freeRerolls || 0, abyss(c).freeReroll);
      if (run.extraSpark) c.maxSparks += run.extraSpark;
      const scale = spawns.length > 1 ? 0.78 : 1;
      const mod = DC.ascMod(run.asc || 0);
      c.asc = run.asc || 0;
      c.enemies = spawns.map(function (s) {
        const e = mkEnemy(s, scale, c.act);
        const cm = run.cmod || {};
        const ab = (run.abyss && run.abyss.mod) || {};
        const mult = (1 + (mod.hp || 0) + ((s.gimmick && mod.bossHp) ? mod.bossHp : 0)) * (1 + (cm.ehp || 0)) * (1 + (ab.hp || 0));
        if (mult !== 1) { e.maxHp = Math.max(1, Math.round(e.maxHp * mult)); e.hp = e.maxHp; }
        e.ascAtk = (1 + (mod.atk || 0)) * (1 + ((run.cmod || {}).eatk || 0)) * (1 + (ab.atk || 0));
        return e;
      });
      c.slots = cls.skills.map(function (s) { return { id: s.id, handIdx: null }; });
      c._bag = (run.dice || []).slice();
      Combat.newTurn(c, true);
      return c;
    },

    newTurn: function (c, first) {
      c.turn += 1;
      if (c.cls === 'paladin' && (c.verdict || 0) > 0) c.verdict = Math.max(0, c.verdict - 2);
      c.block = first ? c.block : 0;
      c.combo = 0;
      c.multBonus = 0;
      c.prevV = null;
      c.sameVal = 1;
      c.rerollsThisTurn = 0;
      c.luckyCoinUsed = 0;
      c.engineUsed = false;
      c.sparks = c.maxSparks + ((abyss(c) && abyss(c).spark) || 0);
      if (synOn(c, 'gambit')) c.sparks += 1;
      c.slots.forEach(function (s) { s.handIdx = null; s.resolved = false; });
      c.chainLog = [];

      const bag = c._bag || [];
      const hand = [];
      bag.forEach(function (die, i) {
        const r = DC.Dice.rollDie(die, DC.rng);
        hand.push({ uid: DC.uid('h'), dieIdx: i, fi: r.fi, k: r.k, v: r.v, baseV: r.v, used: false, locked: false, phantom: false });
      });
      if (has(c, 'rune') && bag.length) {
        const r = DC.Dice.rollDie(bag[Math.floor(DC.rng() * bag.length)], DC.rng);
        hand.push({ uid: DC.uid('h'), dieIdx: -1, fi: r.fi, k: r.k, v: r.v, baseV: r.v, used: false, locked: false, phantom: true });
      }
      if (has(c, 'eyeOfFate') && bag.length) {
        const r = DC.Dice.rollDie(bag[Math.floor(DC.rng() * bag.length)], DC.rng);
        hand.push({ uid: DC.uid('h'), dieIdx: -1, fi: r.fi, k: r.k, v: r.v, baseV: r.v, used: false, locked: false, phantom: true, shadowEye: true });
      }
      // mage passive / hourglass
      if (c.cls === 'mage') c.sparks += 1;
      if (has(c, 'hourglass') && hand.length) {
        const h = hand[Math.floor(DC.rng() * hand.length)];
        if (h.v < 6) { h.v += 1; h.bonusV = true; }
      }
      let sealCount = c.pendingSeal || 0;
      c.pendingSeal = 0;
      const sealer = c.enemies.filter(function (e) { return e.hp > 0 && e.gimmick && e.gimmick.kind === 'seal'; })[0];
      if (sealer && c.turn % (sealer.gimmick.every || 2) === 0) sealCount += (sealer.gimmick.n || 1);
      if (sealCount && hand.length) {
        const pool = hand.slice();
        for (let i = 0; i < sealCount && pool.length; i++) {
          const pick = pool.splice(Math.floor(DC.rng() * pool.length), 1)[0];
          pick.locked = true;
        }
      }
      c.hand = hand;
      c.block = 0;
      if (synOn(c, 'ironWall')) c.block += 3;
      if (c.statuses.weak > 0) c.statuses.weak -= 1;
      if (c.statuses.vuln > 0) c.statuses.vuln -= 1;
    },

    /* can this die go in this slot? */
    canPlay: function (c, handIdx, slotIdx) {
      if (c.phase !== 'player') return { ok: false, why: '전투 종료' };
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      if (!h) return { ok: false, why: '주사위 없음' };
      if (!s) return { ok: false, why: '슬롯 없음' };
      if (h.used) return { ok: false, why: '이미 사용한 주사위' };
      if (h.locked) return { ok: false, why: '봉인된 주사위' };
      if (s.handIdx !== null) return { ok: false, why: '슬롯이 가득 참' };
      const sk = skillOf(c, slotIdx);
      if (!DC.REQ[sk.req].test(h.v)) return { ok: false, why: DC.REQ[sk.req].n + ' 필요' };
      return { ok: true };
    },

    play: function (c, handIdx, slotIdx) {
      const chk = Combat.canPlay(c, handIdx, slotIdx);
      if (!chk.ok) return { ok: false, why: chk.why, events: [] };
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      const skill = skillOf(c, slotIdx);
      const ev = [];
      c.combo += 1;
      c.maxCombo = Math.max(c.maxCombo || 0, c.combo);
      h.used = true;
      s.handIdx = handIdx;
      s.resolved = true;
      c.chainLog = (c.chainLog || []).concat([{ k: h.k, v: h.v, skill: skill.name }]);
      c.skillUse = c.skillUse || {};
      c.skillUse[skill.name] = (c.skillUse[skill.name] || 0) + 1;
      s.anim = Date.now();
      ev.push({ t: 'combo', n: c.combo, mult: mult(c), face: h.k, value: h.v, skill: skill.name });
      const before = alive(c).reduce(function (a, e) { return a + e.hp; }, 0);
      const pair = (c.prevV != null && c.prevV === h.v);
      c.sameVal = pair ? (c.sameVal || 1) + 1 : 1;
      resolve(c, h, skill, ev);
      c.prevV = h.v;
      if (pair) ev.push({ t: 'msg', text: '페어! 피해 +25%' });
      if (c.sameVal === 3) { c.sparks += 1; ev.push({ t: 'spark', amount: 1 }); ev.push({ t: 'triple', n: 3 }); }
      else if (c.sameVal >= 4) { ev.push({ t: 'triple', n: c.sameVal }); }
      const after = alive(c).reduce(function (a, e) { return a + e.hp; }, 0);
      c.totalDamage += Math.max(0, before - after);
      (function () {
        const dmg = ev.filter(function (e) { return e.t === 'edmg'; }).reduce(function (a, e) { return a + e.amount; }, 0);
        const blk = ev.filter(function (e) { return e.t === 'pblock'; }).reduce(function (a, e) { return a + e.amount; }, 0);
        const heal = ev.filter(function (e) { return e.t === 'heal'; }).reduce(function (a, e) { return a + e.amount; }, 0);
        const msgs = ev.filter(function (e) { return e.t === 'msg'; }).map(function (e) { return e.text; });
        const parts = [];
        if (dmg) parts.push(dmg + ' 피해');
        if (blk) parts.push('방어 ' + blk);
        if (heal) parts.push('회복 ' + heal);
        pushLog(c, { turn: c.turn, side: 'p', skill: skill.name, k: h.k, v: h.v, txt: parts.join(' · ') || msgs[0] || '' });
      })();
      if (!alive(c).length) { c.phase = 'won'; ev.push({ t: 'won' }); }
      return { ok: true, events: ev, skill: skill };
    },

    manip: function (c, op, handIdx) {
      if (c.phase !== 'player') return { ok: false, why: '전투 종료', events: [] };
      const h = c.hand[handIdx];
      if (!h) return { ok: false, why: '주사위 없음', events: [] };
      if (h.used) return { ok: false, why: '이미 사용한 주사위', events: [] };
      if (h.locked) return { ok: false, why: '봉인된 주사위', events: [] };
      const ev = [];
      if (op === 'reroll') {
        const free = c.freeRerolls != null ? c.rerollsThisTurn < c.freeRerolls : (has(c, 'doubleRoll') && c.rerollsThisTurn === 0);
        if (!free && c.sparks < 1) return { ok: false, why: '기세 부족', events: [] };
        if (!free) c.sparks -= 1;
        c.rerollsThisTurn += 1;
        const die = c._bag[h.dieIdx];
        if (die) {
          const r = DC.Dice.rollDie(die, DC.rng);
          h.fi = r.fi;
          const keepBonus = h.v - h.baseV;
          h.k = r.k; h.v = DC.clamp(r.v + keepBonus, 1, 6); h.baseV = r.v;
        } else if (h.phantom) {
          h.k = ['slash', 'guard', 'fire', 'bolt', 'venom', 'leech'][Math.floor(DC.rng() * 6)];
          h.v = 1 + Math.floor(DC.rng() * 3);
        }
        ev.push({ t: 'reroll', idx: handIdx, die: h });
        ev.push({ t: 'spark', amount: free ? 0 : -1 });
      } else if (op === 'plus' || op === 'minus') {
        if (c.sparks < 1) return { ok: false, why: '기세 부족', events: [] };
        if (op === 'plus' && h.v >= 6) return { ok: false, why: '이미 6', events: [] };
        if (op === 'minus' && h.v <= 1) return { ok: false, why: '이미 1', events: [] };
        c.sparks -= 1;
        h.v += op === 'plus' ? 1 : -1;
        ev.push({ t: 'nudge', idx: handIdx, delta: op === 'plus' ? 1 : -1 });
        ev.push({ t: 'spark', amount: -1 });
      } else if (op === 'flip') {
        if (c.sparks < 1) return { ok: false, why: '기세 부족', events: [] };
        c.sparks -= 1;
        h.v = 7 - h.v;
        ev.push({ t: 'flip', idx: handIdx });
        ev.push({ t: 'spark', amount: -1 });
      } else if (op === 'copy') {
        if (c.sparks < 2) return { ok: false, why: '기세 2 필요', events: [] };
        c.sparks -= 2;
        c.hand.push({ uid: DC.uid('h'), dieIdx: h.dieIdx, fi: h.fi, k: h.k, v: h.v, baseV: h.v, used: false, locked: false, phantom: true });
        ev.push({ t: 'copy', idx: handIdx, newIdx: c.hand.length - 1 });
        ev.push({ t: 'spark', amount: -2 });
      } else {
        return { ok: false, why: '알 수 없는 조작', events: [] };
      }
      return { ok: true, events: ev };
    },

    /* enemy phase: DoT ticks, then every living enemy acts */
    enemyPhase: function (c) {
      if (c.phase !== 'player') return { ok: false, events: [] };
      const ev = [];
      if (has(c, 'echo')) {
        const unused = c.hand.filter(function (h) { return !h.used && !h.locked; }).length;
        if (unused > 0) { c.sparks += unused; ev.push({ t: 'spark', amount: unused }); }
      }
      c.phase = 'enemy';
      ev.push({ t: 'phase', phase: 'enemy' });

      /* damage over time, then intents */
      c.enemies.forEach(function (e) {
        if (e.hp <= 0) return;
        if (e.st.poison > 0) { hitEnemy(c, e, e.st.poison, { kind: 'poison' }, ev); }
        if (e.hp > 0 && e.st.burn > 0) {
          hitEnemy(c, e, e.st.burn, { kind: 'burn' }, ev);
          e.st.burn = Math.max(0, e.st.burn - 1);
        }
      });
      if (!alive(c).length) { c.phase = 'won'; ev.push({ t: 'won' }); return { ok: true, events: ev }; }

      c.enemies.forEach(function (e) {
        if (e.hp <= 0) return;
        const it = intentOf(e);
        if (!it) return;
        const egm = e.gimmick;
        if (egm && egm.kind === 'enrage' && !e.gUsed && e.hp <= e.maxHp * (egm.at || 0.5)) {
          e.st.str += (egm.str || 3); e.gUsed = true;
          ev.push({ t: 'bossline', text: e.name + ' 격노! 힘 +' + (egm.str || 3) });
        }
        if (egm && egm.kind === 'gaze' && c.turn % (egm.every || 3) === 0) {
          c.statuses.weak += 2; c.statuses.vuln += 2;
          ev.push({ t: 'bossline', text: e.name + ' — 시선이 운명을 묶는다 (약화 2 · 취약 2)' });
        }
        if (egm && egm.kind === 'devour' && c.turn % (egm.every || 4) === 0) {
          c.pendingSeal = (c.pendingSeal || 0) + (egm.n || 2);
          ev.push({ t: 'bossline', text: e.name + ' — 주사위를 삼킨다 (봉인 ' + (egm.n || 2) + ')' });
        }
        if (egm && egm.kind === 'fortify') {
          e.block += (egm.block || 6);
          ev.push({ t: 'eblock', eid: e.id, amount: (egm.block || 6) });
        }
        if (it.k === 'attack') {
          const hits = it.hits || 1;
          let dmgV = it.v;
          if (egm && egm.kind === 'dive' && c.turn % (egm.every || 3) === 0) {
            dmgV = Math.round(dmgV * (egm.mult || 1.7));
            ev.push({ t: 'bossline', text: e.name + ' 급강하!' });
          }
          for (let i = 0; i < hits; i++) { if (c.hp > 0) hitPlayer(c, dmgV, ev, { kind: 'enemy' }); }
          if (it.apply === 'burn') c.statuses.burnOnPlayer = (c.statuses.burnOnPlayer || 0) + 2;
          if (it.apply === 'poison') c.statuses.poisonOnPlayer = (c.statuses.poisonOnPlayer || 0) + 2;
          pushLog(c, { turn: c.turn, side: 'e', name: e.name, txt: intentText(it) });
        } else if (it.k === 'defend') {
          e.block += it.v; ev.push({ t: 'eblock', eid: e.id, amount: it.v });
        } else if (it.k === 'buff') {
          e.st.str += it.v; ev.push({ t: 'estatus', eid: e.id, s: 'str', amount: it.v });
        } else if (it.k === 'debuff') {
          c.statuses[it.s] += it.v; ev.push({ t: 'pstatus', s: it.s, amount: it.v });
        } else if (it.k === 'curse') {
          c.pendingSeal = (c.pendingSeal || 0) + (it.n || 1);
          ev.push({ t: 'curse', n: it.n || 1 });
          pushLog(c, { turn: c.turn, side: 'e', name: e.name, txt: '주사위 ' + (it.n || 1) + '개 봉인' });
        } else if (it.k === 'drain') {
          hitPlayer(c, it.v, ev, { kind: 'drain' });
          e.hp = Math.min(e.maxHp, e.hp + Math.round(it.v / 2));
          ev.push({ t: 'eheal', eid: e.id, amount: Math.round(it.v / 2) });
        }
        e.st.weak = Math.max(0, e.st.weak - 1);
        e.st.vuln = Math.max(0, e.st.vuln - 1);
        e.intentIdx = (e.intentIdx + 1) % e.intents.length;
        if (c.hp <= 0) c.phase = 'lost';
      });

      if (c.phase === 'lost') { ev.push({ t: 'lost' }); return { ok: true, events: ev }; }
      if (abyss(c) && abyss(c).eblock) {
        alive(c).forEach(function (e) { e.block += abyss(c).eblock; ev.push({ t: 'eblock', eid: e.id, amount: abyss(c).eblock }); });
      }
      if (has(c, 'thornMail') && alive(c).length) {
        alive(c).forEach(function (e) { hitEnemy(c, e, 4, { kind: 'guard' }, ev); });
        ev.push({ t: 'msg', text: '가시 갑옷 — 적 전체 4 피해' });
      }
      if (!alive(c).length) { c.phase = 'won'; ev.push({ t: 'won' }); return { ok: true, events: ev }; }

      /* player poison/burn taken on their own turn start (kept simple: tick here) */
      if (c.statuses.poisonOnPlayer) { hitPlayer(c, c.statuses.poisonOnPlayer, ev, { kind: 'poison' }); c.statuses.poisonOnPlayer = Math.max(0, c.statuses.poisonOnPlayer - 1); }
      if (c.statuses.burnOnPlayer) { hitPlayer(c, c.statuses.burnOnPlayer, ev, { kind: 'burn' }); c.statuses.burnOnPlayer = Math.max(0, c.statuses.burnOnPlayer - 1); }
      if (c.phase === 'lost') { ev.push({ t: 'lost' }); return { ok: true, events: ev }; }
      c.phase = 'player';
      return { ok: true, events: ev };
    },

    startTurn: function (c) {
      const ev = [];
      if (c.cls === 'warrior' && c.block > 0) {
        const t = target(c);
        if (t) {
          hitEnemy(c, t, 2, { kind: 'slash' }, ev);
          ev.push({ t: 'msg', text: '강철 의지 — 2 피해' });
          if (!alive(c).length) { c.phase = 'won'; ev.push({ t: 'won' }); return { ok: true, events: ev }; }
        }
      }
      Combat.newTurn(c, false);
      ev.push({ t: 'newturn', turn: c.turn });
      const lockN = c.hand.filter(function (h) { return h.locked; }).length;
      if (lockN) {
        ev.push({ t: 'curse', n: lockN });
        ev.push({ t: 'msg', text: '운명이 묶였다 — 주사위 ' + lockN + '개 봉인' });
      }
      return { ok: true, events: ev };
    },

    /* kept for headless bots: full turn in one call */
    endTurn: function (c) {
      const a = Combat.enemyPhase(c);
      if (!a.ok || c.phase === 'won' || c.phase === 'lost') return a;
      const b = Combat.startTurn(c);
      a.events = a.events.concat(b.events);
      return a;
    },

    attachBag: function (c, bag) { c._bag = bag; },

    /* rich preview for the slot card while a die is selected */
    previewInfo: function (c, handIdx, slotIdx) {
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      if (!h || !s) return null;
      const skill = skillOf(c, slotIdx);
      const fx = skill.fx;
      const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
      const capV = has(c, 'rupture') ? 5.0 : DC.BAL.comboCap;
      const cur = Math.min(capV + 0.5, 1 + step * Math.max(0, c.combo - 1) + c.multBonus);
      const nextMult = Math.min(capV + 0.5, 1 + step * c.combo + c.multBonus);
      const weakP = c.statuses.weak > 0 ? DC.BAL.weakMult : 1;
      function dmg(ratio, extra) {
        let d = (h.v * ratio + (extra || 0) + (c.statuses.str || 0)) * nextMult * weakP;
        if (has(c, 'scale') && h.v % 2 === 1) d *= 1.4;
        if (has(c, 'pledge') && h.v % 2 === 0) d *= 1.4;
        if (has(c, 'flameHeart') && (h.k === 'fire' || fx.burn)) d *= 1.6;
        return Math.max(1, Math.round(d));
      }
      const tg = target(c);
      const tghp = tg ? tg.hp + tg.block : 0;
      const nAlive = alive(c).length;
      const out = { mult: nextMult, curMult: cur, gain: nextMult - cur, dmg: 0, hits: 1, lethal: false, text: '' };
      if (fx.type === 'attack') {
        const bonus = (skill.id === 'dagger' ? Math.max(0, c.combo - 1) * (fx.comboBonus || 0) : 0) +
          (fx.verdict ? (c.verdict || 0) * fx.verdict : 0) + (fx.reflect ? Math.floor(c.block / 2) : 0);
        out.dmg = dmg(fx.ratio, bonus);
        if (has(c, 'karma') && c.combo >= 4) out.hits = 2;
        out.lethal = out.dmg * out.hits >= tghp && tghp > 0;
        out.text = '≈' + out.dmg + (out.hits > 1 ? '×' + out.hits : '') + ' 피해';
      } else if (fx.type === 'aoe') {
        out.dmg = dmg(fx.ratio, fx.verdictSpend ? Math.min(c.verdict || 0, 6) * fx.verdictSpend : 0);
        out.lethal = alive(c).every(function (e) { return e.hp + e.block <= out.dmg; });
        out.text = '≈' + out.dmg + ' ×' + nAlive + ' 피해';
      } else if (fx.type === 'chain') {
        out.dmg = dmg(fx.ratio);
        out.text = '≈' + out.dmg + ' + 연쇄';
        out.lethal = out.dmg >= tghp;
      } else if (fx.type === 'multi') {
        out.hits = Math.max(1, c.combo + 1);
        out.dmg = dmg(fx.ratio) * out.hits;
        out.lethal = out.dmg >= tghp;
        out.text = '≈' + dmg(fx.ratio) + ' ×' + out.hits;
      } else if (fx.type === 'block') {
        out.dmg = Math.round(h.v * fx.ratio * (has(c, 'wrist') ? 1.25 : 1) * (has(c, 'warDrum') ? 0.75 : 1));
        out.text = '+' + out.dmg + ' 방어' + (fx.verdictGain ? ' · 심판 +' + fx.verdictGain : '');
      } else if (fx.type === 'verdict') {
        out.dmg = Math.round((fx.block || 0) * (has(c, 'wrist') ? 1.25 : 1) * (has(c, 'warDrum') ? 0.75 : 1));
        out.text = '심판 +' + (fx.gain || 1) + ' · +' + out.dmg + ' 방어';
      } else if (fx.type === 'mult') {
        out.text = '배율 +' + fx.add.toFixed(1) + (fx.dmgRatio ? ' · ' + dmg(fx.dmgRatio) + ' 피해' : '');
      } else if (fx.type === 'spark') {
        out.text = '기세 +' + fx.amount;
      } else if (fx.type === 'buff') {
        out.text = '힘 +' + fx.str + ' · 방어 ' + Math.round((fx.block || 0) * (has(c, 'wrist') ? 1.25 : 1));
      } else if (fx.type === 'mix') {
        const n = DC.flaskTotal(c.flask);
        out.dmg = n ? dmg((fx.ratio || 1.0) * n) : 0;
        out.text = n ? '정수 ' + n + ' · ≈' + out.dmg + ' 피해' : '플라스크 비어 있음';
      }
      return out;
    },

    preview: function (c, handIdx, slotIdx) {
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      if (!h || !s) return '';
      const skill = skillOf(c, slotIdx);
      const m = mult(c) + 0; // combo hasn't incremented yet -> preview next
      const nextMult = (function () {
        const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
        const capV = has(c, 'rupture') ? 5.0 : DC.BAL.comboCap;
        return Math.min(capV + 0.5, 1 + step * c.combo + c.multBonus);
      })();
      const fx = skill.fx;
      function dmg(ratio) {
        let d = (h.v * ratio + (c.statuses.str || 0)) * nextMult;
        if (has(c, 'scale') && h.v % 2 === 1) d *= 1.4;
        if (has(c, 'pledge') && h.v % 2 === 0) d *= 1.4;
        return Math.max(1, Math.round(d));
      }
      const vbon = fx.verdict ? (c.verdict || 0) * fx.verdict : 0;
      const reflect = fx.reflect ? Math.floor(c.block / 2) : 0;
      if (fx.type === 'attack') return '≈' + (dmg(fx.ratio) + Math.round(vbon) + reflect) + ' 피해';
      if (fx.type === 'aoe') {
        const spend = fx.verdictSpend ? Math.min(c.verdict || 0, 6) * fx.verdictSpend : 0;
        return '≈' + (dmg(fx.ratio) + spend) + ' 전체';
      }
      if (fx.type === 'verdict') return '심판 +' + (fx.gain || 1) + ' · +' + Math.round((fx.block || 0) * (has(c, 'wrist') ? 1.25 : 1) * (has(c, 'warDrum') ? 0.75 : 1)) + ' 방어';
      if (fx.type === 'chain') return '≈' + dmg(fx.ratio) + ' + 연쇄';
      if (fx.type === 'multi') return '≈' + dmg(fx.ratio) + ' ×' + Math.max(1, c.combo + 1);
      if (fx.type === 'block') return '+' + Math.round(h.v * fx.ratio * (has(c, 'wrist') ? 1.25 : 1) * (has(c, 'warDrum') ? 0.75 : 1)) + ' 방어';
      if (fx.type === 'mult') return '배율 +' + fx.add.toFixed(1);
      if (fx.type === 'spark') return '기세 +' + fx.amount;
      if (fx.type === 'buff') return '힘 +' + fx.str;
      if (fx.type === 'mix') {
        const n = DC.flaskTotal(c.flask);
        return n ? '정수 ' + n + ' → ≈' + dmg((fx.ratio || 1.0) * n) + ' 피해' : '플라스크 비어 있음';
      }
      return '';
    },

    intentOf: intentOf,
    skill: skillOf,
    intentText: intentText,
    intentIcon: intentIcon,
    mult: mult,
    alive: alive,
    target: target,
    faceColor: faceColor,
    nextMult: function (c) {
      const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
      const capV = has(c, 'rupture') ? 5.0 : DC.BAL.comboCap;
      return Math.min(capV + 0.5, 1 + step * c.combo + c.multBonus);
    },
  };

  DC.Combat = Combat;
})();
