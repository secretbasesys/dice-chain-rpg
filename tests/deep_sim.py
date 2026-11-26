import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
for cls in ['warrior','alchemist']:
    with sync_playwright() as p:
        b,ctx,page,errors=launch(p,390,844,True)
        page.goto(BASE); page.wait_for_timeout(250)
        page.evaluate("() => localStorage.clear()")
        out = page.evaluate("""(cls) => {
          const depths = []; let wins = 0;
          for (let i=0;i<3;i++) { const r = DC.test.autoRun(cls, 1400, true); depths.push(r.act); if (r.screen==='win') wins++; }
          return {cls:cls, depths: depths, wins: wins};
        }""", cls)
        print(json.dumps(out))
        print("ERR", errors[:2])
        b.close()
