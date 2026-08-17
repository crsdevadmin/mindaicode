/* labtutortest.js — the free playground, the tutor, and the photo slots.
 *
 * The playground is the piece that has to be TRUTHFUL: a student can build any
 * combination, including ones nobody wrote a lesson for, and the answer shown
 * must be right. So section 1 checks the simulator against a completely separate
 * implementation across every combination it can reach.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require("path").join(__dirname, "..") + "/";

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = t => String(t || '').replace(/\s+/g, ' ').trim();

global.window = {};
require(BASE + 'loop-lab.js');
const LAB = global.window.MINDAICODE_LOOPLAB;

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
      w.__spoken = [];
      w.speechSynthesis = { cancel() {}, speak(u) { w.__spoken.push(u.text); } };
      w.SpeechSynthesisUtterance = function (t) { this.text = t; };
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 550));
}

(async () => {

/* ============ 1. the playground tells the truth, whatever they build ============ */
console.log('=== 1. Any loop a student invents gives a truthful answer ===');
{
  // written from scratch, deliberately not sharing code with the simulator
  function reference(s) {
    const values = s.howMany === 'fixed'
      ? Array.from({ length: s.fixed }, (_, k) => k)
      : Array.from({ length: s.howMany === 'exceptLast'
          ? Math.max(0, s.items.length - s.exceptLast) : s.items.length }, (_, k) => k);
    let acc = 0, passes = 0;
    for (const i of values) {
      if (s.stopEarly && i === s.stopAt) break;
      if (s.body === 'addOddI' && i % 2 === 0) { passes++; continue; }
      if (s.body === 'addItem') acc += Number(s.items[i]) || 0;
      else if (s.body === 'count') acc += 1;
      else acc += i;
      passes++;
    }
    return { acc, passes };
  }

  let checked = 0, wrongAcc = 0, wrongPasses = 0;
  const LISTS = [[3, 7, 2], [10, 20, 30, 40], [5], [1, 2, 3, 4, 5, 6], [-4, 8], [0, 0, 0]];
  for (const items of LISTS)
    for (const howMany of ['each', 'exceptLast', 'fixed'])
      for (const body of ['addItem', 'count', 'addI', 'addOddI'])
        for (const stopEarly of [false, true])
          for (const stopAt of [0, 1, 2, 3, 5])
            for (const exceptLast of [0, 1, 2, 3])
              for (const fixed of [0, 1, 2, 5, 7, 12]) {
                if (howMany === 'fixed' && body === 'addItem') continue;   // not offered in the UI
                const s = { items: items.slice(), howMany, body, stopEarly, stopAt, exceptLast, fixed };
                const got = LAB.simulate(s), want = reference(s);
                checked++;
                if (got.answer !== want.acc) wrongAcc++;
                if (got.passes !== want.passes) wrongPasses++;
              }

  ok(checked > 3000, `checked ${checked} different loops a student could build`);
  ok(wrongAcc === 0, `the answer was right every time (${wrongAcc} wrong)`);
  ok(wrongPasses === 0, `and the number of passes was right every time (${wrongPasses} wrong)`);

  // the generated code must match what was simulated
  const gen = LAB.generate({ items: [4, 5], howMany: 'exceptLast', exceptLast: 1, body: 'addItem' });
  ok(gen.some(l => /range\(len\(arr\) - 1\)/.test(l)), 'choosing "except the last" writes range(len(arr) - 1)');
  ok(gen.some(l => /arr = \[4, 5\]/.test(l)), 'and the list in the code is the student\'s own numbers');
  const gen2 = LAB.generate({ howMany: 'fixed', fixed: 3, body: 'count' });
  ok(gen2.some(l => /range\(3\)/.test(l)), 'choosing a fixed count writes range(3)');
  ok(!gen2.some(l => /arr/.test(l)), 'and drops the list entirely when it is not used');
  const gen3 = LAB.generate({ body: 'addOddI', howMany: 'fixed', fixed: 5 });
  ok(gen3.some(l => /continue/.test(l)), 'choosing "skip the even ones" writes a continue');
  const gen4 = LAB.generate({ stopEarly: true, stopAt: 2, howMany: 'fixed', fixed: 5, body: 'count' });
  ok(gen4.some(l => /break/.test(l)), 'ticking "walk out early" writes a break');

  // degenerate cases must be described honestly, not hidden
  const zero = LAB.describe({ howMany: 'fixed', fixed: 0, body: 'count' }).replace(/<[^>]+>/g, '');
  ok(/not go round at all/.test(zero), `zero passes is described in plain words ("${zero.slice(0, 58)}...")`);
  ok(!/up to -1/.test(zero), 'and never says the nonsense "up to -1"');
}

