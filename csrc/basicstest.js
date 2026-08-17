const fs = require('fs');
const { JSDOM } = require('jsdom');
const BASE = '/sessions/practical-serene-gates/mnt/outputs/';
const PAGE = BASE + 'mindaicode-programming-basics.html';
const html = fs.readFileSync(PAGE, 'utf8');
const C = require(BASE + 'basics-content.js');

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };

const ALL_IDS = ['variables', 'array', 'loop', 'function', 'recursion', 'quiz'];
const bKey = (lvl, id) => lvl === 'beginner' ? 'mbas_badge_' + id : 'mbas_badge_' + lvl + '_' + id;
function storeWith(...levels) {
  const s = {};
  levels.forEach(l => ALL_IDS.forEach(id => { s[bKey(l, id)] = '1'; }));
  return s;
}
/* The page loads basics-content.js and basics-engine.js as external scripts, so the
   DOM must be built from a file:// URL for jsdom to resolve them the way a browser does. */
function boot(store) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + PAGE,
    beforeParse(w) {
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 900; } });
      Object.defineProperty(w, 'localStorage', {
        configurable: true,
        value: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }
      });
      w.scrollTo = () => {};
    }
  });
  return new Promise(res => setTimeout(() => res(dom), 350));
}
const cards = doc => [...doc.querySelectorAll('#swapPool .instrCard')];
const cardBy = (doc, txt) => cards(doc).find(c => c.textContent.replace('  ♻', '') === txt);
const jarVals = doc => [...doc.querySelectorAll('#jarRow .jarVal')].map(v => v.textContent.trim());

function solveSwap(doc, win) {
  const cfg = C.SWAP_LEVELS[win.eval('currentLevel')];
  doc.getElementById('swapClearBtn').click();
  cfg.solution.forEach(id => {
    const card = cfg.cards.find(c => c.id === id);
    cardBy(doc, card.text).click();
  });
  cfg.solution.forEach(() => doc.getElementById('swapStepBtn').click());
}

