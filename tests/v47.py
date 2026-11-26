"""v4.7 — skill draft: reward option, modal flow, combat use, persistence."""
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

    print("draft pool:", page.evaluate("() => DC.DRAFT_SKILLS.length"))
    # reward options should sometimes contain a draft card; check generator coverage
    kinds = page.evaluate("""() => { const o = {}; for (let i=0;i<40;i++) {
        DC.Game.makeRewardOptions(3).forEach(x => { o[x.kind] = (o[x.kind]||0)+1; }); }
        return o; }""")
    print("reward kind mix (40x3):", json.dumps(kinds))

    # force a draft option and take it
    page.evaluate("""() => { const s = DC.Game.state;
      s.ui.reward = { gold: 30, boss: false, options: [{kind:'draft', name:'스킬 교체', desc:'d', ic:'book', c:'#c084fc', kindLabel:'드래프트',
        cand: ['d_cleave','d_sweep','d_roar'] }] };
      s.screen = 'reward'; DC.UI.render(); }""")
    page.wait_for_timeout(200)
    page.click('[data-act="reward"][data-i="0"]'); page.wait_for_timeout(250)
    print("modal:", page.evaluate("() => DC.Game.state.ui.modal"), "step:", page.evaluate("() => DC.Game.state.ui.draft.step"),
          "cards:", page.evaluate("() => document.querySelectorAll('.dr-card').length"))
    shot(page, "draft_pick")
    page.click('[data-act="draftskill"][data-i="0"]'); page.wait_for_timeout(250)
    print("step2:", page.evaluate("() => DC.Game.state.ui.draft.step"), "rows:", page.evaluate("() => document.querySelectorAll('.ds-row').length"))
    shot(page, "draft_slot")
    page.click('[data-act="draftslot"][data-i="2"]'); page.wait_for_timeout(400)
    print("after apply:", page.evaluate("""() => ({
        screen: DC.Game.state.screen, modal: DC.Game.state.ui.modal,
        custom: DC.Game.state.run.customSkills,
        slot2: DC.Combat.skill(DC.Game.state.combat || {cls:'warrior'}, 0) ? null : null })"""))
    print("customSkills:", page.evaluate("() => JSON.stringify(DC.Game.state.run.customSkills)"))

    # does combat use it?
    use = page.evaluate("""() => {
      const s = DC.Game.state;
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
      DC.Game.startCombat('combat');
      const c = s.combat;
      const sk = DC.Combat.skill(c, 2);
      return { id: sk.id, name: sk.name, desc: sk.desc };
    }""")
    print("slot2 skill in combat:", use)
    page.evaluate("() => { DC.Game.state.ui.modal = 'skills'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    print("skills modal swapped rows:", page.evaluate("() => document.querySelectorAll('.sk-row.swapped').length"),
          "disabled:", page.evaluate("() => document.querySelectorAll('.sk-btn[disabled]').length"))
    shot(page, "draft_skills")
    page.evaluate("() => { DC.Game.state.ui.modal = null; DC.UI.render(); }")

    # persistence through save/resume
    page.evaluate("() => { DC.Game.save(); }")
    page.reload(); page.wait_for_timeout(300)
    page.evaluate("() => { DC.Game.resume(); }"); page.wait_for_timeout(300)
    print("after resume customSkills:", page.evaluate("() => JSON.stringify(DC.Game.state.run.customSkills)"))
    print("errors:", errors[:4])
    b.close()
