/* =========================================================
   다이스 체인 — hand-drawn SVG bestiary (24x24 viewBox)
   Each entry is the inner markup of one <svg>. Silhouette +
   currentColor fills + a few glowing accents so every enemy
   reads as a creature, not a shape.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  function eyes(x1, x2, y, r) {
    r = r || 1.2;
    return '<circle cx="' + x1 + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".92" stroke="none"/>' +
      '<circle cx="' + x2 + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".92" stroke="none"/>' +
      '<circle cx="' + x1 + '" cy="' + y + '" r="' + (r * 0.5) + '" fill="#0b0f18" stroke="none"/>' +
      '<circle cx="' + x2 + '" cy="' + y + '" r="' + (r * 0.5) + '" fill="#0b0f18" stroke="none"/>';
  }

  const E = {
    /* ---------------- act 1 ---------------- */
    slime:
      '<path d="M4 18.2c0-4.8 3.5-8.2 8-8.2s8 3.4 8 8.2c0 1.7-1.2 2.6-2.8 2.6H6.8C5.2 20.8 4 19.9 4 18.2z" fill="currentColor" opacity=".26"/>' +
      '<path d="M4 18.2c0-4.8 3.5-8.2 8-8.2s8 3.4 8 8.2c0 1.7-1.2 2.6-2.8 2.6H6.8C5.2 20.8 4 19.9 4 18.2z"/>' +
      '<path d="M7.4 18.6c1.2 1.4 3 1.6 4.6.6" opacity=".5"/>' +
      eyes(9.2, 14.8, 14.6, 1.5) +
      '<ellipse cx="7.4" cy="11.4" rx="1.6" ry="1" fill="#fff" opacity=".45" stroke="none" transform="rotate(-30 7.4 11.4)"/>' +
      '<circle cx="17.6" cy="9.4" r=".9" fill="currentColor" stroke="none" opacity=".7"/>',

    rat:
      '<path d="M4.4 8.6C3.6 6.6 4.6 5 6.4 5c1.6 0 2.6 1.2 2.6 2.6M19.6 8.6C20.4 6.6 19.4 5 17.6 5c-1.6 0-2.6 1.2-2.6 2.6"/>' +
      '<path d="M6.6 13c0-3.2 2.4-5.8 5.4-5.8s5.4 2.6 5.4 5.8c0 3.2-2.4 5.6-5.4 5.6S6.6 16.2 6.6 13z" fill="currentColor" opacity=".24"/>' +
      '<path d="M6.6 13c0-3.2 2.4-5.8 5.4-5.8s5.4 2.6 5.4 5.8c0 3.2-2.4 5.6-5.4 5.6S6.6 16.2 6.6 13z"/>' +
      eyes(9.6, 14.4, 12.2, 1.2) +
      '<path d="M10.8 16.4c.8.7 1.6.7 2.4 0"/>' +
      '<path d="M16.4 15.4c2.4.2 3.6 1.8 3 3.8-.4 1.4-1.8 2-2.8 1.4" opacity=".8"/>' +
      '<path d="M5.2 12.4l-2 .4M5.6 14.2l-2 .8M18.8 12.4l2 .4" opacity=".55"/>',

    goblin:
      '<path d="M8.4 6.2L4 5l2.8 3M15.6 6.2L20 5l-2.8 3"/>' +
      '<circle cx="12" cy="7" r="3.2" fill="currentColor" opacity=".22"/>' +
      '<circle cx="12" cy="7" r="3.2"/>' +
      '<path d="M9.4 6.6l1.2.8M14.6 6.6l-1.2.8"/>' +
      '<path d="M8.2 10.6h7.6l1.4 6H6.8l1.4-6z" fill="currentColor" opacity=".26"/>' +
      '<path d="M8.2 10.6h7.6l1.4 6H6.8l1.4-6z"/>' +
      '<path d="M8.4 11.8L5 15.2M15.6 11.8L19 15.2M9.6 16.6v4.2M14.4 16.6v4.2"/>' +
      '<path d="M18.8 7.6l2.4 8.6" stroke-width="2.2" opacity=".9"/>' +
      '<path d="M17.4 6.2h3.4" stroke-width="2.2"/>',

    bat:
      '<path d="M9.4 12L2.6 8.6l1.6 5.6 4 1.6M14.6 12l6.8-3.4-1.6 5.6-4 1.6"/>' +
      '<path d="M12 9.6c1.8 0 3 1.4 3 3.2 0 2.4-1.2 6-3 6s-3-3.6-3-6c0-1.8 1.2-3.2 3-3.2z" fill="currentColor" opacity=".26"/>' +
      '<path d="M12 9.6c1.8 0 3 1.4 3 3.2 0 2.4-1.2 6-3 6s-3-3.6-3-6c0-1.8 1.2-3.2 3-3.2z"/>' +
      '<path d="M10.4 9.8l-.6-2 1.6.8M13.6 9.8l.6-2-1.6.8"/>' +
      eyes(10.7, 13.3, 13, 1) +
      '<path d="M10.8 16.6l1.2 1.6 1.2-1.6"/>',

    wolf:
      '<path d="M5.6 9.4L7 5l3.2 2.2h3.6L17 5l1.4 4.4v4.2c0 3-2.4 5.4-5.4 5.4h-2c-3 0-5.4-2.4-5.4-5.4V9.4z" fill="currentColor" opacity=".24"/>' +
      '<path d="M5.6 9.4L7 5l3.2 2.2h3.6L17 5l1.4 4.4v4.2c0 3-2.4 5.4-5.4 5.4h-2c-3 0-5.4-2.4-5.4-5.4V9.4z"/>' +
      eyes(9.6, 14.4, 11.6, 1.2) +
      '<path d="M9.6 15.2l2.4 1.4 2.4-1.4"/>' +
      '<path d="M9.4 16.8l1 1.6M14.6 16.8l-1 1.6"/>' +
      '<path d="M12 16.6v1.2"/>',

    /* ---------------- act 2 ---------------- */
    skeleton:
      '<path d="M12 3.2c-2.8 0-4.8 2-4.8 4.6 0 1.4.6 2.4 1.4 3.2v2.4h6.8V11c.8-.8 1.4-1.8 1.4-3.2 0-2.6-2-4.6-4.8-4.6z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 3.2c-2.8 0-4.8 2-4.8 4.6 0 1.4.6 2.4 1.4 3.2v2.4h6.8V11c.8-.8 1.4-1.8 1.4-3.2 0-2.6-2-4.6-4.8-4.6z"/>' +
      '<circle cx="9.8" cy="8" r="1.3" fill="#0b0f18" stroke="none"/>' +
      '<circle cx="14.2" cy="8" r="1.3" fill="#0b0f18" stroke="none"/>' +
      '<path d="M10.6 11.7h2.8M10.2 13.4h3.6"/>' +
      '<path d="M12 13.4v3M9 16.8h6M8.4 19.2h7.2M9.6 21.4h4.8"/>' +
      '<path d="M17.6 7.4l2.8 8.4" stroke-width="1.8"/>' +
      '<path d="M16.8 10.8h3.6" stroke-width="1.8"/>',

    spider:
      '<path d="M8.2 11.2L3.2 8.6M8 13.4H3M8.2 15.6l-4.8 2.8M15.8 11.2l5-2.6M16 13.4h5M15.8 15.6l4.8 2.8"/>' +
      '<circle cx="12" cy="13.6" r="4.4" fill="currentColor" opacity=".24"/>' +
      '<circle cx="12" cy="13.6" r="4.4"/>' +
      '<circle cx="10.3" cy="12.4" r="1.1" fill="#fff" opacity=".95" stroke="none"/>' +
      '<circle cx="13.7" cy="12.4" r="1.1" fill="#fff" opacity=".95" stroke="none"/>' +
      '<circle cx="10.3" cy="12.4" r=".5" fill="#0b0f18" stroke="none"/>' +
      '<circle cx="13.7" cy="12.4" r=".5" fill="#0b0f18" stroke="none"/>' +
      '<path d="M9.6 16.2l2.4 2 2.4-2"/>' +
      '<path d="M12 3.4l1.2 2.4-1.2 2.4-1.2-2.4 1.2-2.4z" fill="currentColor" stroke="none" opacity=".7"/>',

    gargoyle:
      '<path d="M6.2 10.8L2.4 7.2l.8 5.4 3 1.6M17.8 10.8l3.8-3.6-.8 5.4-3 1.6"/>' +
      '<path d="M9 6.8L8 4l2.6 1.2M15 6.8L16 4l-2.6 1.2"/>' +
      '<path d="M6.4 11c0-3 2.6-5.4 5.6-5.4s5.6 2.4 5.6 5.4v4.4l-2 2.4H8.4l-2-2.4V11z" fill="currentColor" opacity=".24"/>' +
      '<path d="M6.4 11c0-3 2.6-5.4 5.6-5.4s5.6 2.4 5.6 5.4v4.4l-2 2.4H8.4l-2-2.4V11z"/>' +
      eyes(9.6, 14.4, 10.8, 1.2) +
      '<path d="M9.6 14.6h4.8M10.4 16.4h3.2M9.4 18l1.2 1.6M14.6 18l-1.2 1.6"/>' +
      '<path d="M12 6.6v2.2"/>',

    shaman:
      '<path d="M12 3.4c-3.2 0-5.4 2.4-5.4 5.4 0 1.8.8 2.8 1.6 3.8L6.8 21h10.4l-1.4-8.4c.8-1 1.6-2 1.6-3.8 0-3-2.2-5.4-5.4-5.4z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 3.4c-3.2 0-5.4 2.4-5.4 5.4 0 1.8.8 2.8 1.6 3.8L6.8 21h10.4l-1.4-8.4c.8-1 1.6-2 1.6-3.8 0-3-2.2-5.4-5.4-5.4z"/>' +
      '<path d="M8.6 9.4c1.2-1.4 2.2-1.4 3.4-.4 1.2-1 2.2-1 3.4.4" opacity=".7"/>' +
      '<circle cx="10.4" cy="9.8" r="1" fill="#c084fc" stroke="none"/>' +
      '<circle cx="13.6" cy="9.8" r="1" fill="#c084fc" stroke="none"/>' +
      '<path d="M10.4 13.6c1 .8 2.2.8 3.2 0"/>' +
      '<path d="M19 6.4v13" stroke-width="1.6"/>' +
      '<circle cx="19" cy="4.8" r="2.1" fill="currentColor" opacity=".45"/>' +
      '<circle cx="19" cy="4.8" r="2.1"/>',

    wraith:
      '<path d="M12 3.4c-3.6 0-6.2 2.8-6.2 6.4 0 2 1 3.4 1 5.2 0 2.2-.8 3.6-1.6 5.4h13.6c-.8-1.8-1.6-3.2-1.6-5.4 0-1.8 1-3.2 1-5.2 0-3.6-2.6-6.4-6.2-6.4z" fill="currentColor" opacity=".2"/>' +
      '<path d="M12 3.4c-3.6 0-6.2 2.8-6.2 6.4 0 2 1 3.4 1 5.2 0 2.2-.8 3.6-1.6 5.4h13.6c-.8-1.8-1.6-3.2-1.6-5.4 0-1.8 1-3.2 1-5.2 0-3.6-2.6-6.4-6.2-6.4z"/>' +
      '<circle cx="9.8" cy="9" r="1.5" fill="#67e8f9" stroke="none" opacity=".95"/>' +
      '<circle cx="14.2" cy="9" r="1.5" fill="#67e8f9" stroke="none" opacity=".95"/>' +
      '<path d="M10.4 12.8c1 .6 2.2.6 3.2 0" opacity=".7"/>' +
      '<path d="M9.4 18l1.4 2.4M12 18v2.8M14.6 18l-1.4 2.4" opacity=".75"/>',

    /* ---------------- act 3 ---------------- */
    knight:
      '<path d="M9 4.4h6v3l2 2v6.4l-2 2.2H9l-2-2.2V9.4l2-2v-3z" fill="currentColor" opacity=".22"/>' +
      '<path d="M9 4.4h6v3l2 2v6.4l-2 2.2H9l-2-2.2V9.4l2-2v-3z"/>' +
      '<path d="M9 7.6h6" opacity=".8"/>' +
      '<path d="M9.4 10.2h5.2" stroke-width="1.6"/>' +
      '<path d="M7 12.6L4 15.4M17 12.6l3 2.8"/>' +
      '<path d="M8.2 16.8v3.6M15.8 16.8v3.6"/>' +
      '<path d="M18.6 5.2l1.4 12.4" stroke-width="2"/>' +
      '<path d="M17.2 7.6h3.4M17.4 15.2h3.2" stroke-width="1.8"/>' +
      '<path d="M4.4 16.6h3.4v3.2H4.4z" fill="currentColor" opacity=".22"/>',

    imp:
      '<path d="M8.8 6.4L7 3.4l2.8 1.4M15.2 6.4L17 3.4l-2.8 1.4"/>' +
      '<path d="M8 11L3.8 9.2l1.6 4.4M16 11l4.2-1.8-1.6 4.4"/>' +
      '<circle cx="12" cy="10" r="4.2" fill="currentColor" opacity=".24"/>' +
      '<circle cx="12" cy="10" r="4.2"/>' +
      '<path d="M9.2 9.2l1.6.8M14.8 9.2l-1.6.8"/>' +
      '<path d="M9.6 12.4c1.6 1 3.2 1 4.8 0"/>' +
      '<path d="M9.4 13.4v2.6M14.6 13.4v2.6"/>' +
      '<circle cx="19.4" cy="16.8" r="2.2" fill="#fb923c" opacity=".35" stroke="none"/>' +
      '<circle cx="19.4" cy="16.8" r="1.2" fill="#fb923c" stroke="none"/>',

    shadow:
      '<path d="M12 3.4c4.2 0 6.8 3.4 6.8 7.4 0 3-1.4 4.2-1.4 6.4 0 1.8-1 3.2-2.6 3.2-1 0-1.6-.6-1.6-1.4 0-1.6 1.8-1.8 1.8-3.4 0-1.4-1.2-2-3-2s-3 .6-3 2c0 1.6 1.8 1.8 1.8 3.4 0 .8-.6 1.4-1.6 1.4-1.6 0-2.6-1.4-2.6-3.2 0-2.2-1.4-3.4-1.4-6.4 0-4 2.6-7.4 6.8-7.4z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 3.4c4.2 0 6.8 3.4 6.8 7.4 0 3-1.4 4.2-1.4 6.4 0 1.8-1 3.2-2.6 3.2-1 0-1.6-.6-1.6-1.4 0-1.6 1.8-1.8 1.8-3.4 0-1.4-1.2-2-3-2s-3 .6-3 2c0 1.6 1.8 1.8 1.8 3.4 0 .8-.6 1.4-1.6 1.4-1.6 0-2.6-1.4-2.6-3.2 0-2.2-1.4-3.4-1.4-6.4 0-4 2.6-7.4 6.8-7.4z"/>' +
      '<circle cx="9.6" cy="9.4" r="1.3" fill="#c084fc" stroke="none"/>' +
      '<circle cx="14.4" cy="9.4" r="1.3" fill="#c084fc" stroke="none"/>' +
      '<circle cx="12" cy="13" r="1" fill="#c084fc" stroke="none" opacity=".7"/>',

    serpent:
      '<path d="M6.4 19.4c0-2.6 2-4 4.6-4h3.4c2.2 0 3.4-1 3.4-2.4s-1.2-2.6-3.2-2.6H8.6" stroke-width="2.6" opacity=".9"/>' +
      '<path d="M14.8 5.2c2.4 0 4.2 1.8 4.2 4s-1.8 4-4.2 4-3.8-1.8-3.8-4 1.4-4 3.8-4z" fill="currentColor" opacity=".26"/>' +
      '<path d="M14.8 5.2c2.4 0 4.2 1.8 4.2 4s-1.8 4-4.2 4-3.8-1.8-3.8-4 1.4-4 3.8-4z"/>' +
      '<circle cx="16.2" cy="8.4" r="1.1" fill="#fff" opacity=".95" stroke="none"/>' +
      '<circle cx="16.2" cy="8.4" r=".5" fill="#0b0f18" stroke="none"/>' +
      '<path d="M13.4 11.4l-1 1.8M17 11.4l1 1.8"/>' +
      '<path d="M17.4 5l1.2-2 1.4 1.6" opacity=".8"/>',

    /* ---------------- elites ---------------- */
    ogre:
      '<path d="M8.2 10h8l2.2 8H6L8.2 10z" fill="currentColor" opacity=".24"/>' +
      '<path d="M8.2 10h8l2.2 8H6L8.2 10z"/>' +
      '<circle cx="12" cy="6.6" r="3.4" fill="currentColor" opacity=".22"/>' +
      '<circle cx="12" cy="6.6" r="3.4"/>' +
      '<path d="M9.8 6.2l1.4 1M14.2 6.2l-1.4 1"/>' +
      '<path d="M9.8 9.4c1.4.8 3 .8 4.4 0"/>' +
      '<path d="M7.2 11.4L3.6 14M16.8 11.4l3.6 2.6"/>' +
      '<path d="M9 18v4M15 18v4"/>' +
      '<path d="M19.6 8.6l2 10.2" stroke-width="2.4"/>' +
      '<circle cx="20.6" cy="7" r="2.2" fill="currentColor" opacity=".3"/>',

    golem:
      '<rect x="5" y="6.2" width="14" height="12.4" rx="2.2" fill="currentColor" opacity=".2"/>' +
      '<rect x="5" y="6.2" width="14" height="12.4" rx="2.2"/>' +
      '<path d="M9 6.2V3.4h6v2.8M8.4 11.2h2M13.6 11.2h2M9.4 15.2h5.2"/>' +
      '<path d="M5 12.4H1.8M19 12.4h3.2M8 18.6v2.8M16 18.6v2.8"/>' +
      '<circle cx="12" cy="13.2" r="1.5" fill="currentColor" stroke="none"/>' +
      '<path d="M12 3.4v-1.2M17.6 7.4l1-1M6.4 7.4l-1-1" opacity=".6"/>',

    wyvern:
      '<path d="M8.6 10.2L2.4 6.4l2 6.4 4 2M15.4 10.2l6.2-3.8-2 6.4-4 2"/>' +
      '<path d="M9.4 7.4L7.6 3.8l3.2 1.6M14.6 7.4l1.8-3.6-3.2 1.6"/>' +
      '<path d="M12 8.4c2.2 0 3.6 1.8 3.6 4.4 0 2.6-1.4 6.2-3.6 6.2s-3.6-3.6-3.6-6.2c0-2.6 1.4-4.4 3.6-4.4z" fill="currentColor" opacity=".26"/>' +
      '<path d="M12 8.4c2.2 0 3.6 1.8 3.6 4.4 0 2.6-1.4 6.2-3.6 6.2s-3.6-3.6-3.6-6.2c0-2.6 1.4-4.4 3.6-4.4z"/>' +
      eyes(10.8, 13.2, 11.4, 1) +
      '<path d="M10 14.6h4"/>' +
      '<path d="M9.4 17.4L6.2 21M14.6 17.4l3.2 3.6"/>',

    /* ---------------- bosses ---------------- */
    queen:
      '<path d="M3.4 19.4c0-5.2 3.8-9 8.6-9s8.6 3.8 8.6 9c0 1.4-1 2.2-2.4 2.2H5.8c-1.4 0-2.4-.8-2.4-2.2z" fill="currentColor" opacity=".24"/>' +
      '<path d="M3.4 19.4c0-5.2 3.8-9 8.6-9s8.6 3.8 8.6 9c0 1.4-1 2.2-2.4 2.2H5.8c-1.4 0-2.4-.8-2.4-2.2z"/>' +
      '<path d="M7.6 9.4L9 4.6l3 2.2 3-2.2 1.4 4.8" />' +
      '<circle cx="8" cy="6.2" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="12" cy="4.4" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="16" cy="6.2" r="1" fill="currentColor" stroke="none"/>' +
      eyes(9, 15, 13.6, 1.7) +
      '<path d="M9.4 17.8c1.6 1 3.6 1 5.2 0"/>' +
      '<path d="M6.4 20.6c1.6 1 3.6-1 5.6 0 2 1 4-1 5.6 0" opacity=".5"/>',

    lich:
      '<path d="M12 4c-3.2 0-5.4 2.2-5.4 5 0 1.6.6 2.4 1.4 3.4v2.8h8V12.4c.8-1 1.4-1.8 1.4-3.4 0-2.8-2.2-5-5.4-5z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 4c-3.2 0-5.4 2.2-5.4 5 0 1.6.6 2.4 1.4 3.4v2.8h8V12.4c.8-1 1.4-1.8 1.4-3.4 0-2.8-2.2-5-5.4-5z"/>' +
      '<path d="M8.2 6.8L9.4 3.6l1.8 2 1.6-2.6 1.6 2.6 1.8-2 1.2 3.2"/>' +
      '<circle cx="9.8" cy="9.4" r="1.3" fill="#c084fc" stroke="none"/>' +
      '<circle cx="14.2" cy="9.4" r="1.3" fill="#c084fc" stroke="none"/>' +
      '<path d="M10.6 13.2h2.8"/>' +
      '<path d="M8 15.2L6.4 21M16 15.2L17.6 21M9.8 21h4.4"/>' +
      '<path d="M19 5.6v9.2" stroke-width="1.6"/>' +
      '<circle cx="19" cy="16" r="2.4" fill="currentColor" opacity=".35"/>' +
      '<circle cx="19" cy="16" r="2.4"/>',

    dicelord:
      '<path d="M6 9.2l6-3.4 6 3.4v6.4l-6 3.4-6-3.4V9.2z" fill="currentColor" opacity=".22"/>' +
      '<path d="M6 9.2l6-3.4 6 3.4v6.4l-6 3.4-6-3.4V9.2z"/>' +
      '<path d="M7.4 7.4L9 4l3 2 3-2 1.6 3.4"/>' +
      '<circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>' +
      '<circle cx="9.4" cy="9.6" r=".9" fill="currentColor" stroke="none"/>' +
      '<circle cx="14.6" cy="14.4" r=".9" fill="currentColor" stroke="none"/>' +
      '<path d="M6.2 17.2L3.4 21.2M17.8 17.2l2.8 4M8.6 19.6L7 22.4M15.4 19.6l1.6 2.8"/>' +
      '<path d="M3.4 21.2h3M17.6 21.2h3" opacity=".6"/>',
    /* ---------------- act 1-3 additions (v1.8) ---------------- */
    mushroom:
      '<path d="M4 12.4c0-4.6 3.6-8 8-8s8 3.4 8 8c0 1.6-1.2 2.6-2.8 2.6H6.8C5.2 15 4 14 4 12.4z" fill="currentColor" opacity=".26"/>' +
      '<path d="M4 12.4c0-4.6 3.6-8 8-8s8 3.4 8 8c0 1.6-1.2 2.6-2.8 2.6H6.8C5.2 15 4 14 4 12.4z"/>' +
      '<path d="M9.6 15v4.2c0 1.6 1 2.8 2.4 2.8s2.4-1.2 2.4-2.8V15" fill="currentColor" opacity=".18"/>' +
      '<path d="M9.6 15v4.2c0 1.6 1 2.8 2.4 2.8s2.4-1.2 2.4-2.8V15"/>' +
      '<circle cx="8.6" cy="10.4" r="1.3" fill="currentColor" stroke="none" opacity=".55"/>' +
      '<circle cx="14.8" cy="8.6" r=".9" fill="currentColor" stroke="none" opacity=".45"/>' +
      '<path d="M10.4 16.4v3M13.6 16.4v3" opacity=".6"/>' +
      eyes(10.6, 13.4, 18.4, .9),

    cultist:
      '<path d="M12 3.4c3.2 0 5.4 2.6 5.4 5.8 0 2-.8 3.4-2 4.6 3.2 2.2 5 5.8 5 9.8H5.6c0-4 1.8-7.6 5-9.8-1.2-1.2-2-2.6-2-4.6 0-3.2 2.4-5.8 5.4-5.8z" fill="currentColor" opacity=".22"/>' +
      '<path d="M12 3.4c3.2 0 5.4 2.6 5.4 5.8 0 2-.8 3.4-2 4.6 3.2 2.2 5 5.8 5 9.8H5.6c0-4 1.8-7.6 5-9.8-1.2-1.2-2-2.6-2-4.6 0-3.2 2.4-5.8 5.4-5.8z"/>' +
      '<path d="M12 3.4V7" stroke-width="1.4" opacity=".7"/>' +
      '<circle cx="10.4" cy="9.8" r="1.1" fill="currentColor" stroke="none"/><circle cx="13.6" cy="9.8" r="1.1" fill="currentColor" stroke="none"/>' +
      '<path d="M20.4 6.2v14M18.2 6.2h4.4" stroke-width="1.8"/>' +
      '<circle cx="20.4" cy="5" r="1.6" fill="currentColor" stroke="none" opacity=".8"/>' +
      '<path d="M6.4 22.4h11.2" stroke-width="1.4" opacity=".5"/>',

    berserker:
      '<path d="M7.4 8.2L5 5.6l3.6-.6M16.6 8.2L19 5.6l-3.6-.6" stroke-width="2"/>' +
      '<path d="M6.6 12c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2v3.4c0 1.4-1 2.4-2.4 2.4H9c-1.4 0-2.4-1-2.4-2.4z" fill="currentColor" opacity=".24"/>' +
      '<path d="M6.6 12c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2v3.4c0 1.4-1 2.4-2.4 2.4H9c-1.4 0-2.4-1-2.4-2.4z"/>' +
      eyes(9.8, 14.2, 11.2, 1.1) +
      '<path d="M9 15.6h6M10 18.4v4M14 18.4v4" opacity=".8"/>' +
      '<path d="M20.6 7.2l2.6 6-2 2.6M3.4 7.2l-2.6 6 2 2.6" stroke-width="1.8"/>' +
      '<path d="M5.2 21.4h13.6" stroke-width="1.6" opacity=".55"/>',

    voidmaw:
      '<path d="M12 3.2c4.8 0 8.6 4 8.6 9s-3.8 9-8.6 9-8.6-4-8.6-9 3.8-9 8.6-9z" fill="currentColor" opacity=".16"/>' +
      '<path d="M4.6 12.4c2.4-3.6 5-5.4 7.4-5.4s5 1.8 7.4 5.4c-2.4 3.6-5 5.4-7.4 5.4s-5-1.8-7.4-5.4z"/>' +
      '<path d="M6 12.4l1.8 2.2 1.6-2.2 1.6 2.2 1.6-2.2 1.6 2.2 1.6-2.2 1.6 2.2 1.6-2.2" stroke-width="1.2"/>' +
      '<circle cx="12" cy="12.4" r="6.4" fill="none" stroke-dasharray="1.6 2.4" opacity=".45"/>' +
      '<path d="M2.6 6.4c1.6 1.4 2 3.2 1.6 5M21.4 6.4c-1.6 1.4-2 3.2-1.6 5M4 19.6c1.4-.8 2.8-.6 4 .4M20 19.6c-1.4-.8-2.8-.6-4 .4" opacity=".55"/>' +
      '<circle cx="12" cy="12.4" r="1.4" fill="currentColor" stroke="none" opacity=".8"/>',

  };

  /* act scenes: wide silhouettes behind the arena (viewBox 400x120) */
  const SCENES = {
    1:
      '<g fill="currentColor" opacity=".22">' +
      '<path d="M0 120V86l22-6 4-30 16 4v24l18 4v38z"/>' +
      '<path d="M60 120V74l14-4 6-20 12 6v26l14 2v36z"/>' +
      '<path d="M250 120V92l20-4 8-26 18 6v22l22 2v28z"/>' +
      '<path d="M330 120V70l16-6 6-22 14 8v30l18 4v36z"/>' +
      '</g><g stroke="currentColor" opacity=".28" fill="none">' +
      '<path d="M120 120V96l4-14 4 14v24M124 100l-8-8M124 104l8-9"/>' +
      '<path d="M300 120V98l4-12 4 12v22M304 104l-7-7M304 108l7-8"/>' +
      '<path d="M0 120h400" opacity=".4"/>' +
      '</g>',
    2:
      '<g fill="currentColor" opacity=".2">' +
      '<path d="M20 120V58h12v-8h6v8h10v62z"/>' +
      '<path d="M80 120V44h14v-6h8v6h12v76z"/>' +
      '<path d="M300 120V50h12v-8h8v8h10v70z"/>' +
      '<path d="M356 120V66h12v-6h8v6h10v54z"/>' +
      '</g><g fill="none" stroke="currentColor" opacity=".26">' +
      '<path d="M26 58c0-12 10-20 22-20s22 8 22 20"/>' +
      '<path d="M312 50c0-10 9-17 19-17s19 7 19 17"/>' +
      '<path d="M0 104c30-6 60 6 90 0s60-8 90 0 70 4 100-2 60-4 120 2" opacity=".5"/>' +
      '<path d="M0 112c40-4 70 4 110 0s70-6 110 0 80 2 180-6" opacity=".35"/>' +
      '<circle cx="140" cy="90" r="3" opacity=".5"/><circle cx="152" cy="76" r="2"/><circle cx="270" cy="84" r="2.5"/>' +
      '</g>',
    3:
      '<g fill="currentColor" opacity=".2">' +
      '<path d="M170 120V52l30-14 30 14v68z"/>' +
      '<path d="M180 120V58h8v62zM212 120V58h8v62z"/>' +
      '<path d="M0 120V96h40v24zM360 120V96h40v24z"/>' +
      '</g><g stroke="currentColor" opacity=".22" fill="none">' +
      '<path d="M200 38V18M188 30l12-12 12 12"/>' +
      '<path d="M60 120V78l20-10 20 10v42" /><path d="M300 120V78l20-10 20 10v42"/>' +
      '<path d="M0 112h400" opacity=".4"/>' +
      '</g>',
  };

  DC.ENEMY_ART = E;
  DC.monsterArt = function (art, e) {
    const keyArt = e && e.key && E[e.key];
    if (keyArt) return keyArt;
    const A = {
      blob: '<path d="M12 3.6c4.6 0 8 3.9 8 8.6 0 4.6-3.2 8.4-8 8.4s-8-3.8-8-8.4c0-4.7 3.4-8.6 8-8.6z" fill="currentColor" opacity=".24"/><path d="M12 3.6c4.6 0 8 3.9 8 8.6 0 4.6-3.2 8.4-8 8.4s-8-3.8-8-8.4c0-4.7 3.4-8.6 8-8.6z"/>' + eyes(9, 15, 11, 1.4),
      humanoid: '<circle cx="12" cy="5.8" r="3.2" fill="currentColor" opacity=".22"/><circle cx="12" cy="5.8" r="3.2"/><path d="M8 10.4h8l2 7H6l2-7z" fill="currentColor" opacity=".24"/><path d="M8 10.4h8l2 7H6l2-7z"/>',
      beast: '<path d="M5.6 9.4L7 5l3.2 2.2h3.6L17 5l1.4 4.4v4.2c0 3-2.4 5.4-5.4 5.4h-2c-3 0-5.4-2.4-5.4-5.4V9.4z" fill="currentColor" opacity=".24"/><path d="M5.6 9.4L7 5l3.2 2.2h3.6L17 5l1.4 4.4v4.2c0 3-2.4 5.4-5.4 5.4h-2c-3 0-5.4-2.4-5.4-5.4V9.4z"/>' + eyes(9.6, 14.4, 11.6, 1.2),
      flyer: '<path d="M12 6c2.2 0 4 2 4 4.5S14.2 20 12 20s-4-7-4-9.5S9.8 6 12 6z" fill="currentColor" opacity=".24"/><path d="M8 9L2.5 6.5 4 13l4 2M16 9l5.5-2.5L20 13l-4 2"/>',
      construct: '<rect x="5" y="6" width="14" height="12" rx="2" fill="currentColor" opacity=".2"/><rect x="5" y="6" width="14" height="12" rx="2"/><path d="M9 6V3.5h6V6M8.5 11h2M13.5 11h2M9 15h6"/>',
      boss: '<path d="M12 3.5l2.5 5 5-2-1.5 5.5h-12L4.5 6.5l5 2 2.5-5z"/><path d="M6 12h12v6.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12z" fill="currentColor" opacity=".2"/><path d="M6 12h12v6.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V12z"/>' + eyes(9.5, 14.5, 15, 1.3),
    };
    return A[art] || A.humanoid;
  };

  DC.actScene = function (act) { return SCENES[act] || SCENES[1]; };
})();
