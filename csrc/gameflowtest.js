/* gameflowtest.js — play first, THEN see the code.
 *
 * The agreed order is: give the student a job they can do from the picture, let
 * them answer it, and only then show the code as the name for what they just did.
 * The old flow required reading `range(len(arr) - 1)` before you could answer at
 * all, which is the opposite. These tests hold the new order in place.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = t => String(t || '').replace(/\s+/g, ' ').trim();

const CONTENT = require(BASE + 'basics-content.js');
const LEVELS = ['beginner', 'intermediate', 'pro'];
const STEPS = ['variables', 'array', 'loop', 'function', 'recursion', 'quiz'];
const UNLOCK = {};
STEPS.forEach(id => { UNLOCK['mbas_badge_' + id] = '1'; UNLOCK['mbas_badge_intermediate_' + id] = '1'; });

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
      w.speechSynthesis = { cancel() {}, speak() {} };
      w.SpeechSynthesisUtterance = function (t) { this.text = t; };
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 450));
}

(async () => {

/* ============ 1. every round has a job that needs no code to answer ============ */
console.log('=== 1. The job is answerable without reading any Python ===');
{
  // real syntax, not English words that happen to live inside keywords
  const SYNTAX = [
    [/range\s*\(/, 'range('], [/len\s*\(/, 'len('], [/\w\[\w/, 'indexing like arr[i]'],
    [/==/, '=='], [/[a-z_]+\s*=\s*[a-z0-9]/i, 'an assignment'], [/\bdef\b/, 'def'],
    [/\.append\b/, '.append'], [/%\s*\d/, '% number']
  ];
  let missing = [], leaked = [], badKey = [];
  LEVELS.forEach(lvl => CONTENT.LOOP_LEVELS[lvl].forEach((r, i) => {
    const at = `${lvl} round ${i + 1}`;
    if (!r.task) { missing.push(at); return; }
    const t = r.task.replace(/<[^>]+>/g, '');
    SYNTAX.forEach(([re, what]) => { if (re.test(t)) leaked.push(`${at}: task contains ${what}`); });
    if (r.keyLine === undefined || r.keyLine < 0 || r.keyLine >= r.code.length) badKey.push(at);
  }));
  ok(missing.length === 0, `all 9 rounds have a plain-language job (missing: ${missing.join(', ') || 'none'})`);
  ok(leaked.length === 0,
     leaked.length ? `these jobs still lean on syntax:\n       - ${leaked.join('\n       - ')}`
                   : 'not one job mentions range(), len(), indexing, == or an assignment');
  ok(badKey.length === 0, `every round marks which code line carries the lesson (${badKey.join(', ') || 'all valid'})`);

  // the job has to be long enough to actually be a job
  const short = [];
  LEVELS.forEach(lvl => CONTENT.LOOP_LEVELS[lvl].forEach((r, i) => {
    if (r.task.replace(/<[^>]+>/g, '').length < 70) short.push(`${lvl}[${i}]`);
  }));
  ok(short.length === 0, `each job is a full instruction, not a fragment (${short.join(', ') || 'all fine'})`);

  // and no round may still tell them to read a code line
  const pointsAtCode = [];
  LEVELS.forEach(lvl => CONTENT.LOOP_LEVELS[lvl].forEach((r, i) => {
    if (/line \d/i.test(r.task) || /look closely at line/i.test(r.question)) pointsAtCode.push(`${lvl}[${i}]`);
  }));
  ok(pointsAtCode.length === 0,
     `no round tells them to "look closely at line 3" any more (${pointsAtCode.join(', ') || 'none do'})`);
}

/* ============ 2. no code on screen while they are working it out ============ */
console.log('\n=== 2. The code stays hidden until they have answered ===');
for (const lvl of LEVELS) {
  const dom = await boot(UNLOCK);
  const doc = dom.window.document, win = dom.window;
  ok(win.eval(`setLevel('${lvl}')`) === true, `${lvl}: level selected`);
  win.showStep(2);
  await sleep(90);

  const rounds = CONTENT.LOOP_LEVELS[lvl];
  for (let n = 0; n < rounds.length; n++) {
    const at = `${lvl} round ${n + 1}`;
    const reveal = doc.getElementById('loopReveal');

    // --- before answering ---
    ok(!reveal.classList.contains('on'), `${at}: the code panel is hidden`);
    ok(doc.querySelectorAll('#loopCode .line').length === 0, `${at}: and genuinely empty, not just invisible`);
    ok(clean(doc.getElementById('loopTask').textContent).length > 60, `${at}: the job is on screen`);
    ok(/YOUR JOB/i.test(doc.getElementById('loopTask').textContent), `${at}: labelled as the job to do`);
    const drawn = doc.querySelectorAll('#loopBoxes .box, #loopBoxes .rangeTok').length;
    ok(drawn === rounds[n].show.items.length, `${at}: the picture is there to work from (${drawn} items)`);
    ok(doc.querySelectorAll('#loopOpts .optBtn').length > 0, `${at}: answers offered`);

    // --- answer it ---
    doc.querySelectorAll('#loopOpts .optBtn')[rounds[n].ans].click();
    await sleep(120);

    // --- after answering ---
    ok(reveal.classList.contains('on'), `${at}: NOW the code appears`);
    const lines = [...doc.querySelectorAll('#loopCode .line')];
    ok(lines.length === rounds[n].code.length, `${at}: all ${rounds[n].code.length} lines shown`);
    const key = lines.filter(l => l.classList.contains('keyLine'));
    ok(key.length === 1, `${at}: exactly one line is marked as the deciding one`);
    ok(clean(key[0].textContent).indexOf(clean(rounds[n].code[rounds[n].keyLine]).slice(0, 12)) === 0,
       `${at}: and it is the right line ("${clean(rounds[n].code[rounds[n].keyLine])}")`);
    const head = clean(doc.getElementById('loopRevealHead').textContent);
    ok(/how a programmer writes/i.test(head), `${at}: framed as "here is how you write what you just did"`);
    ok(/tap any line/i.test(head), `${at}: and points them at the decoder`);

    if (n < rounds.length - 1) { doc.getElementById('loopNextBtn').click(); await sleep(140); }
  }
}

/* ============ 3. the round the user was looking at ============ */
console.log('\n=== 3. Round 3 specifically — the one that needed line 3 read ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(90);
  // advance to round 3
  for (let n = 0; n < 2; n++) {
    doc.querySelectorAll('#loopOpts .optBtn')[CONTENT.LOOP_LEVELS.beginner[n].ans].click();
    await sleep(110);
    doc.getElementById('loopNextBtn').click();
    await sleep(140);
  }

  const job = clean(doc.getElementById('loopTask').textContent);
  ok(/stop before the last box/i.test(job), `the job says it in words: "${job.slice(12, 90)}..."`);
  ok(!/range|len\(/.test(job), 'without naming range() or len() at all');
  ok(!doc.getElementById('loopReveal').classList.contains('on'), 'and no code is visible while they count');

  const vals = [...doc.querySelectorAll('#loopBoxes .boxVal')].map(t => t.textContent);
  ok(vals.join(',') === '10,20,30,40', `all four boxes are drawn so it can be counted by hand (${vals.join(', ')})`);

  doc.querySelectorAll('#loopOpts .optBtn')[1].click();   // 60
  await sleep(150);
  ok(/without reading a single line of code/i.test(doc.getElementById('loopRevealHead').textContent),
     'answering correctly says so explicitly — they did it without code');
  const key = doc.querySelector('#loopCode .line.keyLine');
  ok(key && /range\(len\(arr\) - 1\)/.test(key.textContent),
     'and the revealed code highlights the -1 line as the one that decided it');
}

/* ============ 4. the decoder works on the revealed code ============ */
console.log('\n=== 4. The revealed code is tappable ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(90);
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(250);

  const lines = [...doc.querySelectorAll('#loopCode .line[data-xp]')];
  ok(lines.length > 0, `the newly revealed lines are tappable (${lines.length})`);
  const acc = lines.find(l => /total = total/.test(l.textContent));
  ok(!!acc, 'including the accumulate line');
  acc.click();
  await sleep(60);
  const panel = doc.querySelector('.xpPanel.on');
  ok(!!panel, 'tapping it opens the decode');
  ok(/put into/i.test(panel.textContent), 'and the "=" still says put into');
}

/* ============ 5. wrong answers are handled differently but still teach ============ */
console.log('\n=== 5. Getting it wrong still leads to the code ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(90);
  const wrong = CONTENT.LOOP_LEVELS.beginner[0].ans === 0 ? 1 : 0;
  doc.querySelectorAll('#loopOpts .optBtn')[wrong].click();
  await sleep(140);
  ok(doc.getElementById('loopReveal').classList.contains('on'), 'the code is revealed after a wrong answer too');
  const head = clean(doc.getElementById('loopRevealHead').textContent);
  ok(/now look at what the code was actually doing/i.test(head),
     'with a different, non-congratulatory opening');
  ok(!/without reading a single line/i.test(head), 'and it does not claim they got it right');
  ok(doc.querySelector('#loopCode .line.keyLine') !== null, 'the deciding line is still pointed out');
}

/* ============ 6. nothing else on the page broke ============ */
console.log('\n=== 6. The rest still works ===');
{
  const dom = await boot();
  const doc = dom.window.document;
  ok(doc.querySelectorAll('.analogy').length === 5, 'all 5 analogies still there');
  ok(doc.querySelectorAll('#regArt svg').length === 1, 'the register still draws');
  ok(doc.querySelectorAll('#vmArt svg').length === 1, 'the vending machine still draws');
  ok(doc.querySelectorAll('#lrRecState .lrFrame').length > 0, 'the recursion comparison still builds');
  ok(doc.querySelectorAll('.lvlBtn').length === 3, 'the three levels still render');
  ok(doc.body.textContent.replace(/\s+/g, ' ').trim().length > 4000, 'the page renders fully');
}

console.log('\n' + (allPass ? '*** ALL GAME-FLOW TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
