import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    for mode in ['muted', 'unmuted']:
        b, ctx, page, errors = launch(p, 390, 844, True)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("(m) => { localStorage.clear(); if (m) DC.Audio.setMuted(true); }", mode == 'muted')
        out = page.evaluate("""() => {
          const marks = [];
          for (let i = 1; i <= 20; i++) {
            DC.test.autoRun(DC.CLASS_IDS[i % 5], 900, false);
            if (i % 5 === 0) marks.push(Math.round(performance.memory.usedJSHeapSize/1e6));
          }
          return marks;
        }""")
        print(mode, out)
        b.close()
