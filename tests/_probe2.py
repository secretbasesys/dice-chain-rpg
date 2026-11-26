import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,1280,800,False)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(400)
    page.evaluate("() => { DC.Game.state.ui.modal=null; DC.UI.render(); }")
    shot(page,'v71_desk_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    shot(page,'v71_desk_class')
    print(page.evaluate("() => ({hp: document.querySelector('.hp').getBoundingClientRect().width, hud: document.querySelector('.hud').getBoundingClientRect().width})") if page.locator('.hp').count() else '')
    b.close()
