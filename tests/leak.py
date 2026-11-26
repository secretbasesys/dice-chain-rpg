import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const marks = [];
      for (let i = 1; i <= 60; i++) {
        const cls = DC.CLASS_IDS[i % 5];
        DC.test.autoRun(cls, 900, false);
        if (i % 10 === 0) marks.push(i + ':' + (performance.memory ? Math.round(performance.memory.usedJSHeapSize/1e6) : '?'));
      }
      return marks;
    }""")
    print("heap by runs:", out)
    print("DOM nodes:", page.evaluate("() => document.getElementsByTagName('*').length"))
    print("ERRORS", errors[:3])
    b.close()
