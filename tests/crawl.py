import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

ISSUES = []

def check(page, name, errors, tag):
    lay = layout_report(page)
    if lay['overflowX'] or lay['offscreen'] or lay['smallTargets']:
        ISSUES.append({tag: name, 'lay': lay})
    if errors:
        ISSUES.append({tag: name + ':errors', 'err': errors[:4]})
    return lay

for W,H,mob in [(390,844,True),(360,640,True),(1280,800,False)]:
    with sync_playwright() as p:
        b,ctx,page,errors=launch(p,W,H,mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("() => localStorage.clear()")
        page.reload(); page.wait_for_timeout(300)
        tag = f"{W}x{H}"
        check(page, "title", errors, tag)
        # modals
        for modal in ['codex','history','challenge']:
            page.evaluate(f"() => {{ DC.Game.state.ui.modal='{modal}'; DC.UI.render(); }}")
            page.wait_for_timeout(200)
            check(page, modal, errors, tag)
        page.evaluate("() => { DC.Game.state.ui.modal=null; DC.Game.newRun(); DC.UI.render(); }")
        page.wait_for_timeout(200)
        check(page, "class", errors, tag)
        page.evaluate("() => { DC.Game.pickClass('alchemist'); }")
        page.wait_for_timeout(300)
        page.evaluate("() => { DC.Game.state.ui.modal=null; DC.UI.render(); }")
        page.wait_for_timeout(200)
        check(page, "map", errors, tag)
        # combat
        page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][5]]; DC.Game.startCombat('combat'); }""")
        page.wait_for_timeout(300)
        check(page, "combat", errors, tag)
        # reward
        page.evaluate("""() => { const s=DC.Game.state; s.combat=null; s.screen='reward';
          s.ui.reward={gold:40, options: DC.Game.makeRewardOptions(4), boss:false}; DC.UI.render(); }""")
        page.wait_for_timeout(250)
        check(page, "reward", errors, tag)
        # forge
        page.evaluate("() => { DC.Game.state.ui.reward=null; DC.Game.openForge(2, null); }")
        page.wait_for_timeout(250)
        check(page, "forge", errors, tag)
        # shop
        page.evaluate("() => { DC.Game.state.run.gold=200; DC.Game.openShop({}); }")
        page.wait_for_timeout(250)
        check(page, "shop", errors, tag)
        # rest
        page.evaluate("() => { DC.Game.state.screen='rest'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        check(page, "rest", errors, tag)
        # event
        page.evaluate("""() => { const ev=DC.EVENTS[1]; DC.Game.state.screen='event';
          DC.Game.state.ui.event={def:ev,text:ev.text,node:{},result:null}; DC.UI.render(); }""")
        page.wait_for_timeout(200)
        check(page, "event", errors, tag)
        # deck/help/skills
        for modal in ['deck','help']:
            page.evaluate(f"() => {{ DC.Game.state.ui.modal='{modal}'; DC.UI.render(); }}")
            page.wait_for_timeout(200)
            check(page, modal, errors, tag)
        page.evaluate("""() => { DC.Game.state.ui.modal=null; DC.Game.state.screen='combat'; DC.Game.state.combat=null;
          DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); DC.Game.openSkills(false); }""")
        page.wait_for_timeout(200)
        check(page, "skills", errors, tag)
        # win/lose
        page.evaluate("() => { DC.Game.state.ui.modal=null; DC.Game.state.screen='win'; DC.Game.state.ui.winInfo={unlocked:true,level:2}; DC.UI.render(); }")
        page.wait_for_timeout(200)
        check(page, "win", errors, tag)
        page.evaluate("() => { DC.Game.state.screen='gameover'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        check(page, "lose", errors, tag)
        b.close()

print("ISSUES", len(ISSUES))
for i in ISSUES[:20]:
    print(json.dumps(i, ensure_ascii=False)[:400])
