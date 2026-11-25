import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    print(page.evaluate("""() => {
      const d = document.querySelector('.die');
      const pips = document.querySelectorAll('.die-pips i').length;
      const sc = document.querySelector('.arena-scene');
      const sr = sc ? sc.getBoundingClientRect() : null;
      const cs = d ? getComputedStyle(d.querySelector('.die-pips')||d) : null;
      return {pips: pips, scene: !!sc, sceneRect: sr && [Math.round(sr.width), Math.round(sr.height)],
              art: document.querySelector('.enemy-art svg').innerHTML.slice(0,60),
              dieHTML: d ? d.innerHTML.slice(0,180) : null};
    }"""))
    b.close()
