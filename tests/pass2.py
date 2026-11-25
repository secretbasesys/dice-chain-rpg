import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
R = {}
def safe_click(page, sel, wait=250, timeout=2500):
    try:
        page.click(sel, timeout=timeout); page.wait_for_timeout(wait); return True
    except Exception:
        return False

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("""() => {
      DC.Game.newRun(); DC.Game.pickClass('mage');
      const r = DC.Game.state.run;
      r.dice.push(DC.Dice.make('storm')); r.relics.push('flameHeart','sixBless');
      r.gold = 180;
    }""")
    page.wait_for_timeout(200)

    # mid-fight act 2 with two enemies
    page.evaluate("""() => { const r=DC.Game.state.run; r.act=2; r.hp=61;
      window.__origSpawns = DC.Game.spawnsFor;
      DC.Game.spawnsFor=()=>[DC.ENEMIES[2][0], DC.ENEMIES[2][4]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    # play 2 dice to show combo state
    page.evaluate("() => DC.test.botTurn()")
    page.wait_for_timeout(200)
    # start a new turn for a clean shot
    page.evaluate("() => DC.Game.startCombat('combat')")
    page.wait_for_timeout(300)
    safe_click(page, '[data-act="hand"][data-idx="0"]', 200)
    shot(page, "p2_01_act2_combat")
    R["act2_layout"] = layout_report(page)

    # boss fight act 3 (restore default spawns first)
    page.evaluate("""() => { DC.Game.spawnsFor = window.__origSpawns; DC.Game.state.run.act=3; DC.Game.state.run.hp=70; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(350)
    shot(page, "p2_02_final_boss")

    # victory screen
    page.evaluate("""() => {
      const c = DC.Game.state.combat;
      c.enemies.forEach(e=>{e.hp=0;e.dead=true;});
      c.phase='won'; c.totalDamage=812;
      DC.Game.state.run.stats={kills:23,turns:41,dmg:812};
      DC.Game.combatWon(); DC.Game.state.ui.reward.boss=true;
    }""")
    page.wait_for_timeout(350)
    shot(page, "p2_03_boss_reward")
    page.evaluate("() => { DC.Game.advanceAct(); }")
    page.wait_for_timeout(300)
    R["after_final"] = page.evaluate("() => DC.Game.state.screen")
    shot(page, "p2_04_victory")

    # gameover
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('gambler');
      DC.Game.state.run.stats={kills:7,turns:12,dmg:140};
      DC.Game.state.screen='gameover'; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    shot(page, "p2_05_gameover")

    # deck with several dice
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('gambler');
      const r=DC.Game.state.run;
      r.dice.push(DC.Dice.make('vampire'),DC.Dice.make('cursed'),DC.Dice.make('prism'));
      r.relics.push('mask','grail','echo');
      DC.Game.state.ui.modal='deck'; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    shot(page, "p2_06_deck")
    safe_click(page, '[data-act="closedeck"]', 150)

    # help
    page.evaluate("() => { DC.Game.state.screen='title'; DC.UI.render(); }")
    safe_click(page, '[data-act="help"]', 250)
    shot(page, "p2_07_help")

    R["console"] = errors
    b.close()

# desktop deep screens
with sync_playwright() as p:
    b, ctx, page, errors2 = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior');
      const r=DC.Game.state.run; r.act=2; r.gold=200;
      r.dice.push(DC.Dice.make('titan')); r.relics.push('wrist','grail');
      DC.Game.spawnsFor=()=>[DC.ENEMIES[2][2]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(350)
    safe_click(page, '[data-act="hand"][data-idx="0"]', 250)
    shot(page, "p2_d1_combat")
    R["d_combat"] = layout_report(page)
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openForge(2,null); }")
    page.wait_for_timeout(200)
    safe_click(page, '[data-act="fdiedie"][data-i="0"]', 150)
    safe_click(page, '[data-act="fface"][data-i="2"]', 250)
    shot(page, "p2_d2_forge")
    R["d_forge"] = layout_report(page)
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openShop(null); }")
    page.wait_for_timeout(250)
    shot(page, "p2_d3_shop")
    R["d_shop"] = layout_report(page)
    page.evaluate("() => { DC.Game.state.screen='reward'; DC.Game.combatWon&&0; DC.Game.state.ui.reward={gold:42,options:DC.Game.makeRewardOptions(3),boss:false}; DC.UI.render(); }")
    page.wait_for_timeout(250)
    shot(page, "p2_d4_reward")
    R["console2"] = errors2
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
