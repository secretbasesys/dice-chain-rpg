import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
SH = "/workspace/work/dice-rpg/tests/_shots"

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => { localStorage.clear(); }")
    page.reload(); page.wait_for_timeout(350)
    page.screenshot(path=f"{SH}/m3_title_locked.png")
    print("title asc text:", page.evaluate("() => document.querySelector('.asc-label').innerText"))

    # codex
    page.click('[data-act="codex"]'); page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/m3_codex_empty.png")
    print("codex progress:", page.evaluate("() => document.querySelector('.cx-progress').innerText"))
    page.click('[data-act="closecodex"]'); page.wait_for_timeout(200)

    # simulate a full win through the real flow to hit meta
    res = page.evaluate("""() => {
      DC.Game.newRun(); DC.Game.pickClass('warrior');
      const r = DC.Game.state.run; r.act = 3; r.stats = {kills:22,turns:40,dmg:1200}; r.maxCombo=6;
      DC.Game.state.screen='win';
      DC.Game.advanceAct();  // act>=3 -> win path
      return {meta: DC.Meta.get().wins, asc: DC.Meta.get().unlockedAsc, screen: DC.Game.state.screen};
    }""")
    print("after win:", res)
    page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/m3_win.png")
    page.click('[data-act="title"]'); page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/m3_title_unlocked.png")
    print("title asc text:", page.evaluate("() => document.querySelector('.asc-label').innerText"))

    # select asc 3 (one real click, rest via state)
    page.click('[data-act="asc"][data-dir="1"]'); page.wait_for_timeout(150)
    print("after one click asc:", page.evaluate("() => DC.Game.state.ui.asc"))
    page.evaluate("() => { DC.Game.state.ui.asc = 3; DC.UI.render(); }")
    page.wait_for_timeout(120)
    page.screenshot(path=f"{SH}/m3_title_asc3.png")
    print("selected asc:", page.evaluate("() => DC.Game.state.ui.asc"))
    page.evaluate("() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); }")
    page.wait_for_timeout(250)
    print("run asc:", page.evaluate("() => DC.Game.state.run.asc"), "gold:", page.evaluate("() => DC.Game.state.run.gold"))
    hp = page.evaluate("""() => { DC.Game.spawnsFor=()=>[DC.ENEMIES[1][0]]; DC.Game.startCombat('combat');
        return DC.Game.state.combat.enemies[0].maxHp; }""")
    print("ascaled slime hp:", hp, "(base 28 * 1.1 =", int(28*1.1), ")")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{SH}/m3_asc_combat.png")

    prog = page.evaluate("() => JSON.stringify(DC.Meta.progress())")
    print("progress:", prog)
    print("errors", errors[:6])
    b.close()

# ascension sweep: win rate by ascension with the bot
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    out = page.evaluate("""() => {
      const r = {};
      [0,2,4,5].forEach(a => {
        let w=0; const N=12;
        for (let i=0;i<N;i++) {
          DC.Game.state.ui.asc = a;
          const cls = DC.CLASS_IDS[i % 3];
          const res = DC.test.autoRun(cls, 900);
          if (res.screen === 'win') w++;
        }
        r['asc'+a] = w + '/' + N;
      });
      return JSON.stringify(r);
    }""")
    print("asc sweep:", out)
    b.close()
