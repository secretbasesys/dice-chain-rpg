/* Visual juice: floating numbers, particles, screen shake, banners */
(function () {
  'use strict';
  const DC = window.DC;
  let fxLayer = null;
  let reduced = false;

  function layer() {
    if (!fxLayer) fxLayer = document.getElementById('fx');
    return fxLayer;
  }

  function rectOf(el) {
    if (!el) return { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const r = el.getBoundingClientRect();
    return r;
  }

  const FX = {
    setReduced: function (v) { reduced = !!v; },
    isReduced: function () { return reduced; },

    float: function (text, x, y, cls, opts) {
      const L = layer(); if (!L) return;
      const d = document.createElement('div');
      d.className = 'fx-float ' + (cls || '');
      d.textContent = text;
      const cx = Math.max(44, Math.min(window.innerWidth - 44, x));
      d.style.left = cx + 'px';
      d.style.top = y + 'px';
      if (opts && opts.size) d.style.fontSize = opts.size + 'px';
      if (opts && opts.color) d.style.color = opts.color;
      L.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1100);
    },

    floatAt: function (el, text, cls, opts) {
      const r = rectOf(el);
      const jx = (Math.random() - 0.5) * (cls && cls.indexOf('combo') >= 0 ? 0 : 26);
      const dy = opts && opts.dy ? opts.dy : 0;
      FX.float(text, r.left + r.width / 2 + jx, r.top + r.height * 0.36 + dy, cls, opts);
    },

    burst: function (el, color, n) {
      const L = layer(); if (!L || reduced) return;
      const r = rectOf(el);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const count = n || 10;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'fx-particle';
        const a = Math.random() * Math.PI * 2;
        const dist = 26 + Math.random() * 60;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = color || '#fff';
        p.style.setProperty('--dx', Math.cos(a) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(a) * dist + 'px');
        p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
        L.appendChild(p);
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 700);
      }
    },

    shake: function (power) {
      if (reduced) return;
      const root = document.getElementById('app');
      if (!root) return;
      const p = Math.min(14, power || 4);
      root.style.setProperty('--shake', p + 'px');
      root.classList.remove('shaking');
      void root.offsetWidth;
      root.classList.add('shaking');
      setTimeout(function () { root.classList.remove('shaking'); }, 380);
    },

    banner: function (text, cls) {
      const L = layer(); if (!L) return;
      const d = document.createElement('div');
      d.className = 'fx-banner ' + (cls || '');
      d.innerHTML = text;
      L.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1350);
    },

    flash: function (color) {
      if (reduced) return;
      const L = layer(); if (!L) return;
      const d = document.createElement('div');
      d.className = 'fx-flash';
      d.style.background = color || 'rgba(255,255,255,.35)';
      L.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 320);
    },
  };
  DC.FX = FX;
})();
