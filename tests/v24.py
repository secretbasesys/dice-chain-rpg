import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    # start a seeded, challenge run and travel
    page.fill('#seed-input','resume1'); page.wait_for_timeout(120)
    page.evaluate("() => { DC.Game.state.ui.challenge='greed'; }")
    page.click('[data-act="newrun"]'); page.wait_for_timeout(200)
    page.click('[data-act="pickclass"][data-id="mage"]'); page.wait_for_timeout(350)
    try: page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    except Exception: pass
    page.evaluate("""() => { const r=DC.Game.state.run; r.gold=177; r.hp=44;
      r.relics.push('flameHeart'); r.dice.push(DC.Dice.make('storm'));
      const nid=DC.MapGen.available(r.map)[0]; r.map.current=nid; r.cleared.push(nid);
      DC.Game.state.screen='map'; DC.Game.save(); }""")
    page.wait_for_timeout(200)
    before = page.evaluate("() => { const r=DC.Game.state.run; return {hp:r.hp,gold:r.gold,act:r.act,dice:r.dice.length,relics:r.relics.slice(),seed:r.seed,ch:r.challenge,cur:r.map.current,cleared:r.cleared.length}; }")
    print("before:", json.dumps(before, ensure_ascii=False))
    page.reload(); page.wait_for_timeout(400)
    print("has resume btn:", page.evaluate("() => !!document.querySelector('[data-act=resume]')"))
    page.click('[data-act="resume"]'); page.wait_for_timeout(400)
    after = page.evaluate("() => { const r=DC.Game.state.run; return {hp:r.hp,gold:r.gold,act:r.act,dice:r.dice.length,relics:r.relics.slice(),seed:r.seed,ch:r.challenge,cur:r.map.current,cleared:r.cleared.length,screen:DC.Game.state.screen}; }")
    print("after:", json.dumps(after, ensure_ascii=False))
    print("match:", {k: before.get(k)==after.get(k) for k in before})
    # clear save on death
    page.evaluate("() => { DC.Game.state.run.hp=1; DC.Game.combatLost(); }")
    page.wait_for_timeout(200)
    print("save cleared:", page.evaluate("() => !localStorage.getItem('dicechain.save.v2') && !localStorage.getItem('dicechain.save.v1')"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
