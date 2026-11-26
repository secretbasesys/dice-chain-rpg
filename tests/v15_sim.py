import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    for cls in ['warrior','mage','gambler','alchemist']:
        try:
            out = page.evaluate("""(cls) => {
              DC.Game.state.ui.asc = 0;
              const t = Date.now();
              const r = DC.test.sim(25, cls);
              return {cls: cls, win: Math.round(100*r.wins/r.runs), acts: r.acts, ms: Date.now()-t};
            }""", cls)
            print(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            print(cls, "FAILED", str(e)[:120]); break
    print("ERR", errors[:3])
    b.close()
