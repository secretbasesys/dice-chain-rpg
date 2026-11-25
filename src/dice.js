/* Dice model: bag building, rolling, face editing */
(function () {
  'use strict';
  const DC = window.DC;

  const Dice = {
    make: function (dieId, mutate) {
      const def = DC.DICE[dieId];
      if (!def) throw new Error('unknown die ' + dieId);
      const d = {
        uid: DC.uid('d'),
        id: dieId,
        name: def.name,
        c: def.c,
        faces: def.faces.map(function (f) { return { k: f.k, v: f.v }; }),
      };
      if (mutate) d.mut = true;
      return d;
    },
    clone: function (d) {
      return { uid: DC.uid('d'), id: d.id, name: d.name, c: d.c, mut: d.mut, faces: d.faces.map(function (f) { return { k: f.k, v: f.v }; }) };
    },
    rollDie: function (die, rng) {
      const i = Math.floor(rng() * die.faces.length);
      const face = die.faces[i];
      return { fi: i, k: face.k, v: face.v };
    },
    label: function (face) {
      const k = DC.KINDS[face.k] || DC.KINDS.blank;
      return k.n + ' ' + face.v;
    },
    setFace: function (die, fi, face) {
      die.faces[fi] = { k: face.k, v: face.v };
      die.mut = true;
    },
    upgradeFace: function (die, fi) {
      const f = die.faces[fi];
      if (!f) return false;
      if (f.k === 'blank') { f.k = 'slash'; f.v = 2; }
      else if (f.v < 6) f.v += 1;
      else return false;
      die.mut = true;
      return true;
    },
  };
  DC.Dice = Dice;
})();
