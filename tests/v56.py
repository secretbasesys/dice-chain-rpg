"""v5.6 — new achievements unlock through real run end + progress bars."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(250)
    print("ach total:", page.evaluate("() => DC.ACHIEVEMENTS.length"))

    out = page.evaluate("""() => {
      const m = DC.Meta.get();
      const got = [];
      // boss relic + synergy ctx
      let res = DC.Meta.check({ win: true, cls: 'paladin', asc: 0, maxCombo: 6, dmg: 1200, challenge: 'none', relics: 5, seed: 'X',
        syn: 1, bossRelics: 1 });
      res.forEach(a => got.push(a.id));
      // depth 6
      m.bestDepth = 6; DC.Meta.save();
      DC.Meta.check({ win: false, cls: 'mage', asc: 0, maxCombo: 3, dmg: 500, challenge: 'none', relics: 2, seed: 'X' })
        .forEach(a => got.push(a.id));
      // daily streak 3
      m.dailyStreak = 3; DC.Meta.save();
      DC.Meta.check({ win: false, cls: 'mage', asc: 0, maxCombo: 3, dmg: 500, challenge: 'none', relics: 2, seed: 'X' })
        .forEach(a => got.push(a.id));
      return { got: got, total: Object.keys(DC.Meta.get().ach).length };
    }""")
    print("unlocked:", json.dumps(out))

    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("ach rows:", page.evaluate("() => document.querySelectorAll('.cx-ach').length"),
          "done:", page.evaluate("() => document.querySelectorAll('.cx-ach.done').length"),
          "prog bars:", page.evaluate("() => document.querySelectorAll('.ach-prog').length"))
    shot(page, "ach_v56")
    print("errors:", errors[:4])
    b.close()
