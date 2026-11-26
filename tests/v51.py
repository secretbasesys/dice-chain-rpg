"""v5.1 — daily streak/log + triple combo synergy."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)

    # daily noteDaily -> log + streak
    d = page.evaluate("""() => {
      const t = DC.todaySeed();
      DC.Meta.noteDaily({ day: t, win: true, act: 3, kills: 21, dmg: 2500, cls: 'mage', t: Date.now() });
      const log = DC.Meta.dailyLog();
      DC.Game.state.ui.modal = null; DC.UI.render();
      const card = document.querySelector('.daily-card');
      return { log: log.length, streak: DC.Meta.dailyStreak(), score: log[log.length-1].score,
        card: card ? card.textContent.replace(/\s+/g, ' ').trim() : 'none',
        replay: !!document.querySelector('.dc-btn[data-act="dailyrun"]') };
    }""")
    print("daily:", d)
    print("card:", page.evaluate("() => { const e = document.querySelector('.daily-card'); return e ? e.textContent.replace(/\\s+/g,' ').trim() : 'none'; }"))
    shot(page, "daily_v51")

    # triple combo
    page.evaluate("""() => { DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }""")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    tri = page.evaluate("""() => {
      const s = DC.Game.state;
      s.run.relics = [];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat');
      const c = s.combat;
      c.enemies[0].hp = 400; c.enemies[0].maxHp = 400;
      c.hand = [
        {uid:'a',dieIdx:0,fi:0,k:'slash',v:4,baseV:4,used:false,locked:false,phantom:false},
        {uid:'b',dieIdx:1,fi:0,k:'slash',v:4,baseV:4,used:false,locked:false,phantom:false},
        {uid:'c',dieIdx:2,fi:0,k:'slash',v:4,baseV:4,used:false,locked:false,phantom:false},
        {uid:'d',dieIdx:3,fi:0,k:'slash',v:4,baseV:4,used:false,locked:false,phantom:false}
      ];
      c.slots.forEach(x => { x.handIdx = null; x.resolved = false; });
      const out = [];
      for (let i = 0; i < 4; i++) {
        const sp = c.sparks;
        DC.Combat.play(c, i, i);
        out.push({ i: i, sameVal: c.sameVal, sparks: [sp, c.sparks], mult: DC.Combat.mult(c) });
      }
      return out;
    }""")
    print("triple run:", json.dumps(tri))
    print("errors:", errors[:4])
    b.close()
