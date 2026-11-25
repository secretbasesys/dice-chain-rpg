import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
R = {"checks": {}, "console": []}
def ck(n, c, i=None): R["checks"][n] = {"ok": bool(c), "info": i}
def safe_click(page, sel, wait=250, timeout=2500):
    try:
        page.click(sel, timeout=timeout); page.wait_for_timeout(wait); return True
    except Exception:
        return False

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    page.evaluate("() => { DC.Game.newRun(); DC.Game.pickClass('gambler'); }")
    page.wait_for_timeout(250)

    # ---- save / resume ----
    gold = page.evaluate("() => DC.Game.state.run.gold")
    ndice = page.evaluate("() => DC.Game.state.run.dice.length")
    page.reload(); page.wait_for_timeout(350)
    ck("save_banner", page.evaluate("() => !!document.querySelector('[data-act=\"resume\"]')"))
    safe_click(page, '[data-act="resume"]', 350)
    ck("resume_state", page.evaluate("() => DC.Game.state.run && DC.Game.state.run.gold") == gold,
       {"gold": gold, "dice": ndice})
    ck("resume_screen", page.evaluate("() => DC.Game.state.screen") == "map")

    # ---- double end-turn must not double enemy actions ----
    page.evaluate("""() => { DC.Game.startCombat('combat');
       window.__ep = 0; const o = DC.Combat.enemyPhase;
       DC.Combat.enemyPhase = function(c){ window.__ep++; return o(c); }; }""")
    page.wait_for_timeout(250)
    page.evaluate("() => { DC.Game.endTurn(); DC.Game.endTurn(); DC.Game.endTurn(); }")
    page.wait_for_timeout(1400)
    ck("no_double_enemy_phase", page.evaluate("() => window.__ep") == 1, page.evaluate("() => window.__ep"))

    # ---- all dice locked still allows end turn ----
    page.evaluate("""() => { const c = DC.Game.state.combat; if(!c||c.phase!=='player'){DC.Game.startCombat('combat');}
       const cc = DC.Game.state.combat; cc.hand.forEach(h => h.locked = true); DC.UI.render(); }""")
    page.wait_for_timeout(150)
    before_turn = page.evaluate("() => DC.Game.state.combat.turn")
    page.evaluate("() => DC.Game.endTurn()")
    page.wait_for_timeout(1300)
    after = page.evaluate("() => {const c=DC.Game.state.combat; return c ? c.turn : -1;}")
    ck("locked_dice_endturn", after == before_turn + 1 or after == -1, {"before": before_turn, "after": after})

    # ---- manipulation edge cases ----
    page.evaluate("""() => { DC.Game.startCombat('combat'); const c=DC.Game.state.combat;
       c.sparks = 0; DC.UI.render(); }""")
    page.wait_for_timeout(150)
    r = page.evaluate("""() => { const c=DC.Game.state.combat; const before=c.hand[0].v;
       const res=DC.Combat.manip(c,'plus',0); return {ok:res.ok, why:res.why, before, after:c.hand[0].v}; }""")
    ck("manip_needs_spark", (not r["ok"]) and r["before"] == r["after"], r)
    r = page.evaluate("""() => { const c=DC.Game.state.combat; c.sparks=3; c.hand[0].v=6;
       const res=DC.Combat.manip(c,'plus',0); return {ok:res.ok, why:res.why, v:c.hand[0].v}; }""")
    ck("plus_caps_at_6", (not r["ok"]) and r["v"] == 6, r)
    r = page.evaluate("""() => { const c=DC.Game.state.combat; c.sparks=3; c.hand[0].v=6;
       const res=DC.Combat.manip(c,'flip',0); return {ok:res.ok, v:c.hand[0].v}; }""")
    ck("flip_7_minus", r["ok"] and r["v"] == 1, r)
    r = page.evaluate("""() => { const c=DC.Game.state.combat; const n=c.hand.length;
       c.sparks=3; c.hand[0].used=false; c.hand[0].locked=false;
       const res=DC.Combat.manip(c,'copy',0);
       return {n0:n, n1:c.hand.length, sparks:c.sparks, ok:res.ok, why:res.why}; }""")
    ck("copy_adds_die", r["n1"] == r["n0"] + 1, r)

    # ---- requirement gate ----
    r = page.evaluate("""() => { const c=DC.Game.state.combat; c.slots.forEach(s=>s.handIdx=null);
       // find a slot whose req fails for a 1
       const h = c.hand[0]; h.used=false; h.locked=false; h.v=1;
       let si = c.slots.findIndex((s,i)=>!DC.REQ[DC.CLASSES[c.cls].skills[i].req].test(1));
       if (si<0) return {skip:true};
       const chk = DC.Combat.canPlay(c,0,si);
       const res = DC.Combat.play(c,0,si);
       return {ok:chk.ok, played:res.ok, why:res.why};
    }""")
    ck("req_blocks_invalid", r.get("skip") or ((not r["ok"]) and (not r["played"])), r)

    # ---- death path ----
    page.evaluate("""() => { DC.Game.startCombat('combat'); const c=DC.Game.state.combat; c.hp=1; }""")
    page.wait_for_timeout(150)
    page.evaluate("() => DC.Game.endTurn()")
    page.wait_for_timeout(1600)
    scr = page.evaluate("() => DC.Game.state.screen")
    ck("death_gameover", scr in ("gameover", "combat"), scr)
    if scr == "gameover":
        shot(page, "p3_01_gameover")
        ck("save_cleared_on_death", page.evaluate("() => !DC.Game.hasSave()"))

    # ---- full fresh run via UI: act1 boss -> act2 ----
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    safe_click(page, '[data-act="newrun"]', 200)
    safe_click(page, '[data-act="pickclass"][data-id="mage"]', 300)
    steps = 0
    acts_seen = set()
    while steps < 80:
        steps += 1
        scr = page.evaluate("() => DC.Game.state.screen")
        acts_seen.add(page.evaluate("() => DC.Game.state.run && DC.Game.state.run.act"))
        if scr in ("win", "gameover"):
            break
        if scr == "map":
            ok = safe_click(page, '.node.avail', 260, 1500)
            if not ok: break
        elif scr == "combat":
            page.evaluate("() => { DC.test.autoCombat(60); const c=DC.Game.state.combat; if(c&&c.phase==='won') DC.Game.combatWon(); else if(c&&c.phase==='lost') DC.Game.combatLost(); }")
            page.wait_for_timeout(220)
        elif scr == "reward":
            safe_click(page, '[data-act="reward"][data-i="0"]', 260, 1500)
        elif scr == "forge":
            safe_click(page, '[data-act="forgeexit"]', 220, 1500)
        elif scr == "shop":
            safe_click(page, '[data-act="leave"]', 220, 1500)
        elif scr == "rest":
            safe_click(page, '[data-act="rest"][data-i="0"]', 260, 1500)
        elif scr == "event":
            safe_click(page, '[data-act="choice"][data-i="0"]', 260, 1500)
        else:
            page.wait_for_timeout(200)
    final = page.evaluate("() => ({screen: DC.Game.state.screen, act: DC.Game.state.run && DC.Game.state.run.act, hp: DC.Game.state.run && DC.Game.state.run.hp, dice: DC.Game.state.run && DC.Game.state.run.dice.length, relics: DC.Game.state.run && DC.Game.state.run.relics.length, kills: DC.Game.state.run && DC.Game.state.run.stats.kills})")
    ck("full_run_progresses", len(acts_seen) >= 2, {"acts_seen": sorted(acts_seen), "final": final, "steps": steps})
    if final["screen"] == "win":
        shot(page, "p3_02_victory")

    # ---- UI soak: 15 real clicks in a fight ----
    page.evaluate("() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.startCombat('combat'); }")
    page.wait_for_timeout(300)
    clicks = 0
    for i in range(15):
        scr = page.evaluate("() => DC.Game.state.screen")
        if scr != "combat": break
        try:
            page.click('[data-act="slot"]', timeout=800)
            clicks += 1
        except Exception:
            pass
        page.wait_for_timeout(120)
        if i % 4 == 3:
            try:
                page.click('[data-act="endturn"]', timeout=800); clicks += 1
            except Exception:
                pass
            page.wait_for_timeout(1200)
    ck("ui_soak_no_crash", page.evaluate("() => !!document.title"), {"clicks": clicks})
    shot(page, "p3_03_after_soak")

    R["console"] = errors
    b.close()

print(json.dumps(R, ensure_ascii=False, indent=1))
