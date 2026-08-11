/* recursiontest.js — does the recursion lesson actually show it is NOT a loop?
 *
 * The complaint this addresses: "recursion on functions looks like a loop, a
 * student will not understand what exactly it is." So the tests here are about
 * the DISTINCTION, not just about pixels existing:
 *   - recursion must stack up frozen calls; the loop must never stack anything
 *   - recursion must do no arithmetic on the way down
 *   - it must unwind in reverse, and reach the same answer as the loop
 *   - the cinema game must show more than one person waiting at once
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot() {
  const store = {};
  const dom = new JSDOM(fs.readFileSync(BASE + 'mindaicode-programming-basics.html', 'utf8'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + BASE + 'mindaicode-programming-basics.html',
    beforeParse(w) {
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 900; } });
      Object.defineProperty(w, 'localStorage', { configurable: true, value: {
        get length() { return Object.keys(store).length; },
        key: i => Object.keys(store)[i] || null,
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; } } });
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 400));
}

(async () => {
const dom = await boot();
const doc = dom.window.document, win = dom.window;
const txt = id => doc.getElementById(id).textContent.replace(/\s+/g, ' ').trim();

/* ============ 1. the comparison is the first thing on the recursion page ============ */
console.log('=== 1. The question is answered before it is asked ===');
{
  const box = doc.getElementById('lrBox');
  ok(!!box, 'the loop-vs-recursion panel exists');
  ok(/just a loop/i.test(box.textContent), 'it opens by naming the confusion out loud ("isn\'t this just a loop?")');

  const step4 = doc.getElementById('step4');
  const boxes = [...step4.querySelectorAll('.gameBox')];
  ok(boxes[0] === box, 'and it comes FIRST, before the cinema game — the doubt is cleared up before playing');

  ok(!!doc.getElementById('lrLoopState') && !!doc.getElementById('lrRecState'),
     'both sides are shown at once, side by side');
  ok(/for i in range/.test(txt('lrBox')) && /def total/.test(txt('lrBox')),
     'the real code for both versions is on screen');
  ok(/3/.test(txt('lrBox')) && /7/.test(txt('lrBox')),
     'both run the same job on the same numbers, so the only difference is the method');
}

/* ============ 2. THE DISTINCTION — recursion stacks, the loop does not ============ */
console.log('\n=== 2. Recursion piles up work; the loop never does ===');
{
  win.eval('lrReset()');
  await sleep(60);

  const depths = [], frozenCounts = [], loopPending = [];
  let guard = 0, finished = false;
  while (guard++ < 20 && !finished) {
    depths.push(doc.querySelectorAll('#lrRecState .lrFrame').length);
    frozenCounts.push(doc.querySelectorAll('#lrRecState .lrFrame.frozen').length);
    const m = txt('lrLoopState').match(/half-finished: (\d+)/);
    loopPending.push(m ? Number(m[1]) : -1);
    finished = win.eval('lrStep()');
  }
  depths.push(doc.querySelectorAll('#lrRecState .lrFrame').length);

  const peak = Math.max(...depths);
  ok(peak === 4, `recursion reaches ${peak} calls alive at once for a 3-item list (3 waiting + 1 base case)`);
  ok(Math.max(...frozenCounts) === 3, `and ${Math.max(...frozenCounts)} of them are frozen mid-sum at the worst moment`);
  ok(loopPending.every(v => v === 0),
     `the loop leaves 0 things half-finished at EVERY step (${loopPending.join(',')})`);

  // it must go up then come back down — that shape is the whole point
  const rise = depths.slice(0, depths.indexOf(peak) + 1);
  const fall = depths.slice(depths.indexOf(peak));
  ok(rise.every((v, i) => i === 0 || v >= rise[i - 1]), `the stack grows on the way down (${rise.join(' → ')})`);
  ok(fall.every((v, i) => i === 0 || v <= fall[i - 1]), `and shrinks on the way back up (${fall.join(' → ')})`);
  ok(depths[depths.length - 1] === 0, 'and ends empty');
}

/* ============ 3. no arithmetic happens on the way down ============ */
console.log('\n=== 3. Nothing is computed until the base case answers ===');
{
  win.eval('lrReset()');
  await sleep(60);
  // step until the base case appears, checking no frame has resolved before it
  let sawBase = false, resolvedBeforeBase = 0, steps = 0;
  while (steps++ < 20 && !sawBase) {
    const frames = [...doc.querySelectorAll('#lrRecState .lrFrame')];
    if (frames.some(f => f.classList.contains('base'))) { sawBase = true; break; }
    resolvedBeforeBase += frames.filter(f => f.classList.contains('resolved')).length;
    win.eval('lrStep()');
  }
  ok(sawBase, 'the base case is reached');
  ok(resolvedBeforeBase === 0,
     `not one call produced a value before the base case answered (${resolvedBeforeBase} did)`);
  const frozen = doc.querySelectorAll('#lrRecState .lrFrame.frozen').length;
  ok(frozen === 3, `at the moment the base case answers, ${frozen} calls are still stacked above it waiting`);
  ok(/\?/.test(txt('lrRecState')), 'the frozen calls visibly show an unknown "?" they are stuck on');
}

