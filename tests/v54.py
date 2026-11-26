"""v5.4 — third abyss boss: mirror gimmick, art, codex, rotation."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)

    print("abyss rotation:", page.evaluate("() => [4,5,6,7,8,9].map(a => DC.abyssBossFor(a).id).join(',')"))
    print("enemies total:", page.evaluate("() => DC.Meta.enemyTotal()"))

    # fight the new boss and check mirror reflect
    res = page.evaluate("""() => {
      const s = DC.Game.state; s.run.act = 5; s.run.relics = [];
      DC.Game.spawnsFor = () => [DC.BOSSES[6]];
      DC.Game.startCombat('boss');
      const c = s.combat;
      c.enemies[0].hp = 400; c.enemies[0].maxHp = 400;
      c.hand = [{uid:'a',dieIdx:0,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false}];
      c.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
      const hp0 = c.hp;
      const e0 = c.enemies[0].hp;
      DC.Combat.play(c, 0, 0);
      return { dealt: e0 - c.enemies[0].hp, selfLost: hp0 - c.hp, name: c.enemies[0].name, art: !!document.querySelector('.enemy-art svg') };
    }""")
    print("mirror:", json.dumps(res))
    page.wait_for_timeout(300)
    shot(page, "boss_gamblerking")

    # codex includes it
    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("codex enemy count:", page.evaluate("() => document.querySelectorAll('.cx-enemy').length"))
    print("errors:", errors[:4])
    b.close()
