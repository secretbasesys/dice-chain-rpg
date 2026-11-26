import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
cls = sys.argv[1] if len(sys.argv)>1 else 'alchemist'
asc = int(sys.argv[2]) if len(sys.argv)>2 else 0
n = int(sys.argv[3]) if len(sys.argv)>3 else 40
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""([cls,asc,n]) => {
      DC.Game.state.ui.asc = asc;
      const r = DC.test.sim(n, cls);
      return {cls:cls, asc:asc, win: Math.round(100*r.wins/r.runs), acts: r.acts};
    }""", [cls, asc, n])
    print(json.dumps(out, ensure_ascii=False))
    b.close()
