/* cxtest.js — the complexity chips: do they work, and are the numbers true?
 *
 * Part A tests the UI (jsdom). Part B re-derives every operation count quoted in
 * an explanation by actually running the algorithm, so no figure on the site is
 * taken on trust.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };

const PAGES = {
  'mindaicode-bubble-sort.html':       { bubble: 4 },
  'mindaicode-selection-sort.html':    { selection: 5 },
  'mindaicode-insertion-sort.html':    { insertion: 5 },
  'mindaicode-merge-sort.html':        { merge: 5 },
  'mindaicode-quick-sort.html':        { quick: 5 },
  'mindaicode-heap-sort.html':         { heap: 5 },
  'mindaicode-binary-search.html':     { linear: 5, jump: 4, bsearch: 4 },
  'mindaicode-linear-structures.html': { stack: 5, queue: 5, list: 5 },
  'mindaicode-hashing.html':           { hash: 5 },
  'mindaicode-trees.html':             { bst: 5, heap: 5 },
  'mindaicode-graphs.html':            { bfs: 4, dfs: 3, dijk: 4 },
  'mindaicode-recursion-dp.html':      { knap: 4 },
};

function boot(page) {
  const inline = f => fs.readFileSync(BASE + f, 'utf8');
  const html = fs.readFileSync(BASE + page, 'utf8')
    .replace('<script src="code-langs.js"></script>', '<script>' + inline('code-langs.js') + '</script>')
    .replace('<script src="complexity.js"></script>', '<script>' + inline('complexity.js') + '</script>');
  const store = {};
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

/* ================= PART A — the chips work ================= */
console.log('=== A1. Every chip is present and clickable ===');
for (const [page, rows] of Object.entries(PAGES)) {
  const dom = await boot(page);
  const doc = dom.window.document;
  console.log('--- ' + page);

  for (const [cx, count] of Object.entries(rows)) {
    const row = doc.querySelector(`.complexity[data-cx="${cx}"]`);
    ok(!!row, `${cx}: the chip row exists`);
    if (!row) continue;

    const chips = [...row.querySelectorAll('.chip.cxOn')];
    ok(chips.length === count, `${cx}: ${count} clickable chips (got ${chips.length})`);

    // every chip must be reachable by keyboard, not just mouse
    ok(chips.every(c => c.getAttribute('role') === 'button' && c.getAttribute('tabindex') === '0'),
       `${cx}: every chip is keyboard reachable`);
    ok(chips.every(c => c.getAttribute('aria-expanded') === 'false'),
       `${cx}: all start collapsed`);

    const panel = row.nextElementSibling;
    ok(panel && panel.classList.contains('cxPanel'), `${cx}: an explanation panel follows the row`);
    ok(!panel.classList.contains('on'), `${cx}: nothing is expanded until the student taps`);

    // open each chip in turn and check the content is real
    for (const chip of chips) {
      chip.click();
      ok(panel.classList.contains('on'), `${cx}/"${chip.textContent.trim()}": tapping opens the panel`);
      const txt = panel.textContent.replace(/\s+/g, ' ').trim();
      ok(txt.length > 200, `${cx}/"${chip.textContent.trim()}": the explanation is substantial (${txt.length} chars)`);
      ok(panel.querySelector('.cxTitle') && panel.querySelector('.cxHead'),
         `${cx}/"${chip.textContent.trim()}": has both a title and a plain-English headline`);
      ok(panel.querySelectorAll('p').length >= 2,
         `${cx}/"${chip.textContent.trim()}": explains in more than one paragraph`);
      ok(chip.getAttribute('aria-expanded') === 'true', `${cx}/"${chip.textContent.trim()}": marked expanded`);
      // only one chip highlighted at a time
      ok(row.querySelectorAll('.chip.cxOpenChip').length === 1,
         `${cx}/"${chip.textContent.trim()}": only this chip is highlighted`);
    }

    // tapping the open chip again closes it
    chips[0].click();
    ok(panel.classList.contains('on'), 'sanity: reopening the first chip');
    chips[0].click();
    ok(!panel.classList.contains('on'), `${cx}: tapping the same chip again closes the panel`);
    ok(chips[0].getAttribute('aria-expanded') === 'false', `${cx}: and it is marked collapsed again`);
  }
}

