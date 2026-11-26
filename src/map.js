/* Map generation: branching act maps (Slay-the-Spire-ish, 6-8 rows) */
(function () {
  'use strict';
  const DC = window.DC;

  const MapGen = {
    gen: function (rng, act) {
      const rows = Math.min(10, 7 + act);   // 8/9/10 rows incl. boss row
      const nodes = {};
      const grid = [];
      let idn = 0;

      for (let r = 0; r < rows; r++) {
        let count;
        if (r === 0) count = 2;
        else if (r === rows - 1) count = 1;
        else if (r === rows - 2) count = 1; // pre-boss rest
        else count = 1 + Math.floor(rng() * 3); // 1..3
        count = Math.min(count, 3);
        const row = [];
        for (let c = 0; c < count; c++) {
          const id = 'n' + (++idn);
          const node = { id: id, row: r, col: c, type: 'combat', next: [], done: false, seen: false };
          nodes[id] = node;
          row.push(node);
        }
        grid.push(row);
      }

      // types
      for (let r = 0; r < rows; r++) {
        grid[r].forEach(function (n) {
          if (r === rows - 1) { n.type = 'boss'; return; }
          if (r === rows - 2) { n.type = 'rest'; return; }
          if (r === 0) { n.type = 'combat'; return; }
          if (r === 1 && act === 1) { n.type = rng() < 0.5 ? 'combat' : 'mystery'; return; }
          const roll = rng();
          if (roll < 0.42) n.type = 'combat';
          else if (roll < 0.56) n.type = 'mystery';
          else if (roll < 0.68) n.type = 'shop';
          else if (roll < 0.80) n.type = 'forge';
          else if (roll < 0.90) n.type = 'elite';
          else n.type = 'rest';
          if (r === 1) n.type = (roll < 0.7 ? 'combat' : n.type);
        });
      }
      // guarantee at least one shop & forge per act
      const flat = grid.slice(2, rows - 2).reduce(function (a, r) { return a.concat(r); }, []);
      ['shop', 'forge'].forEach(function (want) {
        if (!flat.some(function (n) { return n.type === want; })) {
          const pick = flat[Math.floor(rng() * flat.length)];
          if (pick) pick.type = want;
        }
      });

      // edges: connect each node to 1-2 nodes of next row (nearest column)
      for (let r = 0; r < rows - 1; r++) {
        const cur = grid[r], nxt = grid[r + 1];
        cur.forEach(function (n, i) {
          const ratio = cur.length === 1 ? 0 : i / (cur.length - 1);
          const center = Math.round(ratio * (nxt.length - 1));
          const links = [];
          links.push(nxt[DC.clamp(center, 0, nxt.length - 1)]);
          if (nxt.length > 1 && rng() < 0.55) {
            const alt = DC.clamp(center + (rng() < 0.5 ? -1 : 1), 0, nxt.length - 1);
            links.push(nxt[alt]);
          }
          const uniq = [];
          links.forEach(function (m) { if (uniq.indexOf(m) < 0) uniq.push(m); });
          n.next = uniq.map(function (m) { return m.id; });
        });
        // ensure every next-row node is reachable
        nxt.forEach(function (m) {
          const reachable = cur.some(function (n) { return n.next.indexOf(m.id) >= 0; });
          if (!reachable) {
            const src = cur[Math.min(cur.length - 1, Math.round((m.col / Math.max(1, nxt.length - 1)) * (cur.length - 1)))];
            src.next.push(m.id);
          }
        });
      }

      return {
        act: act,
        rows: rows,
        grid: grid.map(function (row) { return row.map(function (n) { return n.id; }); }),
        nodes: nodes,
        start: grid[0].map(function (n) { return n.id; }),
        current: null,
        visited: [],
      };
    },

    get: function (map, id) { return map.nodes[id]; },
    available: function (map) {
      if (!map.current) return map.start.slice();
      const cur = map.nodes[map.current];
      return cur ? cur.next.slice() : [];
    },
    reachableFrom: function (map, id) {
      const cur = map.nodes[id];
      return cur ? cur.next.slice() : [];
    },
  };
  DC.MapGen = MapGen;
})();
