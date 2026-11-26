import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
res = {}
for cls in ['warrior','mage','gambler','alchemist']:
    with sync_playwright() as p:
        b, ctx, page, errors = launch(p, 390, 844, True)
        page.goto(BASE); page.wait_for_timeout(250)
        page.evaluate("() => localStorage.clear()")
        try:
            out = page.evaluate("""(cls) => {
              DC.Game.state.ui.asc = 0;
              const r = DC.test.sim(40, cls);
              return {win: Math.round(100*r.wins/r.runs), acts: r.acts, runs: r.runs};
            }""", cls)
            res[cls] = out
            print(cls, json.dumps(out), flush=True)
        except Exception as e:
            print(cls, "FAILED", str(e)[:100], flush=True)
        b.close()
print("DONE", json.dumps(res))
