import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

def state(page, name):
    page.screenshot(path=OUT + "/" + name)
    return layout_report(page)

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "warrior"); page.wait_for_timeout(600)
    page.evaluate("() => DC.UI.clearToast()")
    page.wait_for_timeout(200)
    l1 = state(page, "map.png")
    print("390", json.dumps(l1))
    # event
    page.evaluate("""() => { const ev = DC.EVENTS[8]; DC.Game.state.screen='event';
      DC.Game.state.ui.event={def:ev,text:ev.text,node:{},result:null}; DC.UI.render(); }""")
    page.wait_for_timeout(300); page.screenshot(path=OUT + "/event.png")
    # shop
    page.evaluate("""() => { DC.Game.state.screen='shop'; DC.Game.state.ui.shop={items:[
      {kind:'relic',id:'karma',name:DC.RELICS.karma.name,desc:DC.RELICS.karma.desc,price:120,ic:'mult',c:DC.RELICS.karma.c},
      {kind:'relic',id:'hourglass',name:DC.RELICS.hourglass.name,desc:DC.RELICS.hourglass.desc,price:95,ic:'clock',c:DC.RELICS.hourglass.c},
      {kind:'die',id:'storm',name:DC.DICE.storm.name,desc:'번개 면 3개',price:80,ic:'bolt',c:'#ffe066',faces:DC.DICE.storm.faces}],node:{}};
      DC.UI.render(); }""")
    page.wait_for_timeout(250); page.screenshot(path=OUT + "/shop.png")
    print("390 ERR", json.dumps(errors, ensure_ascii=False))
    b.close()

    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "mage"); page.wait_for_timeout(600)
    page.evaluate("() => DC.UI.clearToast()")
    print("360", json.dumps(state(page, "map_360.png")))
    print("360 ERR", json.dumps(errors, ensure_ascii=False))
    b.close()

    b, ctx, page, errors = launch(p, 1280, 800)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "gambler"); page.wait_for_timeout(600)
    page.evaluate("() => DC.UI.clearToast()")
    print("DESK", json.dumps(state(page, "desktop_map.png")))
    print("DESK ERR", json.dumps(errors, ensure_ascii=False))
    b.close()
