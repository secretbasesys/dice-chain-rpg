/* =========================================================
   다이스 체인 — v1.4 art pack
   Hand-drawn 32x32 SVG illustrations for map nodes, relics
   and mystery events. Layered silhouettes so each one reads
   as a small illustration instead of a flat glyph.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  const glow = function (cx, cy, r, o) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="currentColor" opacity="' + (o || 0.12) + '" stroke="none"/>';
  };

  /* ---------------- map nodes ---------------- */
  DC.NODE_ART = {
    combat:
      glow(16, 16, 12, 0.07) +
      '<path d="M22.8 3.2l4 4-12 12-4-4z" fill="currentColor" opacity=".26"/>' +
      '<path d="M22.8 3.2l4 4-12 12-4-4z"/>' +
      '<path d="M9.2 3.2l-4 4 12 12 4-4z" fill="currentColor" opacity=".26"/>' +
      '<path d="M9.2 3.2l-4 4 12 12 4-4z"/>' +
      '<path d="M9.6 14.4l3.6 3.6M22.4 14.4l-3.6 3.6" stroke-width="2.2"/>' +
      '<path d="M11.4 19.4l-2.8 2.8M20.6 19.4l2.8 2.8" stroke-width="2"/>' +
      '<circle cx="7.4" cy="23.4" r="1.5" fill="currentColor" stroke="none"/><circle cx="24.6" cy="23.4" r="1.5" fill="currentColor" stroke="none"/>',

    elite:
      glow(16, 17, 12, 0.12) +
      '<path d="M8.6 12.6c0-4 3-7 7.4-7s7.4 3 7.4 7c0 2.2-.7 3.9-1.9 5.4" />' +
      '<path d="M8.6 12.6c0 2.2.7 3.9 1.9 5.4" />' +
      '<path d="M12 18.4c0 3.4 1.8 6.4 4 6.4s4-3 4-6.4c0-1.2-1.8-2-4-2s-4 .8-4 2z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 18.4c0 3.4 1.8 6.4 4 6.4s4-3 4-6.4c0-1.2-1.8-2-4-2s-4 .8-4 2z"/>' +
      '<path d="M8 9.4L4.4 5l4.6.9M24 9.4L27.6 5l-4.6.9" stroke-width="2"/>' +
      '<path d="M12.4 13.6l2 .9M19.6 13.6l-2 .9" stroke-width="1.8"/>' +
      '<path d="M13.6 22.6c.7-.6 1.5-.6 2.2 0M18 22.6c-.7-.6-1.5-.6-2.2 0" opacity=".7"/>' +
      '<path d="M14.6 18.6h2.8M14.2 20.2h3.6" opacity=".55"/>',

    boss:
      glow(16, 17, 15, 0.14) +
      '<path d="M6.6 12.2L9 5.8l3.4 3.4L16 4l3.6 5.2L23 5.8l2.4 6.4z" fill="currentColor" opacity=".9" stroke="none"/>' +
      '<path d="M6.6 12.2L9 5.8l3.4 3.4L16 4l3.6 5.2L23 5.8l2.4 6.4z"/>' +
      '<path d="M6.8 13.4h18.4" stroke-width="2"/>' +
      '<circle cx="16" cy="20" r="6.4" fill="currentColor" opacity=".18"/>' +
      '<circle cx="16" cy="20" r="6.4"/>' +
      '<path d="M12.6 19.4c.9-.9 2-.9 2.9 0M16.5 19.4c.9-.9 2-.9 2.9 0" stroke-width="1.7"/>' +
      '<path d="M14.6 23.6h2.8M15 25.4v1.8M17 25.4v1.8" opacity=".85"/>' +
      '<path d="M10.4 26.4a7.4 7.4 0 0 0 11.2 0" opacity=".4"/>',

    forge:
      glow(16, 22, 12, 0.14) +
      '<path d="M6.4 22.4h19.2l-2.6 4.2H9z" fill="currentColor" opacity=".3"/>' +
      '<path d="M6.4 22.4h19.2l-2.6 4.2H9z"/>' +
      '<path d="M9.2 22.4c0-2.4 1.6-4.2 3.4-4.2h6.8c1.8 0 3.4 1.8 3.4 4.2" fill="currentColor" opacity=".18"/>' +
      '<path d="M9.2 22.4c0-2.4 1.6-4.2 3.4-4.2h6.8c1.8 0 3.4 1.8 3.4 4.2"/>' +
      '<path d="M22.6 8.2l3.4 3.4M21 9.8l4-4 1.2 1.2-4 4z" stroke-width="2"/>' +
      '<path d="M16 12.2c.9 1 1 2.2.4 3.2M13.4 11.4c1.4 1.4 1.6 3.2.6 4.6M18.6 11.4c-1.4 1.4-1.6 3.2-.6 4.6" opacity=".8"/>' +
      '<path d="M24.4 15.2l1.8 2.2M11.6 6.2l1.2 4.6M7.8 10l3.8 2.4" opacity=".5"/>',

    shop:
      glow(16, 14, 13, 0.1) +
      '<path d="M6 14h20v11.4a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 25.4z" fill="currentColor" opacity=".16"/>' +
      '<path d="M6 14h20v11.4a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 25.4z"/>' +
      '<path d="M5 14l2.6-6h16.8L27 14z" fill="currentColor" opacity=".38"/>' +
      '<path d="M5 14l2.6-6h16.8L27 14z"/>' +
      '<path d="M9.4 8h3.2v6M15.4 8h1.2M19.4 8h3.2" opacity=".6"/>' +
      '<path d="M11 20.4h10M12.4 24h7.2" opacity=".45"/>' +
      '<circle cx="16" cy="18" r="2.4" fill="currentColor" opacity=".7" stroke="none"/>',

    rest:
      glow(16, 22, 11, 0.16) +
      '<path d="M8.6 25.6l14.8-3.2M8.6 22.4l14.8 3.2" stroke-width="2.4" opacity=".8"/>' +
      '<path d="M16 5.6c2.4 3 4.4 5.4 4.4 8.4 0 3-2 5.2-4.4 5.2s-4.4-2.2-4.4-5.2c0-3 2-5.4 4.4-8.4z" fill="currentColor" opacity=".28"/>' +
      '<path d="M16 9.4c1.4 2 2.4 3.4 2.4 5.2 0 1.8-1.1 3.2-2.4 3.2s-2.4-1.4-2.4-3.2c0-1.8 1-3.2 2.4-5.2z" fill="currentColor" stroke="none"/>' +
      '<path d="M16 5.6c2.4 3 4.4 5.4 4.4 8.4 0 3-2 5.2-4.4 5.2s-4.4-2.2-4.4-5.2c0-3 2-5.4 4.4-8.4z"/>' +
      '<path d="M16 22.6c0 .9 0 1.6 0 2.4M10.4 18.4l-1.8 1.4M21.6 18.4l1.8 1.4" opacity=".7"/>' +
      '<circle cx="11.4" cy="12" r=".9" fill="currentColor" stroke="none" opacity=".8"/><circle cx="21" cy="10.6" r=".7" fill="currentColor" stroke="none" opacity=".6"/>',

    mystery:
      glow(16, 16, 14, 0.12) +
      '<path d="M16 5c4.2 0 7 4.2 7 11s-2.8 11-7 11-7-4.2-7-11S11.8 5 16 5z" fill="currentColor" opacity=".1"/>' +
      '<ellipse cx="16" cy="16" rx="9" ry="6.4" transform="rotate(-24 16 16)"/>' +
      '<ellipse cx="16" cy="16" rx="8.4" ry="5.4" transform="rotate(24 16 16)" opacity=".7"/>' +
      '<ellipse cx="16" cy="16" rx="4.4" ry="3" transform="rotate(-24 16 16)" fill="currentColor" opacity=".25"/>' +
      '<path d="M16 12.6l.9 2 2.2.3-1.6 1.5.4 2.2-1.9-1-1.9 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" stroke="none"/>' +
      '<path d="M5.6 7.4l2 1.2M26.4 7.4l-2 1.2M5.2 24l2.2-1.4M26.8 24l-2.2-1.4" opacity=".45"/>',
  };

  /* ---------------- relics (18) ---------------- */
  const dieBody = '<rect x="8" y="8" width="16" height="16" rx="3.4" fill="currentColor" opacity=".2"/><rect x="8" y="8" width="16" height="16" rx="3.4"/>';
  const pip = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 1.5) + '" fill="currentColor" stroke="none"/>'; };

  DC.RELIC_ART = {
    rune:
      dieBody +
      '<path d="M12 18.6l4-7 4 7M13.4 16.4h5.2" stroke-width="1.5"/>' +
      '<path d="M16 2.6v2.4M16 27v2.4M2.6 16h2.4M27 16h2.4" opacity=".45"/>',

    doubleRoll:
      '<rect x="4.6" y="8.4" width="14" height="14" rx="3" fill="currentColor" opacity=".18" transform="rotate(-10 11.6 15.4)"/>' +
      '<rect x="4.6" y="8.4" width="14" height="14" rx="3" transform="rotate(-10 11.6 15.4)"/>' +
      '<rect x="13.4" y="9.6" width="14" height="14" rx="3" fill="currentColor" opacity=".18" transform="rotate(10 20.4 16.6)"/>' +
      '<rect x="13.4" y="9.6" width="14" height="14" rx="3" transform="rotate(10 20.4 16.6)"/>' +
      '<path d="M24.4 5.2a11.4 11.4 0 0 1 3.2 7.6M7.6 26.8A11.4 11.4 0 0 1 4.4 19.2" opacity=".6"/>' +
      '<path d="M27.6 5.6l-3.4-.4.6 3.4M4.4 26.4l3.4.4-.6-3.4" opacity=".6"/>' +
      pip(20.4, 16.6, 1.4),

    luckyCoin:
      '<circle cx="16" cy="16" r="10" fill="currentColor" opacity=".18"/>' +
      '<circle cx="16" cy="16" r="10"/>' +
      '<circle cx="16" cy="16" r="7" stroke-dasharray="1.6 2" opacity=".7"/>' +
      '<path d="M16 11.4c1.8-2.6 5.4-2 5.4.8 0 2.4-3.2 3.4-5.4 6.4-2.2-3-5.4-4-5.4-6.4 0-2.8 3.6-3.4 5.4-.8z" fill="currentColor" stroke="none" opacity=".9"/>' +
      '<path d="M16 19.8v3" stroke-width="1.4"/>',

    flameHeart:
      '<path d="M16 27c5.4 0 9-3.6 9-8.2 0-4-2.6-6.6-5.2-9.4C18.4 7.8 17.4 5.4 16 3c-1.4 2.4-2.4 4.8-3.8 6.4-2.6 2.8-5.2 5.4-5.2 9.4C7 23.4 10.6 27 16 27z" fill="currentColor" opacity=".22"/>' +
      '<path d="M16 27c5.4 0 9-3.6 9-8.2 0-4-2.6-6.6-5.2-9.4C18.4 7.8 17.4 5.4 16 3" />' +
      '<path d="M16 27c-5.4 0-9-3.6-9-8.2 0-4 2.6-6.6 5.2-9.4C14.6 7.8 15.4 5.4 16 3" />' +
      '<path d="M16 24.2c2.8 0 4.8-2 4.8-4.6 0-2.4-2-3.8-3.2-5.6-.8-.8-1.2-1.8-1.6-2.8-.4 1-1 2-1.6 2.8-1.2 1.8-3.2 3.2-3.2 5.6 0 2.6 2 4.6 4.8 4.6z" fill="currentColor" stroke="none" opacity=".85"/>',

    conductor:
      '<path d="M17 3L9 17.6h6L13 29l10-15.4h-6.2z" fill="currentColor" opacity=".2"/>' +
      '<path d="M17 3L9 17.6h6L13 29l10-15.4h-6.2z"/>' +
      '<path d="M4 9.4c1.6-1 3-1 4.6 0M23.4 21c1.6-1 3-1 4.6 0" opacity=".55" stroke-width="1.3"/>' +
      '<circle cx="23" cy="8" r="1.3" fill="currentColor" stroke="none" opacity=".8"/>',

    wrist:
      '<path d="M8.6 10.6h11.8l2.4 3.4v6.6c0 2.6-2 4.6-4.6 4.6h-5.2c-2 0-3.6-1.2-4.2-3l-2.6-7.4c-.6-1.8.6-3.4 2.4-3.4z" fill="currentColor" opacity=".18"/>' +
      '<path d="M8.6 10.6h11.8l2.4 3.4v6.6c0 2.6-2 4.6-4.6 4.6h-5.2c-2 0-3.6-1.2-4.2-3l-2.6-7.4c-.6-1.8.6-3.4 2.4-3.4z"/>' +
      '<path d="M9.6 15.4h9.6M9.6 19.4h9.6" opacity=".55"/>' +
      '<path d="M13 10.2c0-2.6 1.3-4.4 3-4.4s3 1.8 3 4.4" opacity=".8"/>' +
      '<path d="M16 20.4l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" stroke="none" opacity=".9"/>',

    mask:
      glow(16, 16, 12, 0.1) +
      '<path d="M6 8.4l4.4 2L16 5l5.6 5.4 4.4-2-1.6 8.2c-.4 4-3.8 7.4-8.4 7.4s-8-3.4-8.4-7.4z" fill="currentColor" opacity=".2"/>' +
      '<path d="M6 8.4l4.4 2L16 5l5.6 5.4 4.4-2-1.6 8.2c-.4 4-3.8 7.4-8.4 7.4s-8-3.4-8.4-7.4z"/>' +
      '<path d="M10.4 13.4c1.4-1 2.6-1 4 0M17.6 13.4c1.4-1 2.6-1 4 0" stroke-width="1.8"/>' +
      '<circle cx="12.2" cy="15.4" r="1.3" fill="currentColor" stroke="none"/><circle cx="19.8" cy="15.4" r="1.3" fill="currentColor" stroke="none"/>' +
      '<path d="M12.6 21c1.1.9 2.3 1.3 3.4 1.3s2.3-.4 3.4-1.3M13.4 23.4l1 2M18.6 23.4l-1 2" opacity=".7"/>',

    gamblersHand:
      '<path d="M9.4 27V16.6c0-1.2-.8-2-1.8-2s-1.8.8-1.8 2v4.2" opacity=".6"/>' +
      '<path d="M19.4 27c3 0 5.2-2.2 5.2-5.2v-5.4c0-1.4-.8-2.2-1.8-2.2-1 0-1.6.6-1.8 1.6 0-1.4-.9-2.2-1.9-2.2s-1.8.8-1.9 2.1c-.1-1.2-1-1.9-1.9-1.9-1 0-1.8.8-1.8 2v1" stroke-width="1.7"/>' +
      '<path d="M9.4 16.6l1.8-5.2c.4-1.2 1.6-1.6 2.6-1.2 1 .5 1.2 1.6.8 2.8l-1.2 3.4" stroke-width="1.7"/>' +
      '<rect x="14.4" y="4.4" width="6.4" height="9" rx="1.4" fill="currentColor" opacity=".3" transform="rotate(14 17.6 8.9)"/>' +
      '<path d="M9.4 21.4h7.8a2 2 0 0 1 0 4H9.4" opacity=".7"/>',

    grail:
      '<path d="M9 5h14l-1.4 8.2c-.4 2.6-2.8 4.6-5.6 4.6s-5.2-2-5.6-4.6z" fill="currentColor" opacity=".22"/>' +
      '<path d="M9 5h14l-1.4 8.2c-.4 2.6-2.8 4.6-5.6 4.6s-5.2-2-5.6-4.6z"/>' +
      '<path d="M9 5c0 2 .8 3.2 2 3.6M23 5c0 2-.8 3.2-2 3.6" opacity=".55"/>' +
      '<path d="M16 18v5.4M12 27c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6z" fill="currentColor" opacity=".3"/>' +
      '<path d="M12 27c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6z"/>' +
      '<path d="M11.4 8.6c1.4 2.4 3 3.6 4.6 3.6s3.2-1.2 4.6-3.6" stroke-width="1.2" opacity=".8"/>' +
      '<path d="M16 12.4v2.2" stroke-width="1.4" opacity=".8"/>',

    hourglass:
      '<path d="M8.4 4.4h15.2M8.4 27.6h15.2" stroke-width="2"/>' +
      '<path d="M10.2 4.4c0 5.4 3 7 5.8 9.4 2.8-2.4 5.8-4 5.8-9.4M10.2 27.6c0-5.4 3-7 5.8-9.4 2.8 2.4 5.8 4 5.8 9.4" fill="currentColor" opacity=".16"/>' +
      '<path d="M10.2 4.4c0 5.4 3 7 5.8 9.4 2.8-2.4 5.8-4 5.8-9.4M10.2 27.6c0-5.4 3-7 5.8-9.4 2.8 2.4 5.8 4 5.8 9.4"/>' +
      '<path d="M12.2 8c0 3 2.4 4.4 3.8 6 1.4-1.6 3.8-3 3.8-6z" fill="currentColor" stroke="none" opacity=".8"/>' +
      '<path d="M13.6 25.4c1-1.6 2.4-2.6 2.4-4.2 0-1.6-1.4-2.6-2.4-4.2" opacity=".5"/>' +
      '<circle cx="16" cy="16" r=".8" fill="currentColor" stroke="none"/>',

    contract:
      '<path d="M9 4.6h11.6c1.6 0 2.8 1.2 2.8 2.8v17.2c0 1.6-1.2 2.8-2.8 2.8H9c-1.6 0-2.8-1.2-2.8-2.8V7.4C6.2 5.8 7.4 4.6 9 4.6z" fill="currentColor" opacity=".14"/>' +
      '<path d="M9 4.6h11.6c1.6 0 2.8 1.2 2.8 2.8v17.2c0 1.6-1.2 2.8-2.8 2.8H9c-1.6 0-2.8-1.2-2.8-2.8V7.4C6.2 5.8 7.4 4.6 9 4.6z"/>' +
      '<path d="M9.8 10h8.4M9.8 13.4h8.4M9.8 16.8h5.6" opacity=".55"/>' +
      '<circle cx="20.4" cy="21.6" r="4.2" fill="currentColor" opacity=".35"/>' +
      '<circle cx="20.4" cy="21.6" r="4.2"/>' +
      '<path d="M18.6 21.6l1.4 1.4 2.4-2.8" stroke-width="1.4"/>' +
      '<path d="M6.6 7.4c-1.4 0-2.4 1-2.4 2.4v14" opacity=".4"/>',

    scale:
      '<path d="M16 5v20M9 27h14" stroke-width="2"/>' +
      '<path d="M5 10.4h22" stroke-width="1.8"/>' +
      '<path d="M5 10.4l-3 6.4c0 1.8 1.4 3.2 3 3.2s3-1.4 3-3.2z" fill="currentColor" opacity=".2"/>' +
      '<path d="M5 10.4l-3 6.4c0 1.8 1.4 3.2 3 3.2s3-1.4 3-3.2z"/>' +
      '<path d="M27 10.4l-3 6.4c0 1.8 1.4 3.2 3 3.2s3-1.4 3-3.2z" fill="currentColor" opacity=".2"/>' +
      '<circle cx="16" cy="4.6" r="2" fill="currentColor" stroke="none"/>' +
      '<path d="M11.4 7.4a6 1.4 0 0 0 9.2 0" opacity=".5"/>' +
      '<circle cx="5" cy="7.2" r=".9" fill="currentColor" stroke="none" opacity=".7"/><circle cx="27" cy="7.2" r=".9" fill="currentColor" stroke="none" opacity=".7"/>',

    pledge:
      '<circle cx="16" cy="16" r="11.6" stroke-dasharray="2.4 2.6" opacity=".55"/>' +
      dieBody +
      pip(12, 12) + pip(20, 12) + pip(12, 20) + pip(20, 20) +
      '<path d="M16 1.6l1.4 3 3.2.4-2.3 2.2.6 3.2L16 8.8l-2.9 1.6.6-3.2-2.3-2.2 3.2-.4z" fill="currentColor" stroke="none" opacity=".9"/>',

    echo:
      '<circle cx="16" cy="16" r="3.4" fill="currentColor" opacity=".5" stroke="none"/>' +
      '<circle cx="16" cy="16" r="6.4" opacity=".8"/>' +
      '<circle cx="16" cy="16" r="10" opacity=".5" stroke-dasharray="2 2.4"/>' +
      '<circle cx="16" cy="16" r="13.4" opacity=".25" stroke-dasharray="1.4 3"/>' +
      '<path d="M16 2.2v3M16 26.8v3" opacity=".45"/>',

    sixBless:
      '<circle cx="16" cy="16" r="12.4" fill="currentColor" opacity=".08" stroke="none"/>' +
      '<circle cx="16" cy="16" r="12.4" stroke-dasharray="1.4 3" opacity=".45"/>' +
      dieBody +
      pip(12, 12) + pip(16, 12, 1.3) + pip(20, 12) +
      pip(12, 20) + pip(16, 20, 1.3) + pip(20, 20) +
      '<path d="M16 .8l1 2.2 2.4.3-1.7 1.7.5 2.4L16 6.3l-2.2 1.1.5-2.4-1.7-1.7 2.4-.3z" fill="currentColor" stroke="none"/>',

    merchant:
      '<circle cx="16" cy="16" r="10.6" fill="currentColor" opacity=".14"/>' +
      '<circle cx="16" cy="16" r="10.6"/>' +
      '<path d="M16 6.6l2.4 3.4 4.2.8-3 3 .8 4.2-4.4-2.4-4.4 2.4.8-4.2-3-3 4.2-.8z" fill="currentColor" opacity=".55" stroke="none"/>' +
      '<path d="M10.4 22.4h11.2M11.6 25h8.8" opacity=".7"/>' +
      '<path d="M16 13.2v4.4M13.8 15.4h4.4" stroke-width="1.4" opacity=".9"/>',

    vampireFang:
      '<path d="M8 6.4h16l-2.2 5.6c-.8 2-2.2 3-3.4 3s-2-1-2.4-3.2c-.4 2.2-1.2 3.2-2.4 3.2s-2.6-1-3.4-3z" fill="currentColor" opacity=".28"/>' +
      '<path d="M8 6.4h16l-2.2 5.6c-.8 2-2.2 3-3.4 3s-2-1-2.4-3.2c-.4 2.2-1.2 3.2-2.4 3.2s-2.6-1-3.4-3z"/>' +
      '<path d="M9.6 6.4l1.6 4.2M22.4 6.4l-1.6 4.2" opacity=".5"/>' +
      '<path d="M16 14.6c2 0 3.6 1.6 3.6 3.6 0 2.6-1.8 4-3.6 6.6-1.8-2.6-3.6-4-3.6-6.6 0-2 1.6-3.6 3.6-3.6z" fill="currentColor" stroke="none" opacity=".85"/>' +
      '<path d="M12.4 27c2.4-1 4.8-1 7.2 0" opacity=".4"/>',

    karma:
      '<path d="M12.6 6.6a5 5 0 0 1 7 0l2.4 2.4" stroke-width="2.4"/>' +
      '<path d="M19.4 25.4a5 5 0 0 1-7 0l-2.4-2.4" stroke-width="2.4"/>' +
      '<path d="M21.4 8.2l1.6-1.6-2.2-2.2-1.8 1.8" opacity=".7"/>' +
      '<path d="M10.6 23.8L9 25.4l2.2 2.2 1.8-1.8" opacity=".7"/>' +
      '<path d="M13.4 12.2l5.2 3-5.2 3z" fill="currentColor" stroke="none" opacity=".8"/>' +
      '<circle cx="16" cy="15.2" r="4.6" opacity=".4" stroke-dasharray="1.6 2"/>',
    vanguard:
      '<path d="M8.4 27.4V3.6" stroke-width="2.4"/>' +
      '<path d="M9 5.2h15l-3.4 4.8L24 14.8H9z" fill="currentColor" opacity=".3"/>' +
      '<path d="M9 5.2h15l-3.4 4.8L24 14.8H9z"/>' +
      '<path d="M9 14.8c3 1.4 4 3.6 3.2 6.4" opacity=".5"/>' +
      '<circle cx="8.4" cy="3.4" r="1.6" fill="currentColor" stroke="none"/>' +
      '<path d="M4.6 27.4h7.6" stroke-width="2.2"/>',

    thornMail:
      '<path d="M16 3.4l9 3.4v7.4c0 5.6-3.8 9.8-9 12-5.2-2.2-9-6.4-9-12V6.8z" fill="currentColor" opacity=".2"/>' +
      '<path d="M16 3.4l9 3.4v7.4c0 5.6-3.8 9.8-9 12-5.2-2.2-9-6.4-9-12V6.8z"/>' +
      '<path d="M16 8.4l1.6 4 4.2.4-3.2 2.8 1 4.2-3.6-2.2-3.6 2.2 1-4.2-3.2-2.8 4.2-.4z" fill="currentColor" stroke="none" opacity=".8"/>' +
      '<path d="M3.4 9.4l-1.6-1.6M28.6 9.4l1.6-1.6M16 .8v2" opacity=".55"/>',

    duelist:
      '<path d="M10.4 10.4V6.8a1.8 1.8 0 0 1 3.6 0v3.2M14 9.6V5.8a1.8 1.8 0 0 1 3.6 0v4M17.6 10V7.2a1.8 1.8 0 0 1 3.6 0v6.4" stroke-width="1.8"/>' +
      '<path d="M10.4 10.4c-1.2 0-2 .8-2 2v4.4c0 4 2.8 7 6.6 7s6.4-2.8 6.4-6.6v-3.4" fill="currentColor" opacity=".16"/>' +
      '<path d="M10.4 10.4c-1.2 0-2 .8-2 2v4.4c0 4 2.8 7 6.6 7s6.4-2.8 6.4-6.6v-3.4"/>' +
      '<path d="M12.4 15.4h7.2M12.4 18.6h7.2" opacity=".5"/>' +
      '<path d="M6.4 12.4l-2.4-1.2M6.6 16.4H4M7.4 20.4l-2.2 1" opacity=".35"/>',

    miser:
      '<path d="M8.4 12.4h15.2l1.6 10.4c.2 2.2-1.4 4-3.6 4H10.4c-2.2 0-3.8-1.8-3.6-4z" fill="currentColor" opacity=".2"/>' +
      '<path d="M8.4 12.4h15.2l1.6 10.4c.2 2.2-1.4 4-3.6 4H10.4c-2.2 0-3.8-1.8-3.6-4z"/>' +
      '<path d="M11.4 12.4c0-2.8 2-5 4.6-5s4.6 2.2 4.6 5" stroke-width="1.8"/>' +
      '<circle cx="16" cy="19" r="3.2" fill="currentColor" opacity=".35"/>' +
      '<path d="M16 16.4v5.2M14.8 17.6h2.6M14.8 20.4h2.6" stroke-width="1.3"/>' +
      '<circle cx="9.2" cy="8.4" r="2" fill="currentColor" stroke="none" opacity=".7"/>' +
      '<circle cx="23.4" cy="7.4" r="1.5" fill="currentColor" stroke="none" opacity=".55"/>',

  };

  /* ---------------- event illustrations (14) ---------------- */
  DC.EVENT_ART = {
    altar:
      glow(16, 16, 14, 0.14) +
      '<path d="M5.4 27.6h21.2" stroke-width="2"/>' +
      '<path d="M8.6 27.6V17.4h14.8v10.2" fill="currentColor" opacity=".16"/>' +
      '<path d="M8.6 27.6V17.4h14.8v10.2"/>' +
      '<path d="M6.4 17.4h19.2" stroke-width="2"/>' +
      '<path d="M12.4 27.6V20h7.2v7.6" opacity=".45"/>' +
      '<ellipse cx="16" cy="13" rx="6.2" ry="2.8" fill="currentColor" opacity=".35"/>' +
      '<path d="M9.8 13c0 2 2.8 3.4 6.2 3.4s6.2-1.4 6.2-3.4" />' +
      '<circle cx="16" cy="7.4" r="1.8" fill="currentColor" stroke="none"/>' +
      '<circle cx="11.4" cy="5.4" r="1.2" fill="currentColor" stroke="none" opacity=".7"/>' +
      '<circle cx="20.6" cy="5.4" r="1.2" fill="currentColor" stroke="none" opacity=".7"/>' +
      '<path d="M16 1.8v2M9.6 2.4l.8 1.8M22.4 2.4L21.6 4.2" opacity=".55"/>',

    cursedSword:
      '<path d="M4.4 24.4c4-2 8-2.8 11.6-2.8s7.6.8 11.6 2.8" opacity=".6"/>' +
      '<path d="M16 3.4l3.2 3.2v11.4h-6.4V6.6z" fill="currentColor" opacity=".22"/>' +
      '<path d="M16 3.4l3.2 3.2v11.4h-6.4V6.6z"/>' +
      '<path d="M9.6 18.4h12.8" stroke-width="2.4"/>' +
      '<path d="M16 18.4v5.2" stroke-width="2.2"/>' +
      '<circle cx="16" cy="25" r="1.6" fill="currentColor" stroke="none"/>' +
      '<path d="M11.4 9.4c-2.6 2.6-3 6.2-1.4 8.8M20.6 9.4c2.6 2.6 3 6.2 1.4 8.8" stroke-dasharray="1.6 2" opacity=".5"/>' +
      '<path d="M12.6 7.4c2-1.4 4.8-1.4 6.8 0" opacity=".7"/>',

    dicePile:
      '<ellipse cx="16" cy="25.4" rx="12" ry="2.8" fill="currentColor" opacity=".14" stroke="none"/>' +
      '<rect x="4.2" y="16.4" width="10" height="10" rx="2.2" fill="currentColor" opacity=".22" transform="rotate(-12 9.2 21.4)"/>' +
      '<rect x="4.2" y="16.4" width="10" height="10" rx="2.2" transform="rotate(-12 9.2 21.4)"/>' +
      '<rect x="17.4" y="17.4" width="10" height="10" rx="2.2" fill="currentColor" opacity=".22" transform="rotate(9 22.4 22.4)"/>' +
      '<rect x="17.4" y="17.4" width="10" height="10" rx="2.2" transform="rotate(9 22.4 22.4)"/>' +
      '<rect x="10.6" y="7.4" width="11" height="11" rx="2.4" fill="currentColor" opacity=".3"/>' +
      '<rect x="10.6" y="7.4" width="11" height="11" rx="2.4"/>' +
      pip(13.6, 10.4, 1.1) + pip(16.1, 12.9, 1.1) + pip(18.6, 15.4, 1.1) +
      '<path d="M23.4 6.2l1.6 1.6M6.4 10.4L4.8 12" opacity=".5"/>',

    spring:
      glow(16, 19, 14, 0.18) +
      '<ellipse cx="16" cy="20.4" rx="11.6" ry="5" fill="currentColor" opacity=".18"/>' +
      '<ellipse cx="16" cy="20.4" rx="11.6" ry="5"/>' +
      '<ellipse cx="16" cy="20.4" rx="6.4" ry="2.6" fill="currentColor" opacity=".28"/>' +
      '<path d="M16 4.4l1.6 4 4 .6-3 2.8.8 4-3.4-2.2-3.4 2.2.8-4-3-2.8 4-.6z" fill="currentColor" stroke="none"/>' +
      '<path d="M9 12.2l.8 1.8M23 11.4l.8 1.8M6.6 6.4l1.2 1.2M25.4 6.4L24.2 7.6" opacity=".6"/>' +
      '<path d="M5.6 23.4c3 1.6 6.6 2.4 10.4 2.4s7.4-.8 10.4-2.4" opacity=".45"/>',

    merchant:
      '<path d="M16 5.6c3 0 5.2 2.4 5.2 5.4 0 1.6-.8 2.8-1.8 3.8 2.8 1.6 4.4 4.4 4.4 8.2v4.4H10.2V23c0-3.8 1.6-6.6 4.4-8.2-1-1-1.8-2.2-1.8-3.8 0-3 2.2-5.4 5.2-5.4z" fill="currentColor" opacity=".2"/>' +
      '<path d="M16 5.6c3 0 5.2 2.4 5.2 5.4 0 1.6-.8 2.8-1.8 3.8 2.8 1.6 4.4 4.4 4.4 8.2v4.4H10.2V23c0-3.8 1.6-6.6 4.4-8.2-1-1-1.8-2.2-1.8-3.8 0-3 2.2-5.4 5.2-5.4z"/>' +
      '<path d="M12.8 10.6c.6 1.2 1.8 2 3.2 2s2.6-.8 3.2-2" opacity=".6"/>' +
      '<circle cx="13.8" cy="9.4" r="1" fill="currentColor" stroke="none"/><circle cx="18.2" cy="9.4" r="1" fill="currentColor" stroke="none"/>' +
      '<path d="M23.4 12.4h3.2l-1.2 4.4h-2.2z" fill="currentColor" opacity=".45"/>' +
      '<path d="M23.4 12.4h3.2l-1.2 4.4h-2.2zM24.6 9.4v3" />' +
      '<path d="M12.4 20.4h7.2M12.4 23.4h7.2" opacity=".4"/>',

    forgeSpirit:
      glow(16, 19, 13, 0.14) +
      '<path d="M6.4 27.4h19.2l-2.4-4.6H8.8z" fill="currentColor" opacity=".24"/>' +
      '<path d="M6.4 27.4h19.2l-2.4-4.6H8.8z"/>' +
      '<path d="M9.4 22.8c0-2.2 1.4-3.8 3-3.8h7.2c1.6 0 3 1.6 3 3.8" fill="currentColor" opacity=".2"/>' +
      '<path d="M9.4 22.8c0-2.2 1.4-3.8 3-3.8h7.2c1.6 0 3 1.6 3 3.8"/>' +
      '<path d="M16 3.4c3.4 0 6 2.8 6 6.4 0 2.2-1 3.8-2.2 5.2-.9 1-1.9 1.5-3.8 1.5s-2.9-.5-3.8-1.5C11 13.6 10 12 10 9.8c0-3.6 2.6-6.4 6-6.4z" fill="currentColor" opacity=".16"/>' +
      '<path d="M16 3.4c3.4 0 6 2.8 6 6.4 0 2.2-1 3.8-2.2 5.2-.9 1-1.9 1.5-3.8 1.5s-2.9-.5-3.8-1.5C11 13.6 10 12 10 9.8c0-3.6 2.6-6.4 6-6.4z"/>' +
      '<path d="M11.4 9.8c1-1.4 2.4-2 4.6-2s3.6.6 4.6 2" stroke-width="1.6"/>' +
      '<circle cx="13.2" cy="9.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="18.8" cy="9.2" r="1.1" fill="currentColor" stroke="none"/>' +
      '<path d="M13.6 14.4c1.6.9 3.2.9 4.8 0" opacity=".65"/>' +
      '<path d="M22.6 4.6l1.4 2.6M9.4 4.6L8 7.2" opacity=".45"/>',

    armory:
      '<path d="M6.4 27.4h19.2" stroke-width="2"/>' +
      '<path d="M16 4.2v16.4M11.6 8.2l4.4-4 4.4 4" stroke-width="1.8"/>' +
      '<path d="M12.4 20.6h7.2" stroke-width="2.2"/>' +
      '<path d="M16 20.6v4.4" stroke-width="2"/>' +
      '<path d="M7.4 14.4l4.2 4.2v5.2H7.4V14.4z" fill="currentColor" opacity=".18"/>' +
      '<path d="M7.4 14.4l4.2 4.2v5.2H7.4V14.4z"/>' +
      '<path d="M24.6 14.4l-4.2 4.2v5.2h4.2V14.4z" fill="currentColor" opacity=".18"/>' +
      '<path d="M24.6 14.4l-4.2 4.2v5.2h4.2V14.4z"/>' +
      '<path d="M9.4 17.4l1.4 1.4 2-2" opacity=".55"/>' +
      '<path d="M11.4 9.4l-2 2M20.6 9.4l2 2" opacity=".5"/>',

    thief:
      '<path d="M16 4.4c3.2 0 5.6 2.6 5.6 6 0 2-.8 3.4-1.8 4.6 3.2 2 5 5.4 5 9.6v3H7.2v-3c0-4.2 1.8-7.6 5-9.6-1-1.2-1.8-2.6-1.8-4.6 0-3.4 2.4-6 5.6-6z" fill="currentColor" opacity=".2"/>' +
      '<path d="M16 4.4c3.2 0 5.6 2.6 5.6 6 0 2-.8 3.4-1.8 4.6 3.2 2 5 5.4 5 9.6v3H7.2v-3c0-4.2 1.8-7.6 5-9.6-1-1.2-1.8-2.6-1.8-4.6 0-3.4 2.4-6 5.6-6z"/>' +
      '<path d="M12.2 10.6l2.2 1.4M19.8 10.6l-2.2 1.4" stroke-width="1.6"/>' +
      '<circle cx="13.4" cy="9.6" r="1" fill="currentColor" stroke="none"/><circle cx="18.6" cy="9.6" r="1" fill="currentColor" stroke="none"/>' +
      '<rect x="19.4" y="18.4" width="7.4" height="7.4" rx="1.6" fill="currentColor" opacity=".3" transform="rotate(12 23.1 22.1)"/>' +
      '<rect x="19.4" y="18.4" width="7.4" height="7.4" rx="1.6" transform="rotate(12 23.1 22.1)"/>' +
      '<path d="M20.6 15.6c1.6.8 3.4 1 5.2.6" opacity=".55"/>',

    preacher:
      '<path d="M16 4.2c2.8 0 5 2.2 5 5 0 1.8-.8 3.2-2 4.2 3.6 2.2 5.6 6 5.6 10.4v3.6H7.4v-3.6c0-4.4 2-8.2 5.6-10.4-1.2-1-2-2.4-2-4.2 0-2.8 2.2-5 5-5z" fill="currentColor" opacity=".22"/>' +
      '<path d="M16 4.2c2.8 0 5 2.2 5 5 0 1.8-.8 3.2-2 4.2 3.6 2.2 5.6 6 5.6 10.4v3.6H7.4v-3.6c0-4.4 2-8.2 5.6-10.4-1.2-1-2-2.4-2-4.2 0-2.8 2.2-5 5-5z"/>' +
      '<path d="M11.8 4.6L16 1.4l4.2 3.2" stroke-width="1.8" opacity=".8"/>' +
      '<path d="M16 1.4v5.2M14 3.4h4" stroke-width="1.4" opacity=".7"/>' +
      '<path d="M12.2 24.6c1.2 1 2.4 1.4 3.8 1.4s2.6-.4 3.8-1.4" opacity=".5"/>' +
      '<path d="M22.6 15.4h3.4l-1 3.8h-1.4z" fill="currentColor" opacity=".5"/>' +
      '<path d="M24.2 12.6v2.8" opacity=".7"/>' +
      '<circle cx="24.4" cy="20.4" r="1" fill="currentColor" stroke="none" opacity=".8"/>',

    ghost:
      glow(16, 15, 13, 0.14) +
      '<path d="M8.4 24.4V14c0-4.2 3.4-7.6 7.6-7.6s7.6 3.4 7.6 7.6v10.4l-2.6-1.8-2.4 1.8-2.6-1.8L13.4 24.4 11 22.6z" fill="currentColor" opacity=".18"/>' +
      '<path d="M8.4 24.4V14c0-4.2 3.4-7.6 7.6-7.6s7.6 3.4 7.6 7.6v10.4l-2.6-1.8-2.4 1.8-2.6-1.8L13.4 24.4 11 22.6z"/>' +
      '<ellipse cx="13" cy="13.4" rx="1.4" ry="1.8" fill="currentColor" stroke="none"/><ellipse cx="19" cy="13.4" rx="1.4" ry="1.8" fill="currentColor" stroke="none"/>' +
      '<path d="M13.4 18.4c.8.6 1.6.6 2.4 0" opacity=".6"/>' +
      '<path d="M5.4 9.4l2.4 1.2M26.6 9.4l-2.4 1.2M4.4 18.4h2.2M27.6 18.4h-2.2" opacity=".4"/>' +
      '<rect x="21.4" y="6.4" width="6" height="8.2" rx="1.2" fill="currentColor" opacity=".3" transform="rotate(16 24.4 10.5)"/>' +
      '<path d="M23 2.6l.8 2M25.8 2.2l-.4 2" opacity=".5"/>',

    mirror:
      '<ellipse cx="16" cy="13.4" rx="8.4" ry="10" fill="currentColor" opacity=".12"/>' +
      '<ellipse cx="16" cy="13.4" rx="8.4" ry="10"/>' +
      '<ellipse cx="16" cy="13.4" rx="6.2" ry="7.8" stroke-dasharray="1.6 2" opacity=".7"/>' +
      '<path d="M16 6.4a5 7 0 0 0 0 14 5 7 0 0 1 0-14z" fill="currentColor" stroke="none" opacity=".45"/>' +
      '<path d="M12.4 27.4h7.2M16 23.4v4" stroke-width="2"/>' +
      '<path d="M9.4 5.2L7 2.6M22.6 5.2L25 2.6M4.4 13.4H1.6M30.4 13.4h-2.8" opacity=".4"/>' +
      '<path d="M13.4 10.4l1 2M18.6 10.4l-1 2M13.8 16.6c1.4.8 3 .8 4.4 0" opacity=".8"/>',

    maze:
      '<path d="M6 27.4h20" stroke-width="2.4"/>' +
      '<path d="M16 27.4V9.4" stroke-width="2.6"/>' +
      '<path d="M16 9.4H6.6l-2.2-3 2.2-3H16M16 12.4h9.4l2.2-3-2.2-3H16" fill="currentColor" opacity=".12"/>' +
      '<path d="M16 9.4H6.6l-2.2-3 2.2-3H16M16 12.4h9.4l2.2-3-2.2-3H16"/>' +
      '<path d="M8.4 5.4l1.4 1.4M8.4 9.4L9.8 8M23.6 5.4L22.2 6.8" opacity=".55"/>' +
      '<path d="M12.4 20.4l3.6 3.4 3.6-3.4" opacity=".5"/>' +
      '<circle cx="16" cy="27.4" r="2" fill="currentColor" stroke="none" opacity=".7"/>',

    forgeGamble:
      glow(16, 21, 12, 0.16) +
      '<path d="M5.4 27.4h21.2l-2.6-5.2H8z" fill="currentColor" opacity=".18"/>' +
      '<path d="M5.4 27.4h21.2l-2.6-5.2H8z"/>' +
      '<path d="M9.4 22.2c1.6-.8 3.4-1.2 6.6-1.2s5 .4 6.6 1.2" opacity=".55"/>' +
      '<path d="M12.4 18.4c.8-1.6 1-3.4.4-5.2M16 17.6c1.2-2 1.4-4.2.6-6.6M19.6 18.4c-.6-1.6-.8-3 0-4.6" opacity=".7"/>' +
      '<path d="M16 8.4l.8 1.8 2 .3-1.4 1.4.3 2-1.7-1-1.7 1 .3-2-1.4-1.4 2-.3z" fill="currentColor" stroke="none" opacity=".55"/>' +
      '<circle cx="9.4" cy="12.4" r=".9" fill="currentColor" stroke="none" opacity=".6"/><circle cx="23.4" cy="9.4" r=".7" fill="currentColor" stroke="none" opacity=".5"/>',

    bonePile:
      '<path d="M4.4 27.4h23.2" stroke-width="2"/>' +
      '<path d="M9.4 27.4c0-3 1.8-5.4 4.4-5.4s4.4 2.4 4.4 5.4z" fill="currentColor" opacity=".2"/>' +
      '<path d="M9.4 27.4c0-3 1.8-5.4 4.4-5.4s4.4 2.4 4.4 5.4z"/>' +
      '<path d="M16.4 27.4c0-3.6 2-6.4 5-6.4s5 2.8 5 6.4z" fill="currentColor" opacity=".12"/>' +
      '<path d="M16.4 27.4c0-3.6 2-6.4 5-6.4s5 2.8 5 6.4z"/>' +
      '<ellipse cx="13.8" cy="12.4" rx="5.4" ry="5.8" fill="currentColor" opacity=".22"/>' +
      '<ellipse cx="13.8" cy="12.4" rx="5.4" ry="5.8"/>' +
      '<circle cx="11.8" cy="11.4" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.8" cy="11.4" r="1.3" fill="currentColor" stroke="none"/>' +
      '<path d="M11.8 15.4h4M12.6 17.4h2.4" opacity=".6"/>' +
      '<path d="M23.4 4.4v4.2M22.2 8.6h2.4" opacity=".6"/>' +
      '<path d="M7.4 5.4l2 2M20.4 3.2l-1.4 1.8" opacity=".4"/>',
    lighthouse:
      glow(16, 10, 13, 0.12) +
      '<path d="M11.4 27.4l1.4-14h6.4l1.4 14z" fill="currentColor" opacity=".18"/>' +
      '<path d="M11.4 27.4l1.4-14h6.4l1.4 14z"/>' +
      '<path d="M10.4 13.4h11.2l-1.4-3.6h-8.4z" fill="currentColor" opacity=".3"/>' +
      '<path d="M10.4 13.4h11.2l-1.4-3.6h-8.4z"/>' +
      '<path d="M12 9.8V7.2h8v2.6" />' +
      '<path d="M13.4 7.2V4.6h5.2v2.6" fill="currentColor" opacity=".35"/>' +
      '<path d="M16 4.6V2.4" />' +
      '<path d="M13.2 13.6l-6.6 2M18.8 13.6l6.6 2M13 11.4L7.6 8.6M19 11.4l5.4-2.8" opacity=".55" stroke-width="1.2"/>' +
      '<circle cx="16" cy="10.4" r="1.6" fill="currentColor" stroke="none"/>' +
      '<path d="M6.4 27.4h19.2" stroke-width="2"/>' +
      '<path d="M8.4 24.6c2 1.2 4.4 1.8 7.6 1.8s5.6-.6 7.6-1.8" opacity=".35"/>',

    auction:
      '<path d="M4.4 27.4h23.2" stroke-width="2"/>' +
      '<path d="M7.4 27.4V19h17.2v8.4" fill="currentColor" opacity=".14"/>' +
      '<path d="M7.4 27.4V19h17.2v8.4"/>' +
      '<rect x="11.6" y="9.4" width="8.8" height="8.8" rx="2" fill="currentColor" opacity=".3" transform="rotate(-12 16 13.8)"/>' +
      '<rect x="11.6" y="9.4" width="8.8" height="8.8" rx="2" transform="rotate(-12 16 13.8)"/>' +
      pip(14.4, 12.2, 1) + pip(17.6, 14.8, 1) +
      '<path d="M24.4 4.2l3.2 3.2-1.6 1.6-3.2-3.2z" fill="currentColor" opacity=".5"/>' +
      '<path d="M24.4 4.2l3.2 3.2-1.6 1.6-3.2-3.2z"/>' +
      '<path d="M21.4 7.2l3.2 3.2" stroke-width="2"/>' +
      '<path d="M9.4 21.4h12.4M9.4 24.2h8.4" opacity=".45"/>',

    starShard:
      glow(16, 15, 14, 0.14) +
      '<path d="M16 3.6l2.6 7.2 7.2 2.6-7.2 2.6L16 23.2l-2.6-7.2L6.2 13.4l7.2-2.6z" fill="currentColor" opacity=".22"/>' +
      '<path d="M16 3.6l2.6 7.2 7.2 2.6-7.2 2.6L16 23.2l-2.6-7.2L6.2 13.4l7.2-2.6z"/>' +
      '<path d="M16 9.4l1.2 3.4 3.4 1.2-3.4 1.2-1.2 3.4-1.2-3.4-3.4-1.2 3.4-1.2z" fill="currentColor" stroke="none"/>' +
      '<path d="M4.4 5.4l2 1.6M27.6 5.4l-2 1.6M6.4 24.6l1.4-1.8M25.6 24.6l-1.4-1.8" opacity=".45"/>' +
      '<path d="M16 26.4v2.4" opacity=".35"/>',

    oldWell:
      '<path d="M5.4 27.4h21.2" stroke-width="2"/>' +
      '<path d="M8.4 27.4V15.4h15.2v12" fill="currentColor" opacity=".14"/>' +
      '<path d="M8.4 27.4V15.4h15.2v12"/>' +
      '<path d="M6.4 15.4h19.2" stroke-width="2"/>' +
      '<ellipse cx="16" cy="15.4" rx="9.6" ry="2.6" fill="currentColor" opacity=".25"/>' +
      '<path d="M10.4 15.8c0 3.2 2.6 5.6 5.6 5.6s5.6-2.4 5.6-5.6" opacity=".5"/>' +
      '<path d="M16 4.2v5.4M11.4 6.6L16 9.6l4.6-3" stroke-width="1.8"/>' +
      '<circle cx="16" cy="3.4" r="1.4" fill="currentColor" stroke="none"/>' +
      '<path d="M11.4 21.4h9.2M13.4 24.4h5.2" opacity=".35"/>',

  };

  /* helper: returns a full <svg> wrapper for a given art group + key */
  DC.artSvg = function (group, key, cls, extra) {
    const G = DC[group] || {};
    const body = G[key] || G.mystery || '';
    return '<svg class="art-svg ' + (cls || '') + '" viewBox="0 0 32 32" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '>' + body + '</svg>';
  };

  DC.relicArt = function (id, cls) { return DC.artSvg('RELIC_ART', id, cls || 'relic-art'); };
  DC.eventArt = function (id, cls) { return DC.artSvg('EVENT_ART', id, cls || 'ev-art-svg'); };
  DC.nodeArt = function (type, cls) { return DC.artSvg('NODE_ART', type, cls || 'node-art'); };
})();
