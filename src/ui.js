/* =========================================================
   UI: all screens, rendering, tap handling, event animation.
   State lives in DC.Game.state; UI is a pure-ish renderer.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;
  const icon = DC.icon;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function pct(a, b) { return Math.max(0, Math.min(100, (a / Math.max(1, b)) * 100)); }

  function pips(v) {
    const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const on = map[v] || [];
    let out = '<span class="die-pips">';
    for (let i = 0; i < 9; i++) out += '<i' + (on.indexOf(i) >= 0 ? '' : ' class="off"') + '></i>';
    return out + '</span>';
  }

  /* 주사위 재질 등급 — 런의 주사위를 찾아 1 뼈 / 2 흑요석 / 3 황동 */
  function dieTier(h) {
    const run = DC.Game && DC.Game.state && DC.Game.state.run;
    const d = run && run.dice && run.dice[h.dieIdx];
    return (d && d.tier) || (h.phantom ? 2 : 1);
  }

  function dieChip(h, i, opts) {
    opts = opts || {};
    const k = DC.KINDS[h.k] || DC.KINDS.blank;
    const tier = dieTier(h);
    const cls = ['die', 'tier-' + tier, DC.materialClass ? DC.materialClass(tier) : '', h.used ? 'used' : '', h.locked ? 'locked' : '', opts.sel ? 'sel' : '', opts.can ? 'can' : '', opts.dim ? 'dim' : '', h.phantom ? 'phantom' : ''].join(' ');
    return '' +
      '<div class="' + cls + '" data-act="hand" data-idx="' + i + '" style="--c:' + k.c + ';--i:' + i + ';--tex:url(&quot;' + DC.materialUrl(tier) + '&quot;)" role="button" tabindex="0" aria-label="주사위 ' + h.v + ' ' + k.n + '">' +
        '<span class="die-face">' + pips(h.v) + '</span>' +
        '<span class="die-ic">' + icon(k.ic) + '</span>' +
        '<span class="die-val">' + h.v + '</span>' +
        '<span class="die-kind">' + k.n + '</span>' +
        '<span class="die-mat" aria-hidden="true"></span>' +
        (h.locked ? '<span class="die-lock">' + icon('lock') + '</span>' : '') +
        (h.used ? '<span class="die-used">' + icon('check') + '</span>' : '') +
        (h.shadowEye ? '<span class="die-eye" data-tip="운명의 눈 — 매 턴 추가로 굴린 그림자 주사위" data-tip-title="그림자 주사위">' + icon('eye') + '</span>' : '') +
      '</div>';
  }

  function faceMini(f) {
    const k = DC.KINDS[f.k] || DC.KINDS.blank;
    return '<span class="face-mini" style="--c:' + k.c + '">' + icon(k.ic) + '<b>' + f.v + '</b></span>';
  }

  function relicIcon(id, cls) {
    const R = DC.RELICS[id];
    if (!R) return '';
    if (DC.RELIC_ART && DC.RELIC_ART[id]) return DC.relicArt(id, cls || 'relic-art');
    return icon(R.ic);
  }

  function statusChips(st, opts) {
    let out = '';
    ['burn', 'poison', 'weak', 'vuln', 'str'].forEach(function (s) {
      let v = st[s];
      if (s === 'burn') v = Math.max(v || 0, st.burnOnPlayer || 0);
      if (s === 'poison') v = Math.max(v || 0, st.poisonOnPlayer || 0);
      if (v > 0) {
        const d = DC.STATUS[s];
        out += '<span class="schip" style="--c:' + d.c + '" data-tip="' + esc(d.tip) + '" data-tip-title="' + esc(d.n) + '">' + icon(d.ic) + '<b>' + v + '</b></span>';
      }
    });
    return out;
  }

  /* =========================================================
     v7.0 combat UI — 4단 시선 흐름
     적(의도·HP) → 스킬(아이콘+배율) → 내 주사위 → 핵심 액션
     ========================================================= */

  function hpBar(cur, max, block, pred) {
    const w = pct(cur, max);
    const bw = block > 0 ? Math.min(100 - w, pct(block, max)) : 0;
    const pw = pred > 0 ? Math.min(100 - w - bw, pct(pred, max)) : 0;
    return '<div class="hpbar">' +
      '<i class="hp-fill" style="width:' + w + '%"></i>' +
      (bw ? '<i class="hp-block" style="width:' + bw + '%"></i>' : '') +
      (pw ? '<i class="hp-pred" style="width:' + pw + '%"></i>' : '') +
      '</div>';
  }

  /* total incoming damage of this enemy phase */
  function incomingTotal(c) {
    let total = 0;
    DC.Combat.alive(c).forEach(function (e) {
      const it = DC.Combat.intentOf(e);
      if (it && it.k === 'attack') total += it.v * (it.hits || 1);
    });
    return total;
  }

  function hud(state) {
    const c = state.combat;
    const r = state.run;
    const hp = Math.max(0, c ? c.hp : r.hp);
    const maxHpv = c ? c.maxHp : r.maxHp;
    const block = c ? c.block : 0;
    const pred = c && c.phase === 'player' ? Math.max(0, incomingTotal(c) - block) : 0;
    const relicHtml = r.relics.map(function (id) {
      const R = DC.RELICS[id];
      return '<span class="relic" style="--c:' + R.c + '" data-tip="' + esc(R.desc) + '" data-tip-title="' + esc(R.name) + '">' + relicIcon(id) + '</span>';
    }).join('');
    const lethal = pred >= hp && pred > 0;
    return '' +
      '<header class="hud">' +
        '<div class="hp' + (lethal ? ' lethal' : '') + '" data-tip="' + (pred > 0 ? '다음 적 턴 예상 피해 ' + pred : '피해는 방어도가 먼저 흡수합니다.') + '" data-tip-title="체력 ' + hp + '/' + maxHpv + '">' +
          '<div class="hp-top">' +
            '<span class="hp-heart">' + icon('heart') + '</span>' +
            '<span class="hp-num">' + hp + '<i>/' + maxHpv + '</i></span>' +
            (block > 0 ? '<span class="blockchip" data-tip="' + esc(DC.KEYWORDS.block.t) + '" data-tip-title="방어도">' + icon('shield') + block + '</span>' : '') +
          '</div>' +
          hpBar(hp, maxHpv, block, pred) +
        '</div>' +
        '<div class="hud-mid">' + relicHtml + '</div>' +
        '<div class="hud-right">' +
          '<span class="goldchip" title="골드">' + icon('coin') + r.gold + '</span>' +
          '<button class="iconbtn deckbtn" data-act="deck" title="덱 · 유물 보기" aria-label="덱 보기">' + icon('book') +
            (r.relics.length ? '<i class="cntbadge" data-tip="유물 ' + r.relics.length + '개 — 눌러서 확인" data-tip-title="보유 유물">' + r.relics.length + '</i>' : '') + '</button>' +
          '<button class="iconbtn" data-act="sound" title="소리" aria-label="소리">' + icon(DC.Audio.isMuted() ? 'mute' : 'sound') + '</button>' +
          '<button class="iconbtn" data-act="settings" title="설정 · 도움말" aria-label="설정">' + icon('gear') + '</button>' +
        '</div>' +
      '</header>';
  }

  function intentTip(it, e) {
    if (!it) return '의도 없음';
    switch (it.k) {
      case 'attack': return '적의 차례에 ' + (it.hits > 1 ? it.v + ' 피해를 ' + it.hits + '회' : it.v + ' 피해를') + ' 줍니다. 방어도로 막으세요.';
      case 'defend': return '적이 방어도 ' + it.v + '을 얻습니다. 내 공격을 먼저 흡수합니다.';
      case 'buff': return '적의 힘이 ' + it.v + ' 오릅니다. 이후 공격이 강해집니다.';
      case 'debuff': return '나에게 ' + (DC.STATUS[it.s] ? DC.STATUS[it.s].n : '약화') + ' ' + it.v + '을 겁니다.';
      case 'curse': return '내 주사위 ' + it.n + '개를 봉인합니다. 이번 턴 사용할 수 없습니다.';
      case 'drain': return it.v + ' 피해를 주고 그 절반을 회복합니다.';
      default: return '알 수 없는 의도';
    }
  }

  /* small status marks (icon + stacks) */
  function statusMarks(st) {
    let out = '';
    ['burn', 'poison', 'weak', 'vuln', 'str'].forEach(function (s) {
      let v = st[s];
      if (s === 'burn') v = Math.max(v || 0, st.burnOnPlayer || 0);
      if (s === 'poison') v = Math.max(v || 0, st.poisonOnPlayer || 0);
      if (v > 0) {
        const d = DC.STATUS[s];
        out += '<span class="smark" style="--c:' + d.c + '" data-tip="' + esc(d.t) + '" data-tip-title="' + esc(d.n) + '">' + icon(d.ic) + '<b>' + v + '</b></span>';
      }
    });
    return out ? '<span class="smarks">' + out + '</span>' : '';
  }

  /* 의도: 큰 수치 + 작은 라벨 */
  function intentParts(it) {
    if (!it) return { big: '', small: '' };
    switch (it.k) {
      case 'attack': return { big: String(it.v) + (it.hits > 1 ? '×' + it.hits : ''), small: '피해' };
      case 'defend': return { big: String(it.v), small: '방어' };
      case 'buff': return { big: '+' + it.v, small: '힘' };
      case 'debuff': return { big: String(it.v), small: (DC.STATUS[it.s] ? DC.STATUS[it.s].n : '약화') };
      case 'curse': return { big: String(it.n), small: '봉인' };
      case 'drain': return { big: String(it.v), small: '흡혈' };
      default: return { big: '?', small: '' };
    }
  }

  function intentBadge(c, e) {
    const it = DC.Combat.intentOf(e);
    if (!it || e.hp <= 0) return '';
    const incoming = it.k === 'attack' ? it.v * (it.hits || 1) : 0;
    const lethal = incoming > 0 && incoming >= (c.hp + c.block);
    const p = intentParts(it);
    return '<div class="intent it-' + it.k + (lethal ? ' lethal' : '') + '" data-tip="' + esc(intentTip(it, e)) + '" data-tip-title="적의 의도">' +
      icon(DC.Combat.intentIcon(it)) +
      '<b>' + esc(p.big) + '</b>' +
      '<i>' + esc(p.small) + '</i>' +
      '</div>';
  }

  /* 선택한 주사위로 지금 낼 수 있는 최대 피해 — 적 체력바에 예상 구간으로 보여준다 */
  function outgoingDamage(c, sel) {
    if (sel == null) return { any: 0, all: 0 };
    let single = 0, aoe = 0;
    c.slots.forEach(function (_, i) {
      if (!DC.Combat.canPlay(c, sel, i).ok) return;
      const sk = DC.Combat.skill(c, i);
      const info = DC.Combat.previewInfo(c, sel, i);
      if (!info || !info.dmg) return;
      const t = (sk.fx || {}).type;
      if (t === 'aoe') aoe = Math.max(aoe, info.dmg);
      else if (t === 'attack' || t === 'chain' || t === 'multi' || t === 'mix') single = Math.max(single, info.dmg);
    });
    return { any: single, all: aoe };
  }

  function enemyCard(c, e, idx, pred) {
    const dead = e.hp <= 0;
    const boss = !!e.title;
    const kill = !dead && pred > 0 && pred >= e.hp + (e.block || 0);
    return '' +
      '<div class="enemy ' + (dead ? 'dead' : '') + ' ' + (c.target === idx ? 'targeted' : '') + (boss ? ' is-boss' : '') + '" data-eid="' + e.id + '" data-act="target" data-i="' + idx + '" style="--c:' + e.c + '" role="button" tabindex="0" aria-label="' + esc(e.name) + '">' +
        intentBadge(c, e) +
        '<div class="e-art-wrap">' +
          '<img class="e-art" src="' + DC.enemyArt(e) + '" alt="" draggable="false" />' +
          '<span class="e-glow"></span>' +
          statusMarks(e.st) +
        '</div>' +
        '<div class="e-foot">' +
          '<div class="e-line">' +
            (c.enemies.length > 1 && c.target === idx ? '<span class="e-target-tag">' + icon('target') + '<span>표적</span></span>' : '') +
            '<span class="e-name">' + esc(e.name) + '</span>' +
            (e.block > 0 ? '<span class="e-block" data-tip="' + esc(DC.KEYWORDS.block.t) + '" data-tip-title="방어도">' + icon('shield') + e.block + '</span>' : '') +
            (kill ? '<span class="e-kill">' + icon('skull') + '처치</span>' : '') +
            '<span class="e-hp-num" data-tip="체력 ' + Math.max(0, e.hp) + ' / ' + e.maxHp + '" data-tip-title="' + esc(e.name) + '">' + Math.max(0, e.hp) + '<i>/' + e.maxHp + '</i></span>' +
          '</div>' +
          '<div class="e-hp">' +
            hpBar(e.hp, e.maxHp, 0, pred || 0) +
          '</div>' +
          (boss ? '<div class="e-title">' + esc(e.title) + '</div>' : '') +
        '</div>' +
        '<span class="e-reticle"></span>' +
      '</div>';
  }

  /* 슬롯 카드: 조건 배지 + 배율 + 지금 누르면 나오는 결과 */
  const REQ_SHORT = { any: '조건 없음', even: '짝수', odd: '홀수', gte4: '4 이상', lte2: '2 이하', six: '6만', prime: '소수' };

  function skillHeadline(sk) {
    const fx = sk.fx || {};
    function mul(v) { return '×' + (Math.round(v * 10) / 10).toFixed(1); }
    switch (fx.type) {
      case 'attack': return { k: 'atk', ic: 'sword', main: mul(fx.ratio), sub: fx.status && fx.status.vuln ? '취약' : (fx.burn ? '화상' : (fx.status && fx.status.poison ? '중독' : '')) };
      case 'multi': return { k: 'atk', ic: 'sword', main: mul(fx.ratio), sub: '콤보수' };
      case 'aoe': return { k: 'atk', ic: 'whirl', main: mul(fx.ratio), sub: '전체' };
      case 'chain': return { k: 'atk', ic: 'bolt', main: mul(fx.ratio), sub: '연쇄' };
      case 'block': return { k: 'def', ic: 'shield', main: mul(fx.ratio), sub: fx.heal ? '회복' : (fx.verdictGain ? '심판' : '방어') };
      case 'buff': return { k: 'buf', ic: 'up', main: '+' + fx.str + '힘', sub: fx.block ? '방어' + fx.block : '' };
      case 'mult': return { k: 'buf', ic: 'mult', main: '+' + (Math.round((fx.add || 0) * 10) / 10).toFixed(1), sub: '배율' };
      case 'spark': return { k: 'buf', ic: 'spark', main: '+' + fx.amount, sub: '기세' };
      case 'verdict': return { k: 'buf', ic: 'crown', main: '+' + (fx.gain || 1), sub: '심판' };
      case 'mix': return { k: 'atk', ic: 'flask', main: '×1.0', sub: '정수' };
      default: return { k: 'atk', ic: sk.ic || 'star', main: '·', sub: '' };
    }
  }

  /* 지금 이 슬롯에 낼 수 있는 가장 좋은 주사위 */
  function bestPlay(c, idx) {
    const s = c.slots[idx];
    if (!s || s.handIdx !== null) return null;
    let best = null;
    c.hand.forEach(function (h, i) {
      if (h.used || h.locked) return;
      if (!DC.Combat.canPlay(c, i, idx).ok) return;
      const inf = DC.Combat.previewInfo(c, i, idx);
      const score = (inf && inf.lethal ? 9999 : 0) + (inf ? (inf.dmg || 0) : 0) + h.v * 0.01;
      if (!best || score > best.score) best = { i: i, h: h, info: inf, score: score };
    });
    return best;
  }

  /* 같은 뜻, 같은 표기 — 피해 8 / 방어 +12 / 힘 +2 */
  function previewText(sk, info) {
    if (!info) return '';
    const fx = sk.fx || {};
    switch (fx.type) {
      case 'attack': return '피해 ' + info.dmg + (info.hits > 1 ? ' ×' + info.hits : '');
      case 'aoe': return '전체 피해 ' + info.dmg;
      case 'chain': return '피해 ' + info.dmg + ' 연쇄';
      case 'multi': return '피해 ' + info.dmg + '×' + info.hits;
      case 'block': return '방어 +' + info.dmg;
      case 'buff': return '힘 +' + fx.str;
      case 'mult': return '배율 +' + fx.add.toFixed(1);
      case 'spark': return '기세 +' + fx.amount;
      case 'verdict': return '심판 +' + (fx.gain || 1);
      case 'mix': return info.dmg ? '피해 ' + info.dmg : '플라스크 비어 있음';
      default: return '';
    }
  }

  function slotCard(c, idx, selHand, armIdx) {
    const sk = DC.Combat.skill(c, idx);
    const slot = c.slots[idx];
    const filled = slot.handIdx !== null ? c.hand[slot.handIdx] : null;
    const canAny = selHand != null ? DC.Combat.canPlay(c, selHand, idx).ok : null;
    const info = (selHand != null && canAny) ? DC.Combat.previewInfo(c, selHand, idx) : null;
    const armed = armIdx === idx;
    const bp = (!filled && selHand == null) ? bestPlay(c, idx) : null;
    const justPlaced = slot.anim && Date.now() - slot.anim < 520;
    const hd = skillHeadline(sk);
    const req = REQ_SHORT[sk.req] || '';
    let state;
    if (filled) state = 'filled';
    else if (canAny === true) state = 'can';
    else if (canAny === false) state = 'cannot';
    else if (armed) state = 'armed';
    else state = bp ? 'ready' : 'dry';
    let foot;
    if (info) foot = previewText(sk, info);
    else if (filled) foot = '사용 완료';
    else if (armed) foot = '주사위를 고르세요';
    else if (bp) foot = previewText(sk, bp.info);
    else foot = '주사위 없음';
    const tip = sk.desc + (sk.up ? ' (각성)' : '') + ' · 조건: ' + DC.REQ[sk.req].n +
      (filled ? ' · 이번 턴 사용 완료' : (bp ? ' · 한 번 누르면 맞는 주사위가 켜지고, 다시 누르면 주사위 ' + bp.h.v + '로 나갑니다' : ''));
    return '' +
      '<button class="slot type-' + hd.k + ' st-' + state + (justPlaced ? ' landed' : '') + (info && info.lethal ? ' lethal' : '') + '"' +
        ' data-act="slot" data-idx="' + idx + '"' +
        ' data-tip="' + esc(tip) + '" data-tip-title="' + esc(sk.name) + '">' +
        '<span class="sk-top">' +
          '<span class="sk-req req-' + sk.req + '">' + esc(req) + '</span>' +
          (sk.up ? '<span class="sk-up">각</span>' : '') +
        '</span>' +
        '<span class="sk-ic">' + icon(hd.ic) + '</span>' +
        '<span class="sk-val">' + esc(hd.main) + '</span>' +
        '<span class="sk-name">' + esc(sk.name) + '</span>' +
        '<span class="sk-foot">' + (state === 'cannot' ? icon('lock') + ' 조건 밖' : esc(foot)) + '</span>' +
        (filled
          ? '<span class="sk-die" style="--c:' + (DC.KINDS[filled.k] || DC.KINDS.blank).c + '">' + filled.v + '</span>'
          : '') +
      '</button>';
  }

  function resourceChips(c) {
    const out = [];
    out.push('<span class="rchip spark" data-tip="' + esc(DC.KEYWORDS.spark.t) + '" data-tip-title="기세">' + icon('spark') + '<b id="spark-num">' + c.sparks + '</b></span>');
    if (c.cls === 'alchemist') {
      const f = c.flask || { fire: 0, poison: 0, bolt: 0 };
      const n = (f.fire || 0) + (f.poison || 0) + (f.bolt || 0);
      const COL = { fire: '#ff9f43', poison: '#9ae66e', bolt: '#ffe066' };
      let pips = '';
      ['fire', 'poison', 'bolt'].forEach(function (e) {
        for (let i = 0; i < (f[e] || 0); i++) pips += '<i style="--c:' + COL[e] + '"></i>';
      });
      for (let i = n; i < 3; i++) pips += '<i class="empty"></i>';
      out.push('<span class="rchip flask-chip' + (n >= 3 ? ' full' : '') + '" data-tip="' + esc(DC.KEYWORDS.flask.t) + '" data-tip-title="플라스크">' + icon('flask') + '<span class="flask-pips">' + pips + '</span><b>' + n + '</b><i>/3</i></span>');
    }
    if (c.cls === 'paladin') out.push(verdictUi(c));
    return out.join('');
  }

  function logPanel(c, r) {
    return '<div class="overlay" data-act="log"><div class="panel log-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 전투 기록</h3><button class="iconbtn" data-act="log" aria-label="닫기">' + icon('close') + '</button></div>' +
      '<div class="battle-log">' +
        ((c.battleLog || []).slice(-40).map(function (l) {
          const k = DC.KINDS[l.k];
          return '<div class="bl-row ' + l.side + '">' +
            '<span class="bl-turn">T' + l.turn + '</span>' +
            (l.side === 'p'
              ? '<span class="bl-ic" style="--c:' + (k ? k.c : '#8ea3c4') + '">' + icon(k ? k.ic : 'dice') + '</span><b>' + esc(l.skill) + '</b><i>' + l.v + '</i>'
              : '<span class="bl-ic foe">' + icon('skull') + '</span><b>' + esc(l.name) + '</b>') +
            '<span class="bl-txt">' + esc(l.txt) + '</span>' +
          '</div>';
        }).join('') || '<div class="bl-empty">아직 기록이 없습니다</div>') +
      '</div>' +
      '<div class="bl-foot">' +
        (r.relics.length ? '<div class="bf-relics">' + r.relics.map(function (id) {
          const R = DC.RELICS[id];
          return '<span class="relic" style="--c:' + R.c + '" data-tip="' + esc(R.desc) + '" data-tip-title="' + esc(R.name) + '">' + relicIcon(id) + '</span>';
        }).join('') + '</div>' : '') +
      '</div>' +
    '</div></div>';
  }

  function renderCombat(state) {
    const c = state.combat;
    const r = state.run;
    const sel = state.ui.sel;
    const canAct = c.phase === 'player' && !state.ui.busy;
    const unused = c.hand.filter(function (h) { return !h.used && !h.locked; }).length;
    const m = DC.Combat.mult(c);
    const canUndo = canAct && (state.ui.hist || []).length > 0;
    const selDie = sel != null ? c.hand[sel] : null;
    const dieReady = canAct && !!selDie && !selDie.used && !selDie.locked;
    const selV = selDie ? selDie.v : 0;
    const freeReroll = c.freeRerolls != null ? (c.rerollsThisTurn || 0) < c.freeRerolls : false;

    function maniBtn(act, op, label, on, cost, tip) {
      return '<button class="mbtn' + (op === 'undo' ? ' undo' : '') + '" data-act="' + act + '"' +
        (op !== 'undo' ? ' data-op="' + op + '"' : '') +
        (on ? '' : ' disabled') + ' data-tip="' + esc(tip) + '" data-tip-title="' + esc(label) + '">' +
        icon({ undo: 'reroll', reroll: 'dice', plus: 'plus', minus: 'minus', flip: 'flip', copy: 'copy' }[op]) +
        '<span>' + esc(label) + '</span>' +
        (cost > 0 ? '<i class="mcost">' + cost + '</i>' : '') +
        '</button>';
    }

    /* v7.7 — 데스크톱 우측 레일: 스킬 옆 빈 공간을 보유 유물·시너지로 채운다 */
    function sideRail() {
      const rel = r.relics.map(function (id) {
        const R = DC.RELICS[id];
        if (!R) return '';
        return '<div class="cs-row" style="--c:' + R.c + '">' +
          '<span class="cs-ic">' + relicIcon(id, 'relic-art cs-art') + '</span>' +
          '<div><b>' + esc(R.name) + '</b><span>' + esc(R.desc) + '</span></div></div>';
      }).join('');
      const syns = (DC.synergiesFor ? DC.synergiesFor(r.relics) : []).map(function (sy) {
        return '<span class="cs-syn" style="--c:' + sy.c + '" data-tip="' + esc(sy.desc) + '" data-tip-title="' + esc(sy.name) + '">' +
          icon('spark') + esc(sy.name) + '</span>';
      }).join('');
      return '<aside class="combat-side">' +
        '<div class="cs-head">' + icon('star') + '유물 <b>' + r.relics.length + '</b></div>' +
        (rel || '<div class="cs-empty">아직 없습니다</div>') +
        (syns ? '<div class="cs-head">' + icon('spark') + '시너지 <b>' + (DC.synergiesFor ? DC.synergiesFor(r.relics).length : 0) + '</b></div><div class="cs-syns">' + syns + '</div>' : '') +
        '</aside>';
    }

    const arm = canAct && sel == null && state.ui.arm != null ? state.ui.arm : null;
    let slots = '';
    for (let i = 0; i < c.slots.length; i++) slots += slotCard(c, i, canAct ? sel : null, arm);

    let tray = '';
    c.hand.forEach(function (h, i) {
      const ok = arm != null && !h.used && !h.locked && DC.Combat.canPlay(c, i, arm).ok;
      tray += dieChip(h, i, { sel: sel === i && canAct, can: ok, dim: arm != null && !ok });
    });

    let chain = '';
    (c.chainLog || []).slice(-7).forEach(function (l) {
      const k = DC.KINDS[l.k] || DC.KINDS.blank;
      chain += '<i class="chain-dot" style="--c:' + k.c + '">' + icon(k.ic) + '</i>';
    });

    /* 지금 할 일 한 줄 — 상황이 바뀔 때마다 문장이 바뀐다 */
    let hint = '';
    let hintState = 'idle';
    const anySlot = sel != null && c.slots.some(function (_, i) { return DC.Combat.canPlay(c, sel, i).ok; });
    if (c.phase === 'enemy') { hint = '적의 턴입니다 — 잠시 기다리세요'; hintState = 'foe'; }
    else if (state.ui.busy) { hint = ''; }
    else if (sel != null) {
      hint = '주사위 ' + c.hand[sel].v + ' 선택 — 쓸 스킬을 고르세요' + (anySlot ? '' : ' · 낼 수 있는 스킬이 없습니다');
      hintState = anySlot ? 'pick' : 'none';
    } else if (arm != null) {
      const ask = DC.Combat.skill(c, arm);
      hint = ask.name + ' — 넣을 주사위를 고르세요';
      hintState = 'arm';
    } else if (unused === 0) { hint = '주사위를 모두 썼습니다 — 턴을 종료하세요'; hintState = 'done'; }
    else { hint = '주사위를 고르거나, 스킬을 눌러 쓸 주사위를 확인하세요'; }
    const hintHtml = '<div class="hintbar ' + hintState + '">' + (hint ? '<span>' + esc(hint) + '</span>' : '') + '</div>';

    return '' +
      hud(state) +
      '<main class="combat' + (state.ui.busy ? ' busy' : '') + ' phase-' + c.phase + (c.combo >= 4 ? ' heat' : '') + '" data-n="' + c.enemies.length + '">' +
        '<section class="stage act-' + c.act + (c.kind === 'boss' ? ' boss-stage' : '') + '">' +
          '<div class="stage-bg" style="background-image:url(&quot;' + DC.bgUrl(c.act) + '&quot;)"></div>' +
          '<div class="stage-veil"></div>' +
          '<div class="enemy-row" data-n="' + c.enemies.length + '">' + c.enemies.map(function (e, i) {
            const out = (canAct && sel != null) ? outgoingDamage(c, sel) : { any: 0, all: 0 };
            const pred = out.all + (c.target === i ? out.any : 0);
            return enemyCard(c, e, i, pred);
          }).join('') + '</div>' +
          '<div class="stage-floor"></div>' +
          '<div class="phase-banner ' + (c.phase === 'enemy' ? 'foe' : 'own') + '">' +
            (c.phase === 'enemy' ? '<span>적의 턴</span>' : '<span>내 턴 ' + c.turn + '</span>') +
          '</div>' +
        '</section>' +
        '<div class="tray-head">' +
          '<div class="th-left">' +
            '<span class="die-label">' + icon('dice') + '<b>' + unused + '</b><i>/' + c.hand.length + '</i></span>' +
            '<span class="combo-badge' + (c.combo > 1 ? ' hot' : '') + '" id="combo-badge" data-tip="' + esc(DC.KEYWORDS.combo.t) + '" data-tip-title="연쇄 배율 x' + m.toFixed(1) + ' · 다음 +' + (DC.Combat.nextMult(c) - m).toFixed(1) + '">' +
              '<span class="cb-x">×</span><span class="cb-n">' + m.toFixed(1) + '</span></span>' +
            (chain ? '<span class="chain">' + chain + '</span>' : '') +
          '</div>' +
          '<div class="th-right">' + resourceChips(c) +
            '<button class="logbtn' + (state.ui.logOpen ? ' on' : '') + '" data-act="log" aria-label="전투 기록" data-tip="최근 턴의 스킬·적 행동·피해 내역" data-tip-title="전투 기록">' + icon('book') + '</button>' +
          '</div>' +
        '</div>' +
        hintHtml +
        '<div class="slots">' + slots + '</div>' +
        sideRail() +
        '<div class="tray-wrap">' +
          '<div class="tray" id="tray">' + tray + '</div>' +
        '</div>' +
        '<div class="actions">' +
          '<div class="manip">' +
            maniBtn('undo', 'undo', '되돌리기', canUndo, 0, canUndo ? '방금 한 배치나 조작을 되돌립니다 (Z)' : '되돌릴 동작이 없습니다') +
            maniBtn('manip', 'reroll', '재굴림', dieReady && (freeReroll || c.sparks >= 1), freeReroll ? 0 : 1,
              (dieReady ? (freeReroll ? '이번 턴 첫 재굴림은 무료입니다' : '기세 1을 써서 주사위를 다시 굴립니다') : '주사위를 먼저 고르세요')) +
            maniBtn('manip', 'plus', '눈 +1', dieReady && selV < 6 && c.sparks >= 1, 1,
              (!dieReady ? '주사위를 먼저 고르세요' : selV >= 6 ? '이미 6입니다' : c.sparks < 1 ? '기세가 부족합니다' : '기세 1을 써서 눈을 +1 합니다')) +
            maniBtn('manip', 'minus', '눈 -1', dieReady && selV > 1 && c.sparks >= 1, 1,
              (!dieReady ? '주사위를 먼저 고르세요' : selV <= 1 ? '이미 1입니다' : c.sparks < 1 ? '기세가 부족합니다' : '기세 1을 써서 눈을 -1 합니다')) +
            maniBtn('manip', 'flip', '뒤집기', dieReady && c.sparks >= 1, 1,
              (!dieReady ? '주사위를 먼저 고르세요' : c.sparks < 1 ? '기세가 부족합니다' : '기세 1을 써서 눈을 7-x로 뒤집습니다')) +
            maniBtn('manip', 'copy', '복제', dieReady && c.sparks >= 2, 2,
              (!dieReady ? '주사위를 먼저 고르세요' : c.sparks < 2 ? '기세 2가 필요합니다' : '기세 2를 써서 같은 면의 주사위를 하나 더 만듭니다')) +
          '</div>' +
          '<button class="endbtn" data-act="endturn" ' + (canAct ? '' : 'disabled') + '>' + icon('check') + '턴 종료</button>' +
        '</div>' +
        '<div class="sr-only" role="status" aria-live="polite" id="sr-status">' +
        (c.battleLog && c.battleLog.length ? esc((c.battleLog[c.battleLog.length - 1].skill || '적') + ' ' + (c.battleLog[c.battleLog.length - 1].txt || '')) : '전투 시작 — 턴 ' + c.turn) +
        '</div>' +
        (state.ui.logOpen ? logPanel(c, r) : '') +
      '</main>';
  }

  /* ---------------- map (v1.4 exploration map) ---------------- */
  const ACT_NAMES = ['', '잿빛 폐허', '가라앉은 성소', '운명의 정점'];
  const ACT_SCENES = {
    1:
      '<path d="M0 80V54h14v-8h8v20h10V46h6v-9h7v43h12V50h11v30h9V44h6v-7h5v43h13V52h10v28h12V47h7v33h14V57h12v23z" fill="currentColor" opacity=".5"/>' +
      '<path d="M34 80V30l4-6 4 6v50zM128 80V26l3-5 3 5v54z" fill="currentColor" opacity=".35"/>' +
      '<circle cx="58" cy="20" r="7" fill="currentColor" opacity=".18"/>',
    2:
      '<path d="M0 80V64c14 0 22-8 22-18S14 30 0 30V20h200v10c-14 0-22 6-22 16s8 18 22 18v16z" fill="currentColor" opacity=".22"/>' +
      '<path d="M40 80V40a12 12 0 0 1 24 0v40zM88 80V36a12 12 0 0 1 24 0v44zM136 80V44a12 12 0 0 1 24 0v36z" fill="currentColor" opacity=".4"/>' +
      '<path d="M0 72c20 0 40 6 60 0s40-6 60 0 40 6 80 0" opacity=".5" stroke-width="1.2"/>' +
      '<path d="M0 78c24 0 44 4 68 0s44-4 66 0 40 4 66 0" opacity=".3" stroke-width="1.2"/>',
    3:
      '<path d="M0 80l22-30 12 12 16-26 14 20 10-8 18-30 12 24 14-10 16 28 10-6 20 26z" fill="currentColor" opacity=".35"/>' +
      '<path d="M0 80l30-16 18 8 22-10 20 10 24-8 22 10 22-6 26 12z" fill="currentColor" opacity=".2"/>' +
      '<path d="M96 18l3-8 3 8M40 34l2-6 2 6M150 30l2-7 2 7" stroke-width="1.2" opacity=".7"/>',
  };

  function jitter(id) {
    const n = parseInt(String(id).replace(/\D/g, ''), 10) || 1;
    return ((n * 37) % 13) - 6; // -6..6
  }

  function nodePos(n, map) {
    const count = map.grid[n.row].length;
    const base = count === 1 ? 50 : count === 2 ? 29 + n.col * 42 : 17 + n.col * 33;
    const j = jitter(n.id + 'x') * 0.9;
    if (n.type === 'boss') return { x: 50, y: 0 };
    return { x: Math.max(9, Math.min(91, base + j)), y: 0 };
  }

  function actScene(act) {
    return '<svg class="map-scene" viewBox="0 0 200 80" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">' +
      (ACT_SCENES[act] || ACT_SCENES[1]) + '</svg>';
  }

  function mapMotes() {
    let out = '';
    for (let i = 0; i < 14; i++) {
      const l = (i * 37 + 11) % 96 + 2, d = (i % 7) * 1.3, dur = 7 + (i % 5) * 2.2, sz = 1 + (i % 3);
      out += '<i style="left:' + l + '%;animation-delay:-' + d + 's;animation-duration:' + dur + 's;width:' + sz + 'px;height:' + sz + 'px"></i>';
    }
    return out;
  }

  function renderGift(state) {
    const r = state.run;
    const gifts = (r.gift || []).map(function (g, i) {
      return '<button class="gift-card" data-act="gift" data-i="' + i + '" style="--c:' + g.c + '">' +
        '<span class="gc-ic">' + icon(g.ic) + '</span>' +
        '<b>' + esc(g.name) + '</b>' +
        '<span class="gc-desc">' + esc(g.desc) + '</span>' +
      '</button>';
    }).join('');
    return '<main class="gift-screen">' +
      '<div class="gift-head"><span class="act-chip">START</span><h2>시작 선물</h2></div>' +
      '<p class="sub">한 가지만 골라 여정을 시작하세요</p>' +
      '<div class="gift-list">' + gifts + '</div>' +
      '<p class="gift-foot">' + icon('eye') + '선물은 판마다 무작위로 3개가 제시됩니다</p>' +
    '</main>';
  }

  function renderMap(state) {
    const r = state.run;
    const map = r.map;
    const avail = DC.MapGen.available(map);
    const rows = map.rows;
    const curRow = map.current ? map.nodes[map.current].row : 0;
    const visited = r.cleared || [];
    const boss = r.act <= 3 ? DC.BOSSES[r.act] : (DC.abyssBossFor ? DC.abyssBossFor(r.act) : DC.BOSSES[4 + (r.act % 2)]);
    const bossDone = map.current && map.nodes[map.current].type === 'boss';

    let html = '';
    for (let ri = rows - 1; ri >= 0; ri--) {
      map.grid[ri].forEach(function (id) {
        const n = map.nodes[id];
        const meta = DC.NODES[n.type];
        const pos = nodePos(n, map);
        const isAvail = avail.indexOf(n.id) >= 0;
        const isCur = map.current === n.id;
        const isPast = visited.indexOf(n.id) >= 0 && !isCur;
        const yPct = rows === 1 ? 50 : 82 - (n.row / (rows - 1)) * 74;
        const size = n.type === 'boss' ? ' boss' : '';
        const label = n.type === 'boss' ? 'BOSS' : meta.n;
        html += '<div class="node' + size + (isAvail ? ' avail' : '') + (isCur ? ' cur' : '') + (isPast ? ' past' : '') + (n.type === 'boss' && !isAvail && !isCur && !isPast ? ' looming' : '') + '"' +
          ' data-act="node" data-nid="' + n.id + '" data-type="' + n.type + '"' +
          ' style="--c:' + meta.c + ';left:' + pos.x.toFixed(2) + '%;top:' + yPct.toFixed(2) + '%" role="button" tabindex="0"' +
          ' aria-label="' + (esc(meta.n)) + ' 노드' + (isPast ? ' (완료)' : isAvail ? ' (이동 가능)' : '') + '">' +
          '<span class="node-halo"></span>' +
          '<span class="node-face">' + DC.nodeArt(n.type) + '</span>' +
          '<span class="node-l">' + esc(label) + '</span>' +
          (isPast ? '<span class="node-done">' + icon('check') + '</span>' : '') +
          (isAvail ? '<span class="node-cta">' + icon('right') + '</span>' : '') +
        '</div>';
      });
    }

    return hud(state) +
      '<main class="map-screen">' +
        '<div class="map-bg"><div class="map-haze"></div><div class="map-motes">' + mapMotes() + '</div>' +
          '<div class="map-scene-wrap">' + actScene(r.act) + '</div></div>' +
        '<div class="map-head">' +
          '<div class="mh-left"><span class="act-chip">ACT ' + r.act + '</span>' +
            '<span class="act-title">' + esc(DC.actName ? DC.actName(r.act) : (ACT_NAMES[r.act] || '심연')) + '</span>' +
            (r.abyss ? '<span class="abyss-chip" style="--c:' + (r.abyss.c || '#c084fc') + '" data-tip="' + esc(r.abyss.desc) + '" data-tip-title="심연 변칙 · ' + esc(r.abyss.name) + '">' + icon(r.abyss.ic || 'void') + esc(r.abyss.name) + '</span>' : '') +
            '</div>' +
          '<div class="map-prog">' +
            (r.challenge && r.challenge !== 'none' ? '<span class="map-ch-chip" style="--c:' + DC.challengeById(r.challenge).c + '">' + esc(DC.challengeById(r.challenge).short) + '</span>' : '') +
            (r.seed ? '<button class="seed-chip" data-act="copyseed" title="시드 복사">' + icon('copy') + esc(DC.seedDisplay(r.seed)) + '</button>' : '') +
            '<b>층 ' + (curRow + 1) + '</b><span>/' + rows + '</span></div>' +
        '</div>' +
        (boss && !bossDone ? '<div class="boss-preview" style="--c:' + boss.c + '">' +
          '<div class="bp-art">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + DC.monsterArt(boss.art, boss) + '</svg>' + '</div>' +
          '<div class="bp-txt"><span>' + icon('crown') + '다가오는 보스</span><b>' + esc(boss.name) + '</b>' +
            (boss.gimmick && DC.GIMMICK_TXT[boss.gimmick.kind] ? '<i>' + esc(DC.GIMMICK_TXT[boss.gimmick.kind]) + '</i>' : '') + '</div>' +
          '<div class="bp-hp"><b>' + boss.hp + '</b><i>체력</i></div>' +
        '</div>' : '') +
        '<div class="map-wrap" id="map-wrap"><div class="map-canvas" id="map-canvas" style="--rows:' + rows + '">' +
          '<svg class="map-edges" id="map-edges"></svg>' + html +
        '</div></div>' +
        (!avail.length && map.current && map.nodes[map.current] && map.nodes[map.current].type === 'boss' ?
          '<div class="map-deadend"><button class="bigbtn primary" data-act="deeper">심연으로 계속</button>' +
          '<button class="bigbtn ghost" data-act="finishrun">여기서 마무리</button></div>' : '') +
        '<div class="map-legend">' +
          ['combat', 'elite', 'forge', 'shop', 'mystery', 'rest', 'boss'].map(function (t) {
            const m = DC.NODES[t];
            return '<span style="--c:' + m.c + '"><i>' + DC.nodeArt(t, 'leg-art') + '</i>' + m.n + '</span>';
          }).join('') +
        '</div>' +
      '</main>';
  }

  function drawMapEdges() {
    const svg = document.getElementById('map-edges');
    const canvas = document.getElementById('map-canvas');
    if (!svg || !canvas || !DC.Game.state.run) return;
    const map = DC.Game.state.run.map;
    const visited = DC.Game.state.run.cleared || [];
    const W = canvas.clientWidth, H = canvas.scrollHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    const pos = {};
    canvas.querySelectorAll('[data-nid]').forEach(function (el) {
      pos[el.getAttribute('data-nid')] = {
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2,
      };
    });
    let out = '';
    Object.keys(map.nodes).forEach(function (id) {
      const n = map.nodes[id];
      const a = pos[id];
      if (!a) return;
      n.next.forEach(function (nid) {
        const b = pos[nid];
        if (!b) return;
        const active = map.current === id;
        const done = visited.indexOf(id) >= 0 && visited.indexOf(nid) >= 0;
        const cls = active ? 'edge active' : done ? 'edge done' : 'edge';
        const up = b.y < a.y;
        const dir = up ? -1 : 1;
        const dy = Math.max(14, Math.abs(b.y - a.y) * 0.42);
        const y1 = a.y + dir * 10, y2 = b.y - dir * 10;
        const d = 'M' + a.x.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + a.x.toFixed(1) + ' ' + (y1 + dir * dy).toFixed(1) + ',' +
          b.x.toFixed(1) + ' ' + (y2 - dir * dy).toFixed(1) + ',' + b.x.toFixed(1) + ' ' + y2.toFixed(1);
        out += '<path d="' + d + '" class="' + cls + '"/>';
        if (active) out += '<path d="' + d + '" class="edge flow"/>';
      });
    });
    svg.innerHTML = out;
  }

  /* ---------------- title / class ---------------- */
  function dailyCard(state) {
    const cfg = DC.dailyConfig();
    const last = DC.Meta.daily();
    const doneToday = last && last.day === cfg.seed;
    const ch = DC.challengeById(cfg.challenge);
    const cls = DC.classesShort[cfg.cls] || cfg.cls;
    const streak = DC.Meta.dailyStreak ? DC.Meta.dailyStreak() : 0;
    const log = DC.Meta.dailyLog ? DC.Meta.dailyLog() : [];
    const today = log.filter(function (d) { return d.day === cfg.seed; })[0];
    const best = log.reduce(function (a, d) { return Math.max(a, d.score || 0); }, 0);
    return '<div class="daily-card' + (doneToday ? ' done' : '') + '">' +
      '<div class="dc-head"><span>' + icon('star') + '오늘의 도전</span><b>' + esc(cfg.day) + '</b></div>' +
      '<div class="dc-body">' + esc(cls) + ' · ' + esc(ch.short) + ' · 승천 ' + cfg.asc + '</div>' +
      '<div class="dc-meta">' +
        (streak ? '<span class="dc-streak">' + icon('flame') + streak + '일 연속 클리어</span>' : '<span>연속 클리어 없음</span>') +
        (best ? '<span>최고 ' + best + '점</span>' : '') +
      '</div>' +
      (doneToday
        ? '<div class="dc-result">' + (last.win ? '오늘 클리어 · ACT ' + last.act : '오늘 기록 · ACT ' + last.act) +
          (today ? ' · ' + today.score + '점' : '') + '</div>' +
          '<button class="dc-btn ghost" data-act="dailyrun">다시 도전</button>'
        : '<button class="dc-btn" data-act="dailyrun">도전 시작</button>') +
    '</div>';
  }

  function renderTitle(state) {
    const hasSave = DC.Game.hasSave();
    const meta = DC.Meta.get();
    const asc = state.ui.asc || 0;
    const maxAsc = Math.min(10, meta.unlockedAsc || 0);
    const step = DC.ASC_STEPS[asc] || DC.ASC_STEPS[0];
    const prog = DC.Meta.progress();
    const clsnow = (state.ui.challenge && state.ui.challenge !== 'none') ? ' · ' + DC.challengeById(state.ui.challenge).short : '';
    return '' +
      '<main class="title-screen" style="--title-art:url(&quot;' + DC.titleArt() + '&quot;);--title-art-wide:url(&quot;' + DC.titleArtWide() + '&quot;)">' +
        '<span class="title-frame" aria-hidden="true"></span>' +
        '<button class="title-gear" data-act="settings" aria-label="설정">' + icon('gear') + '</button>' +
        '<div class="t-logo">' +
          '<h1 class="logo">다이스 <em>체인</em></h1>' +
          '<p class="logo-sub">DICE CHAIN RPG</p>' +
          '<p class="tagline">주사위를 굴리고, 눈을 바꾸고, 연쇄를 터뜨려라.</p>' +
        '</div>' +
        '<div class="title-btns">' +
          (hasSave && DC.Game.saveInfo() ? (function () {
            const inf = DC.Game.saveInfo();
            const CLS = (DC.classesShort || {})[inf.cls] || inf.cls;
            return '<button class="bigbtn primary resume-card" data-act="resume">' +
              '<span class="rc-main">이어하기 · ' + esc(CLS) + '</span>' +
              '<span class="rc-sub">ACT ' + inf.act + (inf.depth > 3 ? ' · 깊이 ' + inf.depth : '') + ' · 체력 ' + inf.hp + '/' + inf.maxHp +
              ' · 주사위 ' + inf.dice + ' · 유물 ' + inf.relics + '</span></button>';
          })() : (hasSave ? '<button class="bigbtn primary" data-act="resume">이어하기</button>' : '')) +
          '<button class="bigbtn ' + (hasSave ? '' : 'primary') + '" data-act="newrun">' + icon('dice') + '새 게임' + (maxAsc ? ' · 승천 ' + asc : '') + clsnow + '</button>' +
        '</div>' +
        '<div class="title-sub">' +
          '<button class="bigbtn ghost" data-act="codex">도감 <i class="badge-num">' + (prog.dice + prog.relics + prog.enemies) + '</i></button>' +
          '<button class="bigbtn ghost" data-act="history">기록 <i class="badge-num">' + DC.Meta.history().length + '</i></button>' +
          '<button class="bigbtn ghost" data-act="help">방법</button>' +
        '</div>' +
        '<details class="title-opts">' +
          '<summary>' + icon('flag') + '승천 난이도 · ' + (maxAsc ? (asc ? asc + '단계' : '보통') : '잠김') + clsnow + '</summary>' +
          '<div class="opt-body">' +
            '<div class="asc-row">' +
              '<button class="asc-btn" data-act="asc" data-dir="-1" ' + (asc <= 0 ? 'disabled' : '') + ' aria-label="승천 낮추기">' + icon('minus') + '</button>' +
              '<div class="asc-label' + (asc ? ' on' : '') + ' ' + (maxAsc ? '' : 'locked') + '">' +
                '<b>' + (maxAsc ? (asc ? '승천 ' + asc + '단계' : '승천 없음') : '아직 잠김') + '</b>' +
                '<span>' + (maxAsc ? esc(step.desc) : '한 번 승리하면 열립니다') + '</span>' +
              '</div>' +
              '<button class="asc-btn" data-act="asc" data-dir="1" ' + (asc >= maxAsc ? 'disabled' : '') + ' aria-label="승천 높이기">' + icon('plus') + '</button>' +
            '</div>' +
            '<button class="challenge-chip' + ((state.ui.challenge && state.ui.challenge !== 'none') ? ' on' : '') + '" data-act="challenge">' +
              icon('crown') + '도전 모드 <b>' + esc(DC.challengeById(state.ui.challenge || 'none').short) + '</b>' +
            '</button>' +
            '<div class="seed-row">' +
              '<span class="seed-ic">' + icon('dice') + '</span>' +
              '<input id="seed-input" class="seed-input" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="14"' +
                ' placeholder="시드 (비우면 무작위)" value="' + esc(state.ui.seed || '') + '" aria-label="시드" />' +
              '<button class="seed-btn" data-act="daily">' + icon('clock') + '오늘</button>' +
            '</div>' +
            dailyCard(state) +
          '</div>' +
        '</details>' +
        '<p class="ver">v' + DC.VERSION + ' · 승리 ' + meta.wins + '회</p>' +
      '</main>';
  }

  function renderClass(state) {
    const cards = DC.CLASS_IDS.map(function (id) {
      const C = DC.CLASSES[id];
      const dice = C.startDice.map(function (d) {
        return '<span class="dchip" style="--c:' + DC.DICE[d].c + '">' + DC.DICE[d].name + '</span>';
      }).join('');
      return '' +
        '<div class="class-card' + (C.fresh ? ' fresh' : '') + '" data-act="pickclass" data-id="' + id + '" style="--c:' + C.c + '" role="button" tabindex="0">' +
          (C.fresh ? '<span class="class-new">' + icon('star') + 'NEW</span>' : '') +
          '<div class="cc-art" style="background-image:url(&quot;' + DC.classArt(id) + '&quot;)"></div>' +
          '<div class="cc-info">' +
            '<div class="cc-name">' + C.name + '</div>' +
            '<div class="cc-en">' + C.en + '</div>' +
            '<div class="cc-stats"><span><i>체력</i>' + C.hp + '</span><span><i>기세</i>' + C.sparks + '</span><span><i>주사위</i>' + C.startDice.length + '</span></div>' +
            '<p class="cc-desc">' + C.desc + '</p>' +
            '<div class="cc-dice">' + dice + '</div>' +
            '<div class="cc-passive"><span class="cc-passive-k">특성</span><span><b>' + C.passive.n + '</b> — ' + C.passive.tip + '</span></div>' +
          '</div>' +
        '</div>';
    }).join('');
    return '' +
      '<main class="class-screen">' +
        '<h2>클래스를 선택하세요</h2>' +
        '<p class="sub">클래스마다 주사위와 스킬이 다릅니다 · ' + DC.CLASS_IDS.length + '종' + ((state.ui.asc || 0) ? ' · 승천 ' + state.ui.asc : '') +
          ((state.ui.challenge && state.ui.challenge !== 'none') ? ' · ' + esc(DC.challengeById(state.ui.challenge).short) : '') + '</p>' +
        '<div class="class-list">' + cards + '</div>' +
      '</main>';
  }

  /* ---------------- reward / forge / shop / rest / event ---------------- */
  function renderReward(state) {
    const rw = state.ui.reward;
    const cards = rw.options.map(function (o, i) {
      const faces = o.faces ? '<div class="rw-faces">' + o.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' : '';
      return '<button class="rw-card kind-' + (o.kind || 'misc') + '" data-act="reward" data-i="' + i + '" style="--c:' + (o.c || '#e8b45a') + '">' +
        '<span class="rw-glow"></span>' +
        '<span class="rw-kind">' + esc(o.kindLabel) + '</span>' +
        '<span class="rw-ic">' + (o.kind === 'relic' ? relicIcon(o.id, 'relic-art rw-art') : icon(o.ic || 'star')) + '</span>' +
        '<span class="rw-name">' + esc(o.name) + '</span>' +
        '<span class="rw-desc">' + esc(o.desc) + '</span>' +
        faces +
      '</button>';
    }).join('');
    return hud(state) + '' +
      '<main class="reward-screen' + (rw.boss ? ' boss' : '') + '">' +
        '<header class="rw-hero" style="--art:url(&quot;' + DC.rewardArt(rw.boss ? 'boss' : 'loot') + '&quot;)">' +
          '<div class="rw-hero-art"></div>' +
          '<div class="rw-hero-veil"></div>' +
          '<div class="rw-hero-txt">' +
            '<span class="scr-kicker">' + (rw.boss ? 'TREASURE' : 'VICTORY') + '</span>' +
            '<h2>' + (rw.boss ? '보스를 쓰러뜨렸다' : '전투 승리') + '</h2>' +
            '<p class="scr-sub">보상 하나를 고르세요</p>' +
          '</div>' +
          '<div class="scr-gold">' + icon('coin') + '+' + rw.gold + '</div>' +
        '</header>' +
        '<div class="rw-list">' + cards + '</div>' +
        '<div class="scr-foot">' +
          '<button class="ghostbtn" data-act="rerollreward" ' + (rw.rerolled ? 'disabled' : '') + '>' +
            icon('reroll') + (rw.rerolled ? '변경 완료' : '다시 뽑기') + (rw.rerolled ? '' : icon('coin') + '15') + '</button>' +
          '<button class="ghostbtn" data-act="skipreward">건너뛰기' + icon('coin') + '20</button>' +
        '</div>' +
      '</main>';
  }

  /* v4.4 — boss relic 3-way choice after act 1·2 bosses */
  function renderBossRelic(state) {
    const br = state.ui.bossRelic;
    if (!br) return hud(state);
    const cards = br.options.map(function (id, i) {
      const R = DC.RELICS[id];
      return '' +
        '<div class="br-card" data-act="pickbossrelic" data-i="' + i + '" style="--c:' + R.c + '" role="button" tabindex="0">' +
          '<div class="br-tag">' + icon('crown') + 'ACT ' + br.act + ' 보스 유물</div>' +
          '<div class="br-art">' + relicIcon(id, 'relic-art br-art-svg') + '</div>' +
          '<div class="br-name">' + esc(R.name) + '</div>' +
          '<div class="br-desc">' + esc(R.desc) + '</div>' +
          '<div class="br-trade">' + icon('down') + '<span>' + esc(R.trade || '') + '</span></div>' +
        '</div>';
    }).join('');
    return hud(state) + '' +
      '<main class="bossrelic-screen">' +
        '<div class="br-head">' +
          '<h2>' + icon('crown') + ' 보스 유물</h2>' +
          '<p class="sub">하나만 고를 수 있습니다 — 큰 힘에는 반드시 대가가 따릅니다</p>' +
        '</div>' +
        '<div class="br-list">' + cards + '</div>' +
        '<button class="bigbtn ghost skipbtn" data-act="skipbossrelic">건너뛰기 (+50 골드)</button>' +
      '</main>';
  }

  function renderForge(state) {
    const f = state.ui.forge;
    const r = state.run;
    const die = f.dieIdx != null ? r.dice[f.dieIdx] : null;
    const head = '<div class="forge-head">' +
      '<div class="fh-top"><h2>' + icon('anvil') + ' 주사위 단조</h2>' +
        '<span class="fh-free">무료 <b>' + f.free + '</b>회</span></div>' +
      '<div class="forge-steps">' +
        '<span class="' + (f.dieIdx != null ? 'on' : '') + '">1 주사위</span>' +
        '<span class="' + (f.faceIdx != null ? 'on' : '') + '">2 면 선택</span>' +
        '<span class="' + (f.options.length ? 'on' : '') + '">3 새 면</span>' +
      '</div>' +
      '<p class="sub">면은 영구히 바뀝니다 · 남은 골드 ' + r.gold + '</p>' +
      '</div>';

    let strip = '<div class="forge-strip">';
    r.dice.forEach(function (d, di) {
      const on = f.dieIdx === di;
      strip += '<button class="fd-chip ' + (on ? 'on' : '') + '" data-act="fdiedie" data-i="' + di + '" style="--c:' + d.c + '">' +
        '<span class="fd-chip-name">' + esc(d.name) + '</span>' +
        '<span class="fd-bar">' + d.faces.map(function (fc) {
          return '<i style="--c:' + (DC.KINDS[fc.k] || DC.KINDS.blank).c + '"></i>';
        }).join('') + '</span>' +
        '<span class="fd-nums">' + d.faces.map(function (fc) {
          return '<b style="--c:' + (DC.KINDS[fc.k] || DC.KINDS.blank).c + '">' + fc.v + '</b>';
        }).join('') + '</span>' +
      '</button>';
    });
    strip += '</div>';

    let body = '';
    if (!die) {
      body = '<div class="forge-hint">' + icon('eye') + '<div><b>단조할 주사위를 고르세요</b><span>위 목록에서 주사위를 탭하면 면이 펼쳐집니다</span></div></div>';
    } else {
      body = '<div class="forge-faces" style="--c:' + die.c + '">' +
        die.faces.map(function (fc, fi) {
          const k = DC.KINDS[fc.k];
          return '<button class="ff ' + (f.faceIdx === fi ? 'on' : '') + '" data-act="fface" data-i="' + fi + '" style="--c:' + k.c + '">' +
            '<span class="ff-ic">' + icon(k.ic) + '</span><b>' + fc.v + '</b><i>' + esc(k.n) + '</i>' +
            (f.faceIdx === fi ? '<span class="ff-pick">교체</span>' : '') +
          '</button>';
        }).join('') +
      '</div>';
      if (f.faceIdx != null) {
        body += '<div class="forge-opts">' + f.options.map(function (o, oi) {
          const k = DC.KINDS[o.k];
          const cost = f.free > 0 ? 0 : o.cost;
          const afford = r.gold >= cost;
          return '<button class="forge-opt" data-act="fopt" data-i="' + oi + '" style="--c:' + k.c + '" ' + (afford ? '' : 'disabled') + '>' +
            icon(k.ic) + '<b>' + k.n + ' ' + o.v + '</b><span>' + (cost === 0 ? '무료' : icon('coin') + cost) + '</span></button>';
        }).join('') + '</div>';
      } else {
        body += '<div class="forge-hint small">' + icon('eye') + '<div><b>바꿀 면을 탭하세요</b><span>새 면 5개가 나타납니다</span></div></div>';
      }
    }

    return hud(state) + '' +
      '<main class="forge-screen">' +
        head + strip + '<div class="forge-body">' + body + '</div>' +
        '<div class="bottom-bar"><button class="bigbtn" data-act="forgeexit">단조 완료</button></div>' +
      '</main>';
  }

  function renderShop(state) {
    const sh = state.ui.shop;
    const r = state.run;
    const freeLeft = sh.free || 0;
    const items = sh.items.map(function (it, i) {
      const afford = r.gold >= it.price || freeLeft > 0;
      const sold = it.sold;
      return '<div class="shop-item ' + (sold ? 'sold' : '') + '" style="--c:' + it.c + '">' +
        '<div class="si-ic">' + (it.kind === 'relic' ? relicIcon(it.id, 'relic-art si-art') : icon(it.ic)) + '</div>' +
        '<div class="si-main"><div class="si-name">' + esc(it.name) + '</div><div class="si-desc">' + esc(it.desc) + '</div>' +
          (it.faces ? '<div class="si-faces">' + it.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' : '') + '</div>' +
        '<button class="buybtn" data-act="buy" data-i="' + i + '" ' + (sold || !afford ? 'disabled' : '') + '>' + (sold ? '판매됨' : (freeLeft > 0 ? '무료' : icon('coin') + it.price)) + '</button>' +
      '</div>';
    }).join('');
    return hud(state) + '' +
      '<main class="shop-screen">' +
        '<div class="shop-head">' +
          '<div class="shop-portrait"><img src="' + DC.shopkeeperArt() + '" alt="" draggable="false" /></div>' +
          '<div class="shop-title"><h2>상점</h2><p class="shop-quote">돈만 있으면 골라 드리지.</p></div>' +
          '<button class="reroll-btn sm" data-act="rerollshop" ' + ((sh.rerolls || 0) >= 2 ? 'disabled' : '') + '>' +
            icon('reroll') + '재고 교체<i class="rb-n">' + (2 - (sh.rerolls || 0)) + '</i>' +
          '</button>' +
        '</div>' +
        '<p class="sub">' + (freeLeft > 0 ? '황금 우상의 힘 — 하나는 값 없이 가져갑니다' : '주사위 · 유물 · 단조 도구를 골드로 삽니다') + (r.relics.indexOf('merchant') >= 0 ? ' · 상인의 인장 −30%' : '') + '</p>' +
        '<div class="shop-list">' + items + '</div>' +
        '<div class="bottom-bar"><button class="bigbtn" data-act="leave">상점을 떠난다</button></div>' +
      '</main>';
  }

  function renderRest(state) {
    return hud(state) + '' +
      '<main class="rest-screen">' +
        '<div class="rest-scene">' +
          '<img src="' + DC.restArt() + '" alt="" draggable="false" />' +
          '<span class="rest-veil"></span>' +
          '<div class="rest-cap"><span class="scr-kicker">CAMPFIRE</span><h2>모닥불</h2></div>' +
        '</div>' +
        '<p class="sub">잠시 쉬며 몸을 추스른다.</p>' +
        '<div class="rest-opts">' +
          '<button class="rest-opt" data-act="rest" data-i="0">' + icon('heart') + '<b>회복</b><span>체력을 40% 회복합니다</span></button>' +
          '<button class="rest-opt" data-act="rest" data-i="1">' + icon('shield') + '<b>단련</b><span>최대 체력 +8</span></button>' +
          '<button class="rest-opt" data-act="rest" data-i="2">' + icon('anvil') + '<b>단조</b><span>주사위 면 1회 변경</span></button>' +
        '</div>' +
      '</main>';
  }

  function renderEvent(state) {
    const ev = state.ui.event;
    const def = ev.def;
    const TAG_C = { '도박': '#fbbf24', '저주': '#a78bfa', '탐색': '#67e8f9', '성소': '#34d399', '거래': '#34d399', '단조': '#fb923c', '위험': '#ff7b72' };
    const tagC = TAG_C[def.tag] || '#67e8f9';
    const head = '<div class="ev-scene" style="--c:' + tagC + '">' +
        '<img class="ev-img" src="' + DC.eventArt(def.tag, def.id) + '" alt="" draggable="false" />' +
        '<span class="ev-scene-veil"></span>' +
        '<div class="ev-scene-cap">' +
          '<span class="ev-tag" style="--c:' + tagC + '">' + esc(def.tag || '') + '</span>' +
          '<h2>' + esc(def.name) + '</h2>' +
        '</div>' +
      '</div>';
    if (ev.result) {
      return hud(state) + '' +
        '<main class="event-screen">' + head +
          '<p class="ev-text">' + esc(ev.text) + '</p>' +
          '<div class="ev-result"><span>' + icon('spark') + '</span><div><p>' + esc(ev.result) + '</p>' +
            ((ev.gains && ev.gains.length) ? '<div class="ev-gains">' + ev.gains.map(function (g) { return '<i>' + esc(g) + '</i>'; }).join('') + '</div>' : '') +
          '</div></div>' +
          '<button class="bigbtn primary ev-cont" data-act="leave">계속</button>' +
        '</main>';
    }
    const leaveIdx = def.choices.findIndex(function (ch) { return !ch.eff && !ch.chance; });
    function effIcon(ch) {
      const e = (ch.chance ? ch.chance[0].eff : ch.eff) || {};
      if (e.relic) return 'star';
      if (e.curseFace || e.maxHp < 0) return 'skull';
      if (e.healPct) return 'heart';
      if (e.gold && e.gold > 0) return 'coin';
      if (e.gold && e.gold < 0) return 'coin';
      if (e.copyDie || e.dice) return 'copy';
      if (e.upgradeFace) return 'anvil';
      if (e.sparkMax) return 'spark';
      if (e.selfDmgFlat) return 'blood';
      if (ch.chance) return 'mystery';
      return 'right';
    }
    const choices = def.choices.map(function (ch, i) {
      const block = ch.need && ch.need.gold && state.run.gold < ch.need.gold;
      const risk = /피해|상실|감소|잃/.test((ch.desc || '') + (ch.label || ''));
      const quiet = i === leaveIdx;
      return '<button class="ev-choice' + (risk ? ' risky' : '') + (quiet ? ' quiet' : '') + '" data-act="choice" data-i="' + i + '" ' + (block ? 'disabled' : '') + '>' +
        '<span class="ev-ic">' + icon(quiet ? 'right' : effIcon(ch)) + '</span>' +
        '<b>' + esc(ch.label) + '</b><span class="ev-desc">' + esc(ch.desc || '') + (block ? ' — 골드가 부족합니다' : '') + '</span></button>';
    }).join('');
    return hud(state) + '' +
      '<main class="event-screen">' + head +
        '<p class="ev-text">' + esc(def.text || ev.text) + '</p>' +
        '<div class="ev-choices">' + choices + '</div>' +
        (leaveIdx < 0 ? '<button class="ev-skip" data-act="leave">' + icon('right') + '아무것도 하지 않고 떠난다</button>' : '') +
      '</main>';
  }

  function verdictUi(c) {
    const n = c.verdict || 0;
    let pips = '';
    for (let i = 0; i < 6; i++) pips += '<i' + (i < n ? ' class="on"' : '') + '></i>';
    return '<span class="strip-item vchip' + (n >= 4 ? ' hot' : '') + '" data-tip="' + esc(DC.KEYWORDS.verdict.t) + '" data-tip-title="심판">' +
      icon('crown') + '<span class="v-pips">' + pips + '</span><b>' + n + '</b></span>';
  }

  function renderSkills(state) {
    const r = state.run;
    const rows = [0, 1, 2, 3, 4].map(function (i) {
      const custom = r.customSkills && r.customSkills[i];
      const sk = custom || DC.CLASSES[r.cls].skills[i];
      const up = DC.getSkill(r.cls, i, 1);
      const lv = (r.skills || [])[i] || 0;
      return '<div class="skm-row' + (lv ? ' done' : '') + (custom ? ' swapped' : '') + '">' +
        '<div class="skm-ic">' + icon(sk.ic) + '</div>' +
        '<div class="skm-main">' +
          '<div class="skm-name">' + esc(sk.name) + (custom ? ' <i class="upmark swap">드래프트</i>' : '') + (lv ? ' <i class="upmark">각성</i>' : '') + '</div>' +
          '<div class="skm-now">' + esc(lv ? up.desc : sk.desc) + '</div>' +
          (lv || custom ? '' : '<div class="skm-up">' + icon('up') + esc(up.desc) + '</div>') +
        '</div>' +
        '<button class="skm-btn" data-act="upskill" data-i="' + i + '" ' + (lv || custom ? 'disabled' : '') + '>' + (custom ? '교체됨' : lv ? '완료' : '각성') + '</button>' +
      '</div>';
    }).join('');
    return '<div class="overlay" data-act="closeskills"><div class="panel skill-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 스킬 각성</h3><button class="iconbtn" data-act="closeskills">' + icon('close') + '</button></div>' +
      '<p class="sub">스킬 하나를 영구히 강화합니다. 런이 끝나면 사라집니다.</p>' +
      '<div class="skm-list">' + rows + '</div>' +
      '</div></div>';
  }

  function renderChallenge(state) {
    const cur = state.ui.challenge || 'none';
    const cards = DC.CHALLENGES.map(function (c) {
      return '<button class="ch-card' + (cur === c.id ? ' on' : '') + '" data-act="pickchallenge" data-id="' + c.id + '" style="--c:' + c.c + '">' +
        '<span class="ch-dot">' + (cur === c.id ? icon('check') : '') + '</span>' +
        '<b>' + esc(c.name) + '</b><span>' + esc(c.desc) + '</span></button>';
    }).join('');
    return '<div class="overlay" data-act="closechallenge"><div class="panel ch-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('crown') + ' 도전 모드</h3><button class="iconbtn" data-act="closechallenge">' + icon('close') + '</button></div>' +
      '<p class="sub">표준 외 모드는 더 위험하지만, 승리하면 「다른 길」 업적이 열립니다.</p>' +
      '<div class="ch-list">' + cards + '</div>' +
      '</div></div>';
  }

  function renderSettings(state) {
    const st = state.ui.set || { music: .6, sfx: .8, motion: false };
    return '<div class="overlay" data-act="closesettings"><div class="panel set-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('gear') + ' 설정</h3><button class="iconbtn" data-act="closesettings">' + icon('close') + '</button></div>' +
      '<div class="set-row"><label>배경 음악</label>' +
        '<input id="vol-music" type="range" min="0" max="100" value="' + Math.round(st.music * 100) + '" />' +
        '<b>' + Math.round(st.music * 100) + '</b></div>' +
      '<div class="set-row"><label>효과음</label>' +
        '<input id="vol-sfx" type="range" min="0" max="100" value="' + Math.round(st.sfx * 100) + '" />' +
        '<b>' + Math.round(st.sfx * 100) + '</b></div>' +
      '<button class="set-toggle' + (state.ui.speed === 2 ? ' on' : '') + '" data-act="setspeed2">' +
        icon('clock') + '전투 애니메이션 <b>' + (state.ui.speed === 2 ? '2x 빠르게' : '1x') + '</b></button>' +
      '<button class="set-toggle' + (st.motion ? ' on' : '') + '" data-act="setmotion">' +
        icon('eye') + '모션 줄이기 <b>' + (st.motion ? '켜짐' : '꺼짐') + '</b></button>' +
      '<button class="set-toggle' + (st.hc ? ' on' : '') + '" data-act="sethc">' +
        icon('star') + '고대비 <b>' + (st.hc ? '켜짐' : '꺼짐') + '</b></button>' +
      '<div class="set-row fs-row"><label>글씨 크기</label>' +
        '<div class="seg">' +
          [[0, '보통'], [1, '크게'], [2, '아주 크게']].map(function (o) {
            return '<button class="seg-btn' + ((st.fs || 0) === o[0] ? ' on' : '') + '" data-act="setfs" data-v="' + o[0] + '">' + o[1] + '</button>';
          }).join('') +
        '</div></div>' +
      '<button class="set-toggle" data-act="help">' + icon('book') + '게임 방법 <b>열기</b></button>' +
      '<button class="set-toggle" data-act="patchnotes">' + icon('star') + '업데이트 노트 <b>v' + DC.VERSION + '</b></button>' +
      '<div class="set-data">' +
        '<div class="sd-head">' + icon('lock') + ' 게임 데이터</div>' +
        (state.ui.confirmReset
          ? '<p class="sd-warn">진행도(도감·업적·승천·기록)와 저장된 런이 모두 사라집니다.</p>' +
            '<div class="sd-row"><button class="bigbtn ghost sm" data-act="cancelreset">취소</button>' +
            '<button class="bigbtn danger sm" data-act="resetdata">정말 초기화</button></div>'
          : '<div class="sd-row"><button class="bigbtn ghost sm" data-act="askreset">' + icon('trash') + ' 진행도 초기화</button></div>') +
      '</div>' +
      '<p class="set-foot">설정은 이 기기에 저장됩니다.</p>' +
      '</div></div>';
  }

  function renderDraft(state) {
    const d = state.ui.draft;
    const r = state.run;
    if (!d) return '';
    const step = d.step || 'pick';
    const REQP = { any: '조건 없음', even: '짝수', odd: '홀수', gte4: '4 이상', lte2: '2 이하', six: '6만', prime: '소수' };
    if (step === 'pick') {
      const cards = d.options.map(function (sk, i) {
        return '<button class="dr-card" data-act="draftskill" data-i="' + i + '" style="--c:#c084fc">' +
          '<span class="dr-ic">' + icon(sk.ic) + '</span>' +
          '<b>' + esc(sk.name) + '</b>' +
          '<span class="dr-req">' + esc(REQP[sk.req] || sk.req) + '</span>' +
          '<span class="dr-desc">' + esc(sk.desc) + '</span>' +
        '</button>';
      }).join('');
      return '<div class="overlay" data-act="closedraft"><div class="panel draft-panel" data-stop="1">' +
        '<div class="panel-head"><h3>' + icon('book') + ' 스킬 드래프트</h3><button class="iconbtn" data-act="closedraft">' + icon('close') + '</button></div>' +
        '<p class="sub">새 스킬 3장 중 하나를 골라 내 스킬 하나와 교체합니다. 잃는 것은 없습니다.</p>' +
        '<div class="dr-list">' + cards + '</div>' +
        '<button class="bigbtn ghost skipbtn" data-act="skipdraft">건너뛰기</button>' +
        '</div></div>';
    }
    const cur = [0, 1, 2, 3, 4].map(function (i) {
      const sk = (r.customSkills && r.customSkills[i]) || DC.CLASSES[r.cls].skills[i];
      const lv = (r.skills || [])[i] || 0;
      return '<button class="ds-row" data-act="draftslot" data-i="' + i + '">' +
        '<span class="ds-ic">' + icon(sk.ic) + '</span>' +
        '<span class="ds-main"><b>' + esc(sk.name) + (lv ? ' <i class="upmark">각성</i>' : '') + '</b>' +
          '<span>' + esc(sk.desc) + '</span></span>' +
        '<span class="ds-swap">' + icon('reroll') + '교체</span>' +
      '</button>';
    }).join('');
    return '<div class="overlay" data-act="closedraft"><div class="panel draft-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 어느 슬롯을 바꿀까요</h3><button class="iconbtn" data-act="closedraft">' + icon('close') + '</button></div>' +
      '<p class="sub"><b class="dr-pick">' + esc(d.pick.name) + '</b> — ' + esc(d.pick.desc) + '</p>' +
      '<div class="ds-list">' + cur + '</div>' +
      '</div></div>';
  }

  function renderPatchNotes() {
    const rows = (DC.CHANGELOG || []).map(function (v) {
      return '<div class="pn-row"><div class="pn-v">v' + esc(v.v) + '</div><div><b>' + esc(v.t) + '</b>' +
        v.items.map(function (it) { return '<span>' + esc(it) + '</span>'; }).join('') + '</div></div>';
    }).join('');
    return '<div class="overlay" data-act="closepatch"><div class="panel pn-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('star') + ' 업데이트 노트</h3><button class="iconbtn" data-act="closepatch">' + icon('close') + '</button></div>' +
      '<p class="sub">최근 변경 사항만 모았습니다 · 현재 v' + esc(DC.VERSION) + '</p>' +
      '<div class="pn-list">' + rows + '</div></div></div>';
  }

  function renderRemove(state) {
    const r = state.run;
    const cards = r.dice.map(function (d, i) {
      return '<button class="rm-die" data-act="removedie" data-i="' + i + '" style="--c:' + d.c + '">' +
        '<b>' + esc(d.name) + '</b>' +
        '<span class="rm-faces">' + d.faces.map(function (f) { return faceMini(f); }).join('') + '</span>' +
      '</button>';
    }).join('');
    return '<div class="overlay" data-act="closeremove"><div class="panel rm-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('trash') + ' 주사위 정리</h3><button class="iconbtn" data-act="closeremove">' + icon('close') + '</button></div>' +
      '<p class="sub">버릴 주사위를 고르세요. 주사위는 최소 3개가 남아야 합니다.</p>' +
      '<div class="rm-list">' + cards + '</div>' +
      '</div></div>';
  }

  function renderTut() {
    return '<div class="overlay tut-overlay" data-act="closetut"><div class="panel tut-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 세 가지 규칙</h3></div>' +
      '<div class="tut-steps">' +
        '<div class="tut-step"><span class="tut-n" style="--c:#fbbf24">1</span>' +
          '<div><b>굴리고, 조건에 맞춰 놓는다</b><p>매 턴 주사위가 전부 굴려집니다. 주사위를 고르면 낼 수 있는 스킬이 켜지고 예상 피해가 보입니다. 슬롯의 조건(짝수·홀수·4 이상…)에 맞는 주사위만 올릴 수 있습니다.</p></div></div>' +
        '<div class="tut-step"><span class="tut-n" style="--c:#67e8f9">2</span>' +
          '<div><b>이어 쓰면 배율이 오른다</b><p>한 턴에 스킬을 연달아 쓰면 콤보가 쌓이고 피해 배율이 최대 ×3.5까지 상승합니다. 배율은 턴이 끝나면 초기화됩니다.</p></div></div>' +
        '<div class="tut-step"><span class="tut-n" style="--c:#34d399">3</span>' +
          '<div><b>면을 바꾸는 것이 성장이다</b><p>단조 노드에서 주사위의 면 하나를 영구 교체합니다. 같은 눈 두 개를 연달아 쓰면 <b>페어</b> 보너스가 붙습니다.</p></div></div>' +
      '</div>' +
      '<div class="tut-new">' +
        '<div class="tn-row"><span style="--c:#fde68a">' + icon('crown') + '</span><div><b>보스 유물</b><p>1·2막 보스를 잡으면 큰 힘과 대가가 함께 있는 유물 3장 중 하나를 고릅니다.</p></div></div>' +
        '<div class="tn-row"><span style="--c:#c084fc">' + icon('book') + '</span><div><b>스킬 드래프트</b><p>보상에서 새 스킬을 골라 내 슬롯 하나와 바꿀 수 있습니다.</p></div></div>' +
        '<div class="tn-row"><span style="--c:#67e8f9">' + icon('spark') + '</span><div><b>유물 시너지</b><p>정해진 유물 두 개를 모으면 추가 효과가 발동합니다(덱 화면에서 확인).</p></div></div>' +
      '</div>' +
      '<p class="tut-goal">' + icon('crown') + '<span>목표: <b>ACT 3의 주사위 군주</b>를 쓰러뜨리면 승리. 그 뒤에는 끝없는 심연이 기다립니다.</span></p>' +
      '<p class="tut-foot">' + icon('eye') + '모든 적의 다음 행동은 화면에 그대로 보입니다 — 완전 정보 전투.</p>' +
      '<button class="bigbtn primary tut-start" data-act="closetut">시작하기</button>' +
    '</div></div>';
  }

  function renderHistory(state) {
    const list = DC.Meta.history();
    const CLS = DC.classesShort || {};
    const rows = list.map(function (h) {
      const d = new Date(h.t);
      const p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      const when = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
      return '<div class="hist-row ' + (h.win ? 'win' : 'lose') + '">' +
        '<div class="hist-res">' + (h.win ? icon('crown') : icon('skull')) + '</div>' +
        '<div class="hist-main">' +
          '<div class="hist-top"><b>' + esc(CLS[h.cls] || h.cls) + '</b>' +
            '<span class="hist-asc">승천 ' + (h.asc || 0) + '</span>' +
            '<span class="hist-act">ACT ' + h.act + '</span>' +
            '<i>' + (h.win ? '승리' : '패배') + '</i></div>' +
          '<div class="hist-sub">' + when + ' · ' + (h.dmg || 0) + ' 피해 · 콤보 ' + (h.maxCombo || 0) +
            ' · 주사위 ' + (h.dice ? h.dice.length : 0) + ' · 유물 ' + (h.relics ? h.relics.length : 0) + '</div>' +
          (h.seed ? '<div class="hist-seed">' + icon('copy') + esc(DC.seedDisplay(h.seed)) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    const m = DC.Meta.get();
    const total = list.length;
    const wins = list.filter(function (h) { return h.win; }).length;
    const rate = total ? Math.round((wins / total) * 100) : 0;
    const bestDepth = m.bestDepth || 3;
    const bestCombo = m.bestCombo || 0;
    const streak = (function () {
      let n = 0;
      for (let i = 0; i < list.length; i++) { if (list[i].win) n++; else break; }
      return n;
    })();
    const byCls = DC.CLASS_IDS.map(function (id) {
      const w = list.filter(function (h) { return h.cls === id && h.win; }).length;
      const t = list.filter(function (h) { return h.cls === id; }).length;
      return '<span class="hs-cls"><b>' + esc((DC.classesShort || {})[id] || id) + '</b> ' + w + '/' + t + '</span>';
    }).join('');
    const summary = '<div class="hist-sum">' +
      '<div class="hs-grid">' +
        '<div><span>런</span><b>' + total + '</b></div>' +
        '<div><span>승리</span><b>' + wins + '</b></div>' +
        '<div><span>승률</span><b>' + rate + '<i>%</i></b></div>' +
        '<div><span>최고 깊이</span><b>' + bestDepth + '</b></div>' +
        '<div><span>최고 콤보</span><b>' + bestCombo + '</b></div>' +
        '<div><span>연속 승리</span><b>' + streak + '</b></div>' +
      '</div>' +
      '<div class="hs-classes">' + byCls + '</div></div>';
    return '<div class="overlay" data-act="closehistory"><div class="panel hist-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('clock') + ' 런 기록</h3><button class="iconbtn" data-act="closehistory">' + icon('close') + '</button></div>' +
      summary +
      '<div class="hist-list">' + (rows || '<div class="hist-empty">아직 기록이 없습니다.<br/>첫 런을 시작해 보세요.</div>') + '</div>' +
      '</div></div>';
  }

  /* v7.7 — 도감: 잠금 항목을 벽이 아니라 '실루엣'으로.
     등급·막·유형 힌트는 열고, 이름과 수치는 발견 후에. */
  const CX_TIER = { 1: '기본', 2: '고급', 3: '전설' };
  const CX_TIER_HINT = { 1: '상점·보상', 2: '상점·정예', 3: '보상·보스' };

  function cxMeter(label, got, total, c) {
    const p = total ? Math.round((got / total) * 100) : 0;
    return '<span class="cxp" style="--c:' + c + '"><b>' + label + '</b><em>' + got + '<i>/' + total + '</i></em>' +
      '<u><s style="width:' + p + '%"></s></u></span>';
  }

  function cxSilDie(tier, ic, c) {
    return '<span class="cxd-silo tier-' + tier + (ic ? ' has-ic' : '') + '" aria-hidden="true" style="--fc:' + (c || '#b9a88f') + '">' +
      (ic ? icon(ic) : '<i></i><i></i><i></i>') + '</span>';
  }

  function renderCodex(state) {
    const meta = DC.Meta.get();
    const pg = DC.Meta.progress();
    const seenDice = meta.seen.dice || [], seenRelic = meta.seen.relics || [], seenEnemy = meta.seen.enemies || [];

    const dice = DC.DICE_IDS.map(function (id) {
      const D = DC.DICE[id];
      const got = seenDice.indexOf(id) >= 0;
      const tier = D.tier || 1;
      if (!got) {
        // 실루엣 힌트: 가장 강한 면의 계열만 흐리게 보여 준다 (이름·수치는 숨김)
        const top = D.faces.slice().sort(function (a, b) { return b.v - a.v; })[0];
        const tk = DC.KINDS[top.k] || DC.KINDS.blank;
        return '<div class="cx-die locked tier-' + tier + '" style="--c:' + D.c + '">' +
          '<span class="cx-tier t' + tier + '">' + CX_TIER[tier] + '</span>' +
          cxSilDie(tier, tk.ic, tk.c) +
          '<b>???</b>' +
          '<span class="cx-hint">' + CX_TIER_HINT[tier] + '</span>' +
          '<span class="cx-lock">' + icon('lock') + '</span></div>';
      }
      return '<div class="cx-die tier-' + tier + '" style="--c:' + D.c + '">' +
        '<span class="cx-tier t' + tier + '">' + CX_TIER[tier] + '</span>' +
        '<b>' + esc(D.name) + '</b><div class="cx-faces">' + D.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' +
        '<span class="cx-hint">' + esc(D.tag || CX_TIER[tier]) + '</span></div>';
    }).join('');

    const relicCard = function (id) {
      const R = DC.RELICS[id];
      const got = seenRelic.indexOf(id) >= 0;
      return '<div class="cx-relic' + (got ? '' : ' locked') + (R.boss ? ' boss' : '') + '" style="--c:' + R.c + '">' +
        relicIcon(id, 'relic-art cx-art') +
        '<div><b>' + esc(got ? R.name : '???') + (R.boss ? ' <i class="cx-boss">보스</i>' : '') + '</b>' +
        '<span>' + (got ? esc(R.desc) + (R.trade ? ' <em class="cx-trade">' + esc(R.trade) + '</em>' : '') : '<i class="cx-dim">' + (R.boss ? '보스 유물' : '상점 · 보상') + '</i>') + '</span></div>' +
        (got ? '' : '<span class="cx-lock">' + icon('lock') + '</span>') +
        '</div>';
    };
    const normalRelics = DC.RELIC_IDS.filter(function (id) { return !DC.RELICS[id].boss; });
    const bossRelics = DC.RELIC_IDS.filter(function (id) { return DC.RELICS[id].boss; });
    const relics = normalRelics.map(relicCard).join('') +
      '<div class="cx-sub">' + icon('crown') + '보스 유물</div><div class="cx-relics boss-grid">' + bossRelics.map(relicCard).join('') + '</div>';

    const enemyCard = function (e) {
      const got = seenEnemy.indexOf(e.id) >= 0;
      const gtxt = e.gimmick && DC.GIMMICK_TXT[e.gimmick.kind];
      const intents = got && e.intents ? e.intents.map(function (it) {
        return '<i title="' + esc(DC.Combat.intentText(it)) + '">' + icon(DC.Combat.intentIcon(it)) + '</i>';
      }).join('') : '';
      return '<div class="cx-enemy' + (got ? '' : ' locked') + '" style="--c:' + e.c + '">' +
        '<img class="cx-enemy-art' + (got ? '' : ' sil') + '" src="' + DC.enemyArt({ key: e.id }) + '" alt="" draggable="false">' +
        '<b>' + esc(got ? e.name : '???') + '</b>' +
        '<span>' + (got ? '체력 ' + e.hp : (e.title ? '보스' : '미발견')) + '</span>' +
        (got && intents ? '<div class="cx-intents">' + intents + '</div>' : '') +
        (got && gtxt ? '<div class="cx-gimmick">' + esc(gtxt) + '</div>' : '') +
        (got ? '' : '<span class="cx-lock sm">' + icon('lock') + '</span>') +
        '</div>';
    };
    const enemyBlock = function (label, list, cls) {
      if (!list.length) return '';
      const seenN = list.filter(function (e) { return seenEnemy.indexOf(e.id) >= 0; }).length;
      return '<div class="cx-enemy-group"><div class="cx-sub">' + esc(label) +
        '<em>' + seenN + '/' + list.length + '</em></div>' +
        '<div class="cx-enemies ' + (cls || '') + '">' + list.map(enemyCard).join('') + '</div></div>';
    };
    let enemyHtml = '';
    [1, 2, 3].forEach(function (a) {
      const all = (DC.ENEMIES[a] || []).concat(DC.ELITES[a] || []);
      enemyHtml += enemyBlock(a + '막 · ' + (DC.ACTS[a] ? DC.ACTS[a].name : ''), all);
    });
    const abyssBosses = [4, 5, 6].map(function (k) { return DC.BOSSES[k]; }).filter(Boolean);
    enemyHtml += enemyBlock('심연 보스', abyssBosses, 'boss-grid');
    const normalBosses = [1, 2, 3].map(function (k) { return DC.BOSSES[k]; }).filter(Boolean);
    enemyHtml = enemyBlock('막 보스', normalBosses, 'boss-grid') + enemyHtml;

    const seenEv = meta.seen.events || [];
    const events = DC.EVENTS.map(function (ev) {
      const got = seenEv.indexOf(ev.id) >= 0;
      return '<div class="cx-event' + (got ? '' : ' locked') + '">' +
        '<img class="cx-ev-art' + (got ? '' : ' sil') + '" src="' + DC.eventArt(ev.tag, ev.id) + '" alt="" draggable="false">' +
        '<b>' + esc(got ? ev.name : '???') + '</b>' +
        '<span>' + (got ? esc(ev.tag || '') : '<i class="cx-dim">미발견</i>') + '</span>' +
        '</div>';
    }).join('');

    const achs = DC.Meta.achList().map(function (a) {
      const pct = a.prog ? Math.min(100, Math.round(a.prog[0] / Math.max(1, a.prog[1]) * 100)) : 0;
      return '<div class="cx-ach' + (a.done ? ' done' : '') + '">' + icon(a.done ? 'check' : 'lock') +
        '<div><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + '</span>' +
        (a.prog ? '<span class="ach-prog"><i style="width:' + pct + '%"></i></span><u>' + a.prog[0] + ' / ' + a.prog[1] + '</u>' : '') +
        '</div></div>';
    }).join('');

    return '<div class="overlay" data-act="closecodex"><div class="panel codex-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 도감 · 업적</h3><button class="iconbtn" data-act="closecodex">' + icon('close') + '</button></div>' +
      '<div class="cx-progress">' +
        cxMeter('주사위', pg.dice, pg.diceTotal, '#e8b45a') +
        cxMeter('유물', pg.relics, pg.relicTotal, '#9fb4cc') +
        cxMeter('적', pg.enemies, pg.enemyTotal, '#e07a6a') +
        cxMeter('이벤트', pg.events, pg.eventTotal, '#b79bff') +
        cxMeter('업적', pg.ach, pg.achTotal, '#7fd6a8') +
      '</div>' +
      '<p class="cx-legend">' + icon('eye') + ' 잠긴 항목은 실루엣으로 표시됩니다 — 등급과 만나는 곳만 미리 알려 줍니다.</p>' +
      '<h4>' + icon('dice') + ' 주사위 <em>등급: 기본 · 고급 · 전설</em></h4><div class="cx-dice-grid">' + dice + '</div>' +
      '<h4>' + icon('star') + ' 유물</h4><div class="cx-relics">' + relics + '</div>' +
      '<h4>' + icon('spark') + ' 유물 시너지</h4><div class="syn-list">' +
        (DC.SYNERGIES || []).map(function (sy) {
          const allSeen = sy.relics.every(function (id) { return seenRelic.indexOf(id) >= 0; });
          return '<div class="syn-row ' + (allSeen ? 'on' : 'off') + '" style="--c:' + sy.c + '">' +
            '<span class="syn-ic">' + icon('spark') + '</span>' +
            '<div><b>' + esc(sy.name) + '</b><span>' + esc(sy.desc) + '</span>' +
            '<i>' + sy.relics.map(function (id) { return esc(allSeen ? ((DC.RELICS[id] || {}).name || id) : '???'); }).join(' + ') + '</i></div>' +
            (allSeen ? '' : '<span class="cx-lock sm">' + icon('lock') + '</span>') +
          '</div>';
        }).join('') + '</div>' +
      '<h4>' + icon('skull') + ' 적</h4>' + enemyHtml +
      '<h4>' + icon('mystery') + ' 이벤트</h4><div class="cx-events">' + events + '</div>' +
      '<h4>' + icon('crown') + ' 업적</h4><div class="cx-achs">' + achs + '</div>' +
      '</div></div>';
  }

  function renderDeep(state) {
    const r = state.run;
    const nextAct = (r.act || 3) + 1;
    const name = DC.actName ? DC.actName(nextAct) : '심연';
    const depth = (r.depth || 3);
    return hud(state) +
      '<main class="deep-screen">' +
        '<div class="deep-glow"></div>' +
        '<div class="deep-ic">' + icon('crown') + '</div>' +
        '<h1>ACT ' + (r.act || 3) + ' 클리어</h1>' +
        '<p class="sub">주사위 군주가 무너졌습니다. 그러나 굴림은 끝나지 않았습니다.</p>' +
        '<div class="deep-card">' +
          '<div class="deep-row"><span>다음</span><b>ACT ' + nextAct + ' · ' + esc(name) + '</b></div>' +
          '<div class="deep-row"><span>적</span><b>체력·공격이 더 강해집니다</b></div>' +
          '<div class="deep-row"><span>변칙</span><b>' + esc((DC.ABYSS_RULES && DC.ABYSS_RULES.length) ? '매 막마다 무작위 심연 변칙' : '없음') + '</b></div>' +
          '<div class="deep-row"><span>회복</span><b>최대 체력의 일부를 회복하고 시작</b></div>' +
          '<div class="deep-row"><span>기록</span><b>깊이 ' + depth + ' · 승리로 기록됩니다</b></div>' +
        '</div>' +
        '<div class="deep-btns">' +
          '<button class="bigbtn primary" data-act="deeper">더 깊이 들어간다</button>' +
          '<button class="bigbtn ghost" data-act="finishrun">여기서 마무리 (승리)</button>' +
        '</div>' +
      '</main>';
  }

  function renderEnd(state, kind) {
    const r = state.run;
    const winInfo = state.ui.winInfo;
    const newAch = state.ui.newAch || [];
    return '' +
      '<main class="end-screen ' + kind + '">' +
        '<span class="scr-kicker">' + (kind === 'win' ? 'VICTORY' : 'DEFEAT') + '</span>' +
        '<div class="end-ic">' + icon(kind === 'win' ? 'crown' : 'skull') + '</div>' +
        '<h1>' + (kind === 'win' ? '정상에 섰다' : '무너졌다') + '</h1>' +
        '<p class="sub">' + (kind === 'win' ? '주사위 군주를 쓰러뜨렸습니다.' : '여정은 여기서 끝났습니다.') + '</p>' +
        (kind === 'win' && winInfo && winInfo.unlocked ? '<div class="unlock-chip">' + icon('up') + ' 승천 ' + winInfo.level + ' 해금!</div>' : '') +
        (newAch.length ? '<div class="end-achs">' + newAch.map(function (a) { return '<span>' + icon('check') + esc(a.name) + '</span>'; }).join('') + '</div>' : '') +
        (function () {
          const su = r.stats && r.stats.skillUse;
          if (!su) return '';
          const top = Object.keys(su).map(function (k) { return [k, su[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
          if (!top.length) return '';
          return '<div class="end-skills">' + top.map(function (t) {
            return '<span><b>' + esc(t[0]) + '</b><i>' + t[1] + '회</i></span>';
          }).join('') + '</div>';
        })() +
        '<div class="end-stats">' +
          '<div><b>ACT ' + r.act + '</b><span>도달</span></div>' +
          '<div><b>' + (r.stats.kills || 0) + '</b><span>처치</span></div>' +
          '<div><b>' + (r.stats.turns || 0) + '</b><span>턴</span></div>' +
          '<div><b>' + (r.stats.dmg || 0) + '</b><span>누적 피해</span></div>' +
        '</div>' +
        (kind === 'win' && r.asc ? '<p class="asc-clear">승천 ' + r.asc + ' 클리어</p>' : '') +
        (kind === 'win' && r.act > 3 ? '<p class="asc-clear">심연 깊이 ' + r.act + ' 도달</p>' : '') +
        '<div class="end-tags">' +
          (r.seed ? '<span class="end-tag">' + icon('copy') + esc(DC.seedDisplay(r.seed)) + '</span>' : '') +
          (r.challenge && r.challenge !== 'none' ? '<span class="end-tag ch">' + icon('crown') + esc(DC.challengeById(r.challenge).short) + '</span>' : '') +
          (r.asc ? '<span class="end-tag">' + icon('up') + '승천 ' + r.asc + '</span>' : '') +
        '</div>' +
        (function () {
          const syns = DC.synergiesFor ? DC.synergiesFor(r.relics) : [];
          const bosses = r.relics.filter(function (id) { return DC.RELICS[id] && DC.RELICS[id].boss; });
          if (!syns.length && !bosses.length) return '';
          return '<div class="end-build">' +
            (syns.length ? '<div class="eb-row"><span>시너지</span>' + syns.map(function (sy) {
              return '<i class="eb-chip" style="--c:' + sy.c + '" data-tip="' + esc(sy.desc) + '" data-tip-title="' + esc(sy.name) + '">' + icon('spark') + esc(sy.name) + '</i>';
            }).join('') + '</div>' : '') +
            (bosses.length ? '<div class="eb-row"><span>보스 유물</span>' + bosses.map(function (id) {
              const R = DC.RELICS[id];
              return '<span class="relic" style="--c:' + R.c + '" data-tip="' + esc(R.desc + (R.trade ? ' · ' + R.trade : '')) + '" data-tip-title="' + esc(R.name) + '">' + relicIcon(id) + '</span>';
            }).join('') + '</div>' : '') +
          '</div>';
        })() +
        (function () {
          const list = DC.Meta.achList().filter(function (a) { return !a.done && a.prog; });
          if (!list.length) return '';
          list.sort(function (a, b) { return (b.prog[0] / Math.max(1, b.prog[1])) - (a.prog[0] / Math.max(1, a.prog[1])); });
          const a = list[0];
          const pct = Math.min(100, Math.round(a.prog[0] / Math.max(1, a.prog[1]) * 100));
          return '<div class="end-goal" data-tip="도감 · 업적에서 전체 목표를 볼 수 있습니다" data-tip-title="다음 목표">' +
            icon('target') + '<div><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + ' · ' + a.prog[0] + '/' + a.prog[1] + '</span>' +
            '<i class="eg-bar"><u style="width:' + pct + '%"></u></i></div></div>';
        })() +
        '<div class="title-btns">' +
          '<button class="bigbtn primary" data-act="newrun">새 게임</button>' +
          (r.seed ? '<button class="bigbtn ghost" data-act="retryseed">같은 시드로 다시</button>' : '') +
          '<button class="bigbtn ghost" data-act="title">타이틀</button>' +
        '</div>' +
      '</main>';
  }

  /* ---------------- overlays ---------------- */
  function synBlock(r) {
    if (!DC.synergiesFor) return '';
    const act = DC.synergiesFor(r.relics);
    const all = DC.SYNERGIES || [];
    const rows = all.map(function (sy) {
      const on = act.some(function (a) { return a.id === sy.id; });
      return '<div class="syn-row' + (on ? ' on' : '') + '" style="--c:' + sy.c + '">' +
        '<span class="syn-ic">' + icon(on ? 'spark' : 'lock') + '</span>' +
        '<div><b>' + esc(sy.name) + '</b><span>' + esc(sy.desc) + '</span>' +
        '<i>' + sy.relics.map(function (id) { return esc((DC.RELICS[id] || {}).name || id); }).join(' + ') + '</i></div>' +
      '</div>';
    }).join('');
    return '<h4>' + icon('spark') + ' 유물 시너지 ' + act.length + '/' + all.length + '</h4><div class="syn-list">' + rows + '</div>';
  }

  function renderDeck(state) {
    const r = state.run;
    const dice = r.dice.map(function (d) {
      return '<div class="deck-die" style="--c:' + d.c + '">' +
        '<div class="dd-name">' + esc(d.name) + (d.mut ? ' <i>단조됨</i>' : '') + '</div>' +
        '<div class="dd-faces">' + d.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' +
      '</div>';
    }).join('');
    // face composition summary
    const comp = {};
    r.dice.forEach(function (d) { d.faces.forEach(function (f) { comp[f.k] = (comp[f.k] || 0) + 1; }); });
    const compKeys = Object.keys(comp).sort(function (a, b) { return comp[b] - comp[a]; });
    const totalFaces = r.dice.length * 6 || 1;
    const compHtml = '<div class="deck-comp">' + compKeys.map(function (k) {
      const kd = DC.KINDS[k] || DC.KINDS.blank;
      const w = Math.round(comp[k] / totalFaces * 100);
      return '<div class="dc-row" style="--c:' + kd.c + '">' +
        '<i>' + icon(kd.ic) + '</i><b>' + kd.n + '</b>' +
        '<span class="dc-bar"><em style="width:' + w + '%"></em></span>' +
        '<u>' + comp[k] + '</u></div>';
    }).join('') + '</div>';
    const relics = r.relics.length ? r.relics.map(function (id) {
      const R = DC.RELICS[id];
      return '<div class="deck-relic" style="--c:' + R.c + '">' + relicIcon(id) + '<div><b>' + esc(R.name) + '</b><span>' + esc(R.desc) + '</span></div></div>';
    }).join('') : '<p class="empty">아직 유물이 없습니다.</p>';
    return '<div class="overlay" data-act="closedeck"><div class="panel deck-panel" data-stop="1">' +
      '<div class="panel-head"><h3>덱 & 유물</h3><button class="iconbtn" data-act="closedeck">' + icon('close') + '</button></div>' +
      '<h4>' + icon('dice') + ' 주사위 ' + r.dice.length + '개 · 면 ' + (r.dice.length * 6) + '</h4>' + compHtml +
      '<div class="deck-dice">' + dice + '</div>' +
      '<h4>' + icon('spark') + ' 스킬 ' + (r.skills || []).filter(function (v) { return v; }).length + '/5 각성</h4><div class="deck-skills">' +
      DC.CLASSES[r.cls].skills.map(function (sk, i) {
        const lv = (r.skills || [])[i] || 0;
        const eff = DC.getSkill(r.cls, i, lv);
        return '<div class="deck-skill' + (lv ? ' done' : '') + '"><span class="ds-ic">' + icon(sk.ic) + '</span><div><b>' + esc(sk.name) + (lv ? ' <i class="upmark">각성</i>' : '') + '</b><span>' + esc(eff.desc) + '</span></div></div>';
      }).join('') +
      '</div>' +
      '<h4>' + icon('star') + ' 유물 ' + r.relics.length + '개</h4><div class="deck-relics">' + relics + '</div>' +
      synBlock(r) +
      '</div></div>';
  }

  function renderHelp() {
    const tab = DC.Game.state.ui.helpTab || 'basic';
    const TABS = [['basic', '기본'], ['combat', '전투'], ['grow', '성장'], ['meta', '기록·모드']];
    const SECTIONS = {
      basic: [
        ['1', '주사위를 굴린다', '매 턴 가방의 주사위가 모두 굴려집니다. 남은 주사위는 턴이 끝나면 사라집니다.'],
        ['2', '주사위 → 스킬', '주사위를 탭해 고르면 낼 수 있는 스킬이 초록으로 켜지고 예상 수치가 보입니다. 그 스킬을 탭하면 바로 나갑니다. 스킬을 먼저 탭하면 그 스킬에 맞는 주사위만 밝아집니다. 끌어다 놓아도 됩니다.'],
        ['3', '슬롯 조건', '짝수·홀수·4 이상·소수·6 등 조건이 맞아야 올릴 수 있습니다. 조건이 안 맞는 스킬은 잠금 표시와 이유가 뜨고, 조건은 주사위 조작으로 맞춥니다.'],
        ['4', '기세로 조작', '재굴림·+1/-1·뒤집기(7-x)·복제로 눈을 바꿉니다. 기세는 매 턴 최대치까지 회복됩니다.'],
        ['5', '연쇄 콤보', '한 턴에 스킬을 이어 쓸수록 배율이 오릅니다(기본 최대 ×3.5). 3·5·7 연쇄에서 연출이 터집니다.'],
        ['6', '단조', '단조 노드에서 주사위의 개별 면을 영구히 교체합니다. 면이 곧 빌드입니다.'],
      ],
      combat: [
        ['A', '페어 시너지', '방금 쓴 주사위와 같은 눈을 연달아 쓰면 그 스킬 피해가 25% 증가합니다.'],
        ['B', '적의 의도', '적 머리 위 아이콘이 다음 행동입니다. 공격 수치·연타·방어·저주를 미리 보고 방어와 공격을 고르세요.'],
        ['C', '상태이상', '화상은 턴마다 감소, 중독은 계속, 취약은 받는 피해 +50%, 약화는 주는 피해 -25%, 힘은 공격마다 추가 피해.'],
        ['D', '플라스크 (연금술사)', '화염·독·번개 면을 쓸 때마다 정수가 담기고 3개가 차면 조합별 비약이 자동 발동합니다. 촉매로 즉시 터뜨릴 수도 있습니다.'],
        ['E', '전투 기록', '주사위 줄 오른쪽 책 아이콘을 누르면 최근 턴의 스킬·적 행동·피해 내역이 펼쳐집니다.'],
        ['F', '되돌리기', '같은 턴 안에서 배치·재굴림·눈 조작을 되돌립니다(Z 또는 ↺).'],
        ['G', '단축키', '1~5 주사위 선택 · Q W E R T 슬롯에 배치 · Enter 턴 종료 · Z 되돌리기 · Esc 창 닫기.'],
      ],
      grow: [
        ['G', '상점', '주사위·유물·단조 도구·회복·각성의 서를 판매합니다. 20골드로 재고를 두 번까지 바꿀 수 있습니다.'],
        ['H', '휴식', '회복(40%)·단련(최대 체력 +8)·단조(면 1회) 중 하나를 고릅니다.'],
        ['I', '스킬 각성', '상점의 각성의 서나 보상으로 스킬 하나를 영구 강화합니다. 런이 끝나면 사라집니다.'],
        ['J', '유물', '런 내내 유지되는 패시브입니다. 일반 ' + DC.POOL_RELIC_IDS.length + '종 + 보스 유물 ' + DC.BOSS_RELIC_IDS.length + '종. 조합에 따라 빌드가 달라집니다.'],
        ['J3', '유물 시너지', '정해진 유물 두 개를 모으면 추가 효과가 발동합니다(예: 화염 심장 + 번개 도체 = 폭풍의 심장). 덱 화면과 도감에서 확인할 수 있습니다.'],
        ['J4', '심연 변칙', '승리 후 더 깊이 들어가면 매 막 무작위 변칙이 걸립니다. 지도 상단의 칩을 눌러 확인하세요.'],
        ['J2', '보스 유물', '1막·2막 보스를 쓰러뜨리면 세 장 중 하나를 고릅니다. 강력하지만 반드시 대가(최대 체력·골드·방어 등)가 붙습니다.'],
      ],
      meta: [
        ['K', '시드', '타이틀에서 시드를 입력하면 같은 맵·주사위·상점이 재현됩니다. 「오늘의 시드」는 날짜 기반 일일 런입니다.'],
        ['L', '도전 모드', '유리 몸·탐욕·광란 세 가지 변칙 규칙. 표준 외 모드로 이기면 업적이 열립니다.'],
        ['M', '승천', '승리할 때마다 1단계씩 최대 10까지 해금됩니다. 적 체력·공격·상점가가 누적해서 강해집니다.'],
        ['O', '성기사', '방어도와 신성 면으로 심판을 쌓고, 공격 스킬로 터뜨립니다. 심판 1당 +2 피해, 최대 6.'],
        ['N', '런 기록·도감', '타이틀에서 지난 30런의 승패와 시드, 도감에서 주사위·유물·적·업적 수집 현황을 봅니다.'],
      ],
    };
    const rows = SECTIONS[tab] || SECTIONS.basic;
    return '<div class="overlay" data-act="closehelp"><div class="panel help-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 게임 방법</h3><button class="iconbtn" data-act="closehelp">' + icon('close') + '</button></div>' +
      '<div class="help-tabs">' + TABS.map(function (t) {
        return '<button class="help-tab' + (tab === t[0] ? ' on' : '') + '" data-act="helptab" data-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      rows.map(function (r) {
        return '<div class="help-row"><span class="hn">' + r[0] + '</span><div><b>' + r[1] + '</b><p>' + r[2] + '</p></div></div>';
      }).join('') +
      '<p class="help-foot">' + icon('crown') + '목표: ACT 3의 주사위 군주를 쓰러뜨리면 승리, 그 뒤엔 심연 모드가 이어집니다.</p>' +
      '<button class="help-tut-btn" data-act="showtut">' + icon('book') + '첫 판 안내 다시 보기</button>' +
      '</div></div>';
  }

  /* ---------------- animation ---------------- */
  let animToken = 0;

  function q(sel) { return document.querySelector(sel); }

  function animate(events, done) {
    const token = ++animToken;
    let i = 0;
    const state = DC.Game.state;
    const spr = state.ui.speed === 2 ? 0.45 : 1;

    function targetEl(eid) { return document.querySelector('[data-eid="' + eid + '"]'); }

    function step() {
      if (token !== animToken) return;
      if (i >= events.length) { if (done) done(); return; }
      const ev = events[i++];
      let delay = 70;
      try {
        switch (ev.t) {
          case 'combo':
            DC.Audio.play('combo', ev.n);
            /* 어떤 카드가 이 타격을 냈는지 — 카드 자체가 응답한다 */
            (function () {
              if (!ev.skill) return;
              const cards = document.querySelectorAll('.slots .slot');
              for (let ci = 0; ci < cards.length; ci++) {
                const nm = cards[ci].querySelector('.sk-name');
                if (nm && nm.textContent === ev.skill) {
                  const card = cards[ci];
                  card.classList.remove('fired'); void card.offsetWidth; card.classList.add('fired');
                  setTimeout(function () { card.classList.remove('fired'); }, 460);
                  break;
                }
              }
            })();
            if (ev.n === 3) { DC.FX.banner('연쇄 3!', 'small'); }
            else if (ev.n === 5) { DC.FX.banner('연쇄 5!', 'good'); DC.FX.shake(9); }
            else if (ev.n === 7) { DC.FX.banner('MAX CHAIN!', 'good'); DC.FX.shake(13); DC.FX.flash('rgba(255,190,80,.18)'); }
            const comb = q('.combat');
            if (comb) comb.classList.toggle('heat', ev.n >= 4);
            const badge = q('#combo-badge');
            if (badge) {
              badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
              if (ev.n >= 3) {
                badge.classList.remove('burst'); void badge.offsetWidth; badge.classList.add('burst');
                DC.FX.burst(badge, '#fbbf24', ev.n >= 7 ? 16 : ev.n >= 5 ? 11 : 7);
              }
            }
            if (DC.VFX) DC.VFX.combo(ev.n, badge);
            const dots = document.querySelectorAll('.chain .chain-dot');
            if (dots.length) {
              const last = dots[dots.length - 1];
              last.classList.remove('lit'); void last.offsetWidth; last.classList.add('lit');
            }
            delay = 90;
            break;
          case 'edmg': {
            const el = targetEl(ev.eid);
            if (el) {
              const mag = Math.min(15, Math.round(ev.amount / 4));
              DC.FX.floatAt(el, '-' + ev.amount, ev.heavy ? 'dmg heavy' : 'dmg', { size: (ev.heavy ? 24 : 17) + mag });
              if (ev.amount >= 25 && DC.FX.ring) DC.FX.ring(el, 'rgba(255, 176, 110, .8)');
              if (DC.VFX) { DC.VFX.hit(el, ev.kind || 'slash', !!ev.heavy); DC.VFX.cast(q('#tray') || q('.hp'), el, ev.kind || 'slash'); }
              else DC.FX.burst(el, DC.Combat.faceColor(ev.kind || 'slash'), ev.heavy ? 16 : 8);
              DC.FX.shake(ev.heavy ? 10 : 3 + ev.amount / 6);
              const comboPitch = 1 + Math.min(0.55, ((DC.Game.state.combat && DC.Game.state.combat.combo) || 1) * 0.045);
              if (ev.amount >= 20 || ev.heavy) {
                DC.Audio.play('crit'); el.classList.add('crit');
                DC.FX.flash('rgba(255,210,120,.10)');
                const cmb = q('.combat');
                if (cmb) { cmb.classList.remove('punch'); void cmb.offsetWidth; cmb.classList.add('punch'); }
                setTimeout(function () { el.classList.remove('crit'); }, 380);
              } else DC.Audio.play('hit', ev.heavy, comboPitch);
              el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt');
            }
            delay = ev.heavy ? 190 : 110;
            break;
          }
          case 'pdam': {
            const el = q('.hp');
            if (el) { DC.FX.floatAt(el, '-' + ev.amount, 'pdmg'); }
            DC.FX.shake(6); DC.Audio.play('hit', ev.amount > 12);
            delay = 130;
            break;
          }
          case 'heal': {
            const el = q('.hp');
            if (el) DC.FX.floatAt(el, '+' + ev.amount, 'heal');
            DC.Audio.play('heal');
            break;
          }
          case 'pblock': {
            const el = q('.hp');
            if (el) { DC.FX.floatAt(el, '+' + ev.amount, 'block'); if (DC.VFX) DC.VFX.guard(el); }
            DC.Audio.play('block');
            break;
          }
          case 'eblock': {
            const el = targetEl(ev.eid);
            if (el) DC.FX.floatAt(el, '+' + ev.amount, 'block');
            DC.Audio.play('block');
            break;
          }
          case 'flask': {
            const el = q('.flask-chip');
            if (el) {
              if (ev.e === 'clear') {
                DC.FX.floatAt(el, '비약 완성!', 'heal', { size: 16 });
                el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
                DC.Audio.play('combo', 4);
              } else {
                DC.FX.floatAt(el, '정수 +1', 'status', { size: 13 });
                DC.Audio.play('clack', 1);
              }
            }
            delay = ev.e === 'clear' ? 220 : 80;
            break;
          }
          case 'status': {
            const el = targetEl(ev.eid);
            if (!ev.eid) {
              const hp = q('.hp');
              if (hp && DC.STATUS[ev.s]) DC.FX.floatAt(hp, DC.STATUS[ev.s].n + ' +' + ev.amount, 'status', { size: 15 });
              break;
            }
            if (el && DC.STATUS[ev.s]) DC.FX.floatAt(el, DC.STATUS[ev.s].n + ' +' + ev.amount, 'status', { size: 15 });
            break;
          }
          case 'estatus': {
            const el = targetEl(ev.eid);
            if (el && DC.STATUS[ev.s]) DC.FX.floatAt(el, DC.STATUS[ev.s].n + ' +' + ev.amount, 'status', { size: 15 });
            break;
          }
          case 'pstatus': {
            const el = q('.hp');
            if (el && DC.STATUS[ev.s]) DC.FX.floatAt(el, DC.STATUS[ev.s].n + ' ' + ev.amount, 'status', { size: 15 });
            break;
          }
          case 'spark':
            if (ev.amount > 0) { DC.Audio.play('spark'); DC.FX.floatAt(q('.spark') || q('.hud'), '+' + ev.amount + ' 기세', 'spark'); }
            break;
          case 'vstack': {
            const el = q('.vchip');
            if (el) {
              DC.FX.floatAt(el, '심판 +' + Math.max(1, (ev.n || 1) - 0) , 'status', { size: 14 });
              el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
              DC.Audio.play('verdict');
            }
            break;
          }
          case 'kill': {
            const el = targetEl(ev.eid);
            if (el) {
              el.classList.add('dying'); DC.Audio.play('big'); DC.FX.shake(9);
              if (DC.VFX) DC.VFX.death(el, 'slash'); else DC.FX.burst(el, DC.Combat.faceColor('slash'), 18);
              DC.FX.banner('격파!', 'small');
            }
            delay = 230;
            break;
          }
          case 'curse':
            DC.FX.banner('주사위 ' + ev.n + '개 봉인!', 'bad'); DC.Audio.play('error');
            delay = 200;
            break;
          case 'msg':
            DC.FX.banner(ev.text, 'small');
            (function () { const sr = q('#sr-status'); if (sr) sr.textContent = ev.text; })();
            break;
          case 'triple': {
            const badge = q('#combo-badge');
            if (ev.n >= 4) { DC.FX.banner('쿼드 연쇄!', 'good'); DC.FX.shake(9); }
            else { DC.FX.banner('트리플!', 'small'); }
            if (badge) { badge.classList.remove('burst'); void badge.offsetWidth; badge.classList.add('burst'); }
            DC.Audio.play('combo', Math.min(7, ev.n + 2));
            delay = 110;
            break;
          }
          case 'bossline':
            DC.FX.banner(ev.text, ev.soft ? 'boss soft' : 'boss');
            delay = 260;
            break;
          case 'gimmick':
            DC.FX.flash('rgba(255,80,80,.20)'); DC.FX.shake(12);
            break;
          case 'spawn':
            DC.FX.banner('분열!', 'bad');
            delay = 200;
            break;
          case 'won':
            DC.Audio.play('win');
            if (q('.combat')) q('.combat').classList.remove('heat');
            if (DC.VFX) DC.VFX.clear(); else DC.FX.banner('VICTORY', 'good');
            delay = 260;
            break;
          case 'lost':
            DC.Audio.play('lose');
            DC.FX.banner('DEFEAT', 'bad');
            delay = 260;
            break;
          case 'newturn':
            DC.Audio.play('turn');
            delay = 40;
            break;
        }
      } catch (e) { /* FX must never break the game */ }
      setTimeout(step, Math.max(16, delay * spr));
    }
    step();
  }

  /* ---------------- tooltip layer ---------------- */
  const UI = {
    showTip: function (el) {
      const text = el.getAttribute('data-tip');
      if (!text) return;
      const title = el.getAttribute('data-tip-title') || '';
      let layer = document.getElementById('tip');
      if (UI._tipEl === el && layer && layer.classList.contains('show')) { UI.hideTip(); return; }
      if (!layer) {
        layer = document.createElement('div');
        layer.id = 'tip';
        document.body.appendChild(layer);
      }
      layer.innerHTML = (title ? '<b>' + esc(title) + '</b>' : '') + '<span>' + esc(text) + '</span>';
      layer.classList.add('show');
      const r = el.getBoundingClientRect();
      const tw = layer.offsetWidth, th = layer.offsetHeight;
      let x = r.left + r.width / 2 - tw / 2;
      x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
      let y = r.top - th - 10;
      if (y < 58) y = Math.min(window.innerHeight - th - 10, r.bottom + 10);
      layer.style.left = x + 'px';
      layer.style.top = y + 'px';
      UI._tipEl = el;
      DC.Audio.play('click');
    },

    hideTip: function () {
      const layer = document.getElementById('tip');
      if (layer) layer.classList.remove('show');
      UI._tipEl = null;
    },

    /* drag dice from the tray onto a slot (pointer events; tap still works) */
    bindDrag: function () {
      const app = document.getElementById('app');
      if (!app || app._dragBound) return;
      app._dragBound = true;
      let st = null;

      function clearHover() {
        document.querySelectorAll('.slot.drag-over').forEach(function (s) { s.classList.remove('drag-over'); });
      }

      app.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        const die = e.target.closest('[data-act="hand"]');
        if (!die || !app.contains(die)) return;
        const state = DC.Game.state;
        const c = state.combat;
        if (!c || c.phase !== 'player' || state.ui.busy) return;
        const idx = parseInt(die.dataset.idx, 10);
        const h = c.hand[idx];
        if (!h || h.used || h.locked) return;
        const r = die.getBoundingClientRect();
        st = { idx: idx, x: e.clientX, y: e.clientY, rect: r, running: false, ghost: null, pid: e.pointerId };
      });

      app.addEventListener('pointermove', function (e) {
        if (!st || st.pid !== e.pointerId) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!st.running && Math.sqrt(dx * dx + dy * dy) < 9) return;
        if (!st.running) {
          st.running = true;
          DC.Game.state.ui.sel = st.idx;
          DC.UI.render();
          const g = document.createElement('div');
          g.className = 'drag-ghost';
          g.style.width = st.rect.width + 'px';
          g.style.height = st.rect.height + 'px';
          g.style.left = st.rect.left + 'px';
          g.style.top = st.rect.top + 'px';
          const h = DC.Game.state.combat.hand[st.idx];
          const k = DC.KINDS[h.k] || DC.KINDS.blank;
          g.style.setProperty('--c', k.c);
          g.innerHTML = pips(h.v) + '<span class="die-ic">' + icon(k.ic) + '</span><span class="die-val">' + h.v + '</span><span class="die-kind">' + k.n + '</span>';
          document.body.appendChild(g);
          st.ghost = g;
        }
        st.ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.07)';
        clearHover();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const slot = under && under.closest('.slot');
        if (slot) slot.classList.add('drag-over');
      });

      function endDrag(e) {
        if (!st) return;
        const stt = st;
        st = null;
        clearHover();
        if (!stt.running) return;
        if (stt.ghost && stt.ghost.parentNode) stt.ghost.parentNode.removeChild(stt.ghost);
        UI._suppressClick = Date.now() + 350;
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const slot = under && under.closest('.slot');
        if (slot) {
          const si = parseInt(slot.dataset.idx, 10);
          DC.Game.play(stt.idx, si);
        } else {
          DC.Game.state.ui.sel = null;
          DC.UI.render();
        }
      }
      app.addEventListener('pointerup', endDrag);
      app.addEventListener('pointercancel', function () {
        if (st && st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
        st = null; clearHover();
        DC.Game.state.ui.sel = null; DC.UI.render();
      });
    },

    render: function () {
      const state = DC.Game.state;
      const app = document.getElementById('app');
      if (!app) return;
      /* 화면이 바뀌면 이전 화면의 툴팁이 남지 않게 한다 */
      UI.hideTip();
      let html = '';
      switch (state.screen) {
        case 'title': html = renderTitle(state); break;
        case 'class': html = renderClass(state); break;
        case 'gift': html = renderGift(state); break;
        case 'map': html = renderMap(state); break;
        case 'combat': html = renderCombat(state); break;
        case 'reward': html = renderReward(state); break;
        case 'bossrelic': html = renderBossRelic(state); break;
        case 'forge': html = renderForge(state); break;
        case 'shop': html = renderShop(state); break;
        case 'rest': html = renderRest(state); break;
        case 'event': html = renderEvent(state); break;
        case 'deep': html = renderDeep(state); break;
        case 'win': html = renderEnd(state, 'win'); break;
        case 'gameover': html = renderEnd(state, 'lose'); break;
        default: html = '<main class="title-screen"><h1>...</h1></main>';
      }
      app.className = 'app screen-' + state.screen + (state.run ? ' act-' + state.run.act : '');
      const WORLDBG = { map: 1, reward: 1, shop: 1, forge: 1, rest: 1, event: 1, bossrelic: 1, deep: 1, win: 1, gameover: 1, gift: 1 };
      if (state.run && WORLDBG[state.screen] && DC.bgUrl) {
        app.classList.add('has-world');
        app.style.setProperty('--world', 'url("' + DC.bgUrl(state.run.act) + '")');
      } else {
        app.classList.remove('has-world');
      }
      app.innerHTML = html;
      /* 화면이 바뀌면 이전 전투의 피해 숫자·배너가 새 화면 위에 남지 않게 한다 */
      if (state.ui._lastScreen && state.ui._lastScreen !== state.screen) {
        const fxLayer = document.getElementById('fx');
        if (fxLayer) fxLayer.innerHTML = '';
        if (DC.FX && DC.FX.clearBanners) DC.FX.clearBanners();
      }
      state.ui._lastScreen = state.screen;
      if (state.ui.modal === 'deck' && state.run) app.innerHTML += renderDeck(state);
      if (state.ui.modal === 'help') app.innerHTML += renderHelp();
      if (state.ui.modal === 'skills' && state.run) app.innerHTML += renderSkills(state);
      if (state.ui.modal === 'codex') app.innerHTML += renderCodex(state);
      if (state.ui.modal === 'history') app.innerHTML += renderHistory(state);
      if (state.ui.modal === 'tut') app.innerHTML += renderTut();
      if (state.ui.modal === 'challenge') app.innerHTML += renderChallenge(state);
      if (state.ui.modal === 'remove' && state.run) app.innerHTML += renderRemove(state);
      if (state.ui.modal === 'settings') app.innerHTML += renderSettings(state);
      if (state.ui.modal === 'draft' && state.ui.draft) app.innerHTML += renderDraft(state);
      if (state.ui.modal === 'patch') app.innerHTML += renderPatchNotes();
      if (!document.querySelector('.rotate-hint')) {
        const rh = document.createElement('div');
        rh.className = 'rotate-hint';
        rh.innerHTML = icon('flip') + '<b>세로로 돌려 주세요</b><span>다이스 체인은 세로 화면에 맞춰 설계되었습니다</span>';
        document.body.appendChild(rh);
      }
      /* micro-interactions: gold pop + dice roll-in on new turn */
      if (state.run) {
        if (state.ui._lastGold != null && state.run.gold !== state.ui._lastGold) {
          const g = document.querySelector('.goldchip');
          if (g) { g.classList.add('pop'); }
        }
        state.ui._lastGold = state.run.gold;
      }
      if (state.screen === 'combat' && state.combat) {
        if (state.ui._lastTurn !== state.combat.turn) {
          const tr = document.querySelector('.tray');
          if (tr) {
            tr.classList.add('roll-in');
            const dice = tr.querySelectorAll('.die');
            dice.forEach(function (d, i) {
              const hnd = state.combat && state.combat.hand[i];
              const col = '#' + ((DC.KINDS[hnd ? hnd.k : ''] || DC.KINDS.blank).c || 'ffffff').replace('#', '');
              setTimeout(function () {
                if (DC.VFX && d.isConnected) DC.VFX.diceLand(d, col);
              }, 380 + i * 42);
            });
            setTimeout(function () { tr.classList.remove('roll-in'); }, 1100);
          }
          state.ui._lastTurn = state.combat.turn;
        }
      } else {
        state.ui._lastTurn = null;
      }
      document.body.setAttribute('data-screen', state.screen);
      if (state.run) document.body.setAttribute('data-act', state.run.act);
      if (DC.AudioMusic) {
        let mode;
        if (state.screen === 'combat') mode = (state.combat && state.combat.kind === 'boss') ? 'boss' : 'combat';
        else if (state.screen === 'map') mode = 'map';
        else if (state.screen === 'title' || state.screen === 'class') mode = 'title';
        else if (state.screen === 'win' || state.screen === 'gameover') mode = null;
        else mode = 'camp';
        DC.AudioMusic.set(mode);
      }
      if (state.screen === 'map') requestAnimationFrame(drawMapEdges);
      if (state.screen === 'combat') UI.bindDrag();
      if (state.ui.sel != null) UI.hideTip();
    },

    toast: function (msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
      clearTimeout(UI._toastTimer);
      UI._toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1700);
    },

    clearToast: function () {
      const t = document.getElementById('toast');
      if (t) t.classList.remove('show');
    },

    animate: animate,
    drawMapEdges: drawMapEdges,
    esc: esc,
    icon: icon,
    dieChip: dieChip,
    faceMini: faceMini,
  };
  DC.UI = UI;
})();
