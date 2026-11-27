import sys
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
SH = "/workspace/work/dice-rpg/tests/_shots"

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/b_title.png")
    page.click('[data-act="codex"]'); page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/b_codex.png", full_page=False)
    page.click('[data-act="closecodex"]'); page.wait_for_timeout(150)
    new_game(page)
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][2], DC.ENEMIES[1][4]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{SH}/b_combat3.png")
    page.evaluate("""() => { const s = DC.Game.state.run; s.gold = 300;
        DC.Game.openReward ? 0 : 0; }""")
    print(errors[:5])
    b.close()

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(400)
    new_game(page)
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
        DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(500)
    page.screenshot(path=f"{SH}/b_desk_combat.png")
    print(errors[:5])
    b.close()
