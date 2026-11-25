import sys, json, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
OUT2 = "/workspace/work/dice-rpg/tests/_shots"
os.makedirs(OUT2, exist_ok=True)

def snap(page, name):
    p = os.path.join(OUT2, name + ".png")
    page.screenshot(path=p)
    return p

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    snap(page, "m_title")
    page.evaluate("() => { DC.Game.newRun(); }"); page.wait_for_timeout(200)
    snap(page, "m_class")
    page.evaluate("""() => { DC.Game.pickClass('warrior'); const r = DC.Game.state.run;
      r.map.current = r.map.grid[0][0]; r.cleared.push(r.map.grid[0][0]); DC.UI.render(); }""")
    page.wait_for_timeout(350)
    snap(page, "m_map")
    page.evaluate("""() => { const r = DC.Game.state.run;
      r.act = 2; r.hp = 58; r.gold = 145;
      r.dice.push(DC.Dice.make('storm'), DC.Dice.make('vampire'));
      r.relics.push('flameHeart','mask','sixBless');
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][2], DC.ENEMIES[2][1]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(400)
    page.evaluate("""() => { const c = DC.Game.state.combat; c.hand.forEach((h,i)=>{ h.v = Math.min(6, 2+i); }); DC.UI.render(); }""")
    page.wait_for_timeout(150)
    snap(page, "m_combat")
    page.click('[data-act="hand"][data-idx="0"]', no_wait_after=True); page.wait_for_timeout(150)
    snap(page, "m_combat_sel")
    print("errors", errors[:8])
    b.close()

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('mage');
      const r=DC.Game.state.run; r.act=2; r.hp=64; r.gold=180;
      r.dice.push(DC.Dice.make('titan')); r.relics.push('wrist','grail','echo');
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(400)
    snap(page, "d_combat")
    page.evaluate("() => { DC.Game.state.screen='map'; DC.UI.render(); }"); page.wait_for_timeout(300)
    snap(page, "d_map")
    print("errors2", errors[:8])
    b.close()
