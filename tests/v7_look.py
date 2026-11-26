"""v7 quick look: title / class / combat at a viewport."""
import sys, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

W = int(sys.argv[1]) if len(sys.argv) > 1 else 390
H = int(sys.argv[2]) if len(sys.argv) > 2 else 844
TAG = sys.argv[3] if len(sys.argv) > 3 else 'v7'
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, W, H, mobile=(W < 700))
    page.goto(BASE)
    page.wait_for_timeout(900)
    shot(page, TAG + '_title')
    page.evaluate("() => { DC.Game.state.ui.asc = 0; }")
    page.click('[data-act="newrun"]')
    page.wait_for_timeout(700)
    shot(page, TAG + '_class')
    page.click('[data-act="pickclass"][data-id="warrior"]')
    page.wait_for_timeout(700)
    if page.evaluate("() => DC.Game.state.ui.modal") == 'tut':
        page.evaluate("() => { DC.Game.state.ui.modal = null; DC.UI.render(); }")
        page.wait_for_timeout(300)
    scr = page.evaluate("() => DC.Game.state.screen")
    print('screen after class:', scr)
    if scr == 'gift':
        page.click('[data-act="gift"][data-i="0"]')
        page.wait_for_timeout(800)
    print('screen:', page.evaluate("() => DC.Game.state.screen"))
    shot(page, TAG + '_map')
    page.evaluate("() => { DC.Game.state.ui.challenge='none'; }")
    # jump straight into combat vs two act1 enemies
    page.evaluate("""() => {
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][2]];
        DC.Game.startCombat('combat');
    }""")
    page.wait_for_timeout(900)
    if page.evaluate("() => DC.Game.state.ui.modal") == 'tut':
        page.evaluate("() => { DC.Game.state.ui.modal = null; DC.UI.render(); }")
        page.wait_for_timeout(500)
    shot(page, TAG + '_combat')
    print('errors', errors[:10])
    b.close()
