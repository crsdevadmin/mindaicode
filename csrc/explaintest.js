/* explaintest.js — the line decoder.
 *
 * A wrong explanation is worse than none: a beginner cannot tell it is wrong and
 * will carry the mistake for months. So section 2 checks specific lines against
 * hand-written expected meanings, and section 1 guarantees no line the site shows
 * falls through to a useless generic answer.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require("path").join(__dirname, "..") + "/";

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* the decoder runs headless — no browser needed */
global.window = {};
require(BASE + 'explain.js');
const E = global.window.MINDAICODE_EXPLAIN;
const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

/* every code line the basics page can put in front of a student */
function allLines() {
  const c = require(BASE + 'basics-content.js');
  const out = new Set();
  const grab = o => {
    if (!o) return;
    if (Array.isArray(o)) return o.forEach(grab);
    if (typeof o === 'object') {
      if (Array.isArray(o.code)) o.code.forEach(l => out.add(String(l)));
      if (typeof o.text === 'string' && /[=^+\-]/.test(o.text)) out.add(o.text);
      Object.values(o).forEach(grab);
    }
  };
  [c.LOOP_LEVELS, c.FN_LEVELS, c.REC_LEVELS, c.LOCKER_LEVELS, c.SWAP_LEVELS].forEach(grab);
  return [...out].filter(l => l.trim());
}

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
  return new Promise(r => setTimeout(() => r(dom), 450));
}