(async () => {

/* ================= 1. content integrity — every answer key is real ================= */
console.log('--- Content: answer keys verified against real execution ---');
{
  const compute = (op, to, from) => ({ copy: from, add: to + from, toMinusFrom: to - from, fromMinusTo: from - to, xor: to ^ from })[op];

  C.LEVELS.forEach(lvl => {
    const cfg = C.SWAP_LEVELS[lvl];
    let st = { ...cfg.start };
    cfg.solution.forEach(id => { const c = cfg.cards.find(x => x.id === id); st[c.to] = compute(c.op, st[c.to], st[c.from]); });
    ok(st.x === 10 && st.y === 5, `${lvl} swap solution genuinely swaps (x=${st.x}, y=${st.y})`);
    ok(cfg.solution.length === 3, `${lvl}: solution is 3 lines`);
    const distractors = cfg.cards.filter(c => !cfg.solution.includes(c.id));
    ok(distractors.length >= 1, `${lvl}: has at least one wrong-answer card`);
  });
  ok(C.SWAP_LEVELS.beginner.jars.includes('temp'), 'beginner gets a temp jar');
  ok(!C.SWAP_LEVELS.intermediate.jars.includes('temp'), 'intermediate has NO temp jar — that is the whole point');
  ok(!C.SWAP_LEVELS.pro.jars.includes('temp'), 'pro has no temp jar either');
  ok(C.SWAP_LEVELS.pro.cards.some(c => c.reusable), 'pro marks the repeated XOR line as reusable rather than showing two identical cards');

  // the traps must actually break
  {
    const cfg = C.SWAP_LEVELS.intermediate;
    let st = { ...cfg.trap.run };
    cfg.solution.forEach(id => { const c = cfg.cards.find(x => x.id === id); st[c.to] = compute(c.op, st[c.to], st[c.from]); });
    ok(st.y !== 0.1, `intermediate decimal trap really corrupts the value (y=${st.y}, should be 0.1)`);
  }
  {
    const cfg = C.SWAP_LEVELS.pro;
    let st = { ...cfg.trap2.run };
    cfg.solution.forEach(id => { const c = cfg.cards.find(x => x.id === id); st[c.to] = compute(c.op, st[c.to], st[c.from]); });
    ok(st.x !== 7.5, `pro decimal trap really truncates (x=${st.x}, should be 7.5)`);
    let a = 42;
    cfg.solution.forEach(id => { const c = cfg.cards.find(x => x.id === id); a = compute(c.op, a, a); });
    ok(a === 0, `pro aliasing trap really destroys the value (got ${a})`);
  }

  // arrays / loops / functions / recursion
  const arr = C.LOCKER_VALUES;
  C.LEVELS.forEach(lvl => {
    const rounds = C.LOCKER_LEVELS[lvl];
    ok(rounds.length === 5 && rounds.every(r => r.target >= 0 && r.target < arr.length), `${lvl} arrays: 5 rounds, all targets in range`);
    ok(rounds.every(r => r.teach.length > 40), `${lvl} arrays: every round teaches why`);
    const rs = C.LOOP_LEVELS[lvl];
    ok(rs.every(r => String(r.opts[r.ans]) === String(r.correctVal)), `${lvl} loops: marked option equals the true answer`);
    const q = C.QUIZ_LEVELS[lvl];
    ok(q.length >= 5 && q.every(x => x.ans >= 0 && x.ans < x.opts.length && x.why.length > 40), `${lvl} quiz: ${q.length} valid questions with real explanations`);
  });
  ok(C.LOCKER_LEVELS.intermediate[0].target === arr.length - 1, 'arr[-1] round targets the last index');
  ok(C.LOCKER_LEVELS.pro[3].target === 4, 'slice arr[1:4] "first excluded" round targets index 4');
  ok(C.LOOP_LEVELS.intermediate[0].correctVal === 12, 'nested loops answer is 12');
  ok(C.LOOP_LEVELS.pro[0].correctVal === '[1, 2, 3]', 'mutate-while-iterating answer is [1, 2, 3]');

  const pyBool = b => b ? 'True' : 'False';
  const F = C.FN_LEVELS;
  ok(F.beginner.inputs.every(n => F.beginner.opts[F.beginner.answer(n)] === pyBool(n % 2 === 0)), 'isEven answers correct for every input');
  const grade = n => n >= 90 ? 'A' : n >= 75 ? 'B' : n >= 50 ? 'C' : 'F';
  ok(F.intermediate.inputs.every(n => F.intermediate.opts[F.intermediate.answer(n)] === grade(n)), 'grade() answers correct for every input');
  ok(F.intermediate.inputs.includes(90) && F.intermediate.inputs.includes(75), 'grade rounds include the exact boundary values');
  ok(F.pro.cases.map(c => c.ans).join() === '1,0,1,0', 'pass-by-reference answers: int No, append Yes, rebind No, dict Yes');

  const b = C.REC_LEVELS.beginner.trace().filter(s => s.type === 'out').map(s => s.text);
  ok(b.join() === 'Liftoff!,1,2,3,4', 'countdown trace prints Liftoff!,1,2,3,4');
  const i = C.REC_LEVELS.intermediate.trace().filter(s => s.type === 'out').pop();
  ok(i.text === 'returns 24', 'factorial(4) trace ends at 24');
  const p = C.REC_LEVELS.pro.trace();
  ok(p.filter(s => s.type === 'call').length === 15, `fib(5) trace makes 15 calls (got ${p.filter(s => s.type === 'call').length})`);
  ok(C.REC_LEVELS.pro.opts[C.REC_LEVELS.pro.ans] === '15', 'the pro question answer matches that call count');
}

/* ================= 2. levels are locked until earned ================= */
console.log('\n--- Level unlocking ---');
{
  let dom = await boot({});
  let doc = dom.window.document, win = dom.window;
  ok(doc.querySelectorAll('.lvlBtn').length === 3, 'three level buttons');
  ok(doc.querySelectorAll('.lvlBtn.locked').length === 2, 'a brand new student has Intermediate AND Pro locked');
  ok(win.eval('currentLevel') === 'beginner', 'starts on Beginner');
  ok(win.eval('levelUnlocked("intermediate")') === false, 'intermediate is not unlocked yet');

  // clicking a locked level must refuse and explain
  doc.querySelector('.lvlBtn[data-level="pro"]').click();
  ok(win.eval('currentLevel') === 'beginner', 'clicking a locked level does NOT switch to it');
  ok(doc.getElementById('toast').textContent.includes('Locked'), 'it explains that the level is locked');

  dom = await boot(storeWith('beginner'));
  doc = dom.window.document; win = dom.window;
  ok(win.eval('levelUnlocked("intermediate")') === true, 'finishing all six Beginner games unlocks Intermediate');
  ok(win.eval('levelUnlocked("pro")') === false, 'Pro is still locked at that point');
  ok(doc.querySelectorAll('.lvlBtn.locked').length === 1, 'only one level remains locked');

  dom = await boot(storeWith('beginner', 'intermediate'));
  win = dom.window;
  ok(win.eval('levelUnlocked("pro")') === true, 'finishing Intermediate unlocks Pro');
  ok(dom.window.document.querySelectorAll('.lvlBtn.locked').length === 0, 'nothing is locked once both are done');
}

/* ================= 3. each level serves genuinely different content ================= */
console.log('\n--- Levels change the questions ---');
{
  const dom = await boot(storeWith('beginner', 'intermediate'));
  const doc = dom.window.document, win = dom.window;
  const seen = {};
  for (const lvl of C.LEVELS) {
    win.eval(`setLevel("${lvl}")`);
    seen[lvl] = {
      swapTitle: doc.getElementById('swapTitle').textContent,
      jars: [...doc.querySelectorAll('#jarRow .jarLbl')].map(j => j.textContent).join(','),
      cards: cards(doc).map(c => c.textContent).join('|'),
      locker: doc.getElementById('lockerPrompt').textContent,
      // the code is deliberately hidden until the student answers, so compare the
      // thing they actually see at this point: the plain-language job
      loop: doc.getElementById('loopTask').textContent,
      fn: doc.getElementById('fnCode').textContent,
      rec: doc.getElementById('recFnName').textContent,
      quiz: doc.getElementById('quizQ').textContent,
    };
  }
  /* Every question field must differ across all three levels. Jars are the one
     exception: Intermediate and Pro are BOTH "no temp variable" techniques, so
     sharing two jars there is correct — only Beginner should differ. */
  Object.keys(seen.beginner).filter(f => f !== 'jars').forEach(field => {
    const vals = C.LEVELS.map(l => seen[l][field]);
    ok(new Set(vals).size === 3, `${field}: all three levels show different content`);
  });
  ok(seen.beginner.jars === 'x,temp,y', 'Beginner gets the temp jar');
  ok(seen.intermediate.jars === 'x,y' && seen.pro.jars === 'x,y',
     'both harder levels drop the temp jar — that is the shared constraint they are built around');
  ok(seen.pro.rec.includes('fib'), 'recursion at Pro uses fib, not countdown');
  ok(doc.getElementById('cinemaCard').style.display === 'none', 'the beginner cinema metaphor is hidden at Pro');
  win.eval('setLevel("beginner")');
  ok(doc.getElementById('cinemaCard').style.display === 'block', 'the cinema returns at Beginner');
}

/* ================= 4. badges are per level and do not leak ================= */
console.log('\n--- Per-level badges ---');
{
  const store = {};
  const dom = await boot(store);
  const doc = dom.window.document, win = dom.window;
  solveSwap(doc, win);
  ok(store['mbas_badge_variables'] === '1', 'winning at Beginner writes the ORIGINAL key name (course-path card keeps working)');
  ok(!store['mbas_badge_intermediate_variables'], 'it does not also award the Intermediate badge');

  // finish beginner entirely, move up, and check the intermediate badge is separate
  ALL_IDS.forEach(id => { store[bKey('beginner', id)] = '1'; });
  const dom2 = await boot(store);
  const doc2 = dom2.window.document, win2 = dom2.window;
  win2.eval('setLevel("intermediate")');
  ok(doc2.querySelectorAll('.railStep.done').length === 0, 'switching to a fresh level shows zero completed steps');
  solveSwap(doc2, win2);
  ok(store['mbas_badge_intermediate_variables'] === '1', 'winning at Intermediate writes a separate namespaced key');
}

/* ================= 5. the swap, played at every level ================= */
console.log('\n--- Swap game at all three levels ---');
{
  for (const lvl of C.LEVELS) {
    const store = storeWith(...(lvl === 'beginner' ? [] : lvl === 'intermediate' ? ['beginner'] : ['beginner', 'intermediate']));
    const dom = await boot(store);
    const doc = dom.window.document, win = dom.window;
    win.eval(`setLevel("${lvl}")`);
    solveSwap(doc, win);
    const vals = jarVals(doc);
    const xi = C.SWAP_LEVELS[lvl].jars.indexOf('x'), yi = C.SWAP_LEVELS[lvl].jars.indexOf('y');
    ok(vals[xi] === '10' && vals[yi] === '5', `${lvl}: playing the solution in the UI really swaps the jars (${vals.join(',')})`);
    ok(/Swapped/.test(doc.getElementById('swapFb').textContent), `${lvl}: the win verdict appears`);
    ok(store[bKey(lvl, 'variables')] === '1', `${lvl}: the badge is awarded`);
  }
}

/* ================= 6. traps only appear where they exist, and really break ================= */
console.log('\n--- Swap traps ---');
{
  // beginner has no trap
  let dom = await boot({});
  let doc = dom.window.document, win = dom.window;
  solveSwap(doc, win);
  ok(doc.getElementById('swapTraps').style.display === 'none', 'Beginner has no trap panel — nothing to break yet');

  // intermediate: decimal precision
  dom = await boot(storeWith('beginner'));
  doc = dom.window.document; win = dom.window;
  win.eval('setLevel("intermediate")');
  solveSwap(doc, win);
  ok(doc.getElementById('swapTraps').style.display === 'block', 'Intermediate reveals a trap once you have won');
  let btns = [...doc.querySelectorAll('#trapBtns button')];
  ok(btns.length === 1, 'Intermediate has one trap');
  btns[0].click();
  ok(/0\.10000000000000003/.test(doc.getElementById('trapFb').textContent), 'the decimal trap shows the real corrupted value, not a claim');

  // pro: aliasing + decimals
  dom = await boot(storeWith('beginner', 'intermediate'));
  doc = dom.window.document; win = dom.window;
  win.eval('setLevel("pro")');
  solveSwap(doc, win);
  btns = [...doc.querySelectorAll('#trapBtns button')];
  ok(btns.length === 2, 'Pro has two traps');
  btns[0].click();
  ok(jarVals(doc).every(v => v === '0'), 'the aliasing trap visibly destroys the value — both jars show 0');
  ok(/dangerous/i.test(doc.getElementById('trapFb').textContent), 'and explains why XOR swap is dangerous');
  btns[1].click();
  ok(/x=7/.test(doc.getElementById('trapFb').textContent), 'the decimal trap shows 2.5 truncated to 7');
  ok(/not.*ship|avoid|dangerous/i.test(C.SWAP_VERDICT_NOTE.pro + C.SWAP_LEVELS.pro.title),
     'Pro is framed as "do not ship this", not as best practice');
}

/* ================= 7. reusable card ================= */
console.log('\n--- Reusable instruction card ---');
{
  const dom = await boot(storeWith('beginner', 'intermediate'));
  const doc = dom.window.document, win = dom.window;
  win.eval('setLevel("pro")');
  ok(cards(doc).length === 3, `Pro shows 3 distinct cards, not two identical ones (got ${cards(doc).length})`);
  /* the pool re-renders after every click, so each card must be looked up fresh */
  const reusable = () => cards(doc).find(c => c.classList.contains('reusable'));
  const normal = () => cards(doc).find(c => c.textContent.startsWith('y ='));
  ok(reusable() !== undefined, 'one card is marked reusable');
  ok(reusable().textContent.includes('♻'), 'it is visually flagged so the student knows it can be used twice');
  reusable().click();
  ok(!reusable().classList.contains('used'), 'a reusable card does not grey out after one use');
  normal().click();
  ok(normal().classList.contains('used'), 'a normal card DOES grey out after use');
  reusable().click();
  ok(win.eval('swapProgram.length') === 3, 'the reusable card can genuinely be played twice');
}

/* ================= 8. every game still plays through at every level ================= */
console.log('\n--- All five games playable at all three levels ---');
{
  for (const lvl of C.LEVELS) {
    const store = storeWith(...(lvl === 'beginner' ? [] : lvl === 'intermediate' ? ['beginner'] : ['beginner', 'intermediate']));
    const dom = await boot(store);
    const doc = dom.window.document, win = dom.window;
    win.eval(`setLevel("${lvl}")`);

    // variables (the swap)
    solveSwap(doc, win);
    ok(store[bKey(lvl, 'variables')] === '1', `${lvl}: variables completed`);

    // arrays — answer every round correctly
    const lr = C.LOCKER_LEVELS[lvl];
    for (let r = 0; r < lr.length; r++) {
      doc.querySelectorAll('#lockerBoxes .box')[lr[r].target].click();
      const nb = doc.getElementById('lockerNextBtn');
      if (nb.style.display !== 'none') nb.click();
    }
    ok(store[bKey(lvl, 'array')] === '1', `${lvl}: arrays completed`);

    // loops
    const lo = C.LOOP_LEVELS[lvl];
    for (let r = 0; r < lo.length; r++) {
      doc.querySelectorAll('#loopOpts .optBtn')[lo[r].ans].click();
      const nb = doc.getElementById('loopNextBtn');
      if (nb.style.display !== 'none') nb.click();
    }
    ok(store[bKey(lvl, 'loop')] === '1', `${lvl}: loops completed`);
    win.eval('clearInterval(loopTimer)');

    // functions
    const fc = C.FN_LEVELS[lvl];
    const n = fc.isRef ? fc.cases.length : fc.inputs.length;
    for (let r = 0; r < n; r++) {
      const truth = fc.isRef ? fc.cases[r].ans : fc.answer(fc.inputs[r]);
      doc.querySelectorAll('#fnOpts .optBtn')[truth].click();
      const nb = doc.getElementById('fnNextBtn');
      if (nb.style.display !== 'none') nb.click();
    }
    ok(store[bKey(lvl, 'function')] === '1', `${lvl}: functions completed`);

    // recursion — at beginner the cinema must be played first
    if (lvl === 'beginner') {
      let g = 0;
      while (win.eval('cinemaPhase') !== 'done' && g < 30) { doc.getElementById('cinemaAskBtn').click(); g++; }
      ok(win.eval('cinemaPhase') === 'done', 'beginner: cinema plays through to the end');
    }
    const rc = C.REC_LEVELS[lvl];
    doc.querySelectorAll('#recOpts .optBtn')[rc.ans].click();
    ok(store[bKey(lvl, 'recursion')] === '1', `${lvl}: recursion completed`);
    // and the trace steps cleanly to the end
    let g = 0;
    while (win.eval('recIdx < recSteps.length') && g < 60) { doc.getElementById('recStepBtn').click(); g++; }
    ok(win.eval('recStack.length') === 0, `${lvl}: the call stack fully unwinds`);

    // quiz
    const qb = C.QUIZ_LEVELS[lvl];
    win.eval('qi=0; qCorrect=0; showQuiz();');
    for (let r = 0; r < qb.length; r++) {
      doc.querySelectorAll('#quizOpts button')[qb[r].ans].click();
      const nq = doc.getElementById('nq');
      if (nq) nq.click();
    }
    ok(store[bKey(lvl, 'quiz')] === '1', `${lvl}: quiz completed`);
    ok(win.eval(`levelComplete("${lvl}")`), `${lvl}: the whole level is now complete`);
  }
}

/* ================= 9. finish card offers the next level ================= */
console.log('\n--- Level handoff ---');
{
  const store = storeWith('beginner');
  const dom = await boot(store);
  const doc = dom.window.document, win = dom.window;
  win.eval('qi=0; qCorrect=0; showQuiz();');
  const qb = C.QUIZ_LEVELS.beginner;
  for (let r = 0; r < qb.length; r++) {
    doc.querySelectorAll('#quizOpts button')[qb[r].ans].click();
    const nq = doc.getElementById('nq'); if (nq) nq.click();
  }
  ok(doc.getElementById('finishCard').style.display === 'block', 'the finish card appears');
  ok(/Intermediate/.test(doc.getElementById('finishBody').textContent), 'it tells you Intermediate is unlocked');
  const btn = doc.getElementById('finishNextLevel');
  ok(btn.style.display !== 'none', 'a button to start the next level is offered');
  btn.click();
  ok(win.eval('currentLevel') === 'intermediate', 'clicking it switches you to Intermediate');
  ok(win.eval('currentStep') === 0, 'and drops you back at game 1');
}

/* ================= 10. hints are per level ================= */
console.log('\n--- Hints follow the level ---');
{
  const dom = await boot(storeWith('beginner', 'intermediate'));
  const doc = dom.window.document, win = dom.window;
  ok(Object.keys(win.eval('JSON.parse(JSON.stringify(HINTS))')).length === 3, 'a hint set exists for each level');
  C.LEVELS.forEach(l => ok(win.eval(`HINTS["${l}"].length`) === 6, `${l}: a hint for all six steps`));
  doc.getElementById('hintFab').click();
  const beginnerHint = doc.getElementById('hintTitle').textContent;
  win.eval('setLevel("pro")');
  doc.getElementById('hintFab').click(); doc.getElementById('hintFab').click();
  ok(doc.getElementById('hintTitle').textContent !== beginnerHint, 'the hint changes when the level changes');
  ok(/XOR/i.test(doc.getElementById('hintText').textContent), 'the Pro swap hint talks about XOR');
}

/* ================= 11. still works with localStorage blocked (file://) ================= */
console.log('\n--- Degrades safely without storage ---');
{
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + PAGE,
    beforeParse(w) {
      Object.defineProperty(w, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
      w.scrollTo = () => {};
    }
  });
  await new Promise(r => setTimeout(r, 350));
  const doc = dom.window.document;
  ok(doc.querySelectorAll('.lvlBtn').length === 3, 'the page still renders when localStorage throws');
  ok(cards(doc).length > 0, 'the swap game still builds');
  const win = dom.window;
  solveSwap(doc, win);
  ok(/Swapped/.test(doc.getElementById('swapFb').textContent), 'and the game is still winnable without storage');
}

console.log('\n' + (allPass ? '=== ALL TESTS PASSED ===' : '=== SOME TESTS FAILED ==='));
process.exit(allPass ? 0 : 1);
})();
