import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    out = page.evaluate("""() => {
      let bad = [], overlaps = 0, total = 0;
      for (let i=0;i<300;i++) {
        const act = 1 + (i % 5);
        const m = DC.MapGen.gen(DC.rng, act);
        total++;
        // BFS from start
        const seen = new Set(m.start), q = m.start.slice();
        while (q.length) { const id = q.pop(); (m.nodes[id].next||[]).forEach(n => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
        const boss = Object.keys(m.nodes).find(id => m.nodes[id].type === 'boss');
        if (!seen.has(boss)) bad.push({act, rows:m.rows, size:Object.keys(m.nodes).length});
        // overlap check: same row, x distance
        m.grid.forEach(row => {
          for (let a=0;a<row.length;a++) for (let b2=a+1;b2<row.length;b2++) {
            const na = m.nodes[row[a]], nb = m.nodes[row[b2]];
            const cnt = row.length;
            const xa = cnt===1?50:cnt===2?29+a*42:17+a*33, xb = cnt===1?50:cnt===2?29+b2*42:17+b2*33;
            if (Math.abs(xa-xb) < 22) overlaps++;
          }
        });
      }
      return {total, unreachableBoss: bad.length, examples: bad.slice(0,3), overlaps};
    }""")
    print(json.dumps(out))
    print("ERRORS", errors[:3])
    b.close()
