import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 900, 1200, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => {
      const all = [];
      [1,2,3].forEach(a => (DC.ENEMIES[a]||[]).forEach(e => all.push(e)));
      [1,2,3].forEach(a => (DC.ELITES[a]||[]).forEach(e => all.push(e)));
      [1,2,3].forEach(a => all.push(DC.BOSSES[a]));
      document.body.innerHTML = '<div id="sheet" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:14px;background:#0a0f1a"></div>';
      const sh = document.getElementById('sheet');
      all.forEach(e => {
        sh.innerHTML += '<div style="border:1px solid #2a3550;border-radius:12px;padding:8px;text-align:center;background:#111827">' +
          '<svg viewBox="0 0 24 24" style="width:110px;height:110px;color:'+e.c+';filter:drop-shadow(0 0 10px '+e.c+'55)" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + DC.monsterArt(e.art, {key: e.id}) + '</svg>' +
          '<div style="font:700 12px sans-serif;color:#e9eefb">'+e.name+'</div><div style="font:10px sans-serif;color:#7f8ea3">'+e.id+'</div></div>';
      });
    }""")
    page.wait_for_timeout(300)
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/bestiary1.png", full_page=True)
    print("errors", errors[:5])
    b.close()
