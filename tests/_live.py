import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto("https://secretbasesys.github.io/dice-chain-rpg/?v=710"); page.wait_for_timeout(1200)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(1200)
    shot(page,'live_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(500)
    page.click('[data-act="pickclass"][data-id="gambler"]'); page.wait_for_timeout(600)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(450)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(700)
    page.locator('[data-act="hand"]:not(.used)').first.click(); page.wait_for_timeout(350)
    shot(page,'live_combat')
    print('live version', page.evaluate("() => DC.VERSION"), 'errors', errors[:3])
    b.close()
