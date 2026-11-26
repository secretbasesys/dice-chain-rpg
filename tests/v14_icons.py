import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 900, 700)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => {
      const app = document.getElementById('app');
      const types = ['combat','elite','boss','forge','shop','mystery','rest'];
      app.innerHTML = '<div id="sheet" style="display:flex;flex-wrap:wrap;gap:18px;padding:20px;background:#0b1220">' +
        types.map(t => '<div style="text-align:center;color:'+DC.NODES[t].c+'"><div style="width:76px;height:76px;border-radius:50%;background:#111a2b;display:grid;place-items:center;border:1px solid #26324c">'+
          DC.nodeArt(t,'node-art') + '</div><div style="font-size:10px;color:#93a4c2">'+DC.NODES[t].n+'</div></div>').join('') +
        DC.RELIC_IDS.map(id => '<div style="text-align:center;color:'+DC.RELICS[id].c+'"><div style="width:60px;height:60px;border-radius:14px;background:#111a2b;display:grid;place-items:center">'+
          DC.relicArt(id,'relic-art') + '</div><div style="font-size:9px;color:#93a4c2">'+DC.RELICS[id].name+'</div></div>').join('') +
        DC.EVENTS.map(e => '<div style="text-align:center;color:#67e8f9"><div style="width:60px;height:60px;border-radius:14px;background:#111a2b;display:grid;place-items:center">'+
          DC.eventArt(e.id,'ev-art-svg') + '</div><div style="font-size:9px;color:#93a4c2">'+e.name+'</div></div>').join('') +
        '</div>';
      document.querySelectorAll('.node-art,.relic-art,.ev-art-svg').forEach(el=>{el.style.width='46px';el.style.height='46px'});
    }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v14_icon_sheet_b.png", full_page=True)
    b.close()
    print("ERRORS", errors)
