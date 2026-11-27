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
    page.evaluate("() => { DC.Game.state.screen='gameover'; DC.Game.state.run.stats={kills:12,turns:40,dmg:530,skillUse:{'강타':9,'분쇄':4}}; DC.UI.render(); }")
    page.wait_for_timeout(400); shot(page,'v76_lose')
    page.evaluate("() => { DC.Game.state.screen='win'; DC.Game.state.ui.winInfo={unlocked:true,level:1}; DC.Game.state.run.act=3; DC.UI.render(); }")
    page.wait_for_timeout(400); shot(page,'v76_win')
    print('errors', errors[:2])
    b.close()
