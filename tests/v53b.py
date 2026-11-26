"""v5.3 — long soak (30 runs) + codex synergy section."""
import sys, json, time; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    t0 = time.time()
    out = page.evaluate("""() => {
      const res = []; let wins = 0;
      for (let i = 0; i < 30; i++) {
        const cls = DC.CLASS_IDS[i % DC.CLASS_IDS.length];
        const r = DC.test.autoRun(cls, 900, false);
        res.push(cls + ':' + r.screen + '@' + r.act);
        if (r.screen === 'win') wins++;
        if (i === 9 || i === 19 || i === 29) {
          res.push('heap' + i + '=' + (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : '?') + 'MB');
        }
      }
      return { wins: wins + '/30', log: res };
    }""")
    print(json.dumps(out, ensure_ascii=False))
    print("sec:", round(time.time() - t0, 1))
    print("ERRORS", json.dumps(errors[:5], ensure_ascii=False))
    # codex synergy section
    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
    page.wait_for_timeout(300)
    print("codex syn rows:", page.evaluate("() => document.querySelectorAll('.cx-panel .syn-row').length"))
    print("codex height ok:", page.evaluate("() => { const p = document.querySelector('.cx-panel'); return p ? p.scrollHeight > p.clientHeight : null; }"))
    b.close()
