import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="paladin"]'); page.wait_for_timeout(350)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    page.evaluate("() => { DC.Game.state.run.act=3; DC.Game.startCombat('boss'); }")
    page.wait_for_timeout(4200)
    box = page.evaluate("""() => { const r=document.querySelector('.enemy .e-hp .hpbar').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }""")
    page.screenshot(path='/workspace/work/dice-rpg/screenshots/v73_boss_hp.png', clip=box)
    print(box)
    print(page.evaluate("""() => { const f=document.querySelector('.enemy .e-hp .hp-fill'); const cs=getComputedStyle(f); return [cs.backgroundColor, cs.backgroundImage, cs.opacity, cs.zIndex]; }"""))
    b.close()
