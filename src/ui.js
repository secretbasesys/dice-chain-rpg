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

  function dieChip(h, i, opts) {
    opts = opts || {};
    const k = DC.KINDS[h.k] || DC.KINDS.blank;
    const cls = ['die', h.used ? 'used' : '', h.locked ? 'locked' : '', opts.sel ? 'sel' : '', h.phantom ? 'phantom' : ''].join(' ');
    return '' +
      '<div class="' + cls + '" data-act="hand" data-idx="' + i + '" style="--c:' + k.c + '" role="button" tabindex="0" aria-label="주사위 ' + h.v + ' ' + k.n + '">' +
        pips(h.v) +
        '<span class="die-ic">' + icon(k.ic) + '</span>' +
        '<span class="die-val">' + h.v + '</span>' +
        '<span class="die-kind">' + k.n + '</span>' +
        (h.locked ? '<span class="die-lock">' + icon('lock') + '</span>' : '') +
        (h.used ? '<span class="die-used">' + icon('check') + '</span>' : '') +
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

  function hud(state, extra) {
    const c = state.combat;
    const r = state.run;
    const hp = c ? c.hp : r.hp;
    const maxHpv = c ? c.maxHp : r.maxHp;
    const gold = r.gold;
    const relics = r.relics.map(function (id) {
      const R = DC.RELICS[id];
      return '<span class="relic" style="--c:' + R.c + '" data-tip="' + esc(R.desc) + '" data-tip-title="' + esc(R.name) + '">' + relicIcon(id) + '</span>';
    }).join('');
    return '' +
      '<div class="hud">' +
        '<div class="hud-left">' +
          '<div class="hp" data-tip="피해는 방어도가 먼저 흡수합니다. 0이 되면 패배." data-tip-title="체력">' +
            '<div class="hp-top"><span class="hp-num">' + Math.max(0, hp) + '<i>/' + maxHpv + '</i></span>' +
              (c && c.block > 0 ? '<span class="blockchip" data-tip="' + esc(DC.KEYWORDS.block.t) + '" data-tip-title="방어도">' + icon('shield') + c.block + '</span>' : '') +
            '</div>' +
            '<div class="hpbar"><i style="width:' + pct(hp, maxHpv) + '%"></i></div>' +
          '</div>' +
        '</div>' +
        '<div class="hud-mid">' + relics + '</div>' +
        '<div class="hud-right">' +
          '<span class="goldchip" title="골드">' + icon('coin') + gold + '</span>' +
          '<button class="iconbtn" data-act="deck" title="덱 보기" aria-label="덱 보기">' + icon('book') + '</button>' +
          '<button class="iconbtn" data-act="sound" title="소리" aria-label="소리">' + icon(DC.Audio.isMuted() ? 'mute' : 'sound') + '</button>' +
          '<button class="iconbtn" data-act="help" title="도움말" aria-label="도움말">' + icon('mystery') + '</button>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- combat ---------------- */
  function intentTip(it, e) {
    if (!it) return '의도 없음';
    switch (it.k) {
      case 'attack': return '다음 내 턴에 ' + (it.hits > 1 ? it.v + ' 피해 × ' + it.hits + '회' : it.v + ' 피해') + '를 줍니다. 방어도로 막으세요.';
      case 'defend': return '방어도를 ' + it.v + ' 얻습니다. 이번 턴 공격이 흡수됩니다.';
      case 'buff': return '힘이 ' + it.v + ' 증가해 이후 공격이 강해집니다.';
      case 'debuff': return (DC.STATUS[it.s] ? DC.STATUS[it.s].n : '약화') + ' ' + it.v + '을 나에게 겁니다.';
      case 'curse': return '내 주사위 ' + it.n + '개를 봉인합니다. 이번 턴 사용할 수 없습니다.';
      case 'drain': return it.v + ' 피해를 주고 그 절반을 회복합니다.';
      default: return '알 수 없는 의도';
    }
  }

  function enemyCard(c, e, idx) {
    const it = DC.Combat.intentOf(e);
    const dead = e.hp <= 0;
    const incoming = it && it.k === 'attack' ? it.v * (it.hits || 1) : 0;
    const lethal = incoming > 0 && incoming >= (c.hp + c.block) && !dead;
    return '' +
      '<div class="enemy ' + (dead ? 'dead' : '') + ' ' + (c.target === idx ? 'targeted' : '') + '" data-eid="' + e.id + '" data-act="target" data-i="' + idx + '" style="--c:' + e.c + '" role="button" tabindex="0" aria-label="' + esc(e.name) + '">' +
        (dead ? '' : '<div class="intent it-' + (it ? it.k : 'none') + (lethal ? ' lethal' : '') + '" data-tip="' + esc(intentTip(it, e)) + '" data-tip-title="적의 의도">' + icon(DC.Combat.intentIcon(it)) + '<b>' + esc(DC.Combat.intentText(it)) + '</b></div>') +
        '<div class="enemy-art">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + DC.monsterArt(e.art, e) + '</svg>' +
        '</div>' +
        '<div class="enemy-shadow"></div>' +
        '<div class="enemy-name">' + esc(e.name) + '</div>' +
        (e.title ? '<div class="enemy-title">' + esc(e.title) + '</div>' : '') +
        '<div class="hpbar enemy-hp"><i style="width:' + pct(e.hp, e.maxHp) + '%"></i></div>' +
        '<div class="enemy-foot"><span class="ehp">' + Math.max(0, e.hp) + '/' + e.maxHp + '</span>' + (e.block > 0 ? '<span class="echip" data-tip="' + esc(DC.KEYWORDS.block.t) + '" data-tip-title="방어도">' + icon('shield') + e.block + '</span>' : '') + statusChips(e.st) + '</div>' +
      '</div>';
  }

  function slotCard(c, idx, selHand) {
    const sk = DC.Combat.skill(c, idx);
    const slot = c.slots[idx];
    const req = DC.REQ[sk.req];
    const filled = slot.handIdx !== null ? c.hand[slot.handIdx] : null;
    const canAny = selHand != null ? DC.Combat.canPlay(c, selHand, idx).ok : null;
    const info = (selHand != null && canAny) ? DC.Combat.previewInfo(c, selHand, idx) : null;
    const prev = info ? (info.lethal ? info.text + ' · 처치' : info.text) : '';
    const justPlaced = slot.anim && Date.now() - slot.anim < 500;
    return '' +
      '<div class="slot ' + (filled ? 'filled' : '') + ' ' + (canAny ? 'can' : '') + ' ' + (canAny === false ? 'cannot' : '') + (justPlaced ? ' landed' : '') + '" data-act="slot" data-idx="' + idx + '" role="button" tabindex="0">' +
        '<div class="slot-top">' +
          '<span class="slot-ic">' + icon(sk.ic) + '</span>' +
          '<span class="slot-name">' + esc(sk.name) + (sk.up ? '<i class="upmark">각성</i>' : '') + '</span>' +
          '<span class="req req-' + sk.req + '" data-tip="' + esc(DC.KEYWORDS.req.t) + '" data-tip-title="' + esc(req.n) + '">' + icon(req.ic) + esc(req.n) + '</span>' +
        '</div>' +
        '<div class="slot-bottom">' +
          (filled
            ? '<span class="slot-die" style="--c:' + (DC.KINDS[filled.k] || DC.KINDS.blank).c + '">' + icon((DC.KINDS[filled.k] || DC.KINDS.blank).ic) + '<b>' + filled.v + '</b></span><span class="slot-eff">' + esc(sk.desc) + '</span>'
            : '<span class="slot-eff">' + esc(sk.desc) + '</span>' + (prev ? '<span class="slot-prev' + (info.lethal ? ' lethal' : '') + '">' + esc(prev) + '</span>' : '')) +
        '</div>' +
      '</div>';
  }

  function forecast(c) {
    const list = DC.Combat.alive(c);
    if (!list.length) return '';
    let total = 0, chips = '';
    list.forEach(function (e) {
      const it = DC.Combat.intentOf(e);
      if (!it) return;
      let danger = false;
      if (it.k === 'attack') { total += it.v * (it.hits || 1); danger = true; }
      chips += '<span class="fc-chip' + (danger ? ' dmg' : '') + '" data-tip="' + esc(intentTip(it, e)) + '" data-tip-title="' + esc(e.name) + ' 의도">' +
        icon(DC.Combat.intentIcon(it)) + '<b>' + esc(e.name) + '</b> ' + esc(DC.Combat.intentText(it)) + '</span>';
    });
    const lethal = total > 0 && total >= c.hp + c.block;
    const hpAfter = Math.max(0, c.hp + c.block - total);
    return '<div class="forecast' + (lethal ? ' lethal' : '') + '">' +
      '<div class="fc-head">' + icon('eye') + '다음 적 턴' +
        (total > 0
          ? '<span class="fc-total' + (lethal ? ' lethal' : '') + '">' + total + ' 피해' + (lethal ? ' · 치명적' : ' → HP ' + hpAfter) + '</span>'
          : '<span class="fc-total calm">직접 공격 없음</span>') +
      '</div>' +
      '<div class="fc-list">' + chips + '</div>' +
    '</div>';
  }

  function flaskUi(c) {
    const f = c.flask || { fire: 0, poison: 0, bolt: 0 };
    const n = (f.fire || 0) + (f.poison || 0) + (f.bolt || 0);
    const COL = { fire: '#ff9f43', poison: '#9ae66e', bolt: '#ffe066' };
    let pips = '';
    ['fire', 'poison', 'bolt'].forEach(function (e) {
      for (let i = 0; i < (f[e] || 0); i++) pips += '<i style="--c:' + COL[e] + '"></i>';
    });
    for (let i = n; i < 3; i++) pips += '<i class="empty"></i>';
    return '<span class="strip-item flask-chip' + (n >= 3 ? ' full' : '') + '" data-tip="' + esc(DC.KEYWORDS.flask.t) + '" data-tip-title="플라스크">' +
      icon('flask') + '<span class="flask-pips">' + pips + '</span><b>' + n + '</b>/3</span>';
  }

  function renderCombat(state) {
    const c = state.combat;
    const sel = state.ui.sel;
    const canAct = c.phase === 'player' && !state.ui.busy;
    const unused = c.hand.filter(function (h) { return !h.used && !h.locked; }).length;
    const m = DC.Combat.mult(c);
    const speed = state.ui.speed === 2 ? 2 : 1;
    const canUndo = canAct && (state.ui.hist || []).length > 0;

    let slots = '';
    for (let i = 0; i < c.slots.length; i++) slots += slotCard(c, i, canAct ? sel : null);

    const logLen = (c.battleLog || []).length;
    const logOpen = !!state.ui.logOpen;
    let logHtml = '';
    if (logOpen) {
      logHtml = '<div class="battle-log">' +
        ((c.battleLog || []).slice(-14).map(function (l) {
          const k = DC.KINDS[l.k];
          return '<div class="bl-row ' + l.side + '">' +
            '<span class="bl-turn">T' + l.turn + '</span>' +
            (l.side === 'p'
              ? '<span class="bl-ic" style="--c:' + (k ? k.c : '#8ea3c4') + '">' + icon(k ? k.ic : 'dice') + '</span><b>' + esc(l.skill) + '</b><i>' + l.v + '</i>'
              : '<span class="bl-ic foe">' + icon('skull') + '</span><b>' + esc(l.name) + '</b>') +
            '<span class="bl-txt">' + esc(l.txt) + '</span>' +
          '</div>';
        }).join('') || '<div class="bl-empty">아직 기록이 없습니다</div>') +
      '</div>';
    }

    let tray = '';
    c.hand.forEach(function (h, i) { tray += dieChip(h, i, { sel: sel === i && canAct }); });

    let chain = '';
    (c.chainLog || []).slice(-6).forEach(function (l) {
      const k = DC.KINDS[l.k] || DC.KINDS.blank;
      chain += '<i class="chain-dot" style="--c:' + k.c + '" data-tip="' + esc(l.skill + ' · ' + k.n + ' ' + l.v + ' — 연쇄 ' + '콤보에 기여') + '">' + icon(k.ic) + '</i>';
    });

    const intent = c.phase === 'enemy' ? '<span class="phase-tag enemy">적의 턴…</span>' :
      (c.phase === 'player' ? '<span class="phase-tag">내 턴</span>' : '');

    return '' +
      hud(state) +
      '<main class="combat' + (state.ui.busy ? ' busy' : '') + '">' +
        '<div class="arena">' +
          '<div class="arena-scene act-' + c.act + '">' +
            '<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + DC.actScene(c.act) + '</svg>' +
          '</div>' +
          '<div class="enemy-row" data-n="' + c.enemies.length + '">' + c.enemies.map(function (e, i) { return enemyCard(c, e, i); }).join('') + '</div>' +
          '<div class="arena-floor"></div>' +
        '</div>' +
        '<div class="strip">' +
          '<div class="strip-main">' +
            '<span class="combo-badge ' + (c.combo > 1 ? 'hot' : '') + '" id="combo-badge" data-tip="' + esc(DC.KEYWORDS.combo.t) + '" data-tip-title="콤보 x' + m.toFixed(1) + '배율 · 다음 +' + (DC.Combat.nextMult(c) - m).toFixed(1) + '">' + icon('mult') + 'x' + m.toFixed(1) + '</span>' +
            (chain ? '<span class="chain">' + chain + '</span>' : '') +
            '<span class="strip-item">' + icon('dice') + '남은 <b id="left-dice">' + unused + '</b></span>' +
            '<span class="strip-item spark" data-tip="' + esc(DC.KEYWORDS.spark.t) + '" data-tip-title="기세">' + icon('spark') + '기세 <b id="spark-num">' + c.sparks + '</b></span>' +
            (c.cls === 'alchemist' ? flaskUi(c) : '') +
            '<span class="strip-item">' + icon('clock') + '턴 <b>' + c.turn + '</b></span>' +
            '<button class="log-toggle' + (logOpen ? ' on' : '') + '" data-act="log" aria-label="전투 기록">' + icon('book') + (logLen ? '<b>' + logLen + '</b>' : '') + '</button>' +
            statusChips(c.statuses) +
          '</div>' +
          '<div class="strip-sub">' +
            (c.phase === 'enemy' ? '<span class="phase-tag enemy">적의 턴…</span>' : '<span class="phase-tag">내 턴</span>') +
            (c.turn === 1 && c.combo === 0 ? '<span class="strip-hint">' + icon('eye') + '주사위를 슬롯으로 끌어다 놓으세요</span>' : '') +
            '<button class="speedbtn" data-act="speed" data-tip="애니메이션 속도를 바꿉니다 (현재 ' + speed + 'x)" data-tip-title="속도">' + speed + 'x</button>' +
          '</div>' +
        '</div>' +
        forecast(c) +
        logHtml +
        '<div class="slots">' + slots + '</div>' +
        '<div class="tray-wrap">' +
          '<div class="tray-label">' + icon('dice') + '주사위 <b>' + c.hand.length + '</b>' + (sel != null ? ' · <span class="pick">' + esc(DC.KINDS[c.hand[sel].k].n + ' ' + c.hand[sel].v) + ' 선택됨 — 슬롯을 탭하세요</span>' : '') + '</div>' +
          '<div class="tray" id="tray">' + tray + '</div>' +
        '</div>' +
        '<div class="actions">' +
          '<div class="manip">' +
            '<button class="mbtn undo" data-act="undo" ' + (canUndo ? '' : 'disabled') + ' data-tip="방금 배치나 주사위 조작을 되돌립니다 (Z)" data-tip-title="되돌리기">' + icon('reroll') + '<span>되돌</span></button>' +
            '<button class="mbtn" data-act="manip" data-op="reroll" ' + (canAct ? '' : 'disabled') + ' data-tip="' + esc(DC.KEYWORDS.reroll.t) + '" data-tip-title="재굴림 (기세 1)">' + icon('reroll') + '<span>재굴림</span></button>' +
            '<button class="mbtn" data-act="manip" data-op="plus" ' + (canAct ? '' : 'disabled') + ' data-tip="기세 1을 쓰고 눈을 +1 합니다." data-tip-title="+1">' + icon('plus') + '<span>+1</span></button>' +
            '<button class="mbtn" data-act="manip" data-op="minus" ' + (canAct ? '' : 'disabled') + ' data-tip="기세 1을 쓰고 눈을 -1 합니다." data-tip-title="-1">' + icon('minus') + '<span>-1</span></button>' +
            '<button class="mbtn" data-act="manip" data-op="flip" ' + (canAct ? '' : 'disabled') + ' data-tip="' + esc(DC.KEYWORDS.flip.t) + '" data-tip-title="뒤집기 7-x">' + icon('flip') + '<span>뒤집기</span></button>' +
            '<button class="mbtn" data-act="manip" data-op="copy" ' + (canAct ? '' : 'disabled') + ' data-tip="' + esc(DC.KEYWORDS.copy.t) + '" data-tip-title="복제 (기세 2)">' + icon('copy') + '<span>복제</span></button>' +
          '</div>' +
          '<button class="endbtn" data-act="endturn" ' + (canAct ? '' : 'disabled') + '>' + icon('check') + '턴 종료</button>' +
        '</div>' +
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
    const boss = DC.BOSSES[r.act <= 3 ? r.act : 4 + (r.act % 2)];
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
            '<span class="act-title">' + esc(DC.actName ? DC.actName(r.act) : (ACT_NAMES[r.act] || '심연')) + '</span></div>' +
          '<div class="map-prog">' +
            (r.challenge && r.challenge !== 'none' ? '<span class="map-ch-chip" style="--c:' + DC.challengeById(r.challenge).c + '">' + esc(DC.challengeById(r.challenge).short) + '</span>' : '') +
            (r.seed ? '<button class="seed-chip" data-act="copyseed" title="시드 복사">' + icon('copy') + esc(DC.seedDisplay(r.seed)) + '</button>' : '') +
            '<b>층 ' + (curRow + 1) + '</b><span>/' + rows + '</span></div>' +
        '</div>' +
        (boss && !bossDone ? '<div class="boss-preview" style="--c:' + boss.c + '">' +
          '<div class="bp-art">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + DC.monsterArt(boss.art, boss) + '</svg>' + '</div>' +
          '<div class="bp-txt"><span>' + icon('crown') + '다가오는 보스</span><b>' + esc(boss.name) + '</b>' +
            (boss.gimmick && DC.GIMMICK_TXT[boss.gimmick.kind] ? '<i>' + esc(DC.GIMMICK_TXT[boss.gimmick.kind]) + '</i>' : '') + '</div>' +
          '<div class="bp-hp"><b>' + boss.hp + '</b><i>HP</i></div>' +
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
    return '<div class="daily-card' + (doneToday ? ' done' : '') + '">' +
      '<div class="dc-head"><span>' + icon('star') + '오늘의 도전</span><b>' + esc(cfg.day) + '</b></div>' +
      '<div class="dc-body">' + esc(cls) + ' · ' + esc(ch.short) + ' · 승천 ' + cfg.asc + '</div>' +
      (doneToday
        ? '<div class="dc-result">' + (last.win ? '오늘 클리어 · ACT ' + last.act : '오늘 기록 · ACT ' + last.act) + '</div>'
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
    return '' +
      '<main class="title-screen">' +
        '<div class="logo-dice">' +
          '<span class="ld ld1">' + icon('sword') + '</span>' +
          '<span class="ld ld2">' + icon('bolt') + '</span>' +
          '<span class="ld ld3">' + icon('shield') + '</span>' +
        '</div>' +
        '<h1 class="logo">다이스 <em>체인</em></h1>' +
        '<p class="logo-sub">DICE CHAIN RPG</p>' +
        '<p class="tagline">주사위를 굴리고, 눈을 바꾸고, 연쇄를 터뜨려라.</p>' +
        '<div class="asc-row">' +
          '<button class="asc-btn" data-act="asc" data-dir="-1" ' + (asc <= 0 ? 'disabled' : '') + ' aria-label="승천 낮추기">' + icon('minus') + '</button>' +
          '<div class="asc-label' + (asc ? ' on' : '') + ' ' + (maxAsc ? '' : 'locked') + '">' +
            '<b>' + (maxAsc ? '승천 ' + asc : '승천 잠김') + '</b>' +
            '<span>' + (maxAsc ? esc(step.desc) : '한 번 승리하면 열립니다') + '</span>' +
          '</div>' +
          '<button class="asc-btn" data-act="asc" data-dir="1" ' + (asc >= maxAsc ? 'disabled' : '') + ' aria-label="승천 높이기">' + icon('plus') + '</button>' +
        '</div>' +
        dailyCard(state) +
        '<button class="challenge-chip' + ((state.ui.challenge && state.ui.challenge !== 'none') ? ' on' : '') + '" data-act="challenge">' +
          icon('crown') + '도전 모드 <b>' + esc(DC.challengeById(state.ui.challenge || 'none').short) + '</b>' +
        '</button>' +
        '<div class="seed-row">' +
          '<span class="seed-ic">' + icon('dice') + '</span>' +
          '<input id="seed-input" class="seed-input" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="14"' +
            ' placeholder="시드 입력 (비우면 무작위)" value="' + esc(state.ui.seed || '') + '" aria-label="시드" />' +
          '<button class="seed-btn" data-act="daily">' + icon('clock') + '오늘의 시드</button>' +
        '</div>' +
        '<div class="title-btns">' +
          (hasSave ? '<button class="bigbtn primary" data-act="resume">이어하기</button>' : '') +
          '<button class="bigbtn ' + (hasSave ? '' : 'primary') + '" data-act="newrun">새 게임</button>' +
          '<button class="bigbtn ghost" data-act="codex">도감 · 업적 <i class="badge-num">' + (prog.dice + prog.relics + prog.enemies) + '</i></button>' +
          '<button class="bigbtn ghost" data-act="history">런 기록 <i class="badge-num">' + DC.Meta.history().length + '</i></button>' +
          '<button class="bigbtn ghost" data-act="help">게임 방법</button>' +
        '</div>' +
        '<p class="ver">v' + DC.VERSION + ' · 승리 ' + meta.wins + '회 · GitHub Pages</p>' +
      '</main>';
  }

  function renderClass(state) {
    const cards = DC.CLASS_IDS.map(function (id) {
      const C = DC.CLASSES[id];
      const dice = C.startDice.map(function (d) {
        return '<span class="dchip" style="--c:' + DC.DICE[d].c + '">' + DC.DICE[d].name + '</span>';
      }).join('');
      return '' +
        '<div class="class-card" data-act="pickclass" data-id="' + id + '" style="--c:' + C.c + '" role="button" tabindex="0">' +
          '<div class="class-badge">' + icon(C.ic || (id === 'warrior' ? 'shield' : id === 'mage' ? 'flame' : id === 'gambler' ? 'star' : 'flask')) + '</div>' +
          '<div class="class-name">' + C.name + '</div>' +
          '<div class="class-en">' + C.en + '</div>' +
          '<p class="class-desc">' + C.desc + '</p>' +
          '<div class="class-stats"><span>' + icon('heart') + C.hp + ' HP</span><span>' + icon('spark') + C.sparks + ' 기세</span></div>' +
          '<div class="class-dice">' + dice + '</div>' +
          '<div class="class-passive">' + icon('star') + '<b>' + C.passive.n + '</b> ' + C.passive.tip + '</div>' +
        '</div>';
    }).join('');
    return '' +
      '<main class="class-screen">' +
        '<h2>클래스를 선택하세요</h2>' +
        '<p class="sub">각 클래스는 다른 주사위와 스킬 슬롯을 가집니다' + ((state.ui.asc || 0) ? ' · 승천 ' + state.ui.asc : '') +
          ((state.ui.challenge && state.ui.challenge !== 'none') ? ' · ' + esc(DC.challengeById(state.ui.challenge).short) : '') + '</p>' +
        '<div class="class-list">' + cards + '</div>' +
      '</main>';
  }

  /* ---------------- reward / forge / shop / rest / event ---------------- */
  function renderReward(state) {
    const rw = state.ui.reward;
    const cards = rw.options.map(function (o, i) {
      const faces = o.faces ? '<div class="rw-faces">' + o.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' : '';
      return '<div class="rw-card" data-act="reward" data-i="' + i + '" style="--c:' + (o.c || '#fbbf24') + '" role="button" tabindex="0">' +
        '<div class="rw-ic">' + (o.kind === 'relic' ? relicIcon(o.id, 'relic-art rw-art') : icon(o.ic || 'star')) + '</div>' +
        '<div class="rw-kind">' + esc(o.kindLabel) + '</div>' +
        '<div class="rw-name">' + esc(o.name) + '</div>' +
        '<div class="rw-desc">' + esc(o.desc) + '</div>' +
        faces +
      '</div>';
    }).join('');
    return hud(state) + '' +
      '<main class="reward-screen">' +
        '<div class="banner-win">' + icon('check') + '승리!</div>' +
        '<div class="gold-gain">' + icon('coin') + '+' + rw.gold + ' 골드</div>' +
        '<h3>보상을 선택하세요</h3>' +
        '<div class="rw-list">' + cards + '</div>' +
        '<button class="bigbtn ghost skipbtn" data-act="skipreward">건너뛰기 (+20 골드)</button>' +
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
      '<p class="sub">면은 영구히 바뀝니다 · 남은 골드 ' + r.gold + 'G</p>' +
      '</div>';

    let strip = '<div class="forge-strip">';
    r.dice.forEach(function (d, di) {
      const on = f.dieIdx === di;
      strip += '<button class="fd-chip ' + (on ? 'on' : '') + '" data-act="fdiedie" data-i="' + di + '" style="--c:' + d.c + '">' +
        '<span class="fd-chip-name">' + esc(d.name) + '</span>' +
        '<span class="fd-chip-faces">' + d.faces.map(function (fc) {
          const k = DC.KINDS[fc.k];
          return '<i style="--c:' + k.c + '">' + icon(k.ic) + fc.v + '</i>';
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
            icon(k.ic) + '<b>' + k.n + ' ' + o.v + '</b><span>' + (cost === 0 ? '무료' : cost + 'G') + '</span></button>';
        }).join('') + '</div>';
      } else {
        body += '<div class="forge-hint small">' + icon('eye') + '<div><b>바꿀 면을 탭하세요</b><span>새 면 5개가 나타납니다</span></div></div>';
      }
    }

    return hud(state) + '' +
      '<main class="forge-screen">' +
        head + strip + body +
        '<div class="bottom-bar"><button class="bigbtn" data-act="forgeexit">단조 완료</button></div>' +
      '</main>';
  }

  function renderShop(state) {
    const sh = state.ui.shop;
    const r = state.run;
    const items = sh.items.map(function (it, i) {
      const afford = r.gold >= it.price;
      const sold = it.sold;
      return '<div class="shop-item ' + (sold ? 'sold' : '') + '" style="--c:' + it.c + '">' +
        '<div class="si-ic">' + (it.kind === 'relic' ? relicIcon(it.id, 'relic-art si-art') : icon(it.ic)) + '</div>' +
        '<div class="si-main"><div class="si-name">' + esc(it.name) + '</div><div class="si-desc">' + esc(it.desc) + '</div>' +
          (it.faces ? '<div class="si-faces">' + it.faces.map(function (f) { return faceMini(f); }).join('') + '</div>' : '') + '</div>' +
        '<button class="buybtn" data-act="buy" data-i="' + i + '" ' + (sold || !afford ? 'disabled' : '') + '>' + (sold ? '판매됨' : it.price + 'G') + '</button>' +
      '</div>';
    }).join('');
    return hud(state) + '' +
      '<main class="shop-screen">' +
        '<div class="shop-head"><h2>' + icon('shop') + ' 상점</h2>' +
          '<button class="reroll-btn sm" data-act="rerollshop" ' + ((sh.rerolls || 0) >= 2 ? 'disabled' : '') + '>' +
            icon('reroll') + '재고 20G' + ((sh.rerolls || 0) ? ' · ' + (2 - (sh.rerolls || 0)) : '') + '</button>' +
        '</div>' +
        '<p class="sub">골드로 주사위·유물·단조를 삽니다' + (r.relics.indexOf('merchant') >= 0 ? ' (상인의 인장 -30%)' : '') + '</p>' +
        '<div class="shop-list">' + items + '</div>' +
        '<div class="bottom-bar"><button class="bigbtn" data-act="leave">떠난다</button></div>' +
      '</main>';
  }

  function renderRest(state) {
    return hud(state) + '' +
      '<main class="rest-screen">' +
        '<div class="campfire">' + icon('campfire') + '</div>' +
        '<h2>모닥불</h2>' +
        '<p class="sub">잠시 쉬며 몸을 추스른다.</p>' +
        '<div class="rest-opts">' +
          '<button class="rest-opt" data-act="rest" data-i="0">' + icon('heart') + '<b>회복</b><span>체력 40% 회복</span></button>' +
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
    const head = '<div class="ev-art" style="--c:' + tagC + '">' +
        '<div class="ev-art-glow"></div>' +
        (DC.eventArt ? DC.eventArt(def.id, 'ev-art-svg') : icon(def.ic)) +
      '</div>' +
      '<span class="ev-tag" style="--c:' + tagC + '">' + esc(def.tag || '') + '</span>' +
      '<h2>' + esc(def.name) + '</h2>' +
      '<p class="ev-text">' + esc(ev.result ? ev.text : (def.text || ev.text)) + '</p>';
    if (ev.result) {
      return hud(state) + '' +
        '<main class="event-screen">' + head +
          '<div class="ev-result"><span>' + icon('spark') + '</span><div><p>' + esc(ev.result) + '</p>' +
            ((ev.gains && ev.gains.length) ? '<div class="ev-gains">' + ev.gains.map(function (g) { return '<i>' + esc(g) + '</i>'; }).join('') + '</div>' : '') +
          '</div></div>' +
          '<button class="bigbtn primary ev-cont" data-act="leave">계속</button>' +
        '</main>';
    }
    const choices = def.choices.map(function (ch, i) {
      const block = ch.need && ch.need.gold && state.run.gold < ch.need.gold;
      const risk = /피해|상실|감소|잃/.test((ch.desc || '') + (ch.label || ''));
      return '<button class="ev-choice' + (risk ? ' risky' : '') + '" data-act="choice" data-i="' + i + '" ' + (block ? 'disabled' : '') + '>' +
        '<b>' + esc(ch.label) + '</b><span>' + esc(ch.desc || '') + (block ? ' — 골드 부족' : '') + '</span></button>';
    }).join('');
    return hud(state) + '' +
      '<main class="event-screen">' + head +
        '<div class="ev-choices">' + choices + '</div>' +
        '<button class="ev-skip" data-act="leave">' + icon('right') + '그냥 지나간다</button>' +
      '</main>';
  }

  function renderSkills(state) {
    const r = state.run;
    const rows = DC.CLASSES[r.cls].skills.map(function (sk, i) {
      const up = DC.getSkill(r.cls, i, 1);
      const lv = (r.skills || [])[i] || 0;
      return '<div class="sk-row' + (lv ? ' done' : '') + '">' +
        '<div class="sk-ic">' + icon(sk.ic) + '</div>' +
        '<div class="sk-main">' +
          '<div class="sk-name">' + esc(sk.name) + (lv ? ' <i class="upmark">각성</i>' : '') + '</div>' +
          '<div class="sk-now">' + esc(lv ? up.desc : sk.desc) + '</div>' +
          (lv ? '' : '<div class="sk-up">' + icon('up') + esc(up.desc) + '</div>') +
        '</div>' +
        '<button class="sk-btn" data-act="upskill" data-i="' + i + '" ' + (lv ? 'disabled' : '') + '>' + (lv ? '완료' : '각성') + '</button>' +
      '</div>';
    }).join('');
    return '<div class="overlay" data-act="closeskills"><div class="panel skill-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('book') + ' 스킬 각성</h3><button class="iconbtn" data-act="closeskills">' + icon('close') + '</button></div>' +
      '<p class="sub">스킬 하나를 영구히 강화합니다. 런이 끝나면 사라집니다.</p>' +
      '<div class="sk-list">' + rows + '</div>' +
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
          '<div><b>굴리고, 조건에 맞춰 놓는다</b><p>매 턴 주사위가 전부 굴려집니다. 슬롯의 조건(짝수·홀수·4 이상…)에 맞는 주사위만 올릴 수 있습니다.</p></div></div>' +
        '<div class="tut-step"><span class="tut-n" style="--c:#67e8f9">2</span>' +
          '<div><b>이어 쓰면 배율이 오른다</b><p>한 턴에 스킬을 연달아 쓰면 콤보가 쌓이고 피해 배율이 최대 x3.5까지 상승합니다. 배율은 턴이 끝나면 초기화됩니다.</p></div></div>' +
        '<div class="tut-step"><span class="tut-n" style="--c:#34d399">3</span>' +
          '<div><b>면을 바꾸는 것이 성장이다</b><p>단조 노드에서 주사위의 면 하나를 영구 교체합니다. 같은 눈 두 개를 연달아 쓰면 <b>페어</b> 보너스가 붙습니다.</p></div></div>' +
      '</div>' +
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
    return '<div class="overlay" data-act="closehistory"><div class="panel hist-panel" data-stop="1">' +
      '<div class="panel-head"><h3>' + icon('clock') + ' 런 기록</h3><button class="iconbtn" data-act="closehistory">' + icon('close') + '</button></div>' +
      '<div class="hist-list">' + (rows || '<div class="hist-empty">아직 기록이 없습니다.<br/>첫 런을 시작해 보세요.</div>') + '</div>' +
      '</div></div>';
  }

  function renderCodex(state) {
    const meta = DC.Meta.get();
    const pg = DC.Meta.progress();
    const seenDice = meta.seen.dice || [], seenRelic = meta.seen.relics || [], seenEnemy = meta.seen.enemies || [];
    const dice = DC.DICE_IDS.map(function (id) {
      const D = DC.DICE[id];
      const got = seenDice.indexOf(id) >= 0;
      if (!got) return '<div class="cx-die locked">' + icon('lock') + '<span>???</span></div>';
      return '<div class="cx-die" style="--c:' + D.c + '">' +
        '<b>' + esc(D.name) + '</b><div class="cx-faces">' + D.faces.map(function (f) { return faceMini(f); }).join('') + '</div></div>';
    }).join('');
    const relics = DC.RELIC_IDS.map(function (id) {
      const R = DC.RELICS[id];
      const got = seenRelic.indexOf(id) >= 0;
      return '<div class="cx-relic' + (got ? '' : ' locked') + '" style="--c:' + R.c + '">' + (got ? relicIcon(id, 'relic-art cx-art') : icon('lock')) +
        '<div><b>' + esc(got ? R.name : '???') + '</b><span>' + esc(got ? R.desc : '아직 발견하지 못했습니다') + '</span></div></div>';
    }).join('');
    const enemyList = [];
    [1, 2, 3].forEach(function (a) {
      (DC.ENEMIES[a] || []).forEach(function (e) { enemyList.push(e); });
      (DC.ELITES[a] || []).forEach(function (e) { enemyList.push(e); });
    });
    enemyList.push(DC.BOSSES[1], DC.BOSSES[2], DC.BOSSES[3], DC.BOSSES[4], DC.BOSSES[5]);
    const enemies = enemyList.map(function (e) {
      const got = seenEnemy.indexOf(e.id) >= 0;
      const gtxt = e.gimmick && DC.GIMMICK_TXT[e.gimmick.kind];
      const intents = got ? (e.intents || []).map(function (it) {
        return '<i title="' + esc(DC.Combat.intentText(it)) + '">' + icon(DC.Combat.intentIcon(it)) + '</i>';
      }).join('') : '';
      return '<div class="cx-enemy' + (got ? '' : ' locked') + '" style="--c:' + e.c + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + (got ? DC.monsterArt(e.art, { key: e.id }) : '<circle cx="12" cy="12" r="7" stroke-dasharray="3 3"/>') + '</svg>' +
        '<b>' + esc(got ? e.name : '???') + '</b>' +
        '<span>' + (got ? e.hp + ' HP' : '미발견') + '</span>' +
        (got && intents ? '<div class="cx-intents">' + intents + '</div>' : '') +
        (got && gtxt ? '<div class="cx-gimmick">' + esc(gtxt) + '</div>' : '') +
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
      '<div class="cx-progress"><span>주사위 ' + pg.dice + '/' + pg.diceTotal + '</span><span>유물 ' + pg.relics + '/' + pg.relicTotal + '</span><span>적 ' + pg.enemies + '/' + pg.enemyTotal + '</span><span>업적 ' + pg.ach + '/' + pg.achTotal + '</span></div>' +
      '<h4>' + icon('dice') + ' 주사위</h4><div class="cx-dice-grid">' + dice + '</div>' +
      '<h4>' + icon('star') + ' 유물</h4><div class="cx-relics">' + relics + '</div>' +
      '<h4>' + icon('skull') + ' 적</h4><div class="cx-enemies">' + enemies + '</div>' +
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
        '<div class="end-ic">' + icon(kind === 'win' ? 'crown' : 'skull') + '</div>' +
        '<h1>' + (kind === 'win' ? '정상에 서다' : '무너지다') + '</h1>' +
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
        '<div class="title-btns">' +
          '<button class="bigbtn primary" data-act="newrun">새 게임</button>' +
          (r.seed ? '<button class="bigbtn ghost" data-act="retryseed">같은 시드로 다시</button>' : '') +
          '<button class="bigbtn ghost" data-act="title">타이틀</button>' +
        '</div>' +
      '</main>';
  }

  /* ---------------- overlays ---------------- */
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
      '</div></div>';
  }

  function renderHelp() {
    const tab = DC.Game.state.ui.helpTab || 'basic';
    const TABS = [['basic', '기본'], ['combat', '전투'], ['grow', '성장'], ['meta', '기록·모드']];
    const SECTIONS = {
      basic: [
        ['1', '주사위를 굴린다', '매 턴 가방의 주사위가 모두 굴려집니다. 남은 주사위는 턴이 끝나면 사라집니다.'],
        ['2', '주사위 → 스킬 슬롯', '주사위를 탭하고 슬롯을 탭하거나, 슬롯만 탭하면 조건에 맞는 눈이 자동 배치됩니다. 끌어다 놓아도 됩니다.'],
        ['3', '슬롯 조건', '짝수·홀수·4 이상·소수·6 등 조건이 맞아야 올릴 수 있습니다. 조건은 주사위 조작으로 맞춥니다.'],
        ['4', '기세로 조작', '재굴림·+1/-1·뒤집기(7-x)·복제로 눈을 바꿉니다. 기세는 매 턴 최대치까지 회복됩니다.'],
        ['5', '연쇄 콤보', '한 턴에 스킬을 이어 쓸수록 배율이 오릅니다(최대 x3.5). 3·5·7연쇄에서 연출이 터집니다.'],
        ['6', '단조', '단조 노드에서 주사위의 개별 면을 영구히 교체합니다. 면이 곧 빌드입니다.'],
      ],
      combat: [
        ['A', '페어 시너지', '방금 쓴 주사위와 같은 눈을 연달아 쓰면 그 스킬 피해가 25% 증가합니다.'],
        ['B', '적의 의도', '적 머리 위 아이콘이 다음 행동입니다. 공격 수치·연타·방어·저주를 미리 보고 방어와 공격을 고르세요.'],
        ['C', '상태이상', '화상은 턴마다 감소, 중독은 계속, 취약은 받는 피해 +50%, 약화는 주는 피해 -25%, 힘은 공격마다 추가 피해.'],
        ['D', '플라스크 (연금술사)', '화염·독·번개 면을 쓸 때마다 정수가 담기고 3개가 차면 조합별 비약이 자동 발동합니다. 촉매로 즉시 터뜨릴 수도 있습니다.'],
        ['E', '전투 기록', '상단 책 아이콘을 누르면 최근 턴의 스킬·적 행동·피해 내역이 펼쳐집니다.'],
        ['F', '되돌리기', '같은 턴 안에서 배치·재굴림·눈 조작을 되돌립니다(Z 또는 ↺).'],
      ],
      grow: [
        ['G', '상점', '주사위·유물·단조 도구·회복·각성의 서를 판매합니다. 20골드로 재고를 두 번까지 바꿀 수 있습니다.'],
        ['H', '휴식', '회복(40%)·단련(최대 체력 +8)·단조(면 1회) 중 하나를 고릅니다.'],
        ['I', '스킬 각성', '상점의 각성의 서나 보상으로 스킬 하나를 영구 강화합니다. 런이 끝나면 사라집니다.'],
        ['J', '유물', '런 내내 유지되는 패시브입니다. 22종이 있으며 조합에 따라 빌드가 달라집니다.'],
      ],
      meta: [
        ['K', '시드', '타이틀에서 시드를 입력하면 같은 맵·주사위·상점이 재현됩니다. 「오늘의 시드」는 날짜 기반 일일 런입니다.'],
        ['L', '도전 모드', '유리 몸·탐욕·광란 세 가지 변칙 규칙. 표준 외 모드로 이기면 업적이 열립니다.'],
        ['M', '승천', '승리할 때마다 1단계씩 최대 10까지 해금됩니다. 적 체력·공격·상점가가 누적해서 강해집니다.'],
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
      '<p class="help-foot">' + icon('eye') + '완전 정보 전투 — 적의 다음 행동은 항상 화면에 보입니다.</p>' +
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
            if (ev.n === 3) { DC.FX.banner('연쇄 3!', 'small'); }
            else if (ev.n === 5) { DC.FX.banner('연쇄 5!', 'good'); DC.FX.shake(9); }
            else if (ev.n === 7) { DC.FX.banner('MAX CHAIN!', 'good'); DC.FX.shake(13); DC.FX.flash('rgba(255,190,80,.18)'); }
            const comb = q('.combat');
            if (comb) comb.classList.toggle('heat', ev.n >= 4);
            const badge = q('#combo-badge');
            if (badge) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
            delay = 90;
            break;
          case 'edmg': {
            const el = targetEl(ev.eid);
            if (el) {
              DC.FX.floatAt(el, '-' + ev.amount, ev.heavy ? 'dmg heavy' : 'dmg');
              DC.FX.burst(el, DC.Combat.faceColor(ev.kind || 'slash'), ev.heavy ? 16 : 8);
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
            if (el) DC.FX.floatAt(el, '+' + ev.amount, 'block');
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
          case 'kill': {
            const el = targetEl(ev.eid);
            if (el) {
              el.classList.add('dying'); DC.Audio.play('big'); DC.FX.shake(9);
              DC.FX.burst(el, DC.Combat.faceColor('slash'), 18);
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
            break;
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
            DC.FX.banner('VICTORY', 'good');
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
      let html = '';
      switch (state.screen) {
        case 'title': html = renderTitle(state); break;
        case 'class': html = renderClass(state); break;
        case 'gift': html = renderGift(state); break;
        case 'map': html = renderMap(state); break;
        case 'combat': html = renderCombat(state); break;
        case 'reward': html = renderReward(state); break;
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
      app.innerHTML = html;
      if (state.ui.modal === 'deck' && state.run) app.innerHTML += renderDeck(state);
      if (state.ui.modal === 'help') app.innerHTML += renderHelp();
      if (state.ui.modal === 'skills' && state.run) app.innerHTML += renderSkills(state);
      if (state.ui.modal === 'codex') app.innerHTML += renderCodex(state);
      if (state.ui.modal === 'history') app.innerHTML += renderHistory(state);
      if (state.ui.modal === 'tut') app.innerHTML += renderTut();
      if (state.ui.modal === 'challenge') app.innerHTML += renderChallenge(state);
      if (state.ui.modal === 'remove' && state.run) app.innerHTML += renderRemove(state);
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
          if (tr) tr.classList.add('roll-in');
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