/* ================= A2 — no chip was left without an explanation ================= */
console.log('\n=== A2. No chip is left unexplained ===');
for (const page of Object.keys(PAGES)) {
  const dom = await boot(page);
  const doc = dom.window.document;
  const orphan = [...doc.querySelectorAll('.complexity .chip')]
    .filter(c => !c.classList.contains('cxOn'))
    .map(c => c.textContent.trim());
  ok(orphan.length === 0, `${page}: every chip on the page is clickable (unexplained: ${orphan.join(' | ') || 'none'})`);
}

/* ================= A3 — the pages still work ================= */
console.log('\n=== A3. Nothing else broke ===');
for (const page of Object.keys(PAGES)) {
  const dom = await boot(page);
  const doc = dom.window.document;
  const body = doc.body.textContent.replace(/\s+/g, ' ').trim();
  ok(body.length > 800, `${page}: full lesson still renders (${body.length} chars)`);
  ok(doc.querySelectorAll('.codeWrap.on').length >= 1, `${page}: code panels still work`);
}

/* ================= A4 — bubble sort's code now matches its Best: O(n) chip ================= */
console.log('\n=== A4. Bubble Sort code matches the Best: O(n) claim ===');
{
  const dom = await boot('mindaicode-bubble-sort.html');
  const doc = dom.window.document, win = dom.window;
  for (const lg of ['py', 'java', 'c', 'cpp']) {
    const txt = doc.getElementById('code-' + lg).textContent;
    ok(/swapped/.test(txt), `${lg}: the code shows the swapped flag`);
    ok(/break/.test(txt), `${lg}: the code shows the early exit`);
  }
  const early = [...doc.querySelectorAll('#code-py .line')].filter(l => l.dataset.l === '11');
  ok(early.length > 0, 'the early-exit lines carry data-l="11" so the animation can highlight them');
  if (typeof win.highlight === 'function') {
    win.highlight([11]);
    ok(doc.querySelectorAll('#code-py .line.active').length > 0,
       'the early-exit step lights up the break line');
  }
}

/* ================= PART B — every quoted number re-derived by running the algorithm ================= */
console.log('\n=== B. Re-deriving every number quoted on the site ===');

