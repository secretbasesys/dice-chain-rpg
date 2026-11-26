"""v4.4 balance sim — bot win rates with boss relics in play."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    for asc in [0, 5, 8, 10]:
        res = page.evaluate("""(asc) => {
          const out = {asc: asc, wins: 0, n: 0, acts: {}, bossRelics: {}};
          for (let i = 0; i < 24; i++) {
            DC.Meta.set ? null : null;
            const cls = DC.CLASS_IDS[i % DC.CLASS_IDS.length];
            DC.Game.state.ui.asc = asc;
            const r = DC.test.autoRun(cls, 900, false);
            out.n++;
            if (r.screen === 'win') out.wins++;
            out.acts[r.act] = (out.acts[r.act] || 0) + 1;
            const rel = (DC.Game.state.run && DC.Game.state.run.relics) || [];
            rel.filter(id => DC.RELICS[id].boss).forEach(id => { out.bossRelics[id] = (out.bossRelics[id] || 0) + 1; });
          }
          return out;
        }""", asc)
        print("asc", asc, "win", res["wins"], "/", res["n"], "acts", res["acts"], "bossRelics", res["bossRelics"])
    print("errors:", errors[:5])
    b.close()
