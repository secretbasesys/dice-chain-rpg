import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
R = {"checks": {}, "layout": {}, "console": []}

def ck(name, cond, info=None):
    R["checks"][name] = {"ok": bool(cond), "info": info}

def safe_click(page, sel, wait=250, timeout=2500):
    try:
        page.click(sel, timeout=timeout)
        page.wait_for_timeout(wait)
        return True
    except Exception:
        return False

def screen(page):
    return page.evaluate("() => DC.Game.state.screen")

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    no_save(page)
    shot(page, "p1_00_title")

    safe_click(page, '[data-act="newrun"]')
    shot(page, "p1_01_class")
    R["layout"]["class"] = layout_report(page)
    ck("class_cards", page.evaluate("() => document.querySelectorAll('.class-card').length") == 3)

    safe_click(page, '[data-act="pickclass"][data-id="warrior"]', 350)
    shot(page, "p1_02_map")
    R["layout"]["map"] = layout_report(page)
    ck("map_edges_drawn", page.evaluate("() => document.querySelectorAll('.map-edges line').length") > 0,
       page.evaluate("() => document.querySelectorAll('.map-edges line').length"))

    # enter combat
    safe_click(page, '.node.avail', 450)
    ck("combat_started", screen(page) == "combat")
    shot(page, "p1_03_combat")
    R["layout"]["combat"] = layout_report(page)
    ck("slots_5", page.evaluate("() => document.querySelectorAll('.slot').length") == 5)
    ck("hand_rolled", page.evaluate("() => document.querySelectorAll('.tray .die').length") >= 3,
       page.evaluate("() => document.querySelectorAll('.tray .die').length"))

    # die selection → slot preview
    safe_click(page, '[data-act="hand"][data-idx="0"]', 200)
    ck("select_die", page.evaluate("() => !!document.querySelector('.die.sel')"))
    shot(page, "p1_04_select")

    # play with selected die on a valid slot
    played = page.evaluate("""() => {
      const s=DC.Game.state, c=s.combat;
      for (let i=0;i<c.slots.length;i++) if (DC.Combat.canPlay(c, s.ui.sel, i).ok) return i;
      return -1; }""")
    if played >= 0:
        before = page.evaluate("() => DC.Game.state.combat.combo")
        safe_click(page, f'[data-act="slot"][data-idx="{played}"]', 500)
        after = page.evaluate("() => DC.Game.state.combat.combo")
        ck("play_resolves", after == before + 1, {"slot": played, "combo": after})
        shot(page, "p1_05_played")

    # manipulation
    if screen(page) == "combat":
        idx = page.evaluate("""() => {const c=DC.Game.state.combat; return c.hand.findIndex(h=>!h.used&&!h.locked);}""")
        if idx >= 0:
            safe_click(page, f'[data-act="hand"][data-idx="{idx}"]', 150)
            page.evaluate("() => { const c=DC.Game.state.combat; c.hand.forEach(h=>{ if(h.v>5) h.v=3; }); DC.UI.render(); }")
            sp0 = page.evaluate("() => DC.Game.state.combat.sparks")
            safe_click(page, '[data-act="manip"][data-op="plus"]', 300)
            sp1 = page.evaluate("() => DC.Game.state.combat.sparks")
            ck("manip_spends_spark", sp1 == sp0 - 1, {"before": sp0, "after": sp1})
            shot(page, "p1_06_manip")

        # invalid slot gives feedback (not crash)
        ck("endturn_visible", page.evaluate("() => !!document.querySelector('[data-act=\"endturn\"]')"))
        safe_click(page, '[data-act="endturn"]', 1800)
        shot(page, "p1_07_enemy_turn")
        R["layout"]["combat_turn2"] = layout_report(page)
        ck("turn_advanced", page.evaluate("() => !DC.Game.state.combat || DC.Game.state.combat.turn >= 2"))

    # finish fight
    if screen(page) == "combat":
        page.evaluate("() => DC.test.autoCombat(40)")
        page.wait_for_timeout(150)
        st = page.evaluate("() => DC.Game.state.combat && DC.Game.state.combat.phase")
        if st == "won":
            page.evaluate("() => DC.Game.combatWon()")
            page.wait_for_timeout(300)
        elif st == "lost":
            page.evaluate("() => DC.Game.combatLost()")
            page.wait_for_timeout(300)
    ck("combat_reached_reward", screen(page) in ("reward", "gameover"), screen(page))

    if screen(page) == "reward":
        shot(page, "p1_08_reward")
        R["layout"]["reward"] = layout_report(page)
        safe_click(page, '[data-act="reward"][data-i="0"]', 400)
        ck("reward_to_map", screen(page) in ("map", "forge"), screen(page))

    # forge
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openForge(2, null); }")
    page.wait_for_timeout(250)
    shot(page, "p1_09_forge")
    R["layout"]["forge"] = layout_report(page)
    safe_click(page, '[data-act="fdiedie"][data-i="0"]', 200)
    safe_click(page, '[data-act="fface"][data-i="0"]', 250)
    shot(page, "p1_10_forge_options")
    ck("forge_options", page.evaluate("() => document.querySelectorAll('.forge-opt').length") == 5,
       page.evaluate("() => document.querySelectorAll('.forge-opt').length"))
    before_face = page.evaluate("() => JSON.stringify(DC.Game.state.run.dice[0].faces[0])")
    safe_click(page, '[data-act="fopt"][data-i="0"]', 350)
    after_face = page.evaluate("() => JSON.stringify(DC.Game.state.run.dice[0].faces[0])")
    ck("forge_changes_face", before_face != after_face, {"before": before_face, "after": after_face})
    shot(page, "p1_11_forge_done")
    safe_click(page, '[data-act="forgeexit"]', 350)

    # shop
    page.evaluate("() => DC.Game.openShop(null)")
    page.wait_for_timeout(250)
    shot(page, "p1_12_shop")
    R["layout"]["shop"] = layout_report(page)
    gold0 = page.evaluate("() => DC.Game.state.run.gold")
    dice0 = page.evaluate("() => DC.Game.state.run.dice.length")
    bought = page.evaluate("""() => {
      const items = DC.Game.state.ui.shop.items;
      const i = items.findIndex(it => !it.sold && it.price <= DC.Game.state.run.gold);
      if (i < 0) return -1;
      DC.Game.buy(i); return i;
    }""")
    gold1 = page.evaluate("() => DC.Game.state.run.gold")
    ck("shop_purchase", bought >= 0 and gold1 < gold0, {"item": bought, "gold": [gold0, gold1]})
    safe_click(page, '[data-act="leave"]', 350)

    # rest
    page.evaluate("() => { DC.Game.state.screen='rest'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    shot(page, "p1_13_rest")
    R["layout"]["rest"] = layout_report(page)

    # event
    page.evaluate("() => DC.Game.openEvent(null)")
    page.wait_for_timeout(200)
    shot(page, "p1_14_event")
    R["layout"]["event"] = layout_report(page)
    ck("event_choices", page.evaluate("() => document.querySelectorAll('.ev-choice').length") >= 2)

    # boss
    page.evaluate("() => { DC.Game.state.screen='map'; DC.Game.state.run.act=1; DC.Game.startCombat('boss'); }")
    page.wait_for_timeout(350)
    shot(page, "p1_15_boss")
    ck("boss_started", page.evaluate("() => DC.Game.state.combat && DC.Game.state.combat.kind==='boss'"))

    # deck overlay
    safe_click(page, '[data-act="deck"]', 250)
    shot(page, "p1_16_deck")
    ck("deck_overlay", page.evaluate("() => !!document.querySelector('.deck-panel')"))
    safe_click(page, '[data-act="closedeck"]', 200)

    # help overlay
    safe_click(page, '[data-act="help"]', 250)
    shot(page, "p1_17_help")
    safe_click(page, '[data-act="closehelp"]', 150)

    R["console"] = errors
    b.close()

# desktop pass
with sync_playwright() as p:
    b, ctx, page, errors2 = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    no_save(page)
    shot(page, "p1_d0_title")
    safe_click(page, '[data-act="newrun"]', 250)
    shot(page, "p1_d1_class")
    R["layout"]["d_class"] = layout_report(page)
    safe_click(page, '[data-act="pickclass"][data-id="mage"]', 400)
    shot(page, "p1_d2_map")
    R["layout"]["d_map"] = layout_report(page)
    safe_click(page, '.node.avail', 500)
    shot(page, "p1_d3_combat")
    R["layout"]["d_combat"] = layout_report(page)
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openForge(2,null); }")
    page.wait_for_timeout(250)
    shot(page, "p1_d4_forge")
    R["layout"]["d_forge"] = layout_report(page)
    page.evaluate("() => { DC.Game.state.ui.forge=null; DC.Game.openShop(null); }")
    page.wait_for_timeout(250)
    shot(page, "p1_d5_shop")
    R["layout"]["d_shop"] = layout_report(page)
    R["console"] += errors2
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
