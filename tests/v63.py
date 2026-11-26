"""v6.3 — 3 new relics: effects + shop discount."""
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
    print("relics:", page.evaluate("() => DC.RELIC_IDS.length"))

    eff = page.evaluate("""() => {
      const s = DC.Game.state; const out = {};
      const mk = (relics, hp) => { s.run.relics = relics.slice(); s.run.hp = hp || s.run.maxHp;
        s.run.dice = DC.CLASSES.warrior.startDice.map(d => DC.Dice.make(d));
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); return s.combat; };
      let c = mk(['clockwork']);
      out.clockBlock = c.block;
      c = mk(['bloodRite'], 50);
      out.blood = { hp: c.hp, sparks: c.sparks, max: c.maxSparks };
      // shop discount for relics
      s.run.relics = ['collector']; s.run.gold = 500; s.run.act = 2;
      DC.Game.openShop({type:'shop'});
      const relicsA = s.ui.shop.items.filter(i => i.kind === 'relic').map(i => i.price);
      s.run.relics = [];
      DC.Game.openShop({type:'shop'});
      const relicsB = s.ui.shop.items.filter(i => i.kind === 'relic').map(i => i.price);
      out.prices = { withCollector: relicsA, without: relicsB };
      return out;
    }""")
    print("effects:", json.dumps(eff))
    # art renders
    page.evaluate("() => { document.getElementById('app').innerHTML = '<div style=\"display:flex;gap:12px;padding:20px;background:#0b1220\">' + ['clockwork','collector','bloodRite'].map(id => '<div style=\"color:'+DC.RELICS[id].c+'\">'+DC.relicArt(id,'relic-art')+'</div>').join('') + '</div>'; }")
    page.wait_for_timeout(150)
    page.screenshot(path=OUT + "/relics_v63.png")
    print("errors:", errors[:4])
    b.close()
