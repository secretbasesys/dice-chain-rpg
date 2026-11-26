import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="challenge"]'); page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v19_challenge.png")
    print("cards:", page.evaluate("() => document.querySelectorAll('.ch-card').length"))
    page.click('[data-act="pickchallenge"][data-id="glass"]'); page.wait_for_timeout(250)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    page.click('[data-act="closetut"]'); page.wait_for_timeout(300)
    print("run:", page.evaluate("() => { const r=DC.Game.state.run; return {ch:r.challenge, hp:r.maxHp, cmod:r.cmod}; }"))
    page.screenshot(path=OUT + "/v19_map.png")
    # damage multiplier check
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat');
      const c = DC.Game.state.combat; c.hand.forEach((h,i)=>{h.k='slash';h.v=4;});
      const before=c.enemies[0].hp; DC.Combat.play(c,0,0); window.__d = before - c.enemies[0].hp; }""")
    print("dmg (4*1.6*1.3≈8):", page.evaluate("() => window.__d"))
    # enemy hp reduction for frenzy
    page.evaluate("""() => { const s=DC.Game.state; s.combat=null; s.run.challenge='frenzy'; s.run.cmod={ehp:-0.15,eatk:0.25};
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    print("frenzy enemy hp (28*1.26*0.85≈30?):", page.evaluate("() => DC.Game.state.combat.enemies[0].maxHp"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
