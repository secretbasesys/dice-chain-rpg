import sys, json, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
OUT = "/workspace/work/dice-rpg/tests/_shots"

def full(page, tag):
    rep = layout_report(page)
    bad = [x for x in rep["offscreen"] if x["tag"] not in ("svg","path","line")]
    print(tag, "overflowX=%s offscreen=%d small=%s" % (rep["overflowX"], len(bad), [t for t in rep["smallTargets"]]))
    if bad: print("   ", json.dumps(bad)[:400])

for (w,h,mob,tag) in [(390,844,True,"m"), (1280,800,False,"d")]:
    with sync_playwright() as p:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(350)
        page.evaluate("() => localStorage.clear()")
        page.reload(); page.wait_for_timeout(300)
        page.screenshot(path=f"{OUT}/{tag}_title.png"); full(page, tag+" title")
        page.evaluate("() => DC.Game.newRun()"); page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_class.png"); full(page, tag+" class")
        page.evaluate("""() => { DC.Game.pickClass('gambler'); const r=DC.Game.state.run;
          r.map.current=r.map.grid[0][0]; r.cleared.push(r.map.grid[0][0]); DC.UI.render(); }""")
        page.wait_for_timeout(350)
        page.screenshot(path=f"{OUT}/{tag}_map.png"); full(page, tag+" map")
        # combat with boss + statuses
        page.evaluate("""() => { const r=DC.Game.state.run; r.act=3; r.hp=52; r.gold=210;
          r.relics.push('flameHeart','mask','sixBless','vampireFang','hourglass','merchant');
          DC.Game.spawnsFor=()=>[DC.BOSSES[3], DC.ENEMIES[3][1]];
          DC.Game.startCombat('boss'); }""")
        page.wait_for_timeout(400)
        page.evaluate("""() => { const c=DC.Game.state.combat; c.enemies[0].st.burn=4; c.enemies[0].st.vuln=2; c.enemies[1].st.poison=3;
          c.combo=3; c.multBonus=0.5; c.statuses.weak=1; c.block=6; c.chainLog=[{k:'slash',v:4,skill:'단검'},{k:'mult',v:2,skill:'증폭'},{k:'fire',v:5,skill:'유성'}];
          DC.UI.render(); }""")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_combat.png"); full(page, tag+" combat")
        page.evaluate("() => { const s=DC.Game.state; s.ui.sel=0; DC.UI.render(); }")
        page.wait_for_timeout(150)
        page.screenshot(path=f"{OUT}/{tag}_combat_sel.png"); full(page, tag+" combat_sel")
        page.evaluate("() => { DC.Game.state.ui.sel=null; DC.Game.state.ui.modal='deck'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_deck.png"); full(page, tag+" deck")
        page.evaluate("() => { DC.Game.state.ui.modal='help'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_help.png"); full(page, tag+" help")
        page.evaluate("() => { DC.Game.state.ui.modal=null; DC.Game.state.combat=null; DC.Game.openForge(2,null); }")
        page.wait_for_timeout(250)
        page.click('[data-act="fdiedie"][data-i="0"]'); page.wait_for_timeout(150)
        page.click('[data-act="fface"][data-i="1"]'); page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/{tag}_forge.png"); full(page, tag+" forge")
        page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openShop(null); }")
        page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/{tag}_shop.png"); full(page, tag+" shop")
        page.evaluate("""() => { DC.Game.state.ui.shop=null; DC.Game.state.screen='reward';
          DC.Game.state.ui.reward={gold:42, options:DC.Game.makeRewardOptions(3), boss:false}; DC.UI.render(); }""")
        page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/{tag}_reward.png"); full(page, tag+" reward")
        page.evaluate("() => { DC.Game.state.ui.reward=null; DC.Game.state.screen='rest'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_rest.png"); full(page, tag+" rest")
        page.evaluate("() => { DC.Game.state.screen='event'; DC.Game.state.ui.event={def:DC.EVENTS[0], text:DC.EVENTS[0].text, node:null}; DC.UI.render(); }")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_event.png"); full(page, tag+" event")
        page.evaluate("""() => { const r=DC.Game.state.run; r.stats={kills:31,turns:52,dmg:1580}; r.act=3;
          DC.Game.state.ui.event=null; DC.Game.state.screen='win'; DC.UI.render(); }""")
        page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/{tag}_win.png"); full(page, tag+" win")
        print(tag, "ERRORS", errors[:6])
        b.close()