(async () => {

/* ============ 1. no line the student can see is left unexplained ============ */
console.log('=== 1. Every line the site shows has a real explanation ===');
{
  const lines = allLines();
  ok(lines.length > 70, `checking every code line on the page (${lines.length})`);

  const generic = lines.filter(l => E.decodeLine(l).rule === 'unknown');
  ok(generic.length === 0,
     generic.length ? `these lines fall through to a useless generic answer:\n       - ${generic.map(l => JSON.stringify(l)).join('\n       - ')}`
                    : 'not one line falls through to a generic "this line runs X" non-answer');

  // and the explanations must actually be explanations
  let thin = [], noDeeper = [];
  lines.forEach(l => {
    const d = E.decodeLine(l);
    if (plain(d.reading).length < 40) thin.push(l + '  ->  ' + plain(d.reading));
    if (plain(d.deeper).length < 60) noDeeper.push(l);
  });
  ok(thin.length === 0, `every reading is a full sentence, not a label (${thin.length} too short)`);
  ok(noDeeper.length === 0, `every line has a second, different explanation for "I still don't get it" (${noDeeper.length} missing)`);

  // the deeper answer must not just repeat the reading
  let repeats = lines.filter(l => { const d = E.decodeLine(l); return plain(d.deeper) === plain(d.reading); });
  ok(repeats.length === 0, `"I still don't get it" never just repeats the same words (${repeats.length} repeats)`);
}

/* ============ 2. hand-checked meanings ============ */
console.log('\n=== 2. The explanations are correct, checked line by line ===');
{
  const CASES = [
    // the line that started all this
    ['    total = total + arr[i]', [/what it holds right now/i, /add/i, /back into total/i],
      'the accumulate line explains right-side-first and put-back'],
    // "=" must never be described as equals
    ['x = 5', [/put the number 5 into x/i], 'assignment says "put into"'],
    // counting from zero
    ['arr = [3, 7, 2]', [/row of 3 items/i, /position 0, not 1/i], 'list literal warns that counting starts at 0'],
    ['for i in range(5):', [/5 times/i, /0, 1, 2, 3, 4/, /never/i], 'range(5) states all five values and that 5 is excluded'],
    ['for i in range(len(arr)):', [/every item in arr/i, /position/i], 'range(len(arr)) explains i is a position'],
    ['for i in range(len(arr) - 1):', [/except the last/i], 'the -1 version says the last item is skipped'],
    ['for i in range(0, 10, 3):', [/0, 3, 6, 9/, /4/], 'start/stop/step lists the actual values and the count'],
    ['for x in a:', [/is.*the item/i, /not a position/i], 'for-each explains x is the value, not the index'],
    // the classic == vs = trap
    ['    if i == 3:', [/exactly the same as/i], 'if with == is phrased as a question'],
    ['    if i % 2 == 0:', [/divide/i, /even/i], 'modulo 2 is explained as an even test'],
    ['while i < 5:', [/as long as/i, /before each pass/i], 'while explains the check happens before each pass'],
    // loop escapes, which the Intermediate rounds turn on
    ['        break', [/immediately/i], 'break says the whole loop ends'],
    ['        continue', [/next one/i], 'continue says only this pass ends'],
    // functions
    ['def grade(score):', [/nothing happens yet/i], 'def makes clear the body does not run yet'],
    ['        return 1        # base case', [/send/i, /stop the function/i], 'return explains both jobs it does'],
    ['    r.append(i)', [/end of the list/i, /longer/i], 'append explains where the item goes'],
    ['        a.remove(x)', [/first/i, /shuffles left/i], 'remove warns that later items shift left'],
    ['print(x)', [/current value of x/i], 'print without quotes shows a value'],
    ['        print("Liftoff!")', [/exact text/i], 'print with quotes shows the characters themselves'],
    ['    arr[j], arr[j+1] = arr[j+1], arr[j]', [/swap/i], 'the tuple swap is recognised as a swap'],
    ['countdown(4)', [/run the function/i, /carry on/i], 'a call explains control jumps and comes back'],
  ];

  for (const [line, needles, why] of CASES) {
    const d = E.decodeLine(line);
    // the chunk labels are on screen too, so they count as part of the explanation
    const text = plain(d.reading) + ' || ' + plain(d.deeper) + ' || ' + d.chunks.map(c => c.l).join(' | ');
    const missing = needles.filter(re => !re.test(text));
    ok(missing.length === 0, `${why}${missing.length ? ' — missing ' + missing.join(', ') : ''}`);
  }

  // "=" must NEVER be called "equals" anywhere in the decoder
  const allText = allLines().map(l => { const d = E.decodeLine(l); return plain(d.reading) + ' ' + plain(d.deeper) + ' ' + d.chunks.map(c => c.l).join(' '); }).join(' ');
  ok(!/\bequals\b/i.test(allText.replace(/NOT "equals"/gi, '')),
     'nothing ever calls a single "=" sign "equals" — that is the misconception being corrected');
}

/* ============ 3. the two things the page never taught ============ */
console.log('\n=== 3. Indentation and the colon are finally explained ===');
{
  const indented = E.decodeLine('    total = total + arr[i]');
  const indentChunk = indented.chunks.find(c => c.k === 'indent');
  ok(!!indentChunk, 'an indented line gets its own chunk for the indentation');
  ok(/inside/i.test(indentChunk.l) && /not decoration/i.test(indentChunk.l),
     'and it explains the spaces decide what is inside the block');

  const flat = E.decodeLine('x = 5');
  ok(!flat.chunks.some(c => c.k === 'indent'), 'a line with no indentation does not claim to be indented');

  const colonLine = E.decodeLine('for i in range(5):');
  const colon = colonLine.chunks.find(c => c.t === ':');
  ok(!!colon, 'the colon is its own tappable piece');
  ok(/indented below/i.test(colon.l), 'and it explains what the colon introduces');

  const commentOnly = E.decodeLine('# Does the change inside the function survive');
  ok(commentOnly.rule === 'commentOnly', 'a comment-only line is recognised as a comment');
  ok(/ignores it/i.test(plain(commentOnly.reading)), 'and says Python ignores it entirely');

  const withComment = E.decodeLine('    if n % 2 == 0:   # "%" gives the REMAINDER after dividing');
  ok(withComment.rule === 'ifMod', 'a trailing comment does not stop the code being understood');
  ok(withComment.chunks.some(c => c.k === 'comment'), 'and the comment is shown as its own piece');
}

/* ============ 4. tapping a line in the real page ============ */
console.log('\n=== 4. Tapping a line works in the page ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(150);

  // the code only exists after they answer — that is the agreed order
  ok(doc.querySelectorAll('#loopCode .line').length === 0, 'no code on screen while they work it out');
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(200);

  const lines = [...doc.querySelectorAll('#loopCode .line[data-xp]')];
  ok(lines.length >= 3, `once revealed, the loop code has ${lines.length} tappable lines`);
  ok(lines.every(l => l.getAttribute('role') === 'button' && l.getAttribute('tabindex') === '0'),
     'each is reachable by keyboard, not just mouse');
  const tip = [...doc.querySelectorAll('.xpTip')];
  ok(tip.length > 0 && /tap it/i.test(tip[0].textContent), 'the page tells them the lines are tappable');

  const target = lines.find(l => /total = total/.test(l.textContent));
  target.click();
  const panel = [...doc.querySelectorAll('.xpPanel.on')][0];
  ok(!!panel, 'tapping opens the decode panel');
  ok(panel.querySelectorAll('.xpChunk').length >= 5,
     `the line is broken into ${panel.querySelectorAll('.xpChunk').length} labelled pieces`);
  ok(/put into/i.test(panel.textContent), 'the "=" piece says put into');
  ok(/holds right now/i.test(panel.textContent.replace(/\s+/g, ' ')), 'and one piece marks the current value');

  // second explanation, on demand
  const more = panel.querySelector('.xpMore');
  ok(!!more, 'there is an "I still don\'t get it" button');
  ok(!panel.querySelector('.xpDeeper').classList.contains('on'), 'the longer answer is hidden until asked for');
  more.click();
  ok(panel.querySelector('.xpDeeper').classList.contains('on'), 'clicking it reveals a different explanation');
  ok(/right-to-left/i.test(panel.textContent), 'which gives a genuinely new angle');

  // tapping the same line closes it
  target.click();
  ok(doc.querySelectorAll('.xpPanel.on').length === 0, 'tapping the same line again closes the panel');

  // only one line open at a time
  lines[0].click(); lines[1].click();
  ok(doc.querySelectorAll('.line.xpOpen').length === 1, 'only one line is ever open at once');
}

/* ============ 5. it survives the games re-rendering their code ============ */
console.log('\n=== 5. Still works after the game moves on ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(150);
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(200);
  const before = doc.querySelectorAll('#loopCode .line[data-xp]').length;

  // answer round 1 and advance — this rewrites the code block
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(80);
  doc.getElementById('loopNextBtn').click();
  await sleep(250);
  ok(doc.querySelectorAll('#loopCode .line').length === 0,
     'the next round hides the code again, as it should');
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();   // answer round 2
  await sleep(250);

  const after = doc.querySelectorAll('#loopCode .line[data-xp]').length;
  ok(after > 0, `the new round's revealed lines are tappable too (${before} → ${after})`);
  ok(doc.querySelectorAll('#loopCode').length === 1, 'and no duplicate code block appeared');
  const panels = doc.querySelectorAll('.xpPanel');
  const perBlock = [...doc.querySelectorAll('.code')].map(c => {
    let n = 0;
    [...c.parentNode.children].forEach(ch => { if (ch.classList && ch.classList.contains('xpPanel')) n++; });
    return n;
  });
  ok(perBlock.every(n => n <= 1), `no code block piled up more than one panel (${perBlock.join(',')} — total ${panels.length})`);
}

/* ============ 6. read-aloud is off until asked for ============ */
console.log('\n=== 6. Voice: available, but silent until switched on ===');
{
  const dom = await boot();
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(150);
  doc.querySelectorAll('#loopOpts .optBtn')[1].click();   // reveal the code first
  await sleep(200);
  doc.querySelectorAll('#loopCode .line[data-xp]')[0].click();
  const panel = doc.querySelector('.xpPanel.on');

  ok(win.__spoken.length === 0, 'nothing is spoken just because a line was tapped');
  const auto = panel.querySelector('.xpAuto');
  ok(!!auto && auto.checked === false, 'auto read-aloud is OFF by default');
  const speak = panel.querySelector('.xpSpeak');
  ok(!!speak, 'but a "read this aloud" button is there for whoever wants it');

  speak.click();
  ok(win.__spoken.length === 1, 'pressing it speaks once');
  const said = win.__spoken[0];
  ok(!/[<>]/.test(said), 'the spoken text has no markup in it');
  ok(!/[=]/.test(said), 'no bare "=" is left for the voice to stumble over');
  ok(!/&(amp|lt|gt);/.test(said), 'no HTML entities leak into the speech');
  ok(said.length > 30 && /^[A-Z]/.test(said) && /\w \w/.test(said),
     `and it is a spoken sentence ("${said.slice(0, 60)}...")`);

  // a line that IS full of symbols must still come out speakable
  win.__spoken.length = 0;
  const symbolic = [...doc.querySelectorAll('#loopCode .line[data-xp]')]
    .find(l => /total = total/.test(l.textContent));
  if (symbolic) {
    symbolic.click();
    panel.parentNode.querySelector('.xpPanel.on').querySelector('.xpSpeak').click();
    const s2 = win.__spoken[win.__spoken.length - 1] || '';
    ok(!/[<>=]/.test(s2), `the symbol-heavy line is spoken without symbols ("${s2.slice(0, 60)}...")`);
  }

  // switching auto on is remembered
  auto.checked = true;
  auto.dispatchEvent(new win.Event('change'));
  ok(win.localStorage.getItem('mai_readaloud') === '1', 'the choice is remembered for next time');

  // and a device with no speech support must not break
  const dom2 = await boot();
  const w2 = dom2.window;
  delete w2.speechSynthesis;
  w2.showStep(2);
  await sleep(120);
  dom2.window.document.querySelectorAll('#loopOpts .optBtn')[1].click();
  await sleep(200);
  const l2 = dom2.window.document.querySelectorAll('#loopCode .line[data-xp]');
  ok(l2.length > 0, 'a device with no voice still gets the tappable lines');
}

/* ============ 7. the AI tutor hook is inert until configured ============ */
console.log('\n=== 7. The AI tutor hook changes nothing while it is off ===');
{
  const cfg = require(BASE + 'tutor-config.js');
  const T = global.window.MINDAICODE_TUTOR;
  ok(T.ENABLED === false, 'tutor-config.js ships DISABLED');
  ok(T.ENDPOINT === '', 'no endpoint is committed');
  const src = fs.readFileSync(BASE + 'tutor-config.js', 'utf8');
  ok(!/sk-|api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]/i.test(src), 'and no API key is anywhere in the file');
  ok(/never put an api key in this file/i.test(src), 'the file warns that it is public');
  ok(T.TIMEOUT_MS > 0 && T.MAX_QUESTION_CHARS > 0, 'there are limits so one student cannot hang the page or run up a bill');
  ok(/can be wrong/i.test(T.NOTICE), 'and the notice tells students an AI answer can be wrong');

  await T.ask('why?', {}).then(
    () => ok(false, 'asking while disabled should be refused'),
    e => ok(/tutor-disabled/.test(e.message), 'asking while disabled is refused rather than silently failing')
  );

  const dom = await boot();
  const doc = dom.window.document;
  dom.window.showStep(2);
  await sleep(150);
  doc.querySelectorAll('#loopCode .line[data-xp]')[0].click();
  const panel = doc.querySelector('.xpPanel.on');
  ok(!panel.querySelector('.xpAskBtn'), 'no "ask anything" button appears while the tutor is off');
  ok(!panel.querySelector('.xpAsk'), 'and no question box either');
  ok(panel.querySelectorAll('.xpChunk').length > 0, 'the written explanation works regardless — it is the fallback');
}

/* ============ 8. nothing else on the page broke ============ */
console.log('\n=== 8. The rest of the page still works ===');
{
  const dom = await boot();
  const doc = dom.window.document;
  ok(doc.querySelectorAll('.analogy').length === 5, 'all 5 analogies still there');
  ok(doc.querySelectorAll('#regArt svg').length === 1, 'the attendance register still draws');
  ok(doc.querySelectorAll('#vmArt svg').length === 1, 'the vending machine still draws');
  ok(doc.querySelectorAll('.lvlBtn').length === 3, 'the three levels still render');
  ok(doc.querySelectorAll('#swapPool .instrCard').length > 0, 'the swap game still builds');
  ok(doc.body.textContent.replace(/\s+/g, ' ').trim().length > 4000, 'the page renders fully');
}

console.log('\n' + (allPass ? '*** ALL LINE-DECODER TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
