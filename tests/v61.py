"""v6.1 — deep (abyss) runs to act 8+: stability, scaling, rewards."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    res = page.evaluate("""() => {
      const out = [];
      for (let i = 0; i < 4; i++) {
        const cls = DC.CLASS_IDS[i % 5];
        const r = DC.test.autoRun(cls, 1600, true);   // goDeep
        const run = DC.Game.state.run;
        out.push({ cls: cls, screen: r.screen, act: r.act, hp: r.hp, steps: r.steps,
                   depth: run ? run.depth : null, abyss: run && run.abyss ? run.abyss.id : null,
                   relics: run ? run.relics.length : 0 });
      }
      return out;
    }""")
    for r in res:
        print(json.dumps(r, ensure_ascii=False))
    print("ERRORS", errors[:5])

    # deep combat visuals at act 8
    page.evaluate("""() => { const s = DC.Game.state;
      if (!s.run) { DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); s.ui.modal=null; }
      if (s.screen === 'gift') DC.Game.takeGift(0);
      s.run.act = 8; s.run.depth = 8; s.run.abyss = DC.ABYSS_RULES[2];
      DC.Game.spawnsFor = () => [DC.ENEMIES[3][0], DC.ENEMIES[3][3]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(350)
    print("act8 enemy hp:", page.evaluate("() => DC.Game.state.combat.enemies.map(e => e.name + ':' + e.maxHp).join(', ')"))
    shot(page, "deep_act8")
    b.close()