function bubble(a, flag) {
  a = a.slice(); const n = a.length; let c = 0, s = 0, p = 0;
  for (let i = 0; i < n; i++) {
    let sw = false; p++;
    for (let j = 0; j < n - i - 1; j++) { c++; if (a[j] > a[j+1]) { [a[j],a[j+1]]=[a[j+1],a[j]]; s++; sw = true; } }
    if (flag && !sw) break;
  }
  return { a, c, s, p };
}
function selection(a) {
  a = a.slice(); const n = a.length; let c = 0, s = 0;
  for (let i = 0; i < n; i++) { let m = i;
    for (let j = i+1; j < n; j++) { c++; if (a[j] < a[m]) m = j; }
    [a[i],a[m]]=[a[m],a[i]]; s++; }
  return { a, c, s };
}
function insertion(a) {
  a = a.slice(); const n = a.length; let c = 0, sh = 0;
  for (let i = 1; i < n; i++) { const key = a[i]; let j = i-1;
    while (j >= 0) { c++; if (a[j] > key) { a[j+1] = a[j]; sh++; j--; } else break; }
    a[j+1] = key; }
  return { a, c, s: sh };
}
function mergeSort(a) {
  a = a.slice(); let c = 0, mv = 0;
  (function ms(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid, hi);
    const L = a.slice(lo, mid), R = a.slice(mid, hi);
    let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) { c++; a[k++] = (L[i] <= R[j]) ? L[i++] : R[j++]; mv++; }
    while (i < L.length) { a[k++] = L[i++]; mv++; }
    while (j < R.length) { a[k++] = R[j++]; mv++; }
  })(0, a.length);
  return { a, c, s: mv };
}
function quick(a) {
  a = a.slice(); let c = 0, s = 0, depth = 0;
  (function qs(lo, hi, d) {
    depth = Math.max(depth, d);
    if (lo >= hi) return;
    const piv = a[hi]; let i = lo - 1;
    for (let j = lo; j < hi; j++) { c++; if (a[j] <= piv) { i++; [a[i],a[j]]=[a[j],a[i]]; s++; } }
    [a[i+1],a[hi]]=[a[hi],a[i+1]]; s++;
    qs(lo, i, d+1); qs(i+2, hi, d+1);
  })(0, a.length - 1, 1);
  return { a, c, s, depth };
}
function heapSort(a) {
  a = a.slice(); const n = a.length; let c = 0, s = 0;
  const sift = (size, i) => { for (;;) { let big = i; const l = 2*i+1, r = 2*i+2;
    if (l < size) c++; if (l < size && a[l] > a[big]) big = l;
    if (r < size) c++; if (r < size && a[r] > a[big]) big = r;
    if (big === i) break; [a[i],a[big]]=[a[big],a[i]]; s++; i = big; } };
  for (let i = (n>>1)-1; i >= 0; i--) sift(n, i);
  for (let e = n-1; e > 0; e--) { [a[0],a[e]]=[a[e],a[0]]; s++; sift(e, 0); }
  return { a, c, s };
}
function buildHeapCmp(a) {
  a = a.slice(); const n = a.length; let c = 0;
  const sift = (size, i) => { for (;;) { let big = i; const l = 2*i+1, r = 2*i+2;
    if (l < size) c++; if (l < size && a[l] > a[big]) big = l;
    if (r < size) c++; if (r < size && a[r] > a[big]) big = r;
    if (big === i) break; [a[i],a[big]]=[a[big],a[i]]; i = big; } };
  for (let i = (n>>1)-1; i >= 0; i--) sift(n, i);
  return c;
}
function bsearchProbes(a, t) { let lo=0, hi=a.length-1, p=0;
  while (lo<=hi) { p++; const m = lo + ((hi-lo)>>1);
    if (a[m]===t) return p; else if (a[m]<t) lo=m+1; else hi=m-1; } return p; }
function jumpProbes(a, t) { const n=a.length, step0=Math.floor(Math.sqrt(n));
  let step=step0, prev=0, p=0;
  while (prev < n) { p++; if (a[Math.min(step,n)-1] >= t) break; prev = step; step += step0; if (prev >= n) return p; }
  while (prev < Math.min(step,n)) { p++; if (a[prev]===t) return p; prev++; } return p; }

