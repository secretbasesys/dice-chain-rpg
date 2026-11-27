/* =========================================================
   vfx.js — v7.0 canvas 연출 엔진
   참격 궤적 / 원소 폭발 / 피격 플래시 / 파편 / 충격 링 / 보스 컷인
   DOM: 풀스크린 canvas 1장 (#vfx), pointer-events:none
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  let cv = null, ctx = null, dpr = 1, W = 0, H = 0;
  let parts = [], running = false, reduced = false, lastT = 0;

  const COLORS = {
    slash: '#ff8a7a', guard: '#7fc9ff', fire: '#ff9f43', bolt: '#ffe066',
    venom: '#9ae66e', leech: '#f472b6', mult: '#c084fc', holy: '#ffe9a8',
    hex: '#a78bfa', white: '#ffffff', void: '#b18cff'
  };
  function col(k) { return COLORS[k] || COLORS.white; }

  function ensure() {
    if (cv) return true;
    cv = document.createElement('canvas');
    cv.id = 'vfx';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    return true;
  }

  function resize() {
    if (!cv) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rectOf(el) {
    if (!el) return { left: W / 2, top: H / 2, width: 0, height: 0, right: W / 2, bottom: H / 2 };
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  }
  function centerOf(el) {
    const r = rectOf(el);
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.48 };
  }

  const MAX = 520;
  function push(p) {
    if (parts.length > MAX) parts.splice(0, parts.length - MAX);
    parts.push(p);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(tick);
  }

  function addSparks(x, y, color, n, opt) {
    opt = opt || {};
    for (let i = 0; i < n; i++) {
      const a = (opt.angle != null ? opt.angle : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * (opt.spread != null ? opt.spread : Math.PI * 2);
      const sp = (opt.speed || 260) * (0.35 + Math.random());
      push({
        t: 'spark', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift || 40),
        life: 0, max: (opt.life || 0.42) * (0.7 + Math.random() * 0.6),
        w: 1.2 + Math.random() * 2.2, c: color, g: opt.g != null ? opt.g : 900, drag: 0.9
      });
    }
  }

  function addDots(x, y, color, n, opt) {
    opt = opt || {};
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opt.speed || 150) * (0.3 + Math.random());
      push({
        t: 'dot', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift || 20),
        life: 0, max: (opt.life || 0.8) * (0.6 + Math.random()),
        r: (opt.r || 3) * (0.5 + Math.random()), c: color, g: opt.g != null ? opt.g : 120, drag: 0.94, glow: opt.glow !== false
      });
    }
  }

  function addShards(x, y, color, n, opt) {
    opt = opt || {};
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opt.speed || 220) * (0.4 + Math.random());
      push({
        t: 'shard', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift || 160),
        life: 0, max: (opt.life || 1.0) * (0.7 + Math.random()),
        r: 3 + Math.random() * 6, c: color, g: 1100, rot: Math.random() * 6, vrot: (Math.random() - 0.5) * 14, drag: 0.99
      });
    }
  }

  function ring(x, y, color, opt) {
    opt = opt || {};
    push({ t: 'ring', x: x, y: y, life: 0, max: opt.life || 0.5, r0: opt.r0 || 6, r1: opt.r1 || 90, w: opt.w || 3, c: color });
  }

  function flash(x, y, color, opt) {
    opt = opt || {};
    push({ t: 'flash', x: x, y: y, life: 0, max: opt.life || 0.22, r: opt.r || 90, c: color });
  }

  function beam(x1, y1, x2, y2, color, opt) {
    opt = opt || {};
    push({ t: 'beam', x: x1, y: y1, x2: x2, y2: y2, life: 0, max: opt.life || 0.26, w: opt.w || 4, c: color, jag: opt.jag !== false, seed: Math.random() * 1000 });
  }

  function slash(x1, y1, x2, y2, color, opt) {
    opt = opt || {};
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const nx = -(y2 - y1), ny = (x2 - x1);
    const len = Math.hypot(nx, ny) || 1;
    const bend = (opt.bend != null ? opt.bend : 0.22) * (Math.random() < 0.5 ? -1 : 1);
    push({
      t: 'slash', x: x1, y: y1, cx: mx + nx / len * len * 0.12 * bend * 8, cy: my + ny / len * len * 0.12 * bend * 8,
      x2: x2, y2: y2, life: 0, max: opt.life || 0.3, w: opt.w || 7, c: color
    });
  }

  function projectile(x1, y1, x2, y2, color, opt) {
    opt = opt || {};
    push({
      t: 'comet', x: x1, y: y1, x0: x1, y0: y1, x2: x2, y2: y2, life: 0,
      max: opt.life || 0.28, r: opt.r || 8, c: color, kind: opt.kind || 'fire'
    });
  }

  function tick(now) {
    if (!cv) { running = false; return; }
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }
      draw(p, k, dt);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }

  function draw(p, k, dt) {
    const e = 1 - k;
    switch (p.t) {
      case 'spark': {
        p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = e;
        ctx.strokeStyle = p.c; ctx.lineWidth = p.w * (0.4 + e * 0.6); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
        ctx.stroke();
        break;
      }
      case 'dot': {
        p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = e * 0.9;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.4, p.r * (0.4 + e * 0.8)), 0, 6.2832); ctx.fill();
        break;
      }
      case 'shard': {
        p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
        ctx.globalAlpha = e;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.moveTo(-p.r, -p.r * 0.35); ctx.lineTo(p.r, 0); ctx.lineTo(-p.r * 0.6, p.r * 0.6); ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      }
      case 'ring': {
        const r = p.r0 + (p.r1 - p.r0) * (1 - e * e);
        ctx.globalAlpha = e * 0.85;
        ctx.strokeStyle = p.c; ctx.lineWidth = p.w * e + 0.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.stroke();
        break;
      }
      case 'flash': {
        const r = p.r * (0.6 + k * 0.8);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, p.c);
        g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = e * 0.9;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
        break;
      }
      case 'beam': {
        ctx.globalAlpha = e;
        ctx.strokeStyle = p.c; ctx.lineWidth = p.w * e + 1;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        const segs = 7;
        const dx = p.x2 - p.x, dy = p.y2 - p.y;
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const jx = i === 0 || i === segs ? 0 : (Math.sin(p.seed + i * 3.1) * 0.5 + Math.sin(p.seed * 2 + i * 7.7) * 0.5) * 14;
          const jy = i === 0 || i === segs ? 0 : (Math.cos(p.seed + i * 2.3) * 0.5 + Math.cos(p.seed * 3 + i * 5.1) * 0.5) * 14;
          const px = p.x + dx * t + jx, py = p.y + dy * t + jy;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      }
      case 'slash': {
        ctx.globalAlpha = e;
        const prog = Math.min(1, k / 0.45);
        ctx.strokeStyle = p.c;
        ctx.lineCap = 'round';
        const steps = 18;
        for (let i = 0; i < steps * prog; i++) {
          const t0 = i / steps, t1 = (i + 1) / steps;
          const a = bez(p, t0), b = bez(p, t1);
          const taper = Math.sin(Math.min(1, (i / steps) * 1.15) * Math.PI);
          ctx.lineWidth = p.w * taper * (0.5 + e * 0.9) + 0.5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        break;
      }
      case 'comet': {
        const t = 1 - Math.pow(1 - k, 1.7);
        const x = p.x0 + (p.x2 - p.x0) * t, y = p.y0 + (p.y2 - p.y0) * t - Math.sin(t * Math.PI) * 26;
        ctx.globalAlpha = 1;
        for (let i = 1; i <= 5; i++) {
          const tt = Math.max(0, t - i * 0.035);
          const px = p.x0 + (p.x2 - p.x0) * tt, py = p.y0 + (p.y2 - p.y0) * tt - Math.sin(tt * Math.PI) * 26;
          ctx.globalAlpha = (1 - i / 6) * 0.4;
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(px, py, p.r * (1.05 - i / 7), 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.35, p.c);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, p.r * 3, 0, 6.2832); ctx.fill();
        break;
      }
    }
    ctx.globalAlpha = 1;
  }

  function bez(p, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * p.x + 2 * mt * t * p.cx + t * t * p.x2,
      y: mt * mt * p.y + 2 * mt * t * p.cy + t * t * p.y2
    };
  }

  /* ---------------- public effects ---------------- */
  const VFX = {
    setReduced: function (v) { reduced = !!v; if (reduced && cv) { parts = []; ctx.clearRect(0, 0, W, H); } },
    resize: function () { resize(); },

    /* 적 피격: 화이트 플래시 + 원소 폭발 + 파편 */
    hit: function (el, kind, heavy) {
      if (reduced || !ensure()) return;
      const c = centerOf(el);
      const color = col(kind);
      flash(c.x, c.y, 'rgba(255,255,255,0.9)', { r: heavy ? 130 : 90, life: 0.16 });
      if (kind === 'bolt') {
        beam(c.x - 60, c.y - 90, c.x + 40, c.y + 40, color, { w: 5 });
        addSparks(c.x, c.y, color, heavy ? 20 : 12, { speed: 330 });
      } else if (kind === 'fire') {
        addDots(c.x, c.y, color, heavy ? 26 : 16, { speed: 200, lift: 120, r: 5, life: 0.9 });
        addSparks(c.x, c.y, '#ffd8a8', heavy ? 16 : 10, { speed: 280 });
      } else if (kind === 'venom') {
        addDots(c.x, c.y + 10, color, heavy ? 22 : 14, { speed: 170, lift: -30, g: 420, r: 4, life: 1.0 });
      } else if (kind === 'leech') {
        addDots(c.x, c.y, color, 14, { speed: 150, lift: 40, r: 4 });
        ring(c.x, c.y, color, { r1: 70, w: 2 });
      } else if (kind === 'guard') {
        ring(c.x, c.y, color, { r1: 80, w: 3 });
      } else {
        slash(c.x - 62, c.y - 62, c.x + 58, c.y + 52, '#ffffff', { w: heavy ? 9 : 6, life: 0.26 });
        if (heavy) slash(c.x + 54, c.y - 50, c.x - 50, c.y + 58, color, { w: 6, life: 0.3 });
        addSparks(c.x, c.y, color, heavy ? 18 : 10, { speed: 300 });
      }
      ring(c.x, c.y, color, { r0: 10, r1: heavy ? 110 : 78, w: heavy ? 4 : 2.5, life: 0.42 });
      if (heavy) addShards(c.x, c.y, color, 7, { speed: 200 });
      start();
    },

    /* 원거리 스킬: 트레이에서 적으로 발사체 */
    cast: function (fromEl, toEl, kind) {
      if (reduced || !ensure()) return;
      if (['slash', 'guard', 'mult', 'hex'].indexOf(kind) >= 0) return;
      const a = centerOf(fromEl), b = centerOf(toEl);
      projectile(a.x, a.y - 10, b.x, b.y, col(kind), { r: 9, life: 0.24, kind: kind });
      start();
    },

    /* 처치: 산산조각 */
    death: function (el, kind) {
      if (reduced || !ensure()) return;
      const c = centerOf(el);
      const color = col(kind);
      addShards(c.x, c.y, color, 18, { speed: 260, life: 1.1 });
      addDots(c.x, c.y, '#000000', 0, {});
      addDots(c.x, c.y, color, 20, { speed: 120, lift: 60, r: 5, life: 1.2 });
      ring(c.x, c.y, color, { r1: 150, w: 4, life: 0.6 });
      flash(c.x, c.y, 'rgba(255,255,255,0.7)', { r: 120, life: 0.3 });
      start();
    },

    /* 주사위 착지 스파크 */
    diceLand: function (el, color) {
      if (reduced || !ensure()) return;
      const r = rectOf(el);
      const x = r.left + r.width / 2, y = r.top + r.height * 0.92;
      addSparks(x, y, color || '#ffd98a', 5, { speed: 120, lift: 20, life: 0.32, spread: 1.1, g: 500 });
      start();
    },

    /* 콤보 상승 펄스 (화면 중앙) */
    combo: function (level, el) {
      if (reduced || !ensure() || level < 2) return;
      const c = el ? centerOf(el) : { x: W / 2, y: H * 0.34 };
      ring(c.x, c.y, level >= 6 ? '#ffe7a3' : '#fbbf24', { r0: 8, r1: 34 + level * 5, w: 2, life: 0.4 });
      addSparks(c.x, c.y, '#fbbf24', 5 + level, { speed: 130, lift: 40, spread: 1.4, life: 0.36, g: 300 });
      start();
    },

    /* 방어도 획득: 플레이어 쪽 방패 링 */
    guard: function (el) {
      if (reduced || !ensure()) return;
      const c = centerOf(el);
      /* v7.8 — 방어도 링은 체력 칩 주변에서 작게. 화면을 가로지르던 큰 호 수정 */
      ring(c.x, c.y, '#7fc9ff', { r0: 34, r1: 14, w: 2, life: 0.34 });
      addDots(c.x, c.y, '#7fc9ff', 7, { speed: 70, lift: -34, r: 2.4, life: 0.5 });
      start();
    },

    /* 보스 등장 컷인: 화면 전체에 보스 아트 + 이름 */
    bossCutin: function (enemyEl, title, sub, artUrl) {
      if (reduced) { DC.FX && DC.FX.banner(sub || title, 'cinematic'); return; }
      const layer = document.getElementById('fx') || document.body;
      const d = document.createElement('div');
      d.className = 'fx-cutin';
      d.innerHTML =
        '<div class="cut-veil"></div>' +
        (artUrl ? '<div class="cut-art"><img src="' + artUrl + '" alt=""></div>' : '') +
        '<div class="cut-text">' +
          '<span class="cut-kicker">BOSS ENCOUNTER</span>' +
          '<div class="cut-title">' + (title || 'BOSS') + '</div>' +
          (sub ? '<div class="cut-sub">' + sub + '</div>' : '') +
        '</div>';
      layer.appendChild(d);
      document.body.classList.add('cutin');
      setTimeout(function () {
        document.body.classList.remove('cutin');
        if (d.parentNode) d.parentNode.removeChild(d);
      }, 2100);
      if (ensure()) {
        const c = enemyEl ? centerOf(enemyEl) : { x: W / 2, y: H * 0.35 };
        flash(c.x, c.y, 'rgba(255,190,80,0.45)', { r: 280, life: 0.55 });
        addSparks(c.x, c.y, '#f0b45a', 18, { speed: 260, lift: 80, life: 0.7, g: 120 });
        start();
      }
    },

    clear: function () { parts = []; if (ctx) ctx.clearRect(0, 0, W, H); }
  };

  DC.VFX = VFX;
})();
