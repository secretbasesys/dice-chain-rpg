import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(450)
    if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(400)
    page.wait_for_timeout(400)
    shot(page,'v76b_tut')
    if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    page.evaluate("() => { DC.Game.state.ui.modal='remove'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v76b_remove')
    print('errors', errors[:2])
    b.close()
