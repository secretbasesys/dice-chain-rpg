import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    print("enemies:", page.evaluate("() => [1,2,3].map(a=>DC.ENEMIES[a].length).join('/')"), "relics:", page.evaluate("() => DC.RELIC_IDS.length"), "dice:", page.evaluate("() => DC.DICE_IDS.length"), "events:", page.evaluate("() => DC.EVENTS.length"))
    # spawn new enemies
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][5], DC.ENEMIES[2][5]];
      DC.Game.state.run.act = 2; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(400)
    page.screenshot(path=OUT + "/v18_newenemies.png")
    # relic hooks
    out = page.evaluate("""() => { const s = DC.Game.state; s.combat = null;
      s.run.relics = ['vanguard','duelist','thornMail','miser'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
      DC.Game.startCombat('combat');
      const c = s.combat; c.hand.forEach((h,i)=>{h.k='slash';h.v=5;});
      const before = c.enemies[0].hp;
      DC.Combat.play(c,0,0);
      const afterFirst = c.enemies[0].hp;
      DC.Combat.endTurn(c);
      return {firstHit: before-afterFirst, enemyHpAfterPhase: c.enemies[0].hp, maxHp:c.enemies[0].maxHp}; }""")
    print("relics:", json.dumps(out))
    # new event art
    page.evaluate("""() => { DC.Game.state.screen='event';
      const ev = DC.EVENTS.find(e=>e.id==='lighthouse');
      DC.Game.state.ui.event={def:ev,text:ev.text,node:{},result:null}; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/v18b_event.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
