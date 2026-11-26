/* =========================================================
   다이스 체인 / Dice Chain RPG — data layer
   All static content: icons, dice, classes, skills, relics,
   enemies, events. No DOM access.
   ========================================================= */
(function () {
  'use strict';
  const DC = (window.DC = window.DC || {});

  DC.VERSION = '2.5.0';
  DC.BAL = {
    comboStep: 0.2,     // +20% per chain link
    comboCap: 3.0,
    vulnMult: 1.5,
    weakMult: 0.75,
    burnFrac: 0.5,
    handSize: 0,        // 0 = all dice in bag
  };

  /* ---------------- icons (inline SVG, no emoji) ---------------- */
  const P = {
    sword: '<path d="M19 3l2 2-9.5 9.5-2-2L19 3z"/><path d="M9.5 14.5L4 20l-1-4 6.5-6.5"/><path d="M5 15l4 4"/>',
    hammer: '<path d="M14 3l7 7-3 3-2-2-6.5 6.5 2 2-2.5 2.5-3.5-3.5L3 22l-1-1 3.5-3.5L2 14l2.5-2.5 2 2L13 7l-2-2 3-3z"/>',
    shield: '<path d="M12 2.8l7.5 3v6.3c0 4.4-3.1 7.7-7.5 9.6-4.4-1.9-7.5-5.2-7.5-9.6V5.8l7.5-3z"/>',
    flame: '<path d="M12 2.5s5.4 4.3 5.4 9.3a5.4 5.4 0 0 1-10.8 0c0-2.1 1.1-3.4 2.1-4.4.1 2.1 1 3.2 2 3.2 1.2 0 1.4-5.2 1.3-8.1z"/>',
    bolt: '<path d="M13.5 2L4 14.2h5.6L8.5 22 20 9.4h-6.1L13.5 2z"/>',
    venom: '<path d="M12 2.5c3 3.6 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.9 6-10.5z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
    blood: '<path d="M12 2.5c3 3.6 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.9 6-10.5z"/>',
    mult: '<path d="M6 6l12 12M18 6L6 18"/>',
    skull: '<path d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2v4.2l2 1.8v3.8h10.4v-3.8l2-1.8V9.7A7.2 7.2 0 0 0 12 2.5z"/><circle cx="9.2" cy="10.3" r="1.5"/><circle cx="14.8" cy="10.3" r="1.5"/><path d="M11 14.5h2"/>',
    void: '<circle cx="12" cy="12" r="7.2" stroke-dasharray="3 3"/>',
    heart: '<path d="M12 20.5S4.2 15.4 4.2 9.9A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.8 2.7c0 5.5-7.8 10.6-7.8 10.6z"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2v9.6M9.4 9.6h5.2M9.4 14.4h5.2"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.4" cy="8.4" r="1.35" fill="currentColor" stroke="none"/><circle cx="15.6" cy="8.4" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="8.4" cy="15.6" r="1.35" fill="currentColor" stroke="none"/><circle cx="15.6" cy="15.6" r="1.35" fill="currentColor" stroke="none"/>',
    reroll: '<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.5v5.2h-5.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    flip: '<path d="M12 3.5v17"/><path d="M7.5 8L3.5 12l4 4"/><path d="M16.5 8l4 4-4 4"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 5.5H6.5A2 2 0 0 0 4.5 7.5v9"/>',
    crown: '<path d="M3.5 18.5h17l1.2-10-5.4 3.2L12 4.2 7.7 11.7 2.3 8.5l1.2 10z"/>',
    anvil: '<path d="M3 20.5h18"/><path d="M5.5 16.5h13l-2.2-6.2H7.7L5.5 16.5z"/><path d="M10.2 10.3V6.2h3.6v4.1"/>',
    shop: '<path d="M4 9.2h16l-1.2-4.4H5.2L4 9.2z"/><path d="M5.6 9.2v11h12.8v-11"/><path d="M10 20.2v-6h4v6"/>',
    campfire: '<path d="M12 21c-3.9 0-6-2.4-6-5.4 0-3.5 3-6.4 3-8.6 2 1 3 3 3 5 1-1 2-3 2-4 2 2 4 4.4 4 7.4 0 3-2.1 5.6-6 5.6z"/>',
    mystery: '<circle cx="12" cy="12" r="8.5"/><path d="M9.4 9.4a2.7 2.7 0 1 1 3.7 2.5c-.7.4-1.1.9-1.1 1.8"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>',
    star: '<path d="M12 2.8l2.7 6.3 6.8.6-5.2 4.5 1.6 6.6L12 17.2l-5.9 3.6 1.6-6.6L2.5 9.7l6.8-.6L12 2.8z"/>',
    up: '<path d="M12 19.5V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 4.5V19M6 13l6 6 6-6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10.5" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    sound: '<path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4z"/><path d="M15.4 9a4 4 0 0 1 0 6M18 6.4a7.6 7.6 0 0 1 0 11.2"/>',
    mute: '<path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    book: '<path d="M4 4.5h6.2A2.8 2.8 0 0 1 13 7.3v13a2.2 2.2 0 0 0-2.2-2.2H4z"/><path d="M20 4.5h-6.2A2.8 2.8 0 0 0 11 7.3v13a2.2 2.2 0 0 1 2.2-2.2H20z"/>',
    map: '<path d="M3 6.2l6-2.4 6 2.4 6-2.4v14l-6 2.4-6-2.4-6 2.4v-14z"/><path d="M9 3.8v14M15 6.2v14"/>',
    target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    whirl: '<path d="M12 3.5a8.5 8.5 0 1 1-8.2 6.3"/><path d="M12 20.5a8.5 8.5 0 0 1-8.2-6.3"/><path d="M3.5 12l2-3 2 3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.4 2"/>',
    eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    trash: '<path d="M4.5 6.5h15M9 6.5V4h6v2.5M6.5 6.5l1 13.5h9l1-13.5"/>',
    spark: '<path d="M12 2.5l1.8 6.2 6.2 1.8-6.2 1.8L12 18.5l-1.8-6.2L4 10.5l6.2-1.8L12 2.5z"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    flag: '<path d="M6 21V3.6M6 4.4h12l-2.6 3.6L18 11.6H6" /><path d="M4 21h6"/>',
    flask: '<path d="M9.5 3h5"/><path d="M10.5 3v5.2L5.8 17a2.6 2.6 0 0 0 2.3 3.9h7.8a2.6 2.6 0 0 0 2.3-3.9L13.5 8.2V3"/><path d="M7.6 15.4h8.8"/><circle cx="11" cy="18" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="17" r=".6" fill="currentColor" stroke="none"/>',
  };
  DC.ICONS = P;
  DC.icon = function (name, cls) {
    const p = P[name] || P.dice;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };

  /* ---------------- face kinds ---------------- */
  DC.KINDS = {
    slash: { n: '참격', ic: 'sword', c: '#ff7b72' },
    guard: { n: '수호', ic: 'shield', c: '#6bc7ff' },
    fire: { n: '화염', ic: 'flame', c: '#ff9f43' },
    bolt: { n: '번개', ic: 'bolt', c: '#ffe066' },
    venom: { n: '맹독', ic: 'venom', c: '#9ae66e' },
    leech: { n: '흡혈', ic: 'blood', c: '#f472b6' },
    mult: { n: '증폭', ic: 'mult', c: '#c084fc' },
    curse: { n: '저주', ic: 'skull', c: '#a78bfa' },
    blank: { n: '공허', ic: 'void', c: '#7f8ea3' },
    wild: { n: '야생', ic: 'star', c: '#fbbf24' },
  };

  DC.STATUS = {
    burn: { n: '화상', ic: 'flame', c: '#ff9f43', tip: '적의 턴 시작에 피해를 준다. 매 턴 1씩 줄어든다.' },
    poison: { n: '중독', ic: 'venom', c: '#9ae66e', tip: '적의 턴 시작에 피해를 준다. 줄어들지 않는다.' },
    weak: { n: '약화', ic: 'down', c: '#94a3b8', tip: '주는 피해가 25% 감소한다.' },
    vuln: { n: '취약', ic: 'target', c: '#f87171', tip: '받는 피해가 50% 증가한다.' },
    str: { n: '힘', ic: 'up', c: '#fbbf24', tip: '공격마다 피해가 추가된다.' },
  };

  /* keyword glossary for tap tooltips */
  DC.KEYWORDS = {
    combo: { n: '연쇄 콤보', t: '한 턴에 스킬을 쓸 때마다 콤보가 1씩 오릅니다. 콤보 1당 배율이 +0.2 (가면 유물은 +0.3), 최대 x3.5까지.' },
    mult: { n: '배율', t: '모든 피해에 곱해지는 값입니다. 위쪽 x1.0 배지가 현재 배율. 콤보를 쌓을수록 커집니다.' },
    spark: { n: '기세', t: '주사위 조작에 쓰는 자원입니다. 매 턴 최대치까지 회복됩니다.' },
    reroll: { n: '재굴림', t: '기세 1을 쓰고 주사위를 다시 굴립니다. 면은 그대로입니다.' },
    flip: { n: '뒤집기', t: '기세 1을 쓰고 눈을 7-x로 바꿉니다. 홀수↔짝수 전환이나 조건 맞추기에 유용합니다.' },
    copy: { n: '복제', t: '기세 2를 쓰고 같은 면의 주사위를 하나 더 만듭니다.' },
    burn: { n: '화상', t: '적의 턴 시작에 화상 수치만큼 피해. 턴마다 1씩 감소합니다.' },
    poison: { n: '중독', t: '적의 턴 시작에 중독 수치만큼 피해. 줄어들지 않아 오래 갑니다.' },
    vuln: { n: '취약', t: '받는 피해 50% 증가. 턴마다 1씩 감소합니다.' },
    weak: { n: '약화', t: '주는 피해 25% 감소.' },
    str: { n: '힘', t: '공격마다 피해가 힘만큼 추가됩니다.' },
    req: { n: '슬롯 조건', t: '슬롯에 올릴 주사위가 맞춰야 하는 눈입니다. 조건이 다르면 올릴 수 없습니다.' },
    forge: { n: '단조', t: '주사위의 면 하나를 영구히 교체합니다. 면이 곧 빌드입니다.' },
    block: { n: '방어도', t: '이번 턴 피해를 먼저 흡수합니다. 내 턴이 시작되면 사라집니다.' },
    pair: { n: '페어', t: '방금 쓴 주사위와 같은 눈의 주사위를 연달아 쓰면 그 스킬 피해가 25% 증가합니다.' },
    flask: { n: '플라스크', t: '연금술사 전용. 화염(불)·독(독)·번개(번개) 면을 쓸 때마다 정수가 1 담기고, 3개가 차면 조합에 따라 비약이 터집니다. 촉매 스킬로 원할 때 터뜨릴 수도 있습니다.' },
    ascension: { n: '승천', t: '승리할 때마다 단계가 오르는 더 어려운 모드입니다. 적 체력·공격이 강해지고 보상이 줄어듭니다.' },
  };

  DC.classesShort = { warrior: '전사', mage: '마도사', gambler: '도박사', alchemist: '연금술사' };

  /* act flavour */
  DC.ACTS = {
    1: { name: '잿빛 폐허', sub: '무너진 탑과 재가 날리는 들판', sky: '#1b2540', ground: '#141a28', tint: '#6b7fa8', ember: '#ff9f43' },
    2: { name: '가라앉은 성소', sub: '물에 잠긴 성소, 푸른 불빛', sky: '#0f2436', ground: '#0c1a26', tint: '#3fb0c9', ember: '#67e8f9' },
    3: { name: '운명의 정점', sub: '주사위 신전의 끝, 황금빛 파멸', sky: '#2a1c12', ground: '#1a120c', tint: '#d99a3c', ember: '#fbbf24' },
    4: { name: '심연의 나락', sub: '빛이 닿지 않는 주사위 굴림', sky: '#1a1024', ground: '#120a1a', tint: '#a78bfa', ember: '#c084fc' },
    5: { name: '뒤틀린 성좌', sub: '운명이 접힌 별의 바다', sky: '#101a2c', ground: '#0b1220', tint: '#67e8f9', ember: '#93c5fd' },
    6: { name: '끝없는 주사위', sub: '굴림이 멈추지 않는 곳', sky: '#241217', ground: '#170b10', tint: '#f87171', ember: '#fca5a5' },
  };
  DC.actName = function (act) {
    if (DC.ACTS[act]) return DC.ACTS[act].name;
    return '심연 ' + (act - 3);
  };

  /* ---------------- requirements ---------------- */
  DC.REQ = {
    any: { n: '아무 눈', ic: 'dice', test: function () { return true; } },
    even: { n: '짝수', ic: 'mult', test: function (v) { return v % 2 === 0; } },
    odd: { n: '홀수', ic: 'flip', test: function (v) { return v % 2 === 1; } },
    gte4: { n: '4 이상', ic: 'up', test: function (v) { return v >= 4; } },
    lte2: { n: '2 이하', ic: 'down', test: function (v) { return v <= 2; } },
    six: { n: '6', ic: 'star', test: function (v) { return v === 6; } },
    prime: { n: '소수', ic: 'spark', test: function (v) { return v === 2 || v === 3 || v === 5; } },
  };

  /* ---------------- dice ---------------- */
  function f(k, v) { return { k: k, v: v }; }
  DC.DICE = {
    iron: { name: '강철 주사위', tier: 1, price: 0, c: '#9fb4cc', faces: [f('slash', 2), f('slash', 3), f('guard', 2), f('slash', 4), f('guard', 4), f('slash', 5)], tag: '균형' },
    bulwark: { name: '방벽 주사위', tier: 1, price: 55, c: '#6bc7ff', faces: [f('guard', 3), f('guard', 4), f('slash', 2), f('guard', 5), f('guard', 6), f('slash', 3)], tag: '수비' },
    ember: { name: '화염 주사위', tier: 1, price: 0, c: '#ff9f43', faces: [f('fire', 2), f('slash', 2), f('fire', 3), f('fire', 4), f('bolt', 2), f('fire', 5)], tag: '화염' },
    frost: { name: '서리 주사위', tier: 1, price: 0, c: '#93c5fd', faces: [f('guard', 2), f('slash', 2), f('venom', 1), f('slash', 3), f('venom', 2), f('slash', 4)], tag: '독' },
    arcane: { name: '비전 주사위', tier: 1, price: 0, c: '#c084fc', faces: [f('mult', 1), f('slash', 2), f('mult', 2), f('bolt', 3), f('mult', 1), f('leech', 2)], tag: '증폭' },
    loaded: { name: '조작 주사위', tier: 1, price: 0, c: '#fbbf24', faces: [f('slash', 3), f('slash', 4), f('slash', 5), f('slash', 6), f('mult', 1), f('curse', 1)], tag: '도박' },
    wild: { name: '야생 주사위', tier: 1, price: 0, c: '#f472b6', faces: [f('slash', 1), f('guard', 1), f('fire', 1), f('bolt', 1), f('venom', 1), f('leech', 1)], tag: '만능' },
    lucky: { name: '행운 주사위', tier: 1, price: 0, c: '#34d399', faces: [f('slash', 2), f('mult', 1), f('slash', 4), f('leech', 2), f('mult', 2), f('slash', 6)], tag: '행운' },
    reagent: { name: '시약 주사위', tier: 1, price: 0, c: '#34d399', faces: [f('fire', 2), f('venom', 2), f('bolt', 2), f('fire', 3), f('venom', 3), f('bolt', 3)], tag: '시약' },
    cauldron: { name: '가마솥 주사위', tier: 1, price: 0, c: '#fb923c', faces: [f('fire', 4), f('venom', 4), f('guard', 3), f('bolt', 4), f('leech', 2), f('slash', 4)], tag: '가마솥' },
    elixir: { name: '엘릭서 주사위', tier: 2, price: 90, c: '#5eead4', faces: [f('fire', 5), f('venom', 5), f('bolt', 5), f('mult', 2), f('leech', 4), f('guard', 4)], tag: '비약' },
    vampire: { name: '흡혈 주사위', tier: 2, price: 75, c: '#f472b6', faces: [f('leech', 3), f('slash', 2), f('leech', 4), f('slash', 3), f('venom', 2), f('leech', 5)], tag: '흡혈' },
    storm: { name: '폭풍 주사위', tier: 2, price: 80, c: '#ffe066', faces: [f('bolt', 3), f('bolt', 4), f('slash', 2), f('bolt', 5), f('mult', 1), f('bolt', 6)], tag: '번개' },
    venomd: { name: '독니 주사위', tier: 2, price: 70, c: '#9ae66e', faces: [f('venom', 3), f('venom', 4), f('slash', 2), f('venom', 5), f('leech', 2), f('venom', 6)], tag: '맹독' },
    chrono: { name: '시간 주사위', tier: 2, price: 85, c: '#67e8f9', faces: [f('mult', 2), f('slash', 3), f('guard', 3), f('mult', 2), f('bolt', 4), f('leech', 3)], tag: '증폭' },
    cursed: { name: '저주받은 주사위', tier: 2, price: 60, c: '#a78bfa', faces: [f('slash', 6), f('curse', 2), f('slash', 5), f('curse', 1), f('mult', 2), f('slash', 6)], tag: '저주' },
    moon: { name: '달 주사위', tier: 2, price: 85, c: '#c7d2fe', faces: [f('leech', 3), f('mult', 2), f('slash', 4), f('leech', 4), f('guard', 4), f('mult', 1)], tag: '달빛' },
    gear: { name: '톱니 주사위', tier: 2, price: 95, c: '#94a3b8', faces: [f('guard', 5), f('slash', 5), f('guard', 4), f('slash', 4), f('leech', 2), f('guard', 6)], tag: '수호' },
    prism: { name: '무지개 주사위', tier: 3, price: 120, c: '#f0abfc', faces: [f('fire', 4), f('bolt', 4), f('venom', 4), f('leech', 4), f('mult', 2), f('slash', 5)], tag: '전설' },
    titan: { name: '거인의 주사위', tier: 3, price: 130, c: '#fca5a5', faces: [f('slash', 6), f('slash', 6), f('guard', 6), f('slash', 5), f('guard', 5), f('slash', 6)], tag: '전설' },
  };
  DC.DICE_IDS = Object.keys(DC.DICE);

  /* forge face pool */
  DC.FACE_POOL = [
    { k: 'slash', v: 2, cost: 0 }, { k: 'slash', v: 3, cost: 0 }, { k: 'slash', v: 4, cost: 10 },
    { k: 'slash', v: 5, cost: 18 }, { k: 'slash', v: 6, cost: 26 },
    { k: 'guard', v: 3, cost: 0 }, { k: 'guard', v: 4, cost: 10 }, { k: 'guard', v: 5, cost: 18 },
    { k: 'fire', v: 3, cost: 12 }, { k: 'fire', v: 4, cost: 20 },
    { k: 'bolt', v: 3, cost: 12 }, { k: 'bolt', v: 4, cost: 20 },
    { k: 'venom', v: 2, cost: 10 }, { k: 'venom', v: 3, cost: 16 },
    { k: 'leech', v: 3, cost: 14 }, { k: 'leech', v: 4, cost: 22 },
    { k: 'mult', v: 1, cost: 14 }, { k: 'mult', v: 2, cost: 24 },
    { k: 'curse', v: 1, cost: 0 },
  ];

  /* ---------------- classes & skills ---------------- */
  DC.CLASSES = {
    warrior: {
      id: 'warrior', name: '강철의 전사', short: '전사', en: 'IRONCLAD',
      hp: 68, sparks: 2, c: '#ff7b72',
      desc: '두꺼운 방패와 묵직한 주사위. 맞으면서 때린다.',
      startDice: ['iron', 'bulwark', 'iron'],
      passive: { n: '강철 의지', tip: '방어도가 남아 있으면 다음 턴 시작에 2 피해를 준다.' },
      skills: [
        { id: 'strike', name: '강타', req: 'any', ic: 'sword', fx: { type: 'attack', ratio: 1.6 }, desc: '눈 × 1.6 피해' },
        { id: 'guard', name: '철벽', req: 'any', ic: 'shield', fx: { type: 'block', ratio: 2.4 }, desc: '눈 × 2.4 방어도' },
        { id: 'bash', name: '분쇄', req: 'even', ic: 'hammer', fx: { type: 'attack', ratio: 2.0, status: { vuln: 1 } }, desc: '눈 × 2 피해 · 취약 1' },
        { id: 'whirl', name: '회전베기', req: 'gte4', ic: 'whirl', fx: { type: 'aoe', ratio: 1.8 }, desc: '모든 적에게 눈 × 1.8' },
        { id: 'warcry', name: '전투 함성', req: 'prime', ic: 'up', fx: { type: 'buff', str: 2, block: 5 }, desc: '힘 +2 · 방어도 5' },
      ],
    },
    mage: {
      id: 'mage', name: '불꽃의 마도사', short: '마도사', en: 'ARCANIST',
      hp: 82, sparks: 3, c: '#c084fc',
      desc: '원소 주사위를 굴려 불태우고 연쇄시킨다. 눈을 바꿔 최적해를 만든다.',
      startDice: ['ember', 'arcane', 'frost'],
      passive: { n: '원소 친화', tip: '매 턴 기세 +1, 화염·번개 면을 쓰면 2 회복한다.' },
      skills: [
        { id: 'ember', name: '불꽃 화살', req: 'any', ic: 'flame', fx: { type: 'attack', ratio: 2.3, burn: true }, desc: '눈 × 2.3 피해 · 화상' },
        { id: 'ward', name: '마나 방벽', req: 'even', ic: 'shield', fx: { type: 'block', ratio: 3.1, heal: 1 }, desc: '눈 × 3.1 방어도 · 1 회복' },
        { id: 'chain', name: '연쇄 번개', req: 'odd', ic: 'bolt', fx: { type: 'chain', ratio: 1.9 }, desc: '눈 × 1.9 + 다른 적에게 연쇄' },
        { id: 'amplify', name: '증폭', req: 'any', ic: 'mult', fx: { type: 'mult', add: 0.5, dmgRatio: 0.5 }, desc: '연쇄 배율 +0.5 · 눈 × 0.5 피해' },
        { id: 'meteor', name: '유성', req: 'gte4', ic: 'star', fx: { type: 'aoe', ratio: 2.0, burn: 2 }, desc: '모든 적에게 눈 × 2 · 화상 2' },
      ],
    },
    gambler: {
      id: 'gambler', name: '운명의 도박사', short: '도박사', en: 'GAMBLER',
      hp: 80, sparks: 4, c: '#fbbf24',
      desc: '기세가 넘친다. 재굴림과 복제로 판을 뒤집고 콤보로 승부한다.',
      startDice: ['loaded', 'lucky', 'wild'],
      passive: { n: '행운의 손', tip: '콤보가 3 이상이면 공격마다 +3 피해.' },
      skills: [
        { id: 'dagger', name: '단검', req: 'any', ic: 'sword', fx: { type: 'attack', ratio: 1.3, comboBonus: 2.4 }, desc: '눈 × 1.3 + 콤보 보너스' },
        { id: 'coin', name: '동전 던지기', req: 'even', ic: 'coin', fx: { type: 'attack', ratio: 2.8 }, desc: '눈 × 2.8 피해' },
        { id: 'lucky', name: '행운', req: 'any', ic: 'spark', fx: { type: 'spark', amount: 2, block: 3 }, desc: '기세 +2 · 방어도 3' },
        { id: 'allin', name: '올인', req: 'six', ic: 'flame', fx: { type: 'attack', ratio: 6, selfDmg: 3 }, desc: '눈 × 5 피해 · 자신 3 피해' },
        { id: 'jackpot', name: '잭팟', req: 'prime', ic: 'star', fx: { type: 'multi', ratio: 1.3 }, desc: '눈 × 1.2 피해를 콤보 수만큼' },
      ],
    },
    alchemist: {
      id: 'alchemist', name: '독의 연금술사', short: '연금술사', en: 'ALCHEMIST',
      hp: 74, sparks: 3, c: '#34d399', ic: 'flask',
      desc: '화염·독·번개 정수를 플라스크에 모아 세 가지 비약으로 터뜨린다.',
      startDice: ['reagent', 'reagent', 'cauldron'],
      passive: { n: '연금 플라스크', tip: '화염·독·번개 면을 쓸 때마다 정수가 담깁니다. 3개가 차면 조합에 따라 비약이 자동 완성됩니다.' },
      skills: [
        { id: 'acid', name: '산성 플라스크', req: 'any', ic: 'venom', fx: { type: 'attack', ratio: 1.7, status: { poison: 2 } }, desc: '눈 × 1.7 피해 · 중독 2' },
        { id: 'distill', name: '증류', req: 'odd', ic: 'flame', fx: { type: 'attack', ratio: 2.4, burn: true }, desc: '눈 × 2.4 피해 · 화상' },
        { id: 'solidify', name: '응고', req: 'even', ic: 'shield', fx: { type: 'block', ratio: 2.8, heal: 1 }, desc: '눈 × 2.8 방어도 · 1 회복' },
        { id: 'catalyze', name: '촉매', req: 'any', ic: 'flask', fx: { type: 'mix' }, desc: '정수 1개당 눈×1.0 피해·방어 2' },
        { id: 'elixir', name: '대비약', req: 'gte4', ic: 'star', fx: { type: 'aoe', ratio: 1.7, burn: 2 }, desc: '모든 적에게 눈 × 1.7 · 화상 2' },
      ],
    },
  };
  DC.CLASS_IDS = ['warrior', 'mage', 'gambler', 'alchemist'];

  /* ---------------- relics ---------------- */
  DC.RELICS = {
    rune: { name: '룬 주사위', ic: 'dice', c: '#67e8f9', desc: '전투 시작 시 주사위를 하나 더 굴린다.', price: 95 },
    doubleRoll: { name: '이중 굴림', ic: 'reroll', c: '#6bc7ff', desc: '매 턴 첫 재굴림이 무료다.', price: 90 },
    luckyCoin: { name: '행운의 동전', ic: 'coin', c: '#fbbf24', desc: '짝수 눈으로 스킬을 쓰면 기세 +1 (턴당 2회).', price: 85 },
    flameHeart: { name: '화염 심장', ic: 'flame', c: '#ff9f43', desc: '화염 피해가 60% 증가한다.', price: 95 },
    conductor: { name: '번개 도체', ic: 'bolt', c: '#ffe066', desc: '번개 연쇄가 적 하나를 더 때린다.', price: 90 },
    wrist: { name: '강철 손목', ic: 'shield', c: '#6bc7ff', desc: '방어도 획득이 25% 증가한다.', price: 80 },
    mask: { name: '광기의 가면', ic: 'skull', c: '#a78bfa', desc: '콤보 배율 상승폭이 0.1 더 커진다.', price: 110 },
    gamblersHand: { name: '도박꾼의 손', ic: 'star', c: '#fbbf24', desc: '전투마다 기세를 1 더 얻는다.', price: 100 },
    grail: { name: '피의 성배', ic: 'blood', c: '#f472b6', desc: '적을 처치할 때마다 6 회복한다.', price: 90 },
    hourglass: { name: '시간의 모래', ic: 'clock', c: '#67e8f9', desc: '턴 시작에 무작위 주사위 하나의 눈이 +1 된다.', price: 100 },
    contract: { name: '저주받은 계약', ic: 'skull', c: '#a78bfa', desc: '골드 획득 40% 증가 · 최대 체력 12 감소.', price: 60 },
    scale: { name: '균형의 천칭', ic: 'flip', c: '#93c5fd', desc: '홀수 눈 공격 피해가 40% 증가한다.', price: 95 },
    pledge: { name: '짝수의 서약', ic: 'mult', c: '#c084fc', desc: '짝수 눈 공격 피해가 40% 증가한다.', price: 95 },
    echo: { name: '잔향', ic: 'reroll', c: '#67e8f9', desc: '턴 종료 시 남은 주사위 하나당 기세 +1.', price: 85 },
    sixBless: { name: '6의 축복', ic: 'star', c: '#fbbf24', desc: '6이 나올 때마다 기세 +1.', price: 90 },
    merchant: { name: '상인의 인장', ic: 'coin', c: '#34d399', desc: '상점 가격 30% 할인.', price: 75 },
    vampireFang: { name: '흡혈귀의 송곳니', ic: 'blood', c: '#f472b6', desc: '가한 피해의 8%를 회복한다.', price: 100 },
    vanguard: { name: '선봉의 깃발', ic: 'flag', c: '#ff7b72', desc: '전투 첫 턴에 주는 피해가 50% 증가한다.', price: 100 },
    thornMail: { name: '가시 갑옷', ic: 'shield', c: '#94a3b8', desc: '적 턴이 끝나면 적 전체에 4 피해를 준다.', price: 95 },
    duelist: { name: '결투가의 장갑', ic: 'sword', c: '#fbbf24', desc: '살아 있는 적이 하나뿐이면 피해가 25% 증가한다.', price: 90 },
    miser: { name: '수전노의 지갑', ic: 'coin', c: '#fde68a', desc: '골드 획득이 25% 증가한다.', price: 80 },
    karma: { name: '업보의 사슬', ic: 'mult', c: '#f472b6', desc: '콤보 4 이상에서 모든 공격이 2번 적중한다.', price: 130 },
  };
  DC.RELIC_IDS = Object.keys(DC.RELICS);

  /* ---------------- enemies ---------------- */
  function E(id, name, hp, art, c, intents, extra) {
    return Object.assign({ id: id, name: name, hp: hp, art: art, c: c, intents: intents }, extra || {});
  }
  DC.ENEMIES = {
    1: [
      E('slime', '점액 슬라임', 28, 'blob', '#6ee7b7', [{ k: 'attack', v: 7 }, { k: 'attack', v: 4, hits: 2 }, { k: 'defend', v: 6 }]),
      E('rat', '쥐떼', 22, 'beast', '#a8a29e', [{ k: 'attack', v: 4, hits: 2 }, { k: 'attack', v: 6 }, { k: 'debuff', s: 'weak', v: 1 }]),
      E('goblin', '고블린 약탈자', 34, 'humanoid', '#84cc16', [{ k: 'attack', v: 9 }, { k: 'debuff', s: 'vuln', v: 2 }, { k: 'attack', v: 7 }]),
      E('bat', '동굴 박쥐', 20, 'flyer', '#c084fc', [{ k: 'attack', v: 3, hits: 3 }, { k: 'curse', n: 1 }, { k: 'attack', v: 5 }]),
      E('wolf', '굶주린 늑대', 34, 'beast', '#fca5a5', [{ k: 'attack', v: 11 }, { k: 'buff', s: 'str', v: 2 }, { k: 'attack', v: 9 }]),
      E('mushroom', '폭발 버섯', 26, 'mushroom', '#a3e635', [{ k: 'attack', v: 5, apply: 'poison' }, { k: 'defend', v: 6 }, { k: 'attack', v: 3, hits: 2 }]),
    ],
    2: [
      E('skeleton', '해골 병사', 34, 'humanoid', '#e2e8f0', [{ k: 'attack', v: 12 }, { k: 'defend', v: 10 }, { k: 'attack', v: 8, hits: 2 }]),
      E('spider', '독거미', 30, 'beast', '#9ae66e', [{ k: 'attack', v: 8 }, { k: 'attack', v: 4, hits: 2, apply: 'poison' }, { k: 'debuff', s: 'weak', v: 2 }]),
      E('gargoyle', '가고일', 46, 'construct', '#94a3b8', [{ k: 'defend', v: 12 }, { k: 'attack', v: 15 }, { k: 'attack', v: 7, hits: 2 }]),
      E('shaman', '주술사', 36, 'humanoid', '#a78bfa', [{ k: 'debuff', s: 'vuln', v: 2 }, { k: 'attack', v: 12 }, { k: 'curse', n: 2 }, { k: 'buff', s: 'str', v: 3 }]),
      E('wraith', '망령', 33, 'flyer', '#67e8f9', [{ k: 'attack', v: 10 }, { k: 'drain', v: 6 }, { k: 'debuff', s: 'weak', v: 1 }]),
      E('cultist', '심연 광신도', 40, 'cultist', '#a78bfa', [{ k: 'buff', s: 'str', v: 2 }, { k: 'attack', v: 9 }, { k: 'curse', n: 1 }]),
    ],
    3: [
      E('knight', '심연 기사', 58, 'humanoid', '#f87171', [{ k: 'attack', v: 21 }, { k: 'defend', v: 14 }, { k: 'attack', v: 10, hits: 3 }]),
      E('imp', '화염 임프', 46, 'flyer', '#fb923c', [{ k: 'attack', v: 10, apply: 'burn' }, { k: 'attack', v: 6, hits: 3 }, { k: 'buff', s: 'str', v: 3 }]),
      E('shadow', '심연의 그림자', 62, 'blob', '#8b5cf6', [{ k: 'curse', n: 2 }, { k: 'attack', v: 24 }, { k: 'drain', v: 12 }]),
      E('serpent', '독니 뱀', 52, 'beast', '#9ae66e', [{ k: 'attack', v: 12, apply: 'poison' }, { k: 'attack', v: 7, hits: 2 }, { k: 'debuff', s: 'vuln', v: 3 }]),
      E('berserker', '광전사', 72, 'berserker', '#f87171', [{ k: 'attack', v: 18 }, { k: 'buff', s: 'str', v: 4 }, { k: 'attack', v: 8, hits: 3 }]),
      E('voidmaw', '공허의 아귀', 66, 'voidmaw', '#8b5cf6', [{ k: 'drain', v: 10 }, { k: 'curse', n: 2 }, { k: 'attack', v: 14 }]),
    ],
  };
  DC.ELITES = {
    1: [E('ogre', '오우거 투사', 58, 'humanoid', '#fbbf24', [{ k: 'attack', v: 14 }, { k: 'buff', s: 'str', v: 2 }, { k: 'attack', v: 8, hits: 2 }])],
    2: [E('golem', '고대 골렘', 84, 'construct', '#94a3b8', [{ k: 'defend', v: 16 }, { k: 'attack', v: 20 }, { k: 'attack', v: 8, hits: 3 }])],
    3: [E('wyvern', '와이번', 120, 'flyer', '#fb923c', [{ k: 'attack', v: 26 }, { k: 'attack', v: 11, hits: 3 }, { k: 'buff', s: 'str', v: 4 }])],
  };
  DC.ELITES[1][0].gimmick = { kind: 'enrage', at: 0.5, str: 4, once: true };
  DC.ELITES[2][0].gimmick = { kind: 'fortify', block: 7 };
  DC.ELITES[3][0].gimmick = { kind: 'dive', every: 3, mult: 1.8 };

  DC.BOSSES = {
    1: E('queen', '슬라임 여왕', 92, 'boss', '#34d399', [{ k: 'attack', v: 13 }, { k: 'curse', n: 1 }, { k: 'attack', v: 7, hits: 2 }, { k: 'drain', v: 10 }]),
    2: E('lich', '심연의 리치', 150, 'boss', '#a78bfa', [{ k: 'curse', n: 2 }, { k: 'attack', v: 22 }, { k: 'debuff', s: 'vuln', v: 3 }, { k: 'attack', v: 10, hits: 3 }]),
    3: E('dicelord', '주사위 군주', 178, 'boss', '#fbbf24', [{ k: 'curse', n: 2 }, { k: 'attack', v: 30 }, { k: 'attack', v: 13, hits: 3 }, { k: 'buff', s: 'str', v: 5 }, { k: 'drain', v: 16 }]),
  };

  /* boss personality: gimmicks + lines */
  DC.BOSSES[1].title = '군체의 어머니';
  DC.BOSSES[1].lines = {
    appear: '슬라임 여왕 — "내 아이들이 너를 녹이리라."',
    half: '여왕이 몸을 찢는다! "아이들아, 일어나!"',
    die: '"…결국, 다시… 흩어지는구나."',
  };
  DC.BOSSES[1].gimmick = { kind: 'split', at: 0.5, adds: ['slime'], once: true };

  DC.BOSSES[2].title = '죽지 않는 자';
  DC.BOSSES[2].lines = {
    appear: '심연의 리치 — "한 번 죽는 것은 예의가 아니지."',
    half: '리치가 웃는다. "죽음은 나의 하인이다."',
    die: '"이번에도… 잠시일 뿐이다."',
  };
  DC.BOSSES[2].gimmick = { kind: 'revive', hpPct: 0.22, block: 12, once: true };

  DC.BOSSES[3].title = '운명의 주인';
  DC.BOSSES[3].lines = {
    appear: '주사위 군주 — "네 운은 이미 굴려졌다."',
    half: '군주가 손가락을 튕긴다. "주사위는 내 것이다."',
    die: '"…주사위는, 다시 굴러간다."',
  };
  DC.BOSSES[3].gimmick = { kind: 'seal', every: 3, n: 1, once: false };

  /* ---------------- events ---------------- */
  DC.EVENTS = [
    {
      id: 'altar', name: '도박의 제단', ic: 'coin', tag: '도박',
      text: '녹슨 제단 위에 금화가 쌓여 있다. 제단이 속삭인다. "네 운을 걸어라."',
      choices: [
        { label: '30 골드를 건다', desc: '운에 맡긴다 — 크게 얻거나 전부 잃는다', need: { gold: 30 },
          chance: [ { p: 0.28, eff: { gold: 60 }, result: '제단이 웃었다. +60 골드.' },
                    { p: 0.42, eff: { gold: 30 }, result: '작은 행운. +30 골드.' },
                    { p: 0.30, eff: {}, result: '제단은 조용했다. 30 골드가 사라졌다.' } ] },
        { label: '10 골드만 놓고 간다', desc: '안전하게 — 10 골드를 바친다', need: { gold: 10 },
          eff: { gold: -10, healPct: 0.15 }, result: '제단이 따뜻해진다. 체력이 조금 회복됐다.' },
        { label: '무시하고 지나간다', result: '제단을 뒤로했다.' },
      ],
    },
    {
      id: 'cursedSword', name: '저주받은 검', ic: 'skull', tag: '저주',
      text: '검은 연기를 뿜는 검이 땅에 박혀 있다. 잡으면 힘이 솟지만, 대가가 따를 것이다.',
      choices: [
        { label: '검을 뽑는다', desc: '유물 획득 · 최대 체력 8 감소', eff: { relic: 'random', maxHp: -8, selfDmgFlat: 4 },
          result: '손바닥이 타들어간다. 힘이 솟구치고, 무언가가 조금 죽었다.' },
        { label: '뽑아서 부순다', desc: '+45 골드 (파편을 판다)', eff: { gold: 45 }, result: '검은 비명을 지르며 부서졌다. 파편이 팔렸다.' },
        { label: '지나간다', result: '검을 그냥 두고 왔다.' },
      ],
    },
    {
      id: 'dicePile', name: '버려진 주사위 더미', ic: 'dice', tag: '탐색',
      text: '누군가 버린 주사위가 수북하다. 쓸 만한 것을 골라보자.',
      choices: [
        { label: '뒤적여 본다', desc: '무작위 주사위 획득 · 8 피해', eff: { dice: 1, selfDmgFlat: 8 },
          result: '쓸 만한 주사위 하나를 챙겼다. 뭔가에 찔렸다.' },
        { label: '조심히 고른다', desc: '25 골드로 정리해 판다', eff: { gold: 25 }, result: '멀쩡한 것만 골라 팔았다.' },
        { label: '지나간다', result: '더미를 남겨두었다.' },
      ],
    },
    {
      id: 'spring', name: '빛나는 샘', ic: 'star', tag: '성소',
      text: '따뜻한 빛이 흐르는 샘. 물 아래에서 무언가가 반짝인다.',
      choices: [
        { label: '마신다', desc: '체력 35% 회복', eff: { healPct: 0.35 }, result: '몸이 가벼워졌다. 상처가 아문다.' },
        { label: '깊이 들여다본다', desc: '다음 선택으로',
          next: {
            name: '샘의 바닥', ic: 'eye',
            text: '샘 바닥에 유물 하나가 가라앉아 있다. 손을 넣으면 잡을 수 있을 것 같다. 물이 몹시 차갑다.',
            choices: [
              { label: '손을 넣는다', desc: '유물 획득 · 최대 체력 6 감소', eff: { relic: 'random', maxHp: -6 }, result: '손이 얼어붙는 듯했다. 그러나 유물을 쥐었다.' },
              { label: '그냥 마신다', desc: '체력 25% 회복', eff: { healPct: 0.25 }, result: '차가운 물이 속을 씻어냈다.' },
            ],
          } },
        { label: '손을 담근다', desc: '최대 기세 +1', eff: { sparkMax: 1 }, result: '손끝에 기세가 맺힌다. 영원히.' },
      ],
    },
    {
      id: 'merchant', name: '수상한 상인', ic: 'shop', tag: '거래',
      text: '"이 주사위, 아주 특별해. 50 골드면 넘겨주지." 상인의 눈이 웃고 있지 않다.',
      choices: [
        { label: '50 골드에 산다', desc: '전설 주사위 획득', need: { gold: 50 }, eff: { dice: 'tier3' }, result: '상인이 사라졌다. 손에는 전설의 주사위가.' },
        { label: '흥정한다', desc: '30% 확률로 실패 — 15 피해', need: { gold: 50 },
          chance: [ { p: 0.7, eff: { gold: -60, dice: 'tier3' }, result: '상인이 웃으며 값을 올렸다. 60 골드에 샀다.' },
                    { p: 0.3, eff: { selfDmgFlat: 15 }, result: '상인의 단검이 먼저 움직였다.' } ] },
        { label: '거절한다', result: '상인은 어깨를 으쓱했다.' },
      ],
    },
    {
      id: 'forgeSpirit', name: '단조의 정령', ic: 'anvil', tag: '단조',
      text: '불꽃으로 이루어진 정령이 주사위를 두드리고 있다. "한 면만 바꿔줄까? 두 번이면 조금 더 들지."',
      choices: [
        { label: '한 면을 부탁한다', desc: '무료 단조 1회', eff: { forge: 1 }, thenForge: true },
        { label: '두 면을 부탁한다', desc: '30 골드 · 단조 2회', need: { gold: 30 }, eff: { gold: -30, forge: 2 }, thenForge: true },
        { label: '지나간다', result: '정령이 망치를 다시 들었다.' },
      ],
    },
    {
      id: 'armory', name: '잊혀진 무기고', ic: 'lock', tag: '탐색',
      text: '녹슨 자물쇠가 걸린 무기고. 안쪽에서 유물 냄새가 난다.',
      choices: [
        { label: '자물쇠를 딴다', desc: '40 골드 · 유물 획득', need: { gold: 40 }, eff: { gold: -40, relic: 'random' }, result: '자물쇠가 열렸다. 안쪽에는 유물이 놓여 있었다.' },
        { label: '문을 부순다', desc: '18 피해 · 유물 + 40 골드', eff: { selfDmgFlat: 18, relic: 'random', gold: 40 }, result: '문이 무너지며 파편이 쏟아졌다. 그래도 얻을 건 얻었다.' },
        { label: '지나간다', result: '무기고를 뒤로했다.' },
      ],
    },
    {
      id: 'thief', name: '주사위 도둑', ic: 'eye', tag: '위험',
      text: '그림자가 내 가방을 스쳤다. 손에는 주사위 하나가 들려 있다. "이거, 내 거 아닌가?"',
      choices: [
        { label: '돈을 준다', desc: '40 골드 · 주사위를 지킨다', need: { gold: 40 }, eff: { gold: -40 }, result: '그림자가 만족하고 사라졌다.' },
        { label: '주사위를 내준다', desc: '주사위 1개 상실 · 85 골드', eff: { removeDie: 1, gold: 85 }, result: '그림자가 주사위를 던지고 도망쳤다. 주머니는 무거워졌다.' },
        { label: '덤벼든다', desc: '12 피해 · 주사위를 되찾는다', eff: { selfDmgFlat: 12 }, result: '한 대 맞고 주사위를 되찾았다.' },
      ],
    },
    {
      id: 'preacher', name: '타락한 사제', ic: 'blood', tag: '저주',
      text: '붉은 옷의 사제가 웃는다. "고통을 바치면, 운명을 고쳐주지."',
      choices: [
        { label: '고통을 바친다', desc: '주사위 하나에 저주 면 · 완전 회복 + 유물', eff: { curseFace: 1, healPct: 1, relic: 'random' }, result: '비명과 함께 상처가 아물었다. 주사위 하나가 검게 물들었다.' },
        { label: '골드를 바친다', desc: '35 골드 · 최대 체력 +6', need: { gold: 35 }, eff: { gold: -35, maxHp: 6 }, result: '사제가 기도했다. 몸이 조금 단단해졌다.' },
        { label: '돌아선다', result: '사제의 웃음소리가 등 뒤로 따라왔다.' },
      ],
    },
    {
      id: 'ghost', name: '도박꾼의 유령', ic: 'skull', tag: '도박',
      text: '유령이 주사위 세 개를 굴린다. "한 판, 어때? 네 목숨을 걸면 크게 돌려주지."',
      choices: [
        { label: '목숨을 건다', desc: '최대 체력 10 감소 · 유물 + 70 골드', eff: { maxHp: -10, relic: 'random', gold: 70 }, result: '유령이 박수를 쳤다. 몸이 조금 가벼워졌다.' },
        { label: '몸을 건다', desc: '체력 30% 회복 · 40 골드 상실', need: { gold: 40 }, eff: { gold: -40, healPct: 0.3 }, result: '유령이 손을 흔들자 상처가 아물었다.' },
        { label: '나가린다', result: '유령이 주사위를 집어 삼켰다.' },
      ],
    },
    {
      id: 'mirror', name: '거울의 방', ic: 'copy', tag: '성소',
      text: '거울 속의 내가 주사위를 굴리고 있다. 거울이 조용히 속삭인다. "하나 더 가질래?"',
      choices: [
        { label: '주사위를 복제한다', desc: '주사위 1개 복제 · 12 피해', eff: { copyDie: 1, selfDmgFlat: 12 }, result: '거울이 갈라지고 주사위가 하나 더 떨어졌다.' },
        { label: '거울을 깬다', desc: '45 골드', eff: { gold: 45 }, result: '유리가 쏟아졌다. 조각을 모아 팔았다.' },
        { label: '돌아선다', result: '거울 속의 내가 손을 흔들었다.' },
      ],
    },
    {
      id: 'maze', name: '갈라진 길', ic: 'map', tag: '탐색',
      text: '동굴이 둘로 갈라진다. 왼쪽에서 낮은 웅성거림, 오른쪽에서 금속 냄새가 난다.',
      choices: [
        { label: '왼쪽으로 간다', desc: '위험 — 유물 또는 부상', chance: [
            { p: 0.55, eff: { relic: 'random' }, result: '어둠 속에서 유물을 찾았다.' },
            { p: 0.45, eff: { selfDmgFlat: 16, gold: 30 }, result: '무언가에게 물렸다. 도망쳐 금화만 챙겼다.' } ] },
        { label: '오른쪽으로 간다', desc: '안전 — 35 골드 + 주사위', eff: { gold: 35, dice: 1 }, result: '버려진 상자를 열었다. 돈과 주사위가 들어 있었다.' },
      ],
    },
    {
      id: 'forgeGamble', name: '대장간의 잔불', ic: 'anvil', tag: '단조',
      text: '꺼지지 않는 잔불이 남아 있다. 이 불에 주사위를 던지면 면이 바뀔지도 모른다.',
      choices: [
        { label: '던져 본다', desc: '무작위 면 1개 +1 강화 · 10 피해', eff: { upgradeFace: 2, selfDmgFlat: 10 }, result: '주사위가 달궈져 나왔다. 면 하나가 더 날카로워졌다.' },
        { label: '숯을 챙긴다', desc: '25 골드', eff: { gold: 25 }, result: '숯을 팔았다.' },
      ],
    },
    {
      id: 'bonePile', name: '뼈 무덤', ic: 'skull', tag: '성소',
      text: '수많은 뼈가 쌓여 있다. 그 사이로 아직 따뜻한 유물 하나가 보인다.',
      choices: [
        { label: '파헤친다', desc: '유물 + 최대 체력 5 감소', eff: { relic: 'random', maxHp: -5 }, result: '뼈가 부서지는 소리와 함께 유물을 꺼냈다.' },
        { label: '기도한다', desc: '체력 20% 회복 · 최대 기세 +1', eff: { healPct: 0.2, sparkMax: 1 }, result: '잠시 마음이 가벼워졌다.' },
      ],
    },
    {
      id: 'lighthouse', name: '마른 등대', ic: 'star', tag: '성소',
      text: '바다가 마른 자리에 등대가 서 있다. 렌즈가 아직 희미하게 깜빡이며 길을 비춘다.',
      choices: [
        { label: '등불을 밝힌다', desc: '체력 35% 회복 · 20 골드', need: { gold: 20 }, eff: { healPct: 0.35, gold: -20 }, result: '따뜻한 빛이 몸을 감싼다. 상처가 아문다.' },
        { label: '렌즈를 떼어낸다', desc: '유물 획득 · 최대 체력 6 감소', eff: { relic: 'random', maxHp: -6 }, result: '렌즈를 품에 넣자 등대가 꺼졌다. 등 뒤가 서늘하다.' },
        { label: '지나간다', result: '빛을 뒤로하고 길을 재촉했다.' },
      ],
    },
    {
      id: 'auction', name: '주사위 경매', ic: 'coin', tag: '거래',
      text: '후드를 쓴 경매인이 낡은 상자 위에 주사위 하나를 올려놓는다. "값을 불러 보시지."',
      choices: [
        { label: '50 골드에 낙찰받는다', desc: '주사위 획득', need: { gold: 50 }, eff: { dice: 1, gold: -50 }, result: '경매인이 고개를 끄덕이고 주사위를 건넨다.' },
        { label: '30 골드로 눈속임을 한다', desc: '60% 확률로 주사위 획득 · 실패 시 30 골드만 잃음', need: { gold: 30 },
          chance: [ { p: 0.6, eff: { dice: 1, gold: -30 }, result: '손기술이 통했다. 주사위를 챙겼다.' },
                    { p: 0.4, eff: { gold: -30 }, result: '경매인이 손목을 붙잡았다. 30 골드만 사라졌다.' } ] },
        { label: '거절한다', result: '경매인은 어깨를 으쓱였다.' },
      ],
    },
  ];

  /* ---------------- skill upgrades (shop / forge) ---------------- */
  DC.SKILL_UP = {
    warrior: [
      { fx: { ratio: 2.0 }, desc: '눈 × 2.0 피해' },
      { fx: { ratio: 3.2 }, desc: '눈 × 3.2 방어도' },
      { fx: { ratio: 2.4, status: { vuln: 2 } }, desc: '눈 × 2.4 피해 · 취약 2' },
      { fx: { ratio: 2.2 }, desc: '모든 적에게 눈 × 2.2' },
      { fx: { str: 3, block: 9 }, desc: '힘 +3 · 방어도 9' },
    ],
    mage: [
      { fx: { ratio: 2.4, burn: true }, desc: '눈 × 2.4 피해 · 화상' },
      { fx: { ratio: 3.4, heal: 2 }, desc: '눈 × 3.4 방어도 · 2 회복' },
      { fx: { ratio: 2.0 }, desc: '눈 × 2.0 + 다른 적에게 연쇄' },
      { fx: { add: 0.7, dmgRatio: 0.7 }, desc: '연쇄 배율 +0.7 · 눈 × 0.7 피해' },
      { fx: { ratio: 2.1, burn: 3 }, desc: '모든 적에게 눈 × 2.1 · 화상 3' },
    ],
    gambler: [
      { fx: { ratio: 1.7, comboBonus: 1.5 }, desc: '눈 × 1.7 + 콤보 보너스' },
      { fx: { ratio: 3.5 }, desc: '눈 × 3.5 피해' },
      { fx: { amount: 3, block: 6 }, desc: '기세 +3 · 방어도 6' },
      { fx: { ratio: 6.5, selfDmg: 3 }, desc: '눈 × 6.5 피해 · 자신 3 피해' },
      { fx: { ratio: 1.5 }, desc: '눈 × 1.5 피해를 콤보 수만큼' },
    ],
    alchemist: [
      { fx: { ratio: 1.9, status: { poison: 3 } }, desc: '눈 × 1.9 피해 · 중독 3' },
      { fx: { ratio: 2.7, burn: true }, desc: '눈 × 2.7 피해 · 화상' },
      { fx: { ratio: 3.3, heal: 3 }, desc: '눈 × 3.3 방어도 · 3 회복' },
      { fx: { ratio: 1.3, block: 3 }, desc: '정수 1개당 눈×1.3 피해·방어 3' },
      { fx: { ratio: 1.9, burn: 3 }, desc: '모든 적에게 눈 × 1.9 · 화상 3' },
    ],
  };
  DC.getSkill = function (cls, idx, lv) {
    const base = DC.CLASSES[cls].skills[idx];
    if (!lv) return base;
    const up = DC.SKILL_UP[cls] && DC.SKILL_UP[cls][idx];
    if (!up) return base;
    return Object.assign({}, base, { fx: Object.assign({}, base.fx, up.fx), desc: up.desc, up: true });
  };


  /* ---------------- ascension & achievements ---------------- */
  DC.ASC_STEPS = [
    { n: 0, name: '첫 운명', desc: '기본 난이도', hp: 0, atk: 0, gold: 0, bossHp: 0, price: 0 },
    { n: 1, name: '승천 1', desc: '적 체력 +6%', hp: .06, atk: 0, gold: 0, bossHp: 0, price: 0 },
    { n: 2, name: '승천 2', desc: '적 공격 +5%', hp: .06, atk: .05, gold: 0, bossHp: 0, price: 0 },
    { n: 3, name: '승천 3', desc: '시작 골드 -20', hp: .06, atk: .05, gold: -20, bossHp: 0, price: 0 },
    { n: 4, name: '승천 4', desc: '정예·보스 체력 +15%', hp: .06, atk: .05, gold: -20, bossHp: .15, price: 0 },
    { n: 5, name: '승천 5', desc: '상점 가격 +20%', hp: .06, atk: .05, gold: -20, bossHp: .15, price: .20 },
    { n: 6, name: '승천 6', desc: '적 공격 +5% · 정예 체력 +10%', hp: .08, atk: .10, gold: -20, bossHp: .25, price: .20 },
    { n: 7, name: '승천 7', desc: '상점 가격 +10% · 시작 골드 -10', hp: .08, atk: .10, gold: -30, bossHp: .25, price: .30 },
    { n: 8, name: '승천 8', desc: '적 체력 +8% · 보스 체력 +10%', hp: .16, atk: .10, gold: -30, bossHp: .35, price: .30 },
    { n: 9, name: '승천 9', desc: '적 공격 +10%', hp: .16, atk: .20, gold: -30, bossHp: .35, price: .30 },
    { n: 10, name: '승천 10', desc: '적 체력 +10% · 공격 +10% (최종)', hp: .26, atk: .30, gold: -30, bossHp: .35, price: .30 },
  ];
  DC.ascMod = function (n) {
    const out = { hp: 0, atk: 0, gold: 0, bossHp: 0, price: 0 };
    for (let i = 1; i <= Math.min(10, n || 0); i++) {
      const s = DC.ASC_STEPS[i];
      out.hp += s.hp; out.atk += s.atk; out.gold += s.gold; out.bossHp += s.bossHp; out.price += s.price;
    }
    return out;
  };

  /* ---------------- challenge modes (v1.9) ---------------- */
  DC.CHALLENGES = [
    { id: 'none', name: '표준', short: '표준', desc: '기본 난이도로 플레이합니다.', c: '#8ea3c4', mod: {} },
    { id: 'glass', name: '유리 몸', short: '유리 몸', desc: '최대 체력 -30% · 내 공격 피해 +30%', c: '#f472b6', mod: { hpMul: -0.30, dmg: 1.30 } },
    { id: 'greed', name: '탐욕', short: '탐욕', desc: '상점 가격 +50% · 골드 획득 +50%', c: '#fbbf24', mod: { price: 0.5, gold: 1.5 } },
    { id: 'frenzy', name: '광란', short: '광란', desc: '적 체력 -15% · 적 공격 +25%', c: '#f87171', mod: { ehp: -0.15, eatk: 0.25 } },
  ];
  DC.challengeById = function (id) {
    for (let i = 0; i < DC.CHALLENGES.length; i++) if (DC.CHALLENGES[i].id === id) return DC.CHALLENGES[i];
    return DC.CHALLENGES[0];
  };

  DC.ACHIEVEMENTS = [
    { id: 'win1', name: '첫 승리', desc: '주사위 군주를 쓰러뜨린다', test: function (c) { return c.win; } },
    { id: 'winWarrior', name: '강철의 의지', desc: '전사로 승리한다', test: function (c) { return c.win && c.cls === 'warrior'; } },
    { id: 'winMage', name: '원소의 주인', desc: '마도사로 승리한다', test: function (c) { return c.win && c.cls === 'mage'; } },
    { id: 'winGambler', name: '운명을 걸다', desc: '도박사로 승리한다', test: function (c) { return c.win && c.cls === 'gambler'; } },
    { id: 'winAlchemist', name: '비약의 대가', desc: '연금술사로 승리한다', test: function (c) { return c.win && c.cls === 'alchemist'; } },
    { id: 'challenger', name: '다른 길', desc: '도전 모드로 승리한다', test: function (c) { return c.win && c.challenge && c.challenge !== 'none'; } },
    { id: 'chain6', name: '끊이지 않는 사슬', desc: '한 턴에 콤보 6 달성', test: function (c) { return (c.maxCombo || 0) >= 6; } },
    { id: 'chain8', name: '완전 연쇄', desc: '한 턴에 콤보 8 달성', test: function (c) { return (c.maxCombo || 0) >= 8; } },
    { id: 'noRelic', name: '맨손의 승리', desc: '유물 없이 승리한다', test: function (c) { return c.win && (c.relics || 0) === 0; } },
    { id: 'asc10', name: '운명을 초월한 자', desc: '승천 10에서 승리한다', test: function (c) { return c.win && (c.asc || 0) >= 10; } },
    { id: 'daily', name: '오늘의 주사위', desc: '일일 시드로 승리한다', test: function (c) { return c.win && String(c.seed || '').indexOf('DAILY-') === 0; } },
    { id: 'relicHunter', name: '유물 수집가', desc: '유물 18종 이상 수집', test: function (c, m) { return (m.seen.relics || []).length >= 18; } },
    { id: 'dmg1000', name: '분쇄자', desc: '한 런에서 누적 1000 피해', test: function (c) { return (c.dmg || 0) >= 1000; } },
    { id: 'asc3', name: '승천자', desc: '승천 3 이상에서 승리', test: function (c) { return c.win && (c.asc || 0) >= 3; } },
    { id: 'codex', name: '도감 수집가', desc: '주사위 12종 이상 수집', test: function (c, m) { return (m.seen.dice || []).length >= 12; } },
  ];

  /* map node meta */  /* map node meta */
  DC.NODES = {
    combat: { n: '전투', ic: 'sword', c: '#ff7b72' },
    elite: { n: '정예', ic: 'skull', c: '#a78bfa' },
    forge: { n: '단조', ic: 'anvil', c: '#fb923c' },
    shop: { n: '상점', ic: 'shop', c: '#34d399' },
    mystery: { n: '미지', ic: 'mystery', c: '#67e8f9' },
    rest: { n: '휴식', ic: 'campfire', c: '#fbbf24' },
    boss: { n: '보스', ic: 'crown', c: '#ef4444' },
  };

  DC.monsterArt = function (art) {
    const A = {
      blob: '<path d="M12 3.5c4.6 0 8 3.9 8 8.6 0 4.6-3.2 8.4-8 8.4s-8-3.8-8-8.4c0-4.7 3.4-8.6 8-8.6z"/><circle cx="9" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1.4" fill="currentColor" stroke="none"/>',
      humanoid: '<circle cx="12" cy="5.6" r="3"/><path d="M8 10h8l2 6.5H6L8 10z"/><path d="M6.2 11.2L3.8 15.6M17.8 11.2L19.4 14"/><path d="M9.4 16.5L8.4 21M14.6 16.5l1 4.5"/><path d="M19.6 6.2l1.8 6-2.4.7"/>',
      beast: '<path d="M5 9.5l1.5-4 3 2h5l3-2 1.5 4v5.5c0 2.5-2 4.5-4.5 4.5h-5C7 19.5 5 17.5 5 15V9.5z"/><circle cx="9.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M9.5 16.5l2.5 1 2.5-1"/>',
      flyer: '<path d="M12 6c2.2 0 4 2 4 4.5S14.2 20 12 20s-4-7-4-9.5S9.8 6 12 6z"/><path d="M8 9L2.5 6.5 4 13l4 2M16 9l5.5-2.5L20 13l-4 2"/>',
      construct: '<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M9 6V3.5h6V6M8.5 11h2M13.5 11h2"/><path d="M9 15h6"/>',
      boss: '<path d="M12 3.5l2.5 5 5-2-1.5 5.5h-12L4.5 6.5l5 2 2.5-5z"/><path d="M6 12h12v6.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12z"/><circle cx="9.5" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.5" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
    };
    return A[art] || A.humanoid;
  };

  DC.uid = (function () { let n = 0; return function (p) { n += 1; return (p || 'id') + n; }; })();
  DC.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
})();
