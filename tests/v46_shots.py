"""v4.6 screenshots + paladin UI checks."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    for (w, h, mob, tag) in [(390, 844, True, ""), (1280, 800, False, "desktop_")]:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); }")
        page.wait_for_timeout(250)
        page.evaluate("""() => { const list = document.querySelector('.class-list'); if (list) list.scrollTop = list.scrollHeight; }""")
        page.wait_for_timeout(150)
        shot(page, tag + "class5")
        page.evaluate("""() => { DC.Game.pickClass('paladin'); DC.Game.state.ui.modal=null;
          if (DC.Game.state.screen === 'gift') DC.Game.takeGift(0); DC.Game.state.ui.modal = null; }""")
        page.wait_for_timeout(250)
        page.evaluate("""() => { const s = DC.Game.state; s.run.relics = ['wrist'];
          DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat');
          const c = s.combat;
          c.hand = [
            {uid:'a',dieIdx:0,fi:0,k:'holy',v:4,baseV:4,used:false,locked:false,phantom:false},
            {uid:'b',dieIdx:1,fi:0,k:'guard',v:5,baseV:5,used:false,locked:false,phantom:false},
            {uid:'c',dieIdx:2,fi:0,k:'slash',v:3,baseV:3,used:false,locked:false,phantom:false},
            {uid:'d',dieIdx:3,fi:0,k:'holy',v:6,baseV:6,used:false,locked:false,phantom:false}
          ];
          c.verdict = 3; c.block = 12;
          DC.UI.render(); }""")
        page.wait_for_timeout(250)
        print(tag or "mobile", "vchip:", page.evaluate("() => { const e=document.querySelector('.vchip'); return e ? e.textContent : 'none'; }"))
        shot(page, tag + "paladin")
        page.evaluate("() => { DC.Game.state.ui.modal='deck'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        shot(page, tag + "paladin_deck")
        print(tag or "mobile", "layout", json.dumps(layout_report(page))[:140], "err", errors[:3])
        b.close()
