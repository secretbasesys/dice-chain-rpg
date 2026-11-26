"""v7 연출 캡처: 공격 순간 / 콤보 / 처치 / 보스 컷인."""
import sys
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

W = int(sys.argv[1]) if len(sys.argv) > 1 else 390
H = int(sys.argv[2]) if len(sys.argv) > 2 else 844
T = sys.argv[3] if len(sys.argv) > 3 else 'v7'
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, W, H, mobile=(W < 700))
    page.goto(BASE); page.wait_for_timeout(700)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior');
        DC.Game.state.ui.modal = null; DC.Game.state.ui.set.motion = false;
        DC.FX.setReduced(false);
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][2]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(1200)
    # 첫 주사위 → 첫 슬롯(강타)에 배치
    page.click('[data-act="hand"][data-idx="0"]')
    page.wait_for_timeout(200)
    page.click('[data-act="slot"][data-idx="0"]')
    page.wait_for_timeout(120)
    shot(page, T + '_fx1')
    page.wait_for_timeout(90)
    shot(page, T + '_fx2')
    page.wait_for_timeout(600)
    shot(page, T + '_after_hit')
    # 콤보 2~3 연쇄
    for i in range(1, 4):
        try:
            page.click('[data-act="hand"][data-idx="%d"]' % i, timeout=800)
            page.wait_for_timeout(120)
            page.click('[data-act="slot"][data-idx="%d"]' % (i % 5), timeout=800)
            page.wait_for_timeout(100)
        except Exception as e:
            print('skip', i, e)
    shot(page, T + '_combo')
    page.wait_for_timeout(900)
    # 보스 컷인
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.BOSSES[1]];
        DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(700)
    shot(page, T + '_boss_cutin')
    page.wait_for_timeout(1600)
    shot(page, T + '_boss')
    # 처치 연출
    page.evaluate("() => { const c = DC.Game.state.combat; DC.Combat.alive(c).forEach(e => e.hp = 1); }")
    page.wait_for_timeout(100)
    page.click('[data-act="hand"][data-idx="0"]')
    page.wait_for_timeout(150)
    page.click('[data-act="slot"][data-idx="0"]')
    page.wait_for_timeout(180)
    shot(page, T + '_kill')
    print('errors', errors[:8])
    b.close()