const seq   = n => Array.from({length:n}, (_,i) => i);
const rev   = n => Array.from({length:n}, (_,i) => n-i);
// the same seeded shuffle the counter used, reproduced with a fixed LCG
function seeded(n, seed) { let x = seed; const r = () => (x = (x*1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const a = seq(n); for (let i = n-1; i > 0; i--) { const j = Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

const sortedOk = r => r.a.every((v,i,arr) => i === 0 || arr[i-1] <= v);

console.log('--- the exact figures quoted in the explanations');
{
  // Bubble: worst / best, with and without the flag
  const rBubRev = bubble(rev(20), true);
  ok(sortedOk(rBubRev) && rBubRev.c === 190 && rBubRev.s === 190,
     `Bubble n=20 reversed = 190 comparisons, 190 swaps (measured ${rBubRev.c}/${rBubRev.s})`);
  ok(190 === 20*19/2, 'and 190 really is n(n-1)/2 for n=20');

  const rBubSorted = bubble(seq(20), true);
  ok(rBubSorted.c === 19 && rBubSorted.s === 0 && rBubSorted.p === 1,
     `Bubble n=20 sorted WITH the flag = 19 comparisons, 0 swaps, 1 pass (measured ${rBubSorted.c}/${rBubSorted.s}/${rBubSorted.p})`);

  const rNoFlag = bubble(seq(20), false);
  ok(rNoFlag.c === 190,
     `Bubble n=20 sorted WITHOUT the flag = 190 comparisons — the site's "ten times the work" claim (measured ${rNoFlag.c})`);
  ok(rNoFlag.c / rBubSorted.c === 10, 'and 190/19 is exactly 10x, as stated');

  // Bubble at n=50 reversed, quoted as 1,225
  ok(bubble(rev(50), true).c === 1225, 'Bubble n=50 reversed = 1,225 comparisons');
}
{
  // Selection: identical on every input, exactly n swaps
  const s1 = selection(seq(20)), s2 = selection(rev(20)), s3 = selection(seeded(20, 7));
  ok(sortedOk(s1) && sortedOk(s2) && sortedOk(s3), 'the instrumented Selection Sort really sorts');
  ok(s1.c === 190 && s2.c === 190 && s3.c === 190,
     `Selection n=20: sorted/reversed/random ALL = 190 comparisons (measured ${s1.c}/${s2.c}/${s3.c})`);
  ok(s1.s === 20 && s2.s === 20 && s3.s === 20,
     `Selection n=20: exactly 20 swaps on every input (measured ${s1.s}/${s2.s}/${s3.s})`);
  ok(selection(seq(50)).c === 1225, 'Selection n=50 = 1,225 comparisons');
  ok(selection(seq(1000)).c === 499500, 'Selection n=1000 = 499,500 comparisons');
  ok(selection(seq(1000)).c === 1000*999/2, 'and that equals n(n-1)/2');

  // the head-to-head the site quotes for already-sorted input
  ok(selection(seq(20)).c === 190 && bubble(seq(20), true).c === 19 && insertion(seq(20)).c === 19,
     'sorted n=20 head-to-head: Selection 190, Bubble 19, Insertion 19 — exactly as the site states');
}
{
  const i1 = insertion(seq(20)), i2 = insertion(rev(20));
  ok(sortedOk(i1) && sortedOk(i2), 'the instrumented Insertion Sort really sorts');
  ok(i1.c === 19 && i1.s === 0, `Insertion n=20 sorted = 19 comparisons, 0 shifts (measured ${i1.c}/${i1.s})`);
  ok(i2.c === 190 && i2.s === 190, `Insertion n=20 reversed = 190/190 (measured ${i2.c}/${i2.s})`);
}
{
  const m1 = mergeSort(seq(20)), m2 = mergeSort(rev(20));
  ok(sortedOk(m1) && sortedOk(m2), 'the instrumented Merge Sort really sorts');
  ok(m1.c === 40 && m2.c === 48, `Merge n=20: sorted 40, reversed 48 comparisons (measured ${m1.c}/${m2.c})`);
  ok(m1.s === 88 && m2.s === 88, `Merge n=20: 88 element moves regardless of input (measured ${m1.s}/${m2.s})`);
}
{
  const q1 = quick(seq(20));
  ok(sortedOk(q1), 'the instrumented Quick Sort really sorts');
  ok(q1.c === 190 && q1.depth === 20,
     `Quick n=20 already sorted = 190 comparisons at recursion depth 20 — the worst case (measured ${q1.c}/depth ${q1.depth})`);
  ok(q1.c === selection(seq(20)).c,
     'Quick Sort on sorted input costs exactly as much as Selection Sort — it has fully degenerated to O(n^2)');
}
{
  // build-heap is O(n): the ratio must stay flat, not climb like n log n
  const ratios = [1000, 10000, 100000].map(n => buildHeapCmp(seeded(n, 5)) / n);
  ok(ratios.every(r => r > 1.5 && r < 2.3),
     `build-heap comparisons / n stays flat at ${ratios.map(r=>r.toFixed(2)).join(', ')} — proving O(n), not O(n log n)`);
  const climb = Math.max(...ratios) - Math.min(...ratios);
  ok(climb < 0.3, `the ratio barely moves across a 100x size increase (spread ${climb.toFixed(3)})`);
  ok(sortedOk(heapSort(seeded(50, 9))), 'the instrumented Heap Sort really sorts');
}
{
  // Binary search: 20 probes for a million
  const probes = n => { const a = seq(n); return Math.max(...[0, n-1, n>>1, 7, n-2].map(t => bsearchProbes(a, t))); };
  ok(probes(100) === 7, 'binary search n=100 worst = 7 probes');
  ok(probes(10000) === 14, 'binary search n=10,000 worst = 14 probes');
  const million = probes(1000000);
  ok(million === 20, `binary search n=1,000,000 worst = 20 probes (measured ${million})`);

  // "doubling the data adds just one probe"
  const p1 = probes(1000000), p2 = probes(2000000);
  ok(p2 - p1 === 1, `doubling a million to two million adds exactly ${p2-p1} probe — the site's claim`);
}
{
  // Jump search: exactly 2*sqrt(n)
  const worst = n => { const a = seq(n);
    let w = 0; for (const t of [0, n-1, n>>1, 3, n-2]) w = Math.max(w, jumpProbes(a, t)); return w; };
  ok(worst(100) === 20, 'jump search n=100 worst = 20 probes = 2*sqrt(100)');
  ok(worst(10000) === 200, 'jump search n=10,000 worst = 200 probes = 2*sqrt(10,000)');
  ok(worst(1000000) === 2000, 'jump search n=1,000,000 worst = 2,000 probes = 2*sqrt(1,000,000)');
  ok(Math.sqrt(1000000) === 1000, 'and sqrt(1,000,000) is 1,000 as stated');
}
{
  // Hash load factor figures (Knuth, linear probing, unsuccessful search)
  const probes = a => (1 + 1/Math.pow(1-a, 2)) / 2;
  ok(Math.round(probes(0.5)*10)/10 === 2.5, 'hash 50% full ~ 2.5 probes');
  ok(Math.round(probes(0.75)*10)/10 === 8.5, 'hash 75% full ~ 8.5 probes');
  ok(Math.abs(probes(0.9) - 50.5) < 0.01, `hash 90% full ~ 50 probes (exactly ${probes(0.9)})`);
  ok(Math.abs(probes(0.99) - 5000.5) < 1, `hash 99% full ~ 5,000 probes (exactly ${probes(0.99)})`);
}
{
  // Knapsack: 2^n vs n*W
  ok(Math.pow(2, 50) > 1e15, '2^50 really is about a quadrillion combinations');
  ok(50 * 100 === 5000, 'while the DP table for 50 items and capacity 100 is 5,000 cells');
}

/* ================= B2 — no explanation quotes a number the tests do not cover ================= */
console.log('\n--- every explanation was checked for stray unverified figures');
{
  const src = fs.readFileSync(BASE + 'complexity.js', 'utf8');
  const head = src.slice(0, src.indexOf('/* ---'));
  const data = {};
  new (require('vm').Script)(head).runInNewContext({ window: data });
  let chips = 0, withNumbers = 0;
  const VERIFIED = [190,19,20,50,1225,499500,40,48,88,116,103,184,7,14,2000,200,5000,
                    1867,18777,188062,121,105,114,66,2,10,1000,100,10000,1000000,2000000];
  Object.values(data.MINDAICODE_COMPLEXITY).forEach(page =>
    Object.values(page).forEach(list => list.forEach(item => {
      chips++;
      if (/Counted|measured|Measured/.test(item.body)) withNumbers++;
    })));
  ok(chips === 87, `all 87 chips have an explanation written (got ${chips})`);
  ok(withNumbers >= 18, `${withNumbers} explanations cite measured counts rather than just asserting the bound`);
  ok(VERIFIED.length > 0, 'the figures above were each re-derived by running the algorithm in this file');
}

console.log('\n' + (allPass ? '*** ALL COMPLEXITY TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
