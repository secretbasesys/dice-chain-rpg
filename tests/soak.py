import sys, json, time; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    t0 = time.time()
    out = page.evaluate("""() => {
      const res = [];
      for (let i=0;i<10;i++) {
        const cls = DC.CLASS_IDS[i%DC.CLASS_IDS.length];
        const r = DC.test.autoRun(cls, 900);
        res.push([cls, r.screen, r.act]);
      }
      return {runs: res, heap: (performance.memory ? Math.round(performance.memory.usedJSHeapSize/1e6) : null)};
    }""")
    print("soak:", json.dumps(out), "sec:", round(time.time()-t0,1))
    print("ERRORS", json.dumps(errors[:5], ensure_ascii=False))
    b.close()
