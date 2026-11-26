import sys; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,760,900,False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => {
      document.getElementById('app').innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:20px;background:#0b1220">' +
        DC.BOSS_RELIC_IDS.map(id => '<div style="text-align:center;color:'+DC.RELICS[id].c+'">' +
          '<div style="height:110px;border-radius:16px;background:#101a2b;display:grid;place-items:center">'+DC.relicArt(id,'relic-art')+'</div>' +
          '<div style="color:#dbe6f7;font-size:12px;margin-top:6px">'+DC.RELICS[id].name+'</div></div>').join('') + '</div>';
    }""")
    page.wait_for_timeout(200)
    page.screenshot(path="/workspace/work/dice-rpg/screenshots/boss_relic_art.png")
    b.close()
