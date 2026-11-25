import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(200)
    print(page.evaluate("""() => {
      const a = document.querySelector('.enemy-art'), c=document.querySelector('.combat');
      const ar=a.getBoundingClientRect(), cr=c.getBoundingClientRect();
      return {art:[Math.round(ar.width),Math.round(ar.height)], combat:[Math.round(cr.top),Math.round(cr.height)],
        artCls: getComputedStyle(a).width, row: Math.round(document.querySelector('.enemy-row').getBoundingClientRect().height)}
    }"""))
    b.close()
