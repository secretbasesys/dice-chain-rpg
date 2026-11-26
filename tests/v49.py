"""v4.9 — new enemies, abyss relic payout, deep-run sanity."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(250)
    print("enemies per act:", page.evaluate("() => [1,2,3].map(a => DC.ENEMIES[a].map(e=>e.name).length)"))
    print("total enemies:", page.evaluate("() => DC.Meta.enemyTotal()"))

    # new enemies render in combat without art errors
    for a, key in [(1, 'beetle'), (1, 'moth'), (2, 'sentry'), (3, 'hound')]:
        page.evaluate("""([a,key]) => { const s = DC.Game.state;
          if (s.screen === 'title' || !s.run) { DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); s.ui.modal=null; }
          if (s.screen === 'gift') DC.Game.takeGift(0);
          s.run.act = a;
          const def = DC.ENEMIES[a].find(e => e.id === key);
          DC.Game.spawnsFor = () => [def];
          DC.Game.startCombat('combat'); }""", [a, key])
        page.wait_for_timeout(200)
        ok = page.evaluate("() => { const e = DC.Game.state.combat.enemies[0]; return [e.name, e.hp, !!document.querySelector('.enemy')]; }")
        print(key, ok)

    # abyss: deep continues pay a relic
    deep = page.evaluate("""() => {
      const s = DC.Game.state;
      s.run.relics = ['mask'];
      s.run.act = 3; s.run.depth = 3;
      const before = s.run.relics.length;
      DC.Game.continueDeep();
      return { act: s.run.act, relics: s.run.relics.length, before: before, screen: s.screen };
    }""")
    print("continueDeep:", deep)
    print("errors:", errors[:4])
    b.close()
