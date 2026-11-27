import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.on("pageerror", lambda e: print("PAGEERROR:", e, "\nSTACK:", getattr(e, 'stack', '')))
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(300)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(400)
    page.evaluate("""() => { const g=DC.Game; const c=g.state.combat; c.enemies.forEach(e=>e.hp=0); g.state.ui.busy=false; g.combatWon(); }""")
    page.wait_for_timeout(900)
    print('screen', page.evaluate("() => DC.Game.state.screen"), 'combat', page.evaluate("() => !!DC.Game.state.combat"))
    print('errors', errors[:2])
    b.close()
