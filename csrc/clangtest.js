/* clangtest.js — proves the C and C++ tabs actually work on every algorithm page.
 *
 * Run:  npm install jsdom && node clangtest.js      (from the csrc/ folder)
 *
 * The C/C++ SOURCE correctness is proven separately by csrc/verify.sh (real gcc/g++
 * compilation + execution). This file proves the WEBSITE side: that the tabs appear,
 * switch, remember the student's choice, and keep the live line-highlighting working.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };

/* which panels each page is expected to gain C and C++ on */
const EXPECT = {
  'mindaicode-bubble-sort.html':       ['code'],
  'mindaicode-selection-sort.html':    ['code'],
  'mindaicode-insertion-sort.html':    ['code'],
  'mindaicode-merge-sort.html':        ['code'],
  'mindaicode-quick-sort.html':        ['code'],
  'mindaicode-heap-sort.html':         ['code'],
  'mindaicode-binary-search.html':     ['code'],
  'mindaicode-linear-structures.html': ['stack', 'queue', 'list'],
  'mindaicode-hashing.html':           ['hash'],
  'mindaicode-trees.html':             ['bst', 'heap'],
  'mindaicode-graphs.html':            ['bfs', 'dfs', 'dijk'],
  'mindaicode-recursion-dp.html':      ['knap'],
};

/* jsdom cannot fetch a relative <script src> from an https:// URL, so inline it */
function boot(page, store) {
  const langs = fs.readFileSync(BASE + 'code-langs.js', 'utf8');
  const html = fs.readFileSync(BASE + page, 'utf8')
    .replace('<script src="code-langs.js"></script>', '<script>' + langs + '</script>');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'https://crsdevadmin.github.io/mindaicode/' + page,
    beforeParse(w) {
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth',  { configurable: true, get() { return 1000; } });
      Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 380; } });
      Object.defineProperty(w, 'localStorage', { configurable: true, value: {
        get length() { return Object.keys(store).length; },
        key: i => Object.keys(store)[i] || null,
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; } } });
      w.AudioContext = function () { return { state:'running', resume(){}, createOscillator(){return{connect(){},start(){},stop(){},frequency:{}}}, createGain(){return{connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}}}, get currentTime(){return 0;} }; };
      w.speechSynthesis = { cancel(){}, speak(){} };
      w.SpeechSynthesisUtterance = function (t) { this.text = t; };
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 350));
}

