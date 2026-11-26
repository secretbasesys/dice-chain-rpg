"""v4.7 — new relics + 2 events: counts, effects, event flow, art, layouts."""
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

    print("counts:", page.evaluate("() => [DC.RELIC_IDS.length, DC.BOSS_RELIC_IDS.length, DC.EVENTS.length, DC.DRAFT_SKILLS.length]"))

    eff = page.evaluate("""() => {
      const s = DC.Game.state; const out = {};
      const mk = (relics) => { s.run.relics = relics.slice(); s.run.dice = DC.CLASSES.warrior.startDice.map(d=>DC.Dice.make(d));
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); return s.combat; };
      // sixGuard: roll a six via forced hand
      let c = mk(['sixGuard']);
      c.hand = [{uid:'a',dieIdx:0,fi:0,k:'slash',v:6,baseV:6,used:false,locked:false,phantom:false}];
      c.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
      DC.Combat.play(c, 0, 0);
      out.sixGuardBlock = c.block;
      // engine: first block skill gives +1 spark
      c = mk(['engine']);
      const sp0 = c.sparks;
      c.hand = [{uid:'a',dieIdx:0,fi:0,k:'guard',v:3,baseV:3,used:false,locked:false,phantom:false}];
      c.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
      DC.Combat.play(c, 0, 1);
      out.engineSpark = [sp0, c.sparks, !!c.engineUsed];
      // executioner: low hp target bonus
      const dmgTo = (relics, hpPct) => {
        const cc = mk(relics);
        cc.enemies[0].maxHp = 100; cc.enemies[0].hp = Math.round(100 * hpPct);
        cc.hand = [{uid:'a',dieIdx:0,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false}];
        cc.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
        cc.combo = 0;
        const before = cc.enemies[0].hp;
        DC.Combat.play(cc, 0, 0);
        return before - cc.enemies[0].hp;
      };
      out.execLow = dmgTo(['executioner'], 0.25);
      out.execHigh = dmgTo(['executioner'], 1);
      out.baseHigh = dmgTo([], 0.25);
      // pact: +2 max sparks, -6 max hp
      s.run.maxHp = 68; s.run.hp = 68; s.run.relics = [];
      DC.Game.addRelic('pact');
      out.pactHp = [s.run.maxHp, s.run.hp];
      c = mk(['pact']);
      out.pactSparks = c.maxSparks;
      return out;
    }""")
    print("relic effects:", json.dumps(eff))

    # events: force each new one and take first choice
    for eid in ['ironVow', 'ghostGambler']:
        page.evaluate("""(eid) => { const s = DC.Game.state; const d = DC.EVENTS.find(e => e.id === eid);
          s.screen = 'event'; s.ui.event = { def: d, text: d.text, node: null, result: null }; DC.UI.render(); }""", eid)
        page.wait_for_timeout(220)
        shot(page, "ev_" + eid)
        before = page.evaluate("() => ({hp: DC.Game.state.run.hp, maxHp: DC.Game.state.run.maxHp, gold: DC.Game.state.run.gold, relics: DC.Game.state.run.relics.length})")
        page.click('[data-act="choice"][data-i="0"]'); page.wait_for_timeout(300)
        after = page.evaluate("() => ({hp: DC.Game.state.run.hp, maxHp: DC.Game.state.run.maxHp, gold: DC.Game.state.run.gold, relics: DC.Game.state.run.relics.length, result: DC.Game.state.ui.event.result.slice(0,20)})")
        print(eid, "before", before, "after", after)
        page.click('[data-act="leave"]'); page.wait_for_timeout(250)

    # codex event count
    page.evaluate("() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("codex event progress:", page.evaluate("() => { const e = Array.from(document.querySelectorAll('.cx-progress span')).map(s=>s.textContent); return e; }"))
    print("errors:", errors[:4])
    b.close()
