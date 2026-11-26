import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

def click(page, sel, wait=260, t=2500):
    try:
        page.click(sel, timeout=t); page.wait_for_timeout(wait); return True
    except Exception:
        return False

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(350)
    new_game(page, "warrior")
    page.wait_for_timeout(500)
    shot(page, "v14c_map_390")
    info = page.evaluate("""() => ({
      nodes: document.querySelectorAll('.node').length,
      edges: document.querySelectorAll('.map-edges path').length,
      avail: document.querySelectorAll('.node.avail').length,
      boss: !!document.querySelector('.boss-preview'),
      canvasH: document.querySelector('#map-canvas') && document.querySelector('#map-canvas').scrollHeight,
      wrapH: document.querySelector('#map-wrap') && document.querySelector('#map-wrap').clientHeight,
    })""")
    print("MAP", json.dumps(info))
    print("LAYOUT", json.dumps(layout_report(page)))

    # event with art
    page.evaluate("""() => {
      const ev = DC.EVENTS[0];
      DC.Game.state.screen = 'event';
      DC.Game.state.ui.event = { def: ev, text: ev.text, node: {}, result: null };
      DC.UI.render();
    }""")
    page.wait_for_timeout(350)
    shot(page, "v14c_event_390")

    # codex with all relics seen
    page.evaluate("""() => {
      const m = DC.Meta.get(); m.seen.relics = DC.RELIC_IDS.slice();
      DC.Meta.save && DC.Meta.save();
      DC.Game.state.ui.modal = 'codex'; DC.UI.render();
    }""")
    page.wait_for_timeout(300)
    shot(page, "v14c_codex_390")

    # map again, travel one step then check edges done
    page.evaluate("""() => {
      DC.Game.state.ui.modal = null; DC.Game.state.screen='map';
      const r = DC.Game.state.run;
      const nid = DC.MapGen.available(r.map)[0];
      r.map.current = nid; r.cleared.push(nid); r.map.nodes[nid].done = true;
      DC.UI.render();
    }""")
    page.wait_for_timeout(400)
    shot(page, "v14c_map_progress_390")
    b.close()

    # small viewport
    b, ctx, page, errors2 = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "mage")
    page.wait_for_timeout(450)
    shot(page, "v14c_map_360")
    print("LAYOUT360", json.dumps(layout_report(page)))
    # scroll to bottom of map
    page.evaluate("() => { const w=document.querySelector('#map-wrap'); w.scrollTop = w.scrollHeight; }")
    page.wait_for_timeout(250)
    shot(page, "v14c_map_360_bottom")
    b.close()

    # desktop
    b, ctx, page, errors3 = launch(p, 1280, 800)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    new_game(page, "gambler")
    page.wait_for_timeout(450)
    shot(page, "v14c_map_desktop")
    print("LAYOUTDESK", json.dumps(layout_report(page)))
    b.close()

    print("ERRORS", json.dumps(errors + errors2 + errors3, ensure_ascii=False))
