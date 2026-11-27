import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    for (w,h,mob,name,kind) in [(360,640,True,'v73_360_3enemy','combat'),(390,844,True,'v73_390_boss','boss')]:
        b,ctx,page,errors = launch(p,w,h,mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
        page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
        page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(350)
        for _ in range(3):
            if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
            if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
        page.evaluate("(k) => { DC.Game.state.run.act=2; DC.Game.startCombat(k); }", kind)
        page.wait_for_timeout(900)
        if kind=='combat':
            page.evaluate("""() => { const g=DC.Game, c=g.state.combat;
              while (c.enemies.length < 3) { const e=Object.assign({}, c.enemies[0]); e.id=DC.uid('e'); e.hp=e.maxHp=12; e.uid=e.id; c.enemies.push(e); }
              g.state.ui.busy=false; DC.UI.render(); }""")
            page.wait_for_timeout(400)
        shot(page, name)
        print(name, 'enemies', page.evaluate("() => DC.Game.state.combat.enemies.length"), 'errors', errors[:2])
        b.close()
