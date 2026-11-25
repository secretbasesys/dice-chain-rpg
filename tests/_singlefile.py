from playwright.sync_api import sync_playwright
CHROME="/workspace/.cache/chrome/chrome-linux64/chrome"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME,args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
    page=ctx.new_page()
    errs=[]
    page.on("console", lambda m: errs.append(m.type+": "+m.text) if m.type in ("error","warning") else None)
    page.on("pageerror", lambda e: errs.append("pageerror: "+str(e)))
    page.goto("file:///workspace/downloads/dice-chain-rpg.html")
    page.wait_for_timeout(500)
    page.evaluate("() => { DC.Game.newRun(); DC.Game.pickClass('gambler'); }")
    page.wait_for_timeout(300)
    page.evaluate("() => { DC.Game.spawnsFor=()=>[DC.ENEMIES[1][2]]; DC.Game.startCombat('combat'); }")
    page.wait_for_timeout(400)
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/singlefile.png")
    print("version", page.evaluate("() => DC.VERSION"))
    print("errors", errs[:8])
    b.close()