/* ============ 4. same answer, reverse order ============ */
console.log('\n=== 4. Same answer, computed backwards ===');
{
  win.eval('lrReset()');
  let g = 0;
  while (g++ < 25 && !win.eval('lrStep()')) {}
  const loopTxt = txt('lrLoopState'), recTxt = txt('lrRecState'), verdict = txt('lrVerdict');
  ok(/total = 12/.test(loopTxt), `the loop answers 12 (${loopTxt.match(/total = \d+/)})`);
  ok(/12/.test(verdict) || /12/.test(recTxt), 'recursion answers 12 as well — same result');
  ok(/most so far: 4/.test(recTxt), 'the peak stack depth is reported to the student');
  ok(/reverse/i.test(verdict), 'the verdict points out the answers came back in reverse order');
  ok(/stack overflow/i.test(verdict), 'and connects the pile of calls to stack overflow');
  ok(verdict.length > 300, `the verdict is a real explanation (${verdict.length} chars)`);
}

/* ============ 5. the maths is actually right ============ */
console.log('\n=== 5. The numbers are correct, not just plausible ===');
{
  const arr = win.eval('JSON.stringify(LR_ARR)');
  const a = JSON.parse(arr);
  const expected = a.reduce((x, y) => x + y, 0);
  ok(expected === 12, `${a.join(' + ')} = ${expected}`);

  const loopSteps = JSON.parse(win.eval('JSON.stringify(lrBuildLoop())'));
  ok(loopSteps[loopSteps.length - 1].total === expected, 'the loop script ends on the true sum');
  const runningTotals = loopSteps.map(s => s.total);
  ok(runningTotals.join(',') === '0,3,10,12,12', `the loop totals climb correctly (${runningTotals.join(' → ')})`);

  const recSteps = JSON.parse(win.eval('JSON.stringify(lrBuildRec())'));
  ok(recSteps[recSteps.length - 1].result === expected, 'the recursion script ends on the same true sum');
  // every resolved frame must equal the sum of the tail from its index
  let bad = 0;
  recSteps.forEach(st => (st.frames || []).forEach(f => {
    if (f.result !== null && !f.base) {
      const tail = a.slice(f.i).reduce((x, y) => x + y, 0);
      if (f.result !== tail) bad++;
    }
  }));
  ok(bad === 0, `every returned value equals the sum of the rest of the list (${bad} wrong)`);
}

/* ============ 6. the cinema now shows a crowd waiting, not one person ============ */
console.log('\n=== 6. The cinema game shows the pile-up ===');
{
  const d = (await boot()).window.document;
  d.getElementById('cinemaAskBtn').click();
  d.getElementById('cinemaAskBtn').click();
  const waiting = d.querySelectorAll('#cinemaRow .seatBody.waiting').length;
  ok(waiting >= 2, `after two asks, ${waiting} people are shown frozen waiting — not just the current one`);
  ok(d.querySelectorAll('#cinemaRow .waitTag').length === waiting, 'each is labelled as waiting');
  const cnt = d.getElementById('cinemaWaiting').textContent;
  ok(/frozen mid-question/.test(cnt), `and the count is spelled out (${cnt.replace(/\s+/g, ' ').slice(0, 70)})`);
  ok(/loop would have/i.test(cnt), 'with the direct comparison to a loop right there');

  // keep going to the base case
  for (let i = 0; i < 10; i++) d.getElementById('cinemaAskBtn').click();
  ok(d.querySelectorAll('#cinemaRow .seatBody.answered').length > 0, 'answers do come back');
  ok(/reverse/i.test(d.getElementById('cinemaWaiting').textContent) ||
     /reverse/i.test(d.getElementById('cinemaFb').textContent),
     'and the reverse order is called out at the end');
}

/* ============ 7. the rest of the page is unharmed ============ */
console.log('\n=== 7. Nothing else broke ===');
{
  const d = (await boot()).window.document;
  ok(d.querySelectorAll('.analogy').length === 5, 'all 5 analogies still present');
  ok(d.querySelectorAll('#regArt svg').length === 1, 'the attendance register is still drawn');
  ok(d.querySelectorAll('#vmArt svg').length === 1, 'the vending machine is still drawn');
  ok(d.querySelectorAll('#cinemaRow .seat').length === 5, 'the cinema still has its 5 seats');
  ok(d.querySelectorAll('.lvlBtn').length === 3, 'the difficulty levels still work');
  ok(d.body.textContent.replace(/\s+/g, ' ').trim().length > 4000, 'the page still renders fully');
}

console.log('\n' + (allPass ? '*** ALL RECURSION-VS-LOOP TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
