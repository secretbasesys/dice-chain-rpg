"""v5.3 — balance sweep: ascensions 0/5/8/10 after v4.4~v5.2 content."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    for asc in [0, 3, 6, 8, 10]:
        res = page.evaluate("""(asc) => {
          const out = { asc: asc, wins: 0, n: 0, byAct: {}, byCls: {} };
          DC.Game.state.ui.asc = asc;
          for (let i = 0; i < 12; i++) {
            const cls = DC.CLASS_IDS[i % DC.CLASS_IDS.length];
            const r = DC.test.autoRun(cls, 900, false);
            out.n++;
            if (r.screen === 'win') { out.wins++; out.byCls[cls] = (out.byCls[cls]||0)+1; }
            out.byAct[r.act] = (out.byAct[r.act] || 0) + 1;
          }
          return out;
        }""", asc)
        print(json.dumps(res))
    print("errors:", errors[:3])
    b.close()
