import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

def state(page):
    return page.evaluate("""() => { const s=DC.Game.state, c=s.combat; return c ? {
      hp:c.hp, block:c.block, sparks:c.sparks, combo:c.combo, mult:DC.Combat.mult(c),
      hand:c.hand.map(h=>({v:h.v,k:h.k,used:h.used})), slots:c.slots.map(s=>s.handIdx),
      ehp:c.enemies.map(e=>e.hp), phase:c.phase, hist:(s.ui.hist||[]).length, speed:s.ui.speed
    } : null }""")

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior');
      const r=DC.Game.state.run; r.act=2; r.dice.push(DC.Dice.make('titan'));
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][2]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    page.evaluate("() => { const c=DC.Game.state.combat; c.hand.forEach((h,i)=>{h.v=Math.min(6,2+i);}); DC.UI.render(); }")

    a = state(page)
    print("before", json.dumps(a))

    # tap die -> slot
    page.evaluate("() => { const c=DC.Game.state.combat; window.__i = c.hand.findIndex(h=>h.v===2); }")
    idx = page.evaluate("() => window.__i")
    page.click(f'[data-act="hand"][data-idx="{idx}"]', no_wait_after=True); page.wait_for_timeout(120)
    # tooltip on req badge
    page.click('[data-act="slot"][data-idx="0"] .req', no_wait_after=True); page.wait_for_timeout(200)
    tipShown = page.evaluate("() => { const t=document.getElementById('tip'); return !!t && t.classList.contains('show') && t.innerText.length>5; }")
    print("tooltip visible:", tipShown)
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/m_tooltip.png")
    page.evaluate("() => DC.UI.hideTip()")
    page.click('[data-act="slot"][data-idx="0"]', no_wait_after=True); page.wait_for_timeout(800)
    bstate = state(page)
    print("after play", json.dumps(bstate))
    print("undo enabled:", page.evaluate("() => !document.querySelector('[data-act=\"undo\"]').disabled"))

    # undo
    page.click('[data-act="undo"]'); page.wait_for_timeout(250)
    u = state(page)
    print("after undo", json.dumps(u))
    ok_undo = abs(u["ehp"][0] - a["ehp"][0]) < 0.01 and u["combo"] == 0 and (u["slots"][0] is None) and u["sparks"] == a["sparks"]
    print("UNDO OK:", ok_undo)

    # spark manipulation + undo
    page.click(f'[data-act="hand"][data-idx="{idx}"]', no_wait_after=True); page.wait_for_timeout(80)
    page.click('[data-act="manip"][data-op="plus"]', no_wait_after=True); page.wait_for_timeout(150)
    m1 = state(page)
    page.click('[data-act="undo"]'); page.wait_for_timeout(150)
    m2 = state(page)
    print("manip undo ok:", m1["sparks"] != m2["sparks"], m1["hand"][idx]["v"], m2["hand"][idx]["v"])

    # drag a die onto a slot
    die = page.query_selector(f'[data-act="hand"][data-idx="{idx}"]')
    slot = page.query_selector('[data-act="slot"][data-idx="1"]')
    db = die.bounding_box(); sb = slot.bounding_box()
    page.mouse.move(db["x"]+db["width"]/2, db["y"]+db["height"]/2)
    page.mouse.down()
    page.mouse.move(sb["x"]+sb["width"]/2, sb["y"]+sb["height"]/2, steps=12)
    page.wait_for_timeout(120)
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/m_drag.png")
    page.mouse.up()
    page.wait_for_timeout(700)
    d = state(page)
    print("after drag", json.dumps(d))
    print("DRAG OK:", d["slots"][1] is not None and d["hist"] >= 1)

    # speed toggle
    page.click('[data-act="speed"]'); page.wait_for_timeout(150)
    print("speed ->", state(page)["speed"])
    page.click('[data-act="speed"]'); page.wait_for_timeout(120)
    print("speed ->", state(page)["speed"])

    rep = layout_report(page)
    print("layout", json.dumps(rep)[:600])
    print("errors", errors[:10])
    b.close()