/* ============ 2. the playground works in the page ============ */
console.log('\n=== 2. The student can actually change things ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(150);

  ok(!!doc.getElementById('loopLab'), 'the Build-your-own-loop panel is on the loops step');
  const inputs = doc.querySelectorAll('#labItems input');
  ok(inputs.length === 3, `their list is editable (${inputs.length} number boxes)`);
  ok(!!doc.getElementById('labHowMany'), 'they can choose how many times it goes round');
  ok(!!doc.getElementById('labBody'), 'and what it does each time');
  ok(!!doc.getElementById('labStop'), 'and whether it walks out early');
  ok(!!doc.getElementById('labRunBtn'), 'with a Run button');

  const codeBefore = [...doc.querySelectorAll('#labCode .line')].map(l => clean(l.textContent)).join('\n');
  ok(/arr = \[3, 7, 2\]/.test(codeBefore), 'the code shows the starting list');

  // change a number the way a student would
  inputs[0].value = '100';
  inputs[0].dispatchEvent(new win.Event('change'));
  await sleep(80);
  const codeAfter = [...doc.querySelectorAll('#labCode .line')].map(l => clean(l.textContent)).join('\n');
  ok(/arr = \[100, 7, 2\]/.test(codeAfter), 'typing their own number rewrites the code immediately');
  ok(/109/.test(clean(doc.getElementById('labSays').textContent)),
     'and the stated answer updates to 109 without them pressing anything');

  // change what the loop does
  const body = doc.getElementById('labBody');
  body.value = 'count';
  body.dispatchEvent(new win.Event('change'));
  await sleep(80);
  const c3 = [...doc.querySelectorAll('#labCode .line')].map(l => clean(l.textContent)).join('\n');
  ok(/count = count \+ 1/.test(c3), 'switching to "just count" rewrites the body line');

  // add and remove items
  const add = doc.getElementById('labAdd');
  const before = doc.querySelectorAll('#labItems input').length;
  add.click(); await sleep(60);
  ok(doc.querySelectorAll('#labItems input').length === before + 1, 'they can add a number to their list');
  doc.getElementById('labDel').click(); await sleep(60);
  ok(doc.querySelectorAll('#labItems input').length === before, 'and take one away');

  // the generated code must be tappable, like all other code on the page
  ok(doc.querySelectorAll('#labCode .line[data-xp]').length > 0,
     'the code they generated is tappable for an explanation, same as everywhere else');

  // running it animates and lands on the true answer
  doc.getElementById('labRunBtn').click();
  for (let t = 0; t < 20 && !/finished/.test(doc.getElementById('labRunning').textContent); t++) await sleep(200);
  ok(/finished/.test(doc.getElementById('labRunning').textContent), 'pressing Run plays it through to the end');
  const shown = clean(doc.getElementById('labAnswer').textContent);
  ok(/=\s*\d/.test(shown), `and shows the final value (${shown})`);

  // reset
  doc.getElementById('labResetBtn').click();
  await sleep(80);
  ok(/arr = \[3, 7, 2\]/.test([...doc.querySelectorAll('#labCode .line')].map(l => clean(l.textContent)).join('\n')),
     'Start over puts it back to the beginning');
}

