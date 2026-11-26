"""v4.6 balance: per-class bot win rates (batched, low memory)."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    for cls in ['warrior', 'mage', 'gambler', 'alchemist', 'paladin']:
        res = page.evaluate("""(cls) => {
          let win = 0, n = 10, acts = {}, dmg = 0, combo = 0;
          for (let i = 0; i < n; i++) {
            const r = DC.test.autoRun(cls, 900, false);
            if (r.screen === 'win') win++;
            acts[r.act] = (acts[r.act] || 0) + 1;
            const run = DC.Game.state.run;
            if (run) { dmg += run.stats.dmg; combo = Math.max(combo, run.maxCombo || 0); }
          }
          return {win: win + '/' + n, acts: acts, avgDmg: Math.round(dmg / n), bestCombo: combo};
        }""", cls)
        print(cls, json.dumps(res))
        page.wait_for_timeout(120)
    print("errors:", errors[:4])
    b.close()
