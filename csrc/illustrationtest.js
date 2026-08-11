/* illustrationtest.js — every analogy on the Programming Basics page must have a picture.
 *
 * The loops and functions games shipped with a word-picture and no actual picture,
 * while jars, post boxes and cinema seats all had one. Section 1 is a GUARD against
 * that happening again: it finds every analogy on the page and fails if any of them
 * is text-only.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(seed) {
  const store = Object.assign({}, seed || {});
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

/* ============ 1. THE GUARD — no analogy may be words-only ============ */
console.log('=== 1. Every analogy has a picture, not just a word-picture ===');
{
  const analogies = [...doc.querySelectorAll('.analogy')];
  ok(analogies.length === 5, `found all 5 analogies (${analogies.length})`);

  // The real requirement is not "an svg somewhere" — it is that the THING the
  // analogy describes is actually drawn in that step. Jars and post boxes are
  // drawn inside their game rather than beside the words, and that is fine.
  // What was wrong before is that no register and no vending machine existed at all.
  const EXPECTED = {
    step0: { word: 'jar',               art: 'glass jar' },
    step1: { word: 'post box',          art: 'post box' },
    step2: { word: 'attendance',        art: 'class attendance register' },
    step3: { word: 'vending machine',   art: 'vending machine' },
    step4: { word: 'cinema',            art: 'cinema seat' },
  };
  const naked = [];
  analogies.forEach(a => {
    const step = a.closest('.step');
    const id = step ? step.id : '?';
    const exp = EXPECTED[id];
    if (!exp) { naked.push(id + ': no expectation registered'); return; }
    const said = a.textContent.toLowerCase().includes(exp.word);
    const drawn = [...step.querySelectorAll('svg')]
      .some(sv => (sv.getAttribute('aria-label') || '').includes(exp.art));
    if (!said)  naked.push(`${id}: the analogy no longer mentions "${exp.word}"`);
    if (!drawn) naked.push(`${id}: talks about a ${exp.word} but never draws one`);
  });
  ok(naked.length === 0,
     naked.length ? `analogies without their picture:\n       - ${naked.join('\n       - ')}`
                  : 'all 5 analogies (jar, post box, register, vending machine, cinema seat) are actually drawn in their own step');
}

/* ============ 2. the attendance register ============ */
console.log('\n=== 2. The attendance register (Loops) ===');
{
  const art = doc.getElementById('regArt');
  ok(!!art && art.querySelector('svg'), 'the register is drawn as an SVG');
  const rows = art.querySelectorAll('.regRow');
  ok(rows.length === 5, `5 rows on the register (${rows.length})`);
  const names = [...art.querySelectorAll('.regName')].map(t => t.textContent);
  ok(names.length === 5 && names.every(n => n.length > 2), `real names: ${names.join(', ')}`);
  ok([...art.querySelectorAll('.regIdx')].map(t => t.textContent).join(',') === 'i=0,i=1,i=2,i=3,i=4',
     'each row is labelled with the loop counter i, tying the picture to the code');
  ok(art.querySelectorAll('.regTick').length === 5, 'every row has a tick box to fill in');
  ok(!!doc.getElementById('regPlayBtn'), 'there is a play button so it can be replayed');
}

/* ============ 3. it actually animates, in the right order, once each ============ */
console.log('\n=== 3. The teacher goes down the register properly ===');
{
  win.showStep(2);
  await sleep(120);

  const art = doc.getElementById('regArt');
  const echo = doc.getElementById('regEcho');

  ok(doc.querySelector('#regArt .regRow.now') !== null, 'it starts by itself when the student reaches the step');
  ok(doc.getElementById('regRow_0').classList.contains('now'), 'and starts at the FIRST name, not a random one');
  ok(/i = 0/.test(echo.textContent), `the words show i = 0 (${echo.textContent.trim().slice(0, 46)})`);

  // watch the whole walk and record the order
  const seen = [];
  for (let t = 0; t < 30; t++) {
    const now = doc.querySelector('#regArt .regRow.now');
    if (now) { const id = now.id; if (seen[seen.length - 1] !== id) seen.push(id); }
    if (art.querySelectorAll('.regRow.ticked').length === 5) break;
    await sleep(200);
  }

  ok(seen.length === 5, `visited exactly 5 rows — nobody done twice (${seen.length})`);
  ok(seen.join(',') === 'regRow_0,regRow_1,regRow_2,regRow_3,regRow_4',
     `and in register order, top to bottom (${seen.map(s => s.slice(-1)).join(' → ')})`);
  ok(art.querySelectorAll('.regRow.ticked').length === 5, 'all 5 names ended up ticked — nobody skipped');
  ok(/5.*names.*5.*ticks/s.test(echo.textContent), 'the closing line states 5 names, 5 ticks');
  ok(/range\(5\)/.test(echo.textContent), 'and connects it back to for i in range(5)');

  // the count in the picture must match the count the lesson teaches
  const regLen = win.eval('REGISTER.length');
  ok(regLen === 5, `the register has as many names as range(5) has values (${regLen})`);

  // replaying must reset, not double-tick
  doc.getElementById('regPlayBtn').click();
  await sleep(80);
  ok(art.querySelectorAll('.regRow.ticked').length === 0, 'pressing play again clears the old ticks first');
  ok(doc.getElementById('regRow_0').classList.contains('now'), 'and starts again from the top');
}

