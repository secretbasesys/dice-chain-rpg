"""v4.4 — boss relic choice: screen, effects, shop freebie, codex, desktop."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null; }""")

    # --- screen content ---
    print("boss relic count:", page.evaluate("() => DC.BOSS_RELIC_IDS.length"),
          "pool excludes:", page.evaluate("() => DC.POOL_RELIC_IDS.indexOf('bloodPact')"),
          "total relics:", page.evaluate("() => DC.RELIC_IDS.length"))

    # --- effects ---
    out = page.evaluate("""() => {
      const R = {};
      const mk = (relics) => {
        const s = DC.Game.state;
        s.run.relics = relics.slice();
        s.run.dice = DC.CLASSES.warrior.startDice.map(d => DC.Dice.make(d));
        const c = DC.Combat.create(s.run, [DC.ENEMIES[1][0]], 'combat');
        return c;
      };
      let c = mk([]);
      R.baseHand = c.hand.length; R.baseSparks = c.maxSparks;
      let c2 = mk(['eyeOfFate']);
      R.eyeHand = c2.hand.length;
      let c3 = mk(['warDrum']);
      R.drumSparks = c3.maxSparks;
      R.drumBlock = DC.Combat.gainBlockTest ? 0 : null;
      let c4 = mk(['rupture']);
      R.ruptureSparks = c4.maxSparks;
      let c5 = mk(['timeLoop']);
      R.loopFree = c5.freeRerolls;
      // rupture combo cap: play 10 links
      const c6 = mk(['rupture']);
      c6.combo = 12; c6.multBonus = 0;
      R.ruptureCap = DC.Combat.nextMult ? null : null;
      // damage compare: same die value, no combo
      const setup = (relics) => {
        const cc = mk(relics);
        cc.hand = [{ uid: 'h1', dieIdx: 0, fi: 0, k: 'slash', v: 6, baseV: 6, used: false, locked: false, phantom: false }];
        cc.enemies[0].hp = 999; cc.enemies[0].maxHp = 999; cc.enemies[0].block = 0;
        cc.combo = 0;
        const before = cc.enemies[0].hp;
        DC.Combat.play(cc, 0, 0);
        return before - cc.enemies[0].hp;
      };
      R.dmgBase = setup([]);
      R.dmgBlood = setup(['bloodPact']);
      R.dmgGlass = setup(['glassCannon']);
      // incoming damage: glass cannon
      const hp1 = (() => { const cc = mk([]); cc.hp = 60; cc.maxHp = 60; cc.block = 0; cc.statuses.vuln = 0;
        const ev = []; cc.enemies[0].intents = [{k:'attack', v:10}]; cc.enemies[0].intentIdx = 0;
        DC.Combat.endTurn(cc); return 60 - cc.hp; })();
      const hp2 = (() => { const cc = mk(['glassCannon']); cc.hp = 60; cc.maxHp = 60; cc.block = 0; cc.statuses.vuln = 0;
        cc.enemies[0].intents = [{k:'attack', v:10}]; cc.enemies[0].intentIdx = 0;
        DC.Combat.endTurn(cc); return 60 - cc.hp; })();
      R.inBase = hp1; R.inGlass = hp2;
      return R;
    }""")
    print(json.dumps(out))

    # --- chain cap check via mult function through preview ---
    cap = page.evaluate("""() => {
      const s = DC.Game.state;
      const mk = (relics) => { s.run.relics = relics.slice(); return DC.Combat.create(s.run, [DC.ENEMIES[1][0]], 'combat'); };
      const a = mk([]); a.combo = 20;
      const b2 = mk(['rupture']); b2.combo = 20;
      const c3 = mk(['mask']); c3.combo = 20;
      // nextMult exposes mult at combo+1
      return { base: DC.Combat.nextMult(a), rupture: DC.Combat.nextMult(b2), mask: DC.Combat.nextMult(c3) };
    }""")
    print("cap:", cap)

    # --- shop freebie ---
    shop = page.evaluate("""() => {
      const s = DC.Game.state; s.run.relics = ['gildedIdol']; s.run.gold = 10;
      DC.Game.openShop({type:'shop'});
      const sh = s.ui.shop; const before = s.run.gold;
      DC.Game.buy(0);
      const it = sh.items[0];
      return { free: sh.free, goldSame: s.run.gold === before, sold: !!it.sold, kind: it.kind };
    }""")
    print("shop:", shop)

    # --- maxHp penalties on acquire ---
    hp = page.evaluate("""() => {
      const s = DC.Game.state; s.run.maxHp = 68; s.run.hp = 68; s.run.relics = [];
      DC.Game.addRelic('bloodPact');
      return { maxHp: s.run.maxHp, hp: s.run.hp, relics: s.run.relics.slice() };
    }""")
    print("bloodPact hp:", hp)

    # --- soulHarvest win growth + gold cut ---
    sh = page.evaluate("""() => {
      const s = DC.Game.state; s.run.relics = ['soulHarvest']; s.run.maxHp = 50; s.run.hp = 50; s.run.gold = 0;
      s.run.dice = DC.CLASSES.warrior.startDice.map(d => DC.Dice.make(d));
      DC.Game.startCombat('combat');
      const c = s.combat; c.enemies.forEach(e => { e.hp = 0; e.dead = true; }); c.hp = 50;
      DC.Game.combatWon();
      return { maxHp: s.run.maxHp, hp: s.run.hp, gold: s.run.gold, screen: s.screen };
    }""")
    print("soulHarvest:", sh)

    # --- codex shows boss relics ---
    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    print("codex boss tags:", page.evaluate("() => document.querySelectorAll('.cx-relic.boss').length"))
    page.evaluate("() => { DC.Game.state.ui.modal=null; }")

    # --- bossrelic screen layout at 3 sizes (same browser) ---
    for (w, h, mob) in [(390, 844, True), (1280, 800, False)]:
        ctx2 = b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob)
        pg = ctx2.new_page(); e2 = []
        pg.on("pageerror", lambda e: e2.append(str(e)))
        pg.goto(BASE); pg.wait_for_timeout(250)
        pg.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null;
          DC.Game.takeGift(0); DC.Game.state.ui.modal=null; DC.Game.state.run.act=2; DC.Game.openBossRelic(); }""")
        pg.wait_for_timeout(250)
        rep = layout_report(pg)
        print(w, "overflowX", rep["overflowX"], "offscreen", len(rep["offscreen"]), "small", len(rep["smallTargets"]), "err", e2[:2])
        shot(pg, "bossrelic_%d" % w)
        ctx2.close()

    print("errors:", errors[:6])
    b.close()
