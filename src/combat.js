/* =========================================================
   Combat engine — the heart of Dice Chain.
   Turn: roll bag -> assign dice to skill slots (req checks) ->
   manipulate with sparks -> chain combos -> end turn -> enemy intents.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  function has(c, id) { return c.relics && c.relics.indexOf(id) >= 0; }

  function alive(c) { return c.enemies.filter(function (e) { return e.hp > 0; }); }

  function mult(c) {
    const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
    const base = 1 + step * Math.max(0, c.combo - 1);
    return Math.min(DC.BAL.comboCap + 0.5, base + c.multBonus);
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
    const hp = Math.max(1, Math.round(spawn.hp * (scale || 1) * (1 + 0.26 * ((act || 1) - 1))));
    return {
      id: DC.uid('e'), key: spawn.id, name: spawn.name, art: spawn.art, c: spawn.c,
      hp: hp, maxHp: hp, block: 0,
      st: { burn: 0, poison: 0, weak: 0, vuln: 0, str: 0 },
      intents: spawn.intents,
      actMul: 1 + 0.15 * ((act || 1) - 1),
      intentIdx: Math.floor(Math.random() * spawn.intents.length),
      dead: false,
    };
  }

  function intentOf(e) {
    if (!e || e.hp <= 0) return null;
    const it = e.intents[e.intentIdx % e.intents.length];
    const out = Object.assign({}, it);
    if (out.k === 'attack') {
      let v = out.v + (e.st.str || 0);
      if (e.actMul) v = Math.round(v * e.actMul);
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
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      ev.push({ t: 'kill', eid: e.id });
      if (has(c, 'grail')) { c.hp = Math.min(c.maxHp, c.hp + 6); ev.push({ t: 'heal', amount: 6 }); }
    }
    return dmg;
  }

  function hitPlayer(c, amount, ev, opts) {
    let dmg = Math.round(amount);
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
    let v = Math.round(amount * (has(c, 'wrist') ? 1.25 : 1));
    c.block += v;
    return v;
  }

  function healPlayer(c, amount, ev) {
    const before = c.hp;
    c.hp = Math.min(c.maxHp, c.hp + Math.round(amount));
    const d = c.hp - before;
    if (d > 0) ev.push({ t: 'heal', amount: d });
    return d;
  }

  function faceColor(k) { return (DC.KINDS[k] || DC.KINDS.blank).c; }

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
      if (has(c, 'scale') && v % 2 === 1) d *= 1.4;
      if (has(c, 'pledge') && v % 2 === 0) d *= 1.4;
      if (c.cls === 'gambler' && c.combo >= 3 && !(opts && opts.noDouble)) d += 2;
      if (has(c, 'flameHeart') && (k === 'fire' || (opts && opts.fire))) d *= 1.6;
      let dmg = Math.max(1, Math.round(d));
      const hits = (has(c, 'karma') && c.combo >= 4 && !(opts && opts.noDouble)) ? 2 : 1;
      for (let i = 0; i < hits; i++) {
        if (targetEnemy && targetEnemy.hp > 0) hitEnemy(c, targetEnemy, dmg, { kind: k }, ev);
      }
      return dmg * hits;
    }

    switch (fx.type) {
      case 'attack': {
        if (who) atk(who, fx.ratio, (skill.id === 'dagger' ? (c.combo - 1) * (fx.comboBonus || 0) : 0), { fire: !!fx.burn });
        if (fx.burn && who) { who.st.burn += Math.max(1, Math.floor(v / 2) + (has(c, 'flameHeart') ? 1 : 0)); ev.push({ t: 'status', eid: who.id, s: 'burn', amount: Math.max(1, Math.floor(v / 2)) }); }
        if (fx.status && who) {
          Object.keys(fx.status).forEach(function (s) { who.st[s] += fx.status[s]; ev.push({ t: 'status', eid: who.id, s: s, amount: fx.status[s] }); });
        }
        if (fx.selfDmg) hitPlayer(c, fx.selfDmg, ev, { kind: 'self' });
        mainDone = true;
        break;
      }
      case 'aoe': {
        alive(c).forEach(function (e) { atk(e, fx.ratio, 0, { fire: !!fx.burn, noDouble: false }); });
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
      case 'spark': {
        c.sparks += fx.amount || 0;
        ev.push({ t: 'spark', amount: fx.amount || 0 });
        const b = gainBlock(c, fx.block || 0);
        if (b) ev.push({ t: 'pblock', amount: b });
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

    /* face riders (dice identity!) */
    if (k === 'fire' && fx.type !== 'attack' && fx.type !== 'aoe') {
      if (who) { who.st.burn += Math.max(1, Math.floor(v / 2)); ev.push({ t: 'status', eid: who.id, s: 'burn', amount: Math.max(1, Math.floor(v / 2)) }); }
    } else if (k === 'bolt') {
      const extra = pickTargets(c, 3).filter(function (e) { return !who || e !== who; })[0];
      if (extra) { hitEnemy(c, extra, Math.max(1, Math.round((v / 2) * m)), { kind: 'bolt' }, ev); ev.push({ t: 'chain' }); }
    } else if (k === 'venom') {
      if (who) { who.st.poison += Math.max(1, Math.floor(v / 2)); ev.push({ t: 'status', eid: who.id, s: 'poison', amount: Math.max(1, Math.floor(v / 2)) }); }
    } else if (k === 'leech') {
      healPlayer(c, Math.ceil(v / 2), ev);
    } else if (k === 'guard' && fx.type !== 'block') {
      const b = gainBlock(c, Math.ceil(v / 2));
      ev.push({ t: 'pblock', amount: b });
    } else if (k === 'mult') {
      if (fx.type !== 'mult') { c.multBonus += 0.5; ev.push({ t: 'msg', text: '증폭 +0.5' }); }
    } else if (k === 'curse') {
      const self = Math.ceil(v / 2);
      const real = hitPlayer(c, self, ev, { kind: 'curse' });
      ev.push({ t: 'msg', text: '저주! ' + real + ' 피해' });
    } else if (k === 'blank') {
      ev.push({ t: 'msg', text: '공허 — 효과 없음' });
    }

    if (c.cls === 'mage' && (k === 'fire' || k === 'bolt')) healPlayer(c, 2, ev);

    /* relic: spark on 6 / even */
    if (v === 6 && has(c, 'sixBless')) { c.sparks += 1; ev.push({ t: 'spark', amount: 1 }); }
    if (v % 2 === 0 && has(c, 'luckyCoin') && c.luckyCoinUsed < 2) { c.luckyCoinUsed++; c.sparks += 1; ev.push({ t: 'spark', amount: 1 }); }
    return mainDone;
  }

  /* ---------- public API ---------- */
  const Combat = {
    create: function (run, spawns, kind) {
      const c = {
        kind: kind || 'combat',
        act: run.act,
        relics: (run.relics || []).slice(),
        cls: run.cls,
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
        seedNote: null,
      };
      const cls = DC.CLASSES[run.cls];
      c.maxSparks = cls.sparks + (has(c, 'gamblersHand') ? 1 : 0);
      if (run.extraSpark) c.maxSparks += run.extraSpark;
      const scale = spawns.length > 1 ? 0.78 : 1;
      c.enemies = spawns.map(function (s) { return mkEnemy(s, scale, c.act); });
      c.slots = cls.skills.map(function (s) { return { id: s.id, handIdx: null }; });
      c._bag = (run.dice || []).slice();
      Combat.newTurn(c, true);
      return c;
    },

    newTurn: function (c, first) {
      c.turn += 1;
      c.block = first ? c.block : 0;
      c.combo = 0;
      c.multBonus = 0;
      c.rerollsThisTurn = 0;
      c.luckyCoinUsed = 0;
      c.sparks = c.maxSparks;
      c.slots.forEach(function (s) { s.handIdx = null; s.resolved = false; });

      const bag = c._bag || [];
      const hand = [];
      bag.forEach(function (die, i) {
        const r = DC.Dice.rollDie(die, Math.random);
        hand.push({ uid: DC.uid('h'), dieIdx: i, fi: r.fi, k: r.k, v: r.v, baseV: r.v, used: false, locked: false, phantom: false });
      });
      if (has(c, 'rune') && bag.length) {
        const r = DC.Dice.rollDie(bag[Math.floor(Math.random() * bag.length)], Math.random);
        hand.push({ uid: DC.uid('h'), dieIdx: -1, fi: r.fi, k: r.k, v: r.v, baseV: r.v, used: false, locked: false, phantom: true });
      }
      // mage passive / hourglass
      if (c.cls === 'mage') c.sparks += 1;
      if (has(c, 'hourglass') && hand.length) {
        const h = hand[Math.floor(Math.random() * hand.length)];
        if (h.v < 6) { h.v += 1; h.bonusV = true; }
      }
      c.hand = hand;
      c.block = 0;
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
      const sk = DC.CLASSES[c.cls].skills[slotIdx];
      if (!DC.REQ[sk.req].test(h.v)) return { ok: false, why: DC.REQ[sk.req].n + ' 필요' };
      return { ok: true };
    },

    play: function (c, handIdx, slotIdx) {
      const chk = Combat.canPlay(c, handIdx, slotIdx);
      if (!chk.ok) return { ok: false, why: chk.why, events: [] };
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      const skill = DC.CLASSES[c.cls].skills[slotIdx];
      const ev = [];
      c.combo += 1;
      h.used = true;
      s.handIdx = handIdx;
      s.resolved = true;
      ev.push({ t: 'combo', n: c.combo, mult: mult(c), face: h.k, value: h.v });
      const before = alive(c).reduce(function (a, e) { return a + e.hp; }, 0);
      resolve(c, h, skill, ev);
      const after = alive(c).reduce(function (a, e) { return a + e.hp; }, 0);
      c.totalDamage += Math.max(0, before - after);
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
        const free = has(c, 'doubleRoll') && c.rerollsThisTurn === 0;
        if (!free && c.sparks < 1) return { ok: false, why: '기세 부족', events: [] };
        if (!free) c.sparks -= 1;
        c.rerollsThisTurn += 1;
        const die = c._bag[h.dieIdx];
        if (die) {
          const r = DC.Dice.rollDie(die, Math.random);
          h.fi = r.fi;
          const keepBonus = h.v - h.baseV;
          h.k = r.k; h.v = DC.clamp(r.v + keepBonus, 1, 6); h.baseV = r.v;
        } else if (h.phantom) {
          h.k = ['slash', 'guard', 'fire', 'bolt', 'venom', 'leech'][Math.floor(Math.random() * 6)];
          h.v = 1 + Math.floor(Math.random() * 3);
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
        if (it.k === 'attack') {
          const hits = it.hits || 1;
          for (let i = 0; i < hits; i++) { if (c.hp > 0) hitPlayer(c, it.v, ev, { kind: 'enemy' }); }
          if (it.apply === 'burn') c.statuses.burnOnPlayer = (c.statuses.burnOnPlayer || 0) + 2;
          if (it.apply === 'poison') c.statuses.poisonOnPlayer = (c.statuses.poisonOnPlayer || 0) + 2;
        } else if (it.k === 'defend') {
          e.block += it.v; ev.push({ t: 'eblock', eid: e.id, amount: it.v });
        } else if (it.k === 'buff') {
          e.st.str += it.v; ev.push({ t: 'estatus', eid: e.id, s: 'str', amount: it.v });
        } else if (it.k === 'debuff') {
          c.statuses[it.s] += it.v; ev.push({ t: 'pstatus', s: it.s, amount: it.v });
        } else if (it.k === 'curse') {
          const pool = c.hand.filter(function (h) { return !h.used && !h.locked; });
          let n = 0;
          for (let i = 0; i < it.n && pool.length; i++) {
            const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            pick.locked = true; n++;
          }
          ev.push({ t: 'curse', n: n });
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
          hitEnemy(c, t, 3, { kind: 'slash' }, ev);
          ev.push({ t: 'msg', text: '강철 의지 — 3 피해' });
          if (!alive(c).length) { c.phase = 'won'; ev.push({ t: 'won' }); return { ok: true, events: ev }; }
        }
      }
      Combat.newTurn(c, false);
      ev.push({ t: 'newturn', turn: c.turn });
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

    preview: function (c, handIdx, slotIdx) {
      const h = c.hand[handIdx], s = c.slots[slotIdx];
      if (!h || !s) return '';
      const skill = DC.CLASSES[c.cls].skills[slotIdx];
      const m = mult(c) + 0; // combo hasn't incremented yet -> preview next
      const nextMult = (function () {
        const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
        return Math.min(DC.BAL.comboCap + 0.5, 1 + step * c.combo + c.multBonus);
      })();
      const fx = skill.fx;
      function dmg(ratio) {
        let d = (h.v * ratio + (c.statuses.str || 0)) * nextMult;
        if (has(c, 'scale') && h.v % 2 === 1) d *= 1.4;
        if (has(c, 'pledge') && h.v % 2 === 0) d *= 1.4;
        return Math.max(1, Math.round(d));
      }
      if (fx.type === 'attack') return '≈' + dmg(fx.ratio) + ' 피해';
      if (fx.type === 'aoe') return '≈' + dmg(fx.ratio) + ' 전체';
      if (fx.type === 'chain') return '≈' + dmg(fx.ratio) + ' + 연쇄';
      if (fx.type === 'multi') return '≈' + dmg(fx.ratio) + ' ×' + Math.max(1, c.combo + 1);
      if (fx.type === 'block') return '+' + Math.round(h.v * fx.ratio * (has(c, 'wrist') ? 1.25 : 1)) + ' 방어';
      if (fx.type === 'mult') return '배율 +' + fx.add.toFixed(1);
      if (fx.type === 'spark') return '기세 +' + fx.amount;
      if (fx.type === 'buff') return '힘 +' + fx.str;
      return '';
    },

    intentOf: intentOf,
    intentText: intentText,
    intentIcon: intentIcon,
    mult: mult,
    alive: alive,
    target: target,
    faceColor: faceColor,
    nextMult: function (c) {
      const step = DC.BAL.comboStep + (has(c, 'mask') ? 0.1 : 0);
      return Math.min(DC.BAL.comboCap + 0.5, 1 + step * c.combo + c.multBonus);
    },
  };

  DC.Combat = Combat;
})();