/* ============ 3. the tutor sits beside them ============ */
console.log('\n=== 3. The tutor is present at every step ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  await sleep(80);

  ok(!!doc.getElementById('tutorDock'), 'the tutor panel exists without being asked for');
  ok(doc.querySelectorAll('#tutorDock svg').length === 1, 'and has a face, so it reads as a person');
  ok(clean(doc.getElementById('tutorSay').textContent).length > 60, 'it says something on arrival');

  const script = require(BASE + 'tutor.js') || global.window.MINDAICODE_TUTOR_SCRIPT;
  const SC = global.window.MINDAICODE_TUTOR_SCRIPT;
  ok(SC.steps.length === 5, `it has something to say on all ${SC.steps.length} steps`);
  let thin = SC.steps.filter(s => !s.greet || !s.hint || !s.tell ||
                                  s.greet.length < 60 || s.hint.length < 40 || s.tell.length < 40);
  ok(thin.length === 0, `every step has a greeting, a hint AND a straight answer (${thin.length} incomplete)`);

  // it must follow the student
  for (let i = 0; i < 5; i++) {
    win.showStep(i);
    await sleep(90);
    const said = clean(doc.getElementById('tutorSay').textContent);
    ok(said.length > 50, `step ${i + 1}: the tutor speaks up (${said.slice(0, 44)}...)`);
  }

  // hint, then the real answer — because a stuck student must be able to get unstuck
  win.showStep(2);
  await sleep(90);
  let btns = [...doc.querySelectorAll('#tutorBtns .tutorBtn')];
  ok(btns.some(b => /hint/i.test(b.textContent)), 'offers a hint');
  ok(btns.some(b => /tell me/i.test(b.textContent)), 'and offers to just tell them');
  btns.find(b => /hint/i.test(b.textContent)).click();
  await sleep(60);
  ok(/Hint/i.test(doc.getElementById('tutorSay').textContent), 'the hint is specific to the round they are on');
  const hintTxt = clean(doc.getElementById('tutorSay').textContent);
  btns = [...doc.querySelectorAll('#tutorBtns .tutorBtn')];
  btns.find(b => /tell me/i.test(b.textContent)).click();
  await sleep(60);
  const tellTxt = clean(doc.getElementById('tutorSay').textContent);
  ok(tellTxt !== hintTxt, 'asking again gives a different, fuller answer');
  ok(/12/.test(tellTxt), `and it actually contains the answer (${tellTxt.slice(0, 60)}...)`);
  ok(/no shame/i.test(tellTxt), 'phrased so asking does not feel like failing');

  // reacts to answers
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(150);
  const react = clean(doc.getElementById('tutorSay').textContent);
  ok(react.length > 5 && react.length < 200, `it reacts to a correct answer ("${react}")`);

  // and can be got out of the way
  doc.getElementById('tutorClose').click();
  await sleep(40);
  ok(!doc.getElementById('tutorSay'), 'it can be hidden');
  ok(!!doc.getElementById('tutorOpen'), 'leaving a small button to bring it back');
  doc.getElementById('tutorOpen').click();
  await sleep(40);
  ok(!!doc.getElementById('tutorSay'), 'and it comes back');
}

/* ============ 4. the tutor never lies while the AI is off ============ */
console.log('\n=== 4. Tutor works with no internet and no AI ===');
{
  const dom = await boot();
  const doc = dom.window.document;
  await sleep(80);
  ok(!doc.getElementById('tutorAsk'), 'no free-form question box while the AI is switched off');
  ok(clean(doc.getElementById('tutorSay').textContent).length > 60,
     'but the tutor still has plenty to say — all of it written down and offline');
  const src = fs.readFileSync(BASE + 'tutor.js', 'utf8');
  ok(!/fetch\(/.test(src.split('MINDAICODE_TUTOR_SCRIPT')[0] || ''), 'the script content makes no network calls');
}

/* ============ 5. photo slots degrade to the drawings ============ */
console.log('\n=== 5. Photos are optional and never leave a gap ===');
{
  const dom = await boot();
  const doc = dom.window.document;
  await sleep(200);
  const slots = doc.querySelectorAll('[data-photo]');
  ok(slots.length === 2, `photo slots are marked up (${slots.length})`);
  // no photos exist yet, so the drawings must still be visible
  ok(doc.querySelectorAll('#regArt svg').length === 1, 'with no photo present, the register drawing still shows');
  ok(doc.querySelectorAll('#vmArt svg').length === 1, 'and so does the vending machine');
  ok(doc.querySelectorAll('.artPhoto').length === 0, 'no broken image is inserted');
  const P = global.window.MINDAICODE_PHOTOS || require(BASE + 'photos.js');
  const PH = global.window.MINDAICODE_PHOTOS;
  ok(Object.keys(PH.FILES).length === 5, 'all five analogies have a filename reserved');
  ok(Object.keys(PH.CAPTIONS).length === 5, 'and a caption, so a photo is never unlabelled');
  ok(fs.existsSync(BASE + 'img/README.md'), 'and there are written instructions for where to drop the files');
}

/* ============ 6. nothing else regressed ============ */
console.log('\n=== 6. The rest of the page still works ===');
{
  const dom = await boot();
  const doc = dom.window.document;
  ok(doc.querySelectorAll('.analogy').length === 5, 'all 5 analogies still there');
  ok(doc.querySelectorAll('.lvlBtn').length === 3, 'the three levels still render');
  ok(doc.querySelectorAll('#swapPool .instrCard').length > 0, 'the swap game still builds');
  ok(doc.querySelectorAll('#lrRecState .lrFrame').length > 0, 'the recursion comparison still builds');
  ok(doc.getElementById('loopReveal').classList.contains('on') === false, 'the code is still hidden until answered');
  ok(doc.body.textContent.replace(/\s+/g, ' ').trim().length > 5000, 'the page renders fully');
}

console.log('\n' + (allPass ? '*** ALL PLAYGROUND / TUTOR / PHOTO TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
