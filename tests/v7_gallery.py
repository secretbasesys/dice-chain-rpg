"""v7.0 최종 갤러리 — README/공유용 스크린샷을 한 번에 만든다."""
import sys
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()


def enter(page, cls='warrior'):
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(500)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(400)
    page.click('[data-act="pickclass"][data-id="%s"]' % cls); page.wait_for_timeout(700)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    if page.evaluate("() => DC.Game.state.screen") == 'gift':
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(500)
    page.evaluate("() => { DC.Game.state.ui.modal = null; DC.UI.render(); }")


with sync_playwright() as p:
    # ---------- mobile 390 ----------
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(600)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(600)
    shot(page, 'v7_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(500)
    shot(page, 'v7_class')
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(800)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    if page.evaluate("() => DC.Game.state.screen") == 'gift':
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(450)
    page.evaluate("() => { DC.Game.state.ui.modal = null; }")

    # 전투: 2마리
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][3]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(1300)
    shot(page, 'v7_combat')
    # 공격 연출
    page.click('[data-act="hand"][data-idx="0"]'); page.wait_for_timeout(160)
    page.click('[data-act="slot"][data-idx="0"]'); page.wait_for_timeout(150)
    shot(page, 'v7_fx')
    page.wait_for_timeout(700)
    page.click('[data-act="hand"][data-idx="1"]'); page.wait_for_timeout(140)
    page.click('[data-act="slot"][data-idx="2"]'); page.wait_for_timeout(260)
    shot(page, 'v7_fx2')
    page.wait_for_timeout(700)

    # 3마리
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[3][0], DC.ENEMIES[3][3], DC.ENEMIES[3][4]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(1200); shot(page, 'v7_combat3')

    # 보스 컷인 + 보스전
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.BOSSES[3]];
        DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(800); shot(page, 'v7_boss_cutin')
    page.wait_for_timeout(1900); shot(page, 'v7_boss')

    # 전투 기록
    page.evaluate("() => { DC.Game.state.ui.logOpen = true; DC.UI.render(); }")
    page.wait_for_timeout(400); shot(page, 'v7_log')
    page.evaluate("() => { DC.Game.state.ui.logOpen = false; DC.UI.render(); }")

    # 보상
    page.evaluate("""() => { const c = DC.Game.state.combat; c.enemies.forEach(e => e.hp = 0); c.phase='won';
        DC.Game.state.ui.busy = false; DC.Game.combatWon(); }""")
    page.wait_for_timeout(1200); shot(page, 'v7_reward')
    page.click('[data-act="reward"][data-i="0"]'); page.wait_for_timeout(600)
    if page.evaluate("() => DC.Game.state.ui.modal") == 'draft':
        page.click('[data-act="draftslot"][data-i="2"]'); page.wait_for_timeout(500)
    # 상점
    page.evaluate("() => { DC.Game.state.run.gold = 260; DC.Game.openShop({}, false); }")
    page.wait_for_timeout(600); shot(page, 'v7_shop')
    page.evaluate("() => { DC.Game.goMap(); }"); page.wait_for_timeout(700); shot(page, 'v7_map')
    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }"); page.wait_for_timeout(500); shot(page, 'v7_codex')
    page.evaluate("() => { DC.Game.state.ui.modal=null; DC.UI.render(); }"); page.wait_for_timeout(200)
    b.close()
    print('mobile errors', errors[:4])

    # ---------- desktop 1280 ----------
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(600)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(600)
    shot(page, 'v7_desktop_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(500)
    shot(page, 'v7_desktop_class')
    page.click('[data-act="pickclass"][data-id="mage"]'); page.wait_for_timeout(800)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    if page.evaluate("() => DC.Game.state.screen") == 'gift':
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(450)
    page.evaluate("""() => { DC.Game.state.ui.modal = null;
        DC.Game.spawnsFor = () => [DC.ENEMIES[3][0], DC.ENEMIES[3][3], DC.ENEMIES[3][4]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(1300); shot(page, 'v7_desktop_combat')
    page.click('[data-act="hand"][data-idx="0"]'); page.wait_for_timeout(160)
    page.click('[data-act="slot"][data-idx="0"]'); page.wait_for_timeout(200)
    shot(page, 'v7_desktop_fx')
    page.wait_for_timeout(900)
    page.evaluate("""() => { const c = DC.Game.state.combat; c.enemies.forEach(e => e.hp = 0); c.phase='won';
        DC.Game.state.ui.busy = false; DC.Game.combatWon(); }""")
    page.wait_for_timeout(1200); shot(page, 'v7_desktop_reward')
    b.close()
    print('desktop errors', errors[:4])
