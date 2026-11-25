import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
SH = "/workspace/work/dice-rpg/tests/_shots"

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("() => { DC.Game.newRun(); DC.Game.pickClass('mage'); }")
    page.wait_for_timeout(200)
    st = lambda: page.evaluate("() => { const r=DC.Game.state.run; return {gold:r.gold,hp:r.hp,maxHp:r.maxHp,dice:r.dice.length,relics:r.relics.slice(),spark:r.extraSpark,skills:r.skills,seen:(r.seenEvents||[]).length}; }")
    print("start", st())

    # event: forced
    page.evaluate("""() => { const r=DC.Game.state.run; r.seenEvents=[];
        DC.Game.state.ui.event=null; const ev=DC.EVENTS.find(e=>e.id==='spring'); r.seenEvents=[]; 
        DC.Game.state.ui.event={def:ev,text:ev.text,node:null,result:null,after:null}; DC.Game.state.screen='event'; DC.UI.render(); }""")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{SH}/l2_event.png")
    page.click('[data-act="choice"][data-i="1"]')  # chained
    page.wait_for_timeout(250)
    page.screenshot(path=f"{SH}/l2_event_stage2.png")
    page.click('[data-act="choice"][data-i="0"]')
    page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/l2_event_result.png")
    print("after spring chain", st())

    # curse event
    page.evaluate("""() => { const ev=DC.EVENTS.find(e=>e.id==='preacher');
        DC.Game.state.ui.event={def:ev,text:ev.text,node:null,result:null,after:null}; DC.Game.state.screen='event'; DC.UI.render(); }""")
    page.wait_for_timeout(150)
    page.click('[data-act="choice"][data-i="0"]'); page.wait_for_timeout(300)
    print("after preacher", st())

    # skill modal via shop
    page.evaluate("() => { DC.Game.state.screen='shop'; DC.Game.openShop(null); }")
    page.wait_for_timeout(250)
    page.screenshot(path=f"{SH}/l2_shop.png")
    has = page.evaluate("() => !!document.querySelector('[data-act=\"buy\"]')")
    print("shop buy buttons:", has)
    page.evaluate("() => { DC.Game.openSkills(true); }")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{SH}/l2_skills.png")
    page.click('[data-act="upskill"][data-i="0"]'); page.wait_for_timeout(250)
    print("after upskill", st())
    page.screenshot(path=f"{SH}/l2_skill_done.png")

    # combat: upgraded skill appears, boss gimmicks
    page.evaluate("""() => { const r=DC.Game.state.run; r.act=1; r.hp=r.maxHp;
        DC.Game.spawnsFor=()=>[DC.BOSSES[1]]; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(700)
    page.screenshot(path=f"{SH}/l2_boss_intro.png")
    page.evaluate("""() => { const c=DC.Game.state.combat; c.enemies[0].hp = Math.ceil(c.enemies[0].maxHp*0.52); }""")
    # hit it below 50% through the engine
    r1 = page.evaluate("""() => { const c=DC.Game.state.combat; const e=c.enemies[0];
        const before=c.enemies.length; const ev=[];
        DC.Combat.enemyPhase; 
        // direct: play a big hit by monkeypatching hand
        const h=c.hand[0]; h.v=6; DC.UI.render();
        return before; }""")
    page.evaluate("""() => { const c=DC.Game.state.combat; const e=c.enemies[0];
        e.hp = Math.ceil(e.maxHp*0.52);
        // use internal hit via aoe skill: fake by injecting damage through hitEnemy path with play
        const s=DC.Game.state; const h=c.hand[0]; h.v=6; h.k='slash';
        DC.Combat.play(c, 0, 3); // 회전베기 (aoe) if req ok
        DC.UI.render(); }""")
    page.wait_for_timeout(400)
    gi = page.evaluate("() => { const c=DC.Game.state.combat; return {n:c.enemies.length, names:c.enemies.map(e=>e.name), split:!!c.enemies[0].gSplit}; }")
    print("queen split:", gi)
    page.screenshot(path=f"{SH}/l2_boss_split.png")

    # lich revive
    page.evaluate("""() => { const r=DC.Game.state.run; r.act=2; DC.Game.state.combat=null;
        DC.Game.spawnsFor=()=>[DC.BOSSES[2]]; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(300)
    rev = page.evaluate("""() => { const c=DC.Game.state.combat; const e=c.enemies[0];
        e.hp=1; const s=DC.Game.state; const h=c.hand.find(h=>!h.used); h.v=6;
        // 강타
        const before=e.hp;
        DC.Combat.play(c, c.hand.indexOf(h), 0);
        return {hp:e.hp, rev:!!e.gRevived, dead:e.dead, max:e.maxHp}; }""")
    print("lich revive:", rev)
    page.wait_for_timeout(300)
    page.screenshot(path=f"{SH}/l2_lich.png")

    # dicelord seal on even turns
    page.evaluate("""() => { const r=DC.Game.state.run; r.act=3; DC.Game.state.combat=null;
        DC.Game.spawnsFor=()=>[DC.BOSSES[3]]; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(300)
    seal = page.evaluate("""() => { const c=DC.Game.state.combat; c.turn=2;
        const res=DC.Combat.enemyPhase(c);
        return {locked:c.hand.filter(h=>h.locked).length, events:res.events.filter(e=>e.t==='curse').length}; }""")
    print("dicelord seal:", seal)
    print("errors", errors[:8])
    b.close()
