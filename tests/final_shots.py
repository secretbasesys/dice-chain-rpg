import sys, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
OUT = "/workspace/work/dice-rpg/screenshots"
os.makedirs(OUT, exist_ok=True)

def snap(page, name):
    page.screenshot(path=os.path.join(OUT, name + ".png"))

for (w, h, mob, tag) in [(390, 844, True, ""), (1280, 800, False, "desktop_")]:
    with sync_playwright() as p:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(350)
        page.evaluate("() => localStorage.clear()")
        page.evaluate("""() => { const m=DC.Meta.get(); m.wins=3; m.unlockedAsc=2; m.runs=9; m.bestAct=3;
          m.seen.dice=['iron','ember','lucky','titan','storm','vampire','wild','prism'];
          m.seen.relics=['flameHeart','mask','sixBless']; m.seen.enemies=['slime','rat','goblin','queen','bat','wolf'];
          m.ach={win1:1,winWarrior:1}; DC.Meta.save(); DC.Game.state.ui.asc=1; DC.Game.state.screen='title'; DC.UI.render(); }""")
        page.wait_for_timeout(250)
        snap(page, tag + "title")
        page.evaluate("() => { DC.Game.newRun(); }"); page.wait_for_timeout(200)
        snap(page, tag + "class")
        page.evaluate("""() => { DC.Game.pickClass('warrior'); const r=DC.Game.state.run;
          r.map.current=r.map.grid[1][0]; r.cleared.push(r.map.grid[0][0]); r.cleared.push(r.map.grid[1][0]); DC.UI.render(); }""")
        page.wait_for_timeout(400); snap(page, tag + "map")
        page.evaluate("""() => { const r=DC.Game.state.run; r.act=2; r.hp=44; r.gold=168;
          r.dice.push(DC.Dice.make('storm'), DC.Dice.make('titan')); r.skills[0]=1;
          r.relics.push('flameHeart','mask','sixBless');
          DC.Game.spawnsFor=()=>[DC.ENEMIES[2][2], DC.ENEMIES[2][1]]; DC.Game.startCombat('combat'); }""")
        page.wait_for_timeout(400)
        page.evaluate("""() => { const c=DC.Game.state.combat; c.combo=3; c.multBonus=0.5; c.block=8; c.sparks=2;
          c.hand.forEach((h,i)=>{ h.v=Math.min(6, 2+i); });
          c.enemies[0].st.burn=3; c.enemies[1].st.vuln=2;
          c.chainLog=[{k:'slash',v:4,skill:'강타'},{k:'mult',v:2,skill:'증폭'},{k:'fire',v:5,skill:'유성'}];
          DC.Game.state.ui.sel=0; DC.UI.render(); }""")
        page.wait_for_timeout(250); snap(page, tag + "combat")
        page.evaluate("""() => { DC.Game.state.ui.sel=null; DC.Game.state.ui.reward={gold:38, options:DC.Game.makeRewardOptions(3), boss:false};
          DC.Game.state.screen='reward'; DC.Game.state.combat=null; DC.UI.render(); }""")
        page.wait_for_timeout(250); snap(page, tag + "reward")
        page.evaluate("""() => { DC.Game.state.ui.reward=null; DC.Game.state.screen='event';
          const ev=DC.EVENTS.find(e=>e.id==='cursedSword'); DC.Game.state.ui.event={def:ev,text:ev.text,node:null,result:null,after:null}; DC.UI.render(); }""")
        page.wait_for_timeout(250); snap(page, tag + "event")
        page.evaluate("() => { DC.Game.state.ui.event=null; DC.Game.openShop(null); }")
        page.wait_for_timeout(250); snap(page, tag + "shop")
        page.evaluate("() => { DC.Game.state.ui.shop=null; DC.Game.state.screen='title'; DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
        page.wait_for_timeout(250); snap(page, tag + "codex")
        print(tag or "mobile", "errors", errors[:4])
        b.close()
