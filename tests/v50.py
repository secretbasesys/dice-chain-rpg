"""v5.0 — abyss anomalies, history summary, thorn dedupe."""
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

    print("rules:", page.evaluate("() => DC.ABYSS_RULES.length"))

    tests = page.evaluate("""() => {
      const s = DC.Game.state; const out = {};
      const mk = (rule) => {
        s.run.abyss = rule; s.run.relics = [];
        s.run.dice = DC.CLASSES.warrior.startDice.map(d => DC.Dice.make(d));
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
        DC.Game.startCombat('combat');
        return s.combat;
      };
      const pick = (id) => DC.ABYSS_RULES.find(r => r.id === id);
      // hp +10%
      let c = mk(pick('gluttony'));
      out.gluttonyHp = [c.enemies[0].maxHp];
      // silence: hp -12%, atk +15%
      c = mk(pick('silence'));
      out.silenceHp = c.enemies[0].maxHp;
      out.silenceIntent = DC.Combat.intentOf(c.enemies[0]).v;
      c = mk(null);
      out.baseHp = c.enemies[0].maxHp;
      out.baseIntent = DC.Combat.intentOf(c.enemies[0]).v;
      // rift: sparks +1, taken +20%
      c = mk(pick('rift'));
      out.riftSparks = [DC.CLASSES.warrior.sparks, c.sparks];
      // echo: free reroll 1
      c = mk(pick('echo'));
      out.echoFree = c.freeRerolls;
      // famine: dmg +20%
      const dmg = (rule) => { const cc = mk(rule); cc.combo = 0;
        cc.hand = [{uid:'a',dieIdx:0,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false}];
        cc.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
        const b = cc.enemies[0].hp; DC.Combat.play(cc, 0, 0); return b - cc.enemies[0].hp; };
      out.dmgBase = dmg(null); out.dmgFamine = dmg(pick('famine'));
      s.run.abyss = null;
      return out;
    }""")
    print("abyss effects:", json.dumps(tests))

    # map chip + deep screen
    page.evaluate("""() => { const s = DC.Game.state; s.run.act = 3; s.run.abyss = DC.ABYSS_RULES[2];
      DC.Game.goMap(); }""")
    page.wait_for_timeout(250)
    print("map chip:", page.evaluate("() => { const e = document.querySelector('.abyss-chip'); return e ? e.textContent : 'none'; }"))
    shot(page, "abyss_map")
    page.evaluate("() => { const s = DC.Game.state; s.screen='deep'; s.ui.deep={act:3}; DC.UI.render(); }")
    page.wait_for_timeout(200)
    shot(page, "abyss_deep")

    # history summary
    page.evaluate("""() => { const m = DC.Meta.get(); m.history = [
        {t: Date.now()-5000, cls:'warrior', asc:0, win:true, act:3, kills:20, dmg:2400, maxCombo:6, gold:120, dice:[], relics:[]},
        {t: Date.now()-9000, cls:'paladin', asc:2, win:false, act:2, kills:9, dmg:900, maxCombo:4, gold:40, dice:[], relics:[]},
        {t: Date.now()-12000, cls:'mage', asc:0, win:true, act:4, kills:26, dmg:3100, maxCombo:5, gold:80, dice:[], relics:[]}];
        m.wins = 2; m.bestDepth = 4; m.bestCombo = 6; DC.Meta.save(); DC.Game.state.ui.modal='history'; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    print("summary:", page.evaluate("() => { const e = document.querySelector('.hist-sum'); return e ? e.textContent.slice(0, 80) : 'none'; }"))
    shot(page, "history_v50")

    # thorn mail no longer double-hits
    thorn = page.evaluate("""() => { const s = DC.Game.state; s.run.abyss = null; s.run.relics = ['thornMail'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat');
      const c = s.combat; c.enemies[0].hp = 200; c.enemies[0].maxHp = 200; c.enemies[0].block = 0;
      c.enemies[0].intents = [{k:'defend', v:1}]; c.enemies[0].intentIdx = 0;
      const before = c.enemies[0].hp;
      DC.Combat.endTurn(c);
      return { dmg: before - c.enemies[0].hp }; }""")
    print("thornMail per enemy turn (expect 4):", thorn)
    print("errors:", errors[:4])
    b.close()