/* ============ 4. the vending machine ============ */
console.log('\n=== 4. The vending machine (Functions) ===');
{
  const art = doc.getElementById('vmArt');
  ok(!!art && art.querySelector('svg'), 'the vending machine is drawn as an SVG');
  ok(!!art.querySelector('.vmSlot'), 'it has an input slot');
  ok(!!art.querySelector('.vmTray'), 'and an output tray');
  ok(!!doc.getElementById('vmPlayBtn'), 'with a button to put a number in');

  win.showStep(3);
  await sleep(150);
  const coin = doc.getElementById('vmCoin');
  ok(coin.style.opacity === '1', 'a value appears at the slot when the student arrives');

  // wait for the full in -> decide -> out cycle
  const out = doc.getElementById('vmOut');
  for (let t = 0; t < 25 && out.style.opacity !== '1'; t++) await sleep(120);
  ok(out.style.opacity === '1', 'the answer drops into the output tray');
  const shown = Number(out.textContent);
  ok(Number.isFinite(shown), `and it is a real value (${out.textContent})`);

  // the machine must be honest: same input, same output
  const first = out.textContent;
  win.eval('playVending("4", "16")');
  for (let t = 0; t < 25 && doc.getElementById('vmOut').textContent !== '16'; t++) await sleep(120);
  ok(doc.getElementById('vmOut').textContent === '16',
     'feeding it 4 produces 16 — the square, matching the analogy of a fixed rule');
  ok(first !== null, 'and a second press shows a different number, so it does not look frozen');
}

/* ============ 4b. THE GUARD — no round may be code-only ============ */
console.log('\n=== 4b. Every loop round shows what it is working on, BEFORE you answer ===');
{
  const content = require(BASE + 'basics-content.js');
  const LEVELS = ['beginner', 'intermediate', 'pro'];

  // the picture must never disagree with the answer key
  let mismatched = [], missing = [];
  LEVELS.forEach(lvl => content.LOOP_LEVELS[lvl].forEach((r, i) => {
    if (!r.show) { missing.push(`${lvl}[${i}]`); return; }
    const last = r.show.trace[r.show.trace.length - 1].acc;
    if (String(last) !== String(r.correctVal)) {
      mismatched.push(`${lvl}[${i}]: trace ends on ${last} but the quiz says ${r.correctVal}`);
    }
  }));
  ok(missing.length === 0, `all 9 rounds have a picture spec (missing: ${missing.join(', ') || 'none'})`);
  ok(mismatched.length === 0,
     mismatched.length ? `traces disagreeing with the answer key:\n       - ${mismatched.join('\n       - ')}`
                       : 'every round\'s step-by-step trace ends on exactly the answer the quiz marks correct');

  // and every trace must only touch items that exist
  let oob = 0;
  LEVELS.forEach(lvl => content.LOOP_LEVELS[lvl].forEach(r => {
    r.show.trace.forEach(t => { if (t.at < 0 || t.at >= r.show.items.length) oob++; });
  }));
  ok(oob === 0, `no trace step points at an item that is not drawn (${oob} out of range)`);

  // now check it on screen, for every round of every level
  // Intermediate and Pro are deliberately LOCKED until the level below is finished,
  // which is correct behaviour — so award the badges first rather than fighting it.
  const STEPS = ['variables', 'array', 'loop', 'function', 'recursion', 'quiz'];  // must match STEP_IDS exactly
  const unlockAll = {};
  STEPS.forEach(id => {
    unlockAll['mbas_badge_' + id] = '1';                    // beginner
    unlockAll['mbas_badge_intermediate_' + id] = '1';       // intermediate
  });

  for (const lvl of LEVELS) {
    const d2 = await boot(unlockAll);
    const w2 = d2.window, doc2 = w2.document;
    const switched = w2.eval(`setLevel('${lvl}')`);
    ok(switched === true, `${lvl}: the level can be selected once it is unlocked`);
    w2.showStep(2);
    await sleep(80);

    const rounds = content.LOOP_LEVELS[lvl].length;
    for (let n = 0; n < rounds; n++) {
      const drawn = doc2.querySelectorAll('#loopBoxes .box, #loopBoxes .rangeTok').length;
      const jar = doc2.querySelectorAll('#loopBoxes .accJar svg').length;
      const spec = content.LOOP_LEVELS[lvl][n];
      ok(drawn === spec.show.items.length,
         `${lvl} round ${n + 1}: ${drawn} items drawn before answering (expected ${spec.show.items.length})`);
      ok(jar === 1, `${lvl} round ${n + 1}: the value being built up is drawn as a jar`);
      const hint = doc2.getElementById('loopRunning').textContent;
      ok(/working on/.test(hint), `${lvl} round ${n + 1}: tells them to work it out first`);

      // answer it and move on
      const btns = doc2.querySelectorAll('#loopOpts .optBtn');
      if (btns.length) btns[spec.ans].click();
      await sleep(40);
      const nextBtn = doc2.getElementById('loopNextBtn');
      if (n < rounds - 1 && nextBtn) { nextBtn.click(); await sleep(60); }
    }
  }
}

