import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="alchemist"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    page.evaluate("() => { DC.Game.state.run.act=1; DC.Game.openForge(0); }"); page.wait_for_timeout(500)
    shot(page,'v73_forge390')
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.state.screen='win'; DC.Game.state.ui.winInfo={unlocked:true,level:1}; DC.Game.state.run.act=3; DC.UI.render(); }")
    page.wait_for_timeout(500); shot(page,'v73_win390')
    page.evaluate("() => { DC.Game.state.screen='combat'; DC.Game.startCombat('combat'); }"); page.wait_for_timeout(1200)
    page.evaluate("() => { DC.Game.state.ui.modal='skills'; DC.UI.render(); }"); page.wait_for_timeout(400)
    shot(page,'v73_skills')
    print('errors', errors[:3])
    b.close()
