import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(350)
    # audio context only after gesture
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    print("music(title):", page.evaluate("() => DC.AudioMusic.current()"))
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(500)
    print("music(map):", page.evaluate("() => DC.AudioMusic.current()"))
    page.evaluate("() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }")
    page.wait_for_timeout(400)
    print("music(combat):", page.evaluate("() => DC.AudioMusic.current()"))
    # play a skill and open log
    page.evaluate("""() => { const c = DC.Game.state.combat;
      c.hand.forEach((h,i)=>{ h.k='slash'; h.v=5; });
      DC.Combat.play(c,0,0); DC.Combat.endTurn(c); DC.Combat.play(c,0,0);
      DC.Game.state.ui.logOpen = true; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v16b_log.png")
    print("log rows:", page.evaluate("() => document.querySelectorAll('.bl-row').length"))
    print("music after:", page.evaluate("() => DC.AudioMusic.current()"))
    # boss music
    page.evaluate("""() => { DC.Game.state.run.act=1; DC.Game.spawnsFor = () => [DC.BOSSES[1]];
      DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(300)
    print("music(boss):", page.evaluate("() => DC.AudioMusic.current()"))
    page.screenshot(path=OUT + "/v16_boss.png")
    # mute toggles music
    page.evaluate("() => { DC.Audio.setMuted(true); }")
    page.wait_for_timeout(200)
    print("muted ok")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