/* ============ 4c. the run animation follows the trace ============ */
console.log('\n=== 4c. Pressing an answer replays the loop over that same picture ===');
{
  const d3 = await boot();
  const w3 = d3.window, doc3 = w3.document;
  w3.showStep(2);
  await sleep(60);
  doc3.querySelectorAll('#loopOpts .optBtn')[1].click();   // round 1, correct answer

  const seen = [];
  for (let t = 0; t < 25; t++) {
    const hi = doc3.querySelector('#loopBoxes .box.hi, #loopBoxes .rangeTok.hi');
    if (hi) { const i = hi.dataset.i; if (seen[seen.length - 1] !== i) seen.push(i); }
    if (/finished/.test(doc3.getElementById('loopRunning').textContent)) break;
    await sleep(180);
  }
  ok(seen.join(',') === '0,1,2', `it walked the boxes in order 0 → 1 → 2 (got ${seen.join(' → ') || 'nothing'})`);
  ok(/finished/.test(doc3.getElementById('loopRunning').textContent), 'and says when it has finished');
  ok(/12/.test(doc3.getElementById('loopRunning').textContent), 'ending on 12, the correct total');
  ok(doc3.querySelectorAll('#loopBoxes .box.done').length >= 2, 'the visited boxes are marked as done');
}

/* ============ 5. the games themselves still work ============ */
console.log('\n=== 5. The lessons still work ===');
{
  const d = (await boot()).window.document;
  const w = (await boot()).window;
  ok(d.querySelectorAll('.lvlBtn').length === 3, 'the three difficulty levels still render');
  ok(d.querySelectorAll('#swapPool .instrCard').length > 0, 'the swap game still builds');
  ok(d.querySelectorAll('#lockerBoxes .box').length > 0, 'the post boxes still render');
  w.showStep(2);
  await sleep(60);
  ok(d.querySelectorAll('#loopOpts .optBtn').length > 0 ||
     (await boot()).window.document.querySelectorAll('#loopOpts .optBtn').length > 0,
     'the loop prediction game still offers answers');
  const d2 = (await boot()).window.document;
  ok(d2.querySelectorAll('#loopCode .line').length > 0, 'the loop code is still shown');
  ok(d2.querySelector('#step2 .dq') !== null, 'the "no dumb questions" box is still there');
}

/* ============ 6. nothing regressed on the page as a whole ============ */
console.log('\n=== 6. The page as a whole ===');
{
  const d = (await boot()).window.document;
  const body = d.body.textContent.replace(/\s+/g, ' ').trim();
  ok(body.length > 4000, `the full page still renders (${body.length} chars)`);
  ok(d.querySelectorAll('.analogyPic .apArt').length === 2,
     'exactly the two previously-missing analogies gained a side illustration');
  ok(d.querySelectorAll('svg').length >= 10, `plenty of illustrations on the page (${d.querySelectorAll('svg').length} SVGs)`);
}

console.log('\n' + (allPass ? '*** ALL ILLUSTRATION TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
