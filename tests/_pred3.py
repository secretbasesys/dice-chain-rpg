import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(450)
    page.evaluate("""() => { const g=DC.Game, c=g.state.combat;
      while (c.enemies.length < 3) { const e=Object.assign({}, c.enemies[0]); e.id=DC.uid('e'); c.enemies.push(e); }
      c.target=1; c.enemies[1].hp=5; g.state.ui.busy=false; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.locator('[data-act="hand"]:not(.used)').first.click(); page.wait_for_timeout(300)
    shot(page,'v73_pred3')
    print('errors', errors[:2])
    b.close()
