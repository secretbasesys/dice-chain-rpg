/* =========================================================
   art3.js — v7.0 raster art layer.
   실제 생성 일러스트(assets/*.webp)를 게임에 연결한다.
   단일 파일 빌드에서는 build.py가 DC.ASSET_DATA에 data URI를 넣는다.
   ========================================================= */
(function () {
  'use strict';
  const DC = window.DC;

  DC.ASSET_DATA = DC.ASSET_DATA || null;

  DC.assetUrl = function (path) {
    if (DC.ASSET_DATA && DC.ASSET_DATA[path]) return DC.ASSET_DATA[path];
    return path;
  };

  DC.assetVer = '7.0';

  const CLASS_ART = { warrior: 1, mage: 1, gambler: 1, alchemist: 1, paladin: 1 };
  const BG_BY_ACT = { 1: 'bg_act1', 2: 'bg_act2', 3: 'bg_act3' };
  const _loaded = {};
  const _waiting = [];

  function url(file) { return DC.assetUrl('assets/' + file + '.webp'); }

  DC.enemyImgFile = function (e) {
    const id = (e && (e.artId || e.key || e.id)) || 'humanoid';
    return 'e_' + id;
  };

  DC.enemyArt = function (e) {
    return url(DC.enemyImgFile(e));
  };

  DC.classArt = function (id) {
    return url(CLASS_ART[id] ? 'c_' + id : 'c_warrior');
  };

  DC.bgUrl = function (act) {
    return url(BG_BY_ACT[act] || 'bg_abyss');
  };

  DC.titleArt = function () { return url('title'); };

  DC.preloadArt = function (files) {
    if (!files) return;
    if (!files.length) files = [files];
    files.forEach(function (f) {
      if (_loaded[f]) return;
      _loaded[f] = true;
      const img = new Image();
      img.decoding = 'async';
      img.src = url(f);
    });
  };

  /* 다음 전투에 필요한 이미지를 미리 받아 둔다 (턴 전환 시 깜빡임 방지) */
  DC.preloadCombat = function (act, enemies) {
    const list = ['bg_act1', 'bg_act2', 'bg_act3', 'bg_abyss'];
    (enemies || []).forEach(function (e) { list.push(DC.enemyImgFile(e)); });
    DC.preloadArt(list);
  };
})();
