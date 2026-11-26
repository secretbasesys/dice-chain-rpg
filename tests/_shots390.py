import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(400)
    shot(page,'v71_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(400)
    shot(page,'v71_class')
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(450)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(350)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(500)
    page.wait_for_timeout(200)
    shot(page,'v71_combat')
    print('errors',errors[:3], 'ov', page.evaluate("() => document.documentElement.scrollWidth>innerWidth+1"))
    b.close()
