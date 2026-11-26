"""v6.4 — legendary dice + starfall event."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    print("dice/events:", page.evaluate("() => [DC.DICE_IDS.length, DC.EVENTS.length]"))
    # shop at act3 must be able to offer tier3
    shop = page.evaluate("""() => { const s = DC.Game.state; s.run.act = 3; s.run.gold = 999;
      const seen = {};
      for (let i = 0; i < 25; i++) { DC.Game.openShop({type:'shop'}); s.ui.shop.items.filter(x=>x.kind==='die').forEach(x => seen[x.id] = true); }
      return Object.keys(seen); }""")
    print("die ids seen in 25 shops:", shop)
    print("tier3 available:", page.evaluate("() => ['solar','abyssal'].map(id => DC.DICE[id].tier)"))

    for eid in ['starfall']:
        page.evaluate("""(eid) => { const s = DC.Game.state; const d = DC.EVENTS.find(e => e.id === eid);
          s.screen = 'event'; s.ui.event = { def: d, text: d.text, node: null, result: null }; DC.UI.render(); }""", eid)
        page.wait_for_timeout(250)
        shot(page, "ev_starfall")
        before = page.evaluate("() => ({hp: DC.Game.state.run.hp, maxHp: DC.Game.state.run.maxHp, gold: DC.Game.state.run.gold, dice: DC.Game.state.run.dice.length})")
        page.click('[data-act="choice"][data-i="1"]'); page.wait_for_timeout(300)
        after = page.evaluate("() => ({hp: DC.Game.state.run.hp, maxHp: DC.Game.state.run.maxHp, gold: DC.Game.state.run.gold, dice: DC.Game.state.run.dice.length, res: DC.Game.state.ui.event.result.slice(0,24)})")
        print(eid, before, "->", after)
    print("errors:", errors[:4])
    b.close()
