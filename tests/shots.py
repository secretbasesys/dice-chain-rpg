import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

def click(page, sel, wait=260, t=2500):
    try:
        page.click(sel, timeout=t); page.wait_for_timeout(wait); return True
    except Exception:
        return False

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    shot(page, "title")

    # map with some progress
    page.evaluate("""() => {
      DC.Game.newRun(); DC.Game.pickClass('mage');
      const r = DC.Game.state.run;
      r.map.current = r.map.grid[0][0]; r.cleared.push(r.map.grid[0][0]);
      r.map.grid[0][0].done = true;
      DC.UI.render();
    }""")
    page.wait_for_timeout(400)
    shot(page, "map")

    # combat: act 2, two enemies, combo 2 in progress
    page.evaluate("""() => {
      const r = DC.Game.state.run;
      r.act = 2; r.hp = 58; r.gold = 145;
      r.dice.push(DC.Dice.make('storm'), DC.Dice.make('vampire'));
      r.relics.push('flameHeart', 'mask', 'sixBless');
      window.__o = DC.Game.spawnsFor;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][2], DC.ENEMIES[2][1]];
      DC.Game.startCombat('combat');
    }""")
    page.wait_for_timeout(400)
    page.evaluate("""() => {
      const c = DC.Game.state.combat;
      c.hand.forEach((h, i) => { h.v = Math.min(6, 2 + i); });
      DC.UI.render();
    }""")
    page.wait_for_timeout(120)
    page.click('[data-act="hand"][data-idx="0"]', no_wait_after=True)
    page.wait_for_timeout(80)
    shot(page, "combat_select")
    sel = page.evaluate("""() => { const s=DC.Game.state, c=s.combat;
      for (let i=0;i<c.slots.length;i++) if (DC.Combat.canPlay(c, s.ui.sel, i).ok) return i; return -1; }""")
    if sel >= 0:
        page.click(f'[data-act="slot"][data-idx="{sel}"]', no_wait_after=True)
        page.wait_for_timeout(220)
        shot(page, "combat")
    else:
        shot(page, "combat")

    # forge
    page.evaluate("() => { DC.Game.state.ui.forge = null; DC.Game.openForge(2, null); }")
    page.wait_for_timeout(250)
    click(page, '[data-act="fdiedie"][data-i="0"]', 140)
    click(page, '[data-act="fface"][data-i="2"]', 300)
    shot(page, "forge")

    # shop / reward / deck
    page.evaluate("() => { DC.Game.state.ui.forge = null; DC.Game.openShop(null); }")
    page.wait_for_timeout(300)
    shot(page, "shop")
    page.evaluate("() => { DC.Game.state.ui.shop=null; DC.Game.state.screen='reward'; DC.Game.state.ui.reward={gold:38, options:DC.Game.makeRewardOptions(3), boss:false}; DC.UI.render(); }")
    page.wait_for_timeout(300)
    shot(page, "reward")
    page.evaluate("() => { DC.Game.state.ui.modal='deck'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    shot(page, "deck")

    # victory
    page.evaluate("""() => { const r=DC.Game.state.run; r.stats={kills:26,turns:44,dmg:1210}; r.act=3;
      DC.Game.state.ui.modal=null; DC.Game.state.screen='win'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    shot(page, "victory")
    print("errors", errors)
    b.close()

# desktop hero shot
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior');
      const r=DC.Game.state.run; r.act=2; r.hp=64; r.gold=180;
      r.dice.push(DC.Dice.make('titan')); r.relics.push('wrist','grail','echo');
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(350)
    page.evaluate("() => { const c=DC.Game.state.combat; c.hand.forEach((h,i)=>{h.v=Math.min(6,2+i);}); DC.UI.render(); }")
    page.click('[data-act="hand"][data-idx="2"]', no_wait_after=True)
    page.wait_for_timeout(150)
    shot(page, "desktop_combat")
    page.evaluate("() => { DC.Game.state.screen='map'; DC.UI.render(); }")
    page.wait_for_timeout(350)
    shot(page, "desktop_map")
    print("errors2", errors)
    b.close()
