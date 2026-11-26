import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    out = page.evaluate("""() => {
      const s = DC.Game.state;
      s.run.act = 1;
      s.ui.reward = { gold: 20, boss: true, options: [{kind:'forge', name:'단조 도구', desc:'', ic:'anvil', c:'#fb923c'}] };
      s.screen = 'reward'; DC.UI.render();
      DC.Game.takeReward(0);
      const mid = { screen: s.screen, bossAfter: s.ui.forge && s.ui.forge.bossAfter };
      DC.Game.forgeExit();
      return { mid: mid, after: { screen: s.screen, act: s.run.act, bossRelic: !!s.ui.bossRelic } };
    }""")
    print(json.dumps(out))
    # also check event with empty result cannot loop
    ev = page.evaluate("""() => {
      const s = DC.Game.state; const d = DC.EVENTS.find(e => e.id === 'forgeSpirit');
      s.screen = 'event'; s.ui.event = { def: d, text: d.text, node: null, result: null }; DC.UI.render();
      const before = s.run.gold;
      DC.Game.choice(0);
      return { result: s.ui.event.result, after: s.ui.event.after, gold: [before, s.run.gold] };
    }""")
    print(json.dumps(ev))
    print("errors", errors[:3])
    b.close()
