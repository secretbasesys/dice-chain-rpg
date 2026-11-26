"""v4.6 — paladin class: data, skills, verdict mechanic, screens, bot runs."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(250)

    print("classes:", page.evaluate("() => DC.CLASS_IDS.join(',')"),
          "dice:", page.evaluate("() => DC.DICE_IDS.length"),
          "kinds holy:", page.evaluate("() => !!DC.KINDS.holy"))

    # class screen shows 5 cards
    page.click('[data-act="newrun"]'); page.wait_for_timeout(200)
    print("class cards:", page.evaluate("() => document.querySelectorAll('.class-card').length"))
    page.screenshot(path=OUT + "/class5_360.png")

    page.click('[data-act="pickclass"][data-id="paladin"]'); page.wait_for_timeout(250)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    print("run cls:", page.evaluate("() => DC.Game.state.run.cls"),
          "dice:", page.evaluate("() => DC.Game.state.run.dice.map(d=>d.id).join(',')"))

    # combat: verdict stacking
    mech = page.evaluate("""() => {
      const s = DC.Game.state;
      s.run.relics = [];
      DC.Game.startCombat('combat');
      const c = s.combat;
      c.enemies.forEach(e => { e.hp = 200; e.maxHp = 200; });
      const out = {};
      // holy face + sanctuary
      c.hand = [{uid:'a',dieIdx:0,fi:0,k:'holy',v:4,baseV:4,used:false,locked:false,phantom:false}];
      c.slots.forEach(x => { x.handIdx = null; x.resolved = false; });
      DC.Combat.play(c, 0, 0);  // 심판의 일격 with holy face
      out.afterVStrike = { verdict: c.verdict, block: c.block };
      c.hand.push({uid:'b',dieIdx:1,fi:0,k:'guard',v:5,baseV:5,used:false,locked:false,phantom:false});
      c.slots[1].handIdx = null; c.slots[1].resolved = false;
      DC.Combat.play(c, 1, 1);  // 성역
      out.afterSanctuary = { verdict: c.verdict, block: c.block };
      // judge (prime req) -> verdict +2
      c.hand.push({uid:'c',dieIdx:2,fi:0,k:'slash',v:3,baseV:3,used:false,locked:false,phantom:false});
      c.slots[3].handIdx = null; c.slots[3].resolved = false;
      DC.Combat.play(c, 2, 3);
      out.afterJudge = { verdict: c.verdict, block: c.block };
      // wrath spends verdict
      c.hand.push({uid:'d',dieIdx:3,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false});
      c.slots[4].handIdx = null; c.slots[4].resolved = false;
      const before = c.enemies.map(e => e.hp);
      DC.Combat.play(c, 3, 4);
      out.wrath = { verdict: c.verdict, dmg: c.enemies.map((e,i) => before[i] - e.hp) };
      return out;
    }""")
    print("mechanics:", json.dumps(mech))

    # verdict decays at new turn
    dec = page.evaluate("""() => { const c = DC.Game.state.combat; c.verdict = 6; DC.Combat.newTurn(c); return c.verdict; }""")
    print("verdict after newTurn (6 -> 4):", dec)

    # preview text
    prev = page.evaluate("""() => { const c = DC.Game.state.combat; c.verdict = 3; c.block = 10;
      return [0,1,2,3,4].map(i => DC.Combat.preview(c, c.hand.length ? 0 : 0, i)).slice(0,5); }""")
    print("previews:", prev)
    page.evaluate("() => { DC.Game.state.ui.sel = 0; DC.UI.render(); }")
    page.wait_for_timeout(200)
    shot(page, "paladin_combat")
    print("errors:", errors[:5])
    b.close()

    # bot runs per class including paladin
    b2, c2, pg, e2 = launch(p, 390, 844, True)
    pg.goto(BASE); pg.wait_for_timeout(250)
    pg.evaluate("() => localStorage.clear()")
    res = pg.evaluate("""() => {
      const out = {};
      for (const cls of DC.CLASS_IDS) {
        let win = 0, n = 14, acts = {};
        for (let i = 0; i < n; i++) {
          const r = DC.test.autoRun(cls, 900, false);
          if (r.screen === 'win') win++;
          acts[r.act] = (acts[r.act]||0)+1;
        }
        out[cls] = { win: win + '/' + n, acts: acts };
      }
      return out;
    }""")
    print("bot per class:", json.dumps(res))
    print("errors2:", e2[:4])
    b2.close()
