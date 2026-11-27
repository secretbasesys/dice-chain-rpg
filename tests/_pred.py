import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(500)
    page.evaluate("() => { DC.Game.state.combat.enemies[0].hp = 6; DC.UI.render(); }")
    page.locator('[data-act="hand"]:not(.used)').first.click(); page.wait_for_timeout(300)
    shot(page,'v73_pred')
    print(page.evaluate("""() => { const e=document.querySelector('.enemy'); return {kill: !!e.querySelector('.e-kill'), pred: !!e.querySelector('.hp-pred'), w:(e.querySelector('.hp-pred')||{}).style && e.querySelector('.hp-pred').style.width}; }"""))
    b.close()
