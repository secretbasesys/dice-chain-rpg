import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "gambler")
    page.wait_for_timeout(600)
    shot(page, "v14d_map_390")
    # reward with relic card
    page.evaluate("""() => {
      DC.Game.state.screen = 'reward';
      DC.Game.state.ui.reward = { gold: 34, options: [
        { kind:'relic', id:'flameHeart', name:DC.RELICS.flameHeart.name, desc:DC.RELICS.flameHeart.desc, ic:'flame', c:'#ff9f43', kindLabel:'유물' },
        { kind:'die', id:'storm', name:DC.DICE.storm.name, desc:'번개 면이 많은 주사위', faces:DC.DICE.storm.faces, c:'#ffe066', ic:'bolt', kindLabel:'주사위' }
      ]};
      DC.UI.render();
    }""")
    page.wait_for_timeout(300)
    shot(page, "v14d_reward_390")
    # shop with relic
    page.evaluate("""() => {
      DC.Game.state.ui.reward = null;
      DC.Game.state.screen = 'shop';
      DC.Game.state.ui.shop = { items: [
        { kind:'relic', id:'karma', name:DC.RELICS.karma.name, desc:DC.RELICS.karma.desc, price:120, ic:'mult', c:DC.RELICS.karma.c },
        { kind:'relic', id:'hourglass', name:DC.RELICS.hourglass.name, desc:DC.RELICS.hourglass.desc, price:95, ic:'clock', c:DC.RELICS.hourglass.c },
        { kind:'die', id:'storm', name:DC.DICE.storm.name, desc:'번개 면 3개', price:80, ic:'bolt', c:'#ffe066', faces:DC.DICE.storm.faces }
      ], node: {} };
      DC.UI.render();
    }""")
    page.wait_for_timeout(300)
    shot(page, "v14d_shop_390")
    # event 2
    page.evaluate("""() => {
      DC.Game.state.screen = 'event';
      const ev = DC.EVENTS[4];
      DC.Game.state.ui.event = { def: ev, text: ev.text, node: {}, result: null };
      DC.UI.render();
    }""")
    page.wait_for_timeout(250)
    shot(page, "v14d_event2_390")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
