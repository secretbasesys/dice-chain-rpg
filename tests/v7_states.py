"""v7 화면 상태별 캡처 — API로 각 화면을 띄우고 안정된 뒤 촬영."""
import sys
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

CFG = {'360': (360, 640, True), '390': (390, 844, True), '1280': (1280, 800, False)}
key = sys.argv[1] if len(sys.argv) > 1 else '390'
w, h, mob = CFG[key]
T = 'v7s_' + key
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, w, h, mob)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(500)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(350)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(600)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    page.evaluate("() => { DC.Game.state.ui.modal = null; }")

    # --- reward: 1 HP 적을 처치
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][3]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(900)
    page.evaluate("() => { const c = DC.Game.state.combat; c.enemies.forEach(e => e.hp = 0); c.phase='won'; DC.Game.state.ui.busy=false; DC.Game.combatWon(); }")
    page.wait_for_timeout(1400)
    print('screen', page.evaluate("() => DC.Game.state.screen"))
    shot(page, T + '_reward')

    # --- 상점
    page.evaluate("""() => { DC.Game.state.run.gold = 320; DC.Game.openShop({}, false); }""")
    page.wait_for_timeout(600); shot(page, T + '_shop')

    # --- 휴식
    page.evaluate("() => { DC.Game.state.screen='rest'; DC.Game.state.ui.rest = DC.Game.state.ui.rest || null; DC.UI.render(); }")
    page.wait_for_timeout(400); shot(page, T + '_rest')

    # --- 단조
    page.evaluate("() => { DC.Game.openForge(true, {}, false); }")
    page.wait_for_timeout(500); shot(page, T + '_forge')

    # --- 이벤트
    page.evaluate("() => { DC.Game.openEvent({}); }")
    page.wait_for_timeout(500); shot(page, T + '_event')

    # --- 맵
    page.evaluate("() => { DC.Game.goMap(); }")
    page.wait_for_timeout(700); shot(page, T + '_map')

    # --- 보스전 (컷인 이후 정지 상태)
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.BOSSES[2]];
        DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(2600); shot(page, T + '_boss')

    # --- 3마리 전투
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][1], DC.ENEMIES[2][2]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(1000); shot(page, T + '_combat3')

    # --- 딥 모드 / 승리 화면
    page.evaluate("() => { DC.Game.state.screen = 'deep'; DC.UI.render(); }")
    page.wait_for_timeout(400); shot(page, T + '_deep')
    print('errors', errors[:6])
    b.close()
