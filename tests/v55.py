"""v5.5 — 3 new dice, 2 new events, new SFX."""
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
    print("counts: dice", page.evaluate("() => DC.DICE_IDS.length"), "events", page.evaluate("() => DC.EVENTS.length"))

    # dice appear in shop pool at right tier and render faces
    d = page.evaluate("""() => {
      const s = DC.Game.state; s.run.act = 3; s.run.gold = 999;
      DC.Game.openShop({type:'shop'});
      const shop = s.ui.shop.items.map(i => i.name);
      const info = ['tide','cinder','oracle'].map(id => ({ id: id, tier: DC.DICE[id].tier, price: DC.DICE[id].price, faces: DC.DICE[id].faces.length }));
      s.ui.modal = 'deck'; DC.UI.render();
      return { shop: shop, info: info };
    }""")
    print(json.dumps(d))
    page.evaluate("() => { DC.Game.state.ui.modal = null; }")

    for eid in ['caravan', 'statue']:
        page.evaluate("""(eid) => { const s = DC.Game.state; const d = DC.EVENTS.find(e => e.id === eid);
          s.screen = 'event'; s.ui.event = { def: d, text: d.text, node: null, result: null }; DC.UI.render(); }""", eid)
        page.wait_for_timeout(220)
        shot(page, "ev_" + eid)
        before = page.evaluate("() => ({hp: DC.Game.state.run.hp, gold: DC.Game.state.run.gold, relics: DC.Game.state.run.relics.length, dice: DC.Game.state.run.dice.length, spark: DC.Game.state.run.extraSpark||0})")
        page.click('[data-act="choice"][data-i="0"]'); page.wait_for_timeout(320)
        after = page.evaluate("() => ({hp: DC.Game.state.run.hp, gold: DC.Game.state.run.gold, relics: DC.Game.state.run.relics.length, dice: DC.Game.state.run.dice.length, spark: DC.Game.state.run.extraSpark||0, res: DC.Game.state.ui.event.result.slice(0,26)})")
        print(eid, before, "->", after)
        page.click('[data-act="leave"]'); page.wait_for_timeout(200)

    # events reachable through mystery nodes (pool check)
    print("event ids:", page.evaluate("() => DC.EVENTS.map(e => e.id).join(',')"))
    print("errors:", errors[:4])
    b.close()