(async () => {

/* ============ 1. every page gained C and C++ on every code panel ============ */
console.log('=== 1. C and C++ tabs exist everywhere ===');
for (const [page, bases] of Object.entries(EXPECT)) {
  const dom = await boot(page, {});
  const doc = dom.window.document;
  console.log('--- ' + page);

  for (const base of bases) {
    const py   = doc.getElementById(base + '-py');
    const java = doc.getElementById(base + '-java');
    const c    = doc.getElementById(base + '-c');
    const cpp  = doc.getElementById(base + '-cpp');
    ok(py && java && c && cpp, `${base}: all four panels present (Python, Java, C, C++)`);
    if (!c || !cpp) continue;

    ok(c.textContent.trim().length > 40,   `${base}: the C panel has real code in it`);
    ok(cpp.textContent.trim().length > 40, `${base}: the C++ panel has real code in it`);

    // C and C++ must be genuinely different, not the same text twice
    ok(c.textContent.trim() !== cpp.textContent.trim(),
       `${base}: C and C++ are different code, not a copy of each other`);

    // buttons, in the right order, labelled correctly
    let group = py.previousElementSibling;
    while (group && !group.classList.contains('tabs')) group = group.previousElementSibling;
    const labels = [...group.querySelectorAll('.tab')].map(t => t.textContent.trim());
    ok(labels.join(' | ') === 'Python | Java | C | C++',
       `${base}: tabs read "Python | Java | C | C++" (got "${labels.join(' | ')}")`);

    // exactly one panel visible at a time
    const wraps = [py, java, c, cpp];
    ok(wraps.filter(w => w.classList.contains('on')).length === 1,
       `${base}: exactly one panel is visible at a time`);
  }
}

/* ============ 2. clicking a tab actually switches the code ============ */
console.log('\n=== 2. Switching languages works ===');
{
  const dom = await boot('mindaicode-bubble-sort.html', {});
  const doc = dom.window.document;
  const tabs = {};
  doc.querySelectorAll('.tab[data-lang]').forEach(t => { tabs[t.dataset.lang] = t; });

  tabs.c.click();
  ok(doc.getElementById('code-c').classList.contains('on'), 'clicking C shows the C panel');
  ok(!doc.getElementById('code-py').classList.contains('on'), 'clicking C hides the Python panel');
  ok(tabs.c.classList.contains('on') && !tabs.py.classList.contains('on'), 'the C button is the highlighted one');
  ok(/int t = arr\[j\]/.test(doc.getElementById('code-c').textContent), 'the C code shows the manual temp-variable swap');

  tabs.cpp.click();
  ok(doc.getElementById('code-cpp').classList.contains('on'), 'clicking C++ shows the C++ panel');
  ok(!doc.getElementById('code-c').classList.contains('on'), 'clicking C++ hides the C panel');
  ok(/swap\(arr\[j\], arr\[j\+1\]\)/.test(doc.getElementById('code-cpp').textContent),
     'the C++ code uses std::swap instead — genuinely different from C');

  tabs.py.click();
  ok(doc.getElementById('code-py').classList.contains('on'), 'you can switch back to Python');
  ok(doc.querySelectorAll('.codeWrap.on').length === 1, 'still exactly one panel visible after switching around');
}

/* ============ 3. the choice is remembered — across sections and across visits ============ */
console.log('\n=== 3. The student\'s language is remembered ===');
{
  const store = {};
  const dom = await boot('mindaicode-bubble-sort.html', store);
  dom.window.document.querySelector('.tab[data-lang="cpp"]').click();
  ok(store['mai_codelang'] === 'cpp', 'picking C++ is saved to the browser');

  // a DIFFERENT page, same browser storage
  const dom2 = await boot('mindaicode-graphs.html', store);
  const doc2 = dom2.window.document;
  ok(doc2.getElementById('bfs-cpp').classList.contains('on'), 'C++ is already selected when they open the Graphs page');
  ok(doc2.getElementById('dfs-cpp').classList.contains('on'), '...on the DFS panel too');
  ok(doc2.getElementById('dijk-cpp').classList.contains('on'), '...and on Dijkstra');
  ok(!doc2.getElementById('bfs-py').classList.contains('on'), 'Python is not left showing underneath');

  // switching one section switches them all, so the page never shows two languages at once
  doc2.querySelector('[data-target="dfs-c"]').click();
  ok(doc2.getElementById('bfs-c').classList.contains('on') &&
     doc2.getElementById('dfs-c').classList.contains('on') &&
     doc2.getElementById('dijk-c').classList.contains('on'),
     'switching one section to C switches every section on the page');
  ok(store['mai_codelang'] === 'c', 'and the new choice is saved');

  // a page with no saved preference still defaults to Python
  const dom3 = await boot('mindaicode-trees.html', {});
  ok(dom3.window.document.getElementById('bst-py').classList.contains('on'),
     'a brand new student still starts on Python');
}

/* ============ 4. the live line-highlighting still follows C and C++ ============ */
console.log('\n=== 4. Line highlighting works in C and C++ ===');
for (const page of ['mindaicode-bubble-sort.html', 'mindaicode-quick-sort.html', 'mindaicode-binary-search.html']) {
  const dom = await boot(page, {});
  const doc = dom.window.document, win = dom.window;
  console.log('--- ' + page);

  for (const lg of ['c', 'cpp']) {
    const wrap = doc.getElementById('code-' + lg);
    const lines = [...wrap.querySelectorAll('.line')];
    ok(lines.length > 5, `${lg}: the panel is built out of individual .line rows`);

    const tagged = lines.filter(l => l.dataset.l !== undefined && l.dataset.l !== '');
    ok(tagged.length > 4, `${lg}: ${tagged.length} lines carry a data-l marker for highlighting`);

    // Every data-l a C/C++ line claims must be a step the page actually emits.
    // The reference is Python PLUS Java: the C-family panels legitimately have
    // closing-brace lines (8, 9, 10...) that Python has no equivalent for.
    const known = new Set([...doc.querySelectorAll('#code-py .line, #code-java .line')]
      .map(l => l.dataset.l).filter(v => v !== undefined && v !== ''));
    const stray = [...new Set(tagged.map(l => l.dataset.l))].filter(v => !known.has(v));
    ok(stray.length === 0, `${lg}: no line points at a step that doesn't exist (stray: ${stray.join(',') || 'none'})`);

    // The page's own highlight() must reach into the C/C++ panels. Some pages
    // compare data-l as a number, others as a string — a correct panel must
    // light up either way, so try both.
    if (typeof win.highlight === 'function') {
      const target = tagged[Math.floor(tagged.length / 2)].dataset.l;
      win.highlight([target]);
      let lit = wrap.querySelectorAll('.line.active').length;
      if (!lit) { win.highlight([+target]); lit = wrap.querySelectorAll('.line.active').length; }
      ok(lit > 0, `${lg}: highlight(${target}) lights up the ${lg.toUpperCase()} panel (${lit} lines)`);

      // and it must light the SAME step in every language, not a different one
      const inPy = [...doc.querySelectorAll('#code-py .line.active, #code-java .line.active')].length;
      ok(inPy > 0, `${lg}: the same step also lights up in the Python/Java panels — the tabs stay in sync`);
    }
  }
}

/* ============ 5. the AI explainer follows the selected language ============ */
console.log('\n=== 5. The explainer matches the tab that is showing ===');
for (const page of ['mindaicode-bubble-sort.html', 'mindaicode-selection-sort.html',
                    'mindaicode-insertion-sort.html', 'mindaicode-merge-sort.html']) {
  const dom = await boot(page, {});
  const doc = dom.window.document, win = dom.window;
  const pick = l => doc.querySelector(`.tab[data-lang="${l}"]`).click();

  pick('py');   ok(win.currentCodeLang() === 'py',   `${page}: Python selected -> Python explanation`);
  pick('java'); ok(win.currentCodeLang() === 'java', `${page}: Java selected -> Java explanation`);
  pick('c');    ok(win.currentCodeLang() === 'java', `${page}: C selected -> C-style explanation, NOT the Python one`);
  pick('cpp');  ok(win.currentCodeLang() === 'java', `${page}: C++ selected -> C-style explanation, NOT the Python one`);
  ok(win.MindAICodeLang.current() === 'cpp', `${page}: the exact tab is still reportable as "cpp"`);
}

/* ============ 6. nothing else on the page broke ============ */
console.log('\n=== 6. The rest of each page still works ===');
for (const page of Object.keys(EXPECT)) {
  const dom = await boot(page, {});
  const doc = dom.window.document;
  const errs = [];
  dom.window.addEventListener('error', e => errs.push(e.message));
  const body = doc.body.textContent.replace(/\s+/g, ' ').trim();
  ok(body.length > 800, `${page}: full lesson content still renders (${body.length} chars)`);
  ok(doc.querySelectorAll('.codeWrap.on').length >= 1, `${page}: at least one code panel is visible`);
  // no group should ever show two languages at once
  let bad = 0;
  doc.querySelectorAll('.tabs').forEach(g => {
    const wraps = []; let el = g.nextElementSibling;
    while (el && el.classList && el.classList.contains('codeWrap')) { wraps.push(el); el = el.nextElementSibling; }
    if (wraps.length && wraps.filter(w => w.classList.contains('on')).length !== 1) bad++;
  });
  ok(bad === 0, `${page}: every code group shows exactly one language`);
}

/* ============ 7. the shipped file matches the compiled sources ============ */
console.log('\n=== 7. The shipped code came from the verified sources ===');
{
  const js = fs.readFileSync(BASE + 'code-langs.js', 'utf8');
  ok(/GENERATED FILE/.test(js), 'code-langs.js is marked generated, so nobody hand-edits it out of sync');
  const data = {};
  new (require('vm').Script)(js.slice(0, js.indexOf('/* ---')))
    .runInNewContext({ window: data, localStorage: null, document: null, location: null });
  const panels = Object.values(data.MINDAICODE_CODE || {}).reduce((n, p) => n + Object.keys(p).length, 0);
  ok(panels === 17, `all 17 code panels have C and C++ (got ${panels})`);
  let missing = [];
  Object.entries(data.MINDAICODE_CODE).forEach(([pg, ps]) =>
    Object.entries(ps).forEach(([b, v]) => { if (!v.c || !v.cpp) missing.push(pg + '/' + b); }));
  ok(missing.length === 0, `no panel is missing a language (${missing.join(', ') || 'none missing'})`);
}

console.log('\n' + (allPass ? '*** ALL C / C++ TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
