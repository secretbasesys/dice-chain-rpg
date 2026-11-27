import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="history"]'); page.wait_for_timeout(350); shot(page,'v74_history')
    page.click('[data-act="closehistory"]'); page.wait_for_timeout(200)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    shot(page,'v74_tut')
    page.click('[data-act="pickclass"][data-id="gambler"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    page.evaluate("() => { DC.Game.state.ui.modal='challenge'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v74_challenge')
    print('errors', errors[:2])
    b.close()
