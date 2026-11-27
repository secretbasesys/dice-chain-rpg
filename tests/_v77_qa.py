import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
OUT = "/workspace/work/dice-rpg/tests/_shots"

def rep(page, tag):
    r = layout_report(page)
    bad = [x for x in r["offscreen"] if x["tag"] not in ("svg", "path", "line")]
    print(tag, "overflowX=%s offscreen=%d" % (r["overflowX"], len(bad)))
    if bad: print("   ", json.dumps(bad)[:300])

for (w, h, mob, tag) in [(360, 640, True, "q36"), (390, 844, True, "q39"), (1280, 800, False, "q12")]:
    with sync_playwright() as p:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(350); no_save(page)
        page.screenshot(path=f"{OUT}/{tag}_title.png"); rep(page, tag + " title")
        page.evaluate("() => DC.Game.newRun()"); page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/{tag}_class.png"); rep(page, tag + " class")
        page.evaluate("""() => { DC.Game.pickClass('gambler'); const r=DC.Game.state.run;
          r.map.current=r.map.grid[0][0]; r.cleared.push(r.map.grid[0][0]); DC.UI.render(); }""")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{OUT}/{tag}_map.png"); rep(page, tag + " map")
        page.evaluate("""() => { const r=DC.Game.state.run; r.act=3; r.hp=52; r.gold=210;
          r.relics.push('flameHeart','mask','sixBless','vampireFang','hourglass');
          DC.Game.spawnsFor=()=>[DC.BOSSES[3], DC.ENEMIES[3][1]];
          DC.Game.startCombat('boss'); }""")
        page.wait_for_timeout(500)
        page.screenshot(path=f"{OUT}/{tag}_combat.png"); rep(page, tag + " combat")
        page.evaluate("""() => { const s=DC.Game.state; s.ui.sel=0; DC.UI.render(); }""")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_combat_sel.png"); rep(page, tag + " combat_sel")
        # reward (normal) + boss
        page.evaluate("""() => { const s=DC.Game.state; s.combat=null; s.ui.sel=null; s.screen='reward';
          s.ui.reward={gold:41, options:DC.Game.makeRewardOptions(3), boss:false}; DC.UI.render(); }""")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{OUT}/{tag}_reward.png"); rep(page, tag + " reward")
        page.evaluate("""() => { const s=DC.Game.state; s.ui.reward={gold:133, options:DC.Game.makeRewardOptions(4), boss:true}; DC.UI.render(); }""")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{OUT}/{tag}_reward_boss.png"); rep(page, tag + " reward_boss")
        # codex locked
        page.evaluate("() => { const s=DC.Game.state; s.ui.reward=null; s.screen='title'; s.ui.modal='codex'; DC.UI.render(); }")
        page.wait_for_timeout(350)
        page.screenshot(path=f"{OUT}/{tag}_codex.png"); rep(page, tag + " codex")
        for idx, sec in enumerate(["적", "이벤트"]):
            page.evaluate("""(sec) => { const p=document.querySelector('.codex-panel');
              const hs=[...p.querySelectorAll('h4')]; const h=hs.find(x=>x.textContent.includes(sec)); p.scrollTop=h.offsetTop-12; }""", sec)
            page.wait_for_timeout(220)
            page.screenshot(path=f"{OUT}/{tag}_codex_{idx}.png")
        # unlocked codex: seed meta seen
        page.evaluate("""() => { const m=DC.Meta.get();
          m.seen.dice=DC.DICE_IDS.slice(0,14); m.seen.relics=DC.RELIC_IDS.slice(0,12);
          m.seen.enemies=DC.ENEMIES[1].map(e=>e.id); m.seen.events=DC.EVENTS.slice(0,6).map(e=>e.id);
          DC.Meta.save && DC.Meta.save(m); DC.UI.render(); }""")
        page.wait_for_timeout(350)
        page.screenshot(path=f"{OUT}/{tag}_codex_unlocked.png"); rep(page, tag + " codex_unlocked")
        page.evaluate("() => { DC.Game.state.ui.modal=null; DC.Game.state.screen='title'; DC.UI.render(); }")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{OUT}/{tag}_title_unlocked.png")
        print(tag, "ERRORS", errors[:8])
        b.close()
