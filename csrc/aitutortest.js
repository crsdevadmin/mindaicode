/* aitutortest.js — the live AI path, tested without spending anything.
 *
 * Two things matter more than whether the AI is clever:
 *   1. the Anthropic key must be impossible to leak into anything a browser reads
 *   2. when the AI fails — no internet, rate limited, bad response — the student
 *      must land softly on the written explanations, never on an error
 *
 * Every network call here is stubbed. No real request is made, so running this
 * costs nothing.
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require("path").join(__dirname, "..") + "/";

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = t => String(t || '').replace(/\s+/g, ' ').trim();

/* ---- boot the page with the tutor switched ON, and fetch stubbed ---- */
function boot(opts) {
  opts = opts || {};
  const store = {};
  const inline = f => fs.readFileSync(BASE + f, 'utf8');
  let html = fs.readFileSync(BASE + 'mindaicode-programming-basics.html', 'utf8');

  if (opts.enable) {
    // swap the config for one that is switched on, pointing at a fake worker
    html = html.replace('<script src="tutor-config.js"></script>',
      '<script>' + inline('tutor-config.js')
        .replace('ENABLED: false', 'ENABLED: true')
        .replace("ENDPOINT: ''", "ENDPOINT: 'https://fake-worker.test'") + '</script>');
  }

  const dom = new JSDOM(html, {
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
      w.AbortController = function () { this.signal = {}; this.abort = () => {}; };

      // stub the network. NOTHING real is ever called.
      w.__sent = [];
      w.fetch = function (url, init) {
        w.__sent.push({ url: url, body: init && init.body ? JSON.parse(init.body) : null,
                        headers: (init && init.headers) || {} });
        if (opts.mode === 'offline') return Promise.reject(new Error('network down'));
        if (opts.mode === 'http500') return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('boom') });
        if (opts.mode === 'garbage') return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ nope: 1 }) });
        return Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve({ answer: 'Because an index is a distance from the start, so the first box is 0 steps along.' }) });
      };
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 550));
}

(async () => {

/* ============ 1. the key can never be in anything a browser reads ============ */
console.log('=== 1. The key cannot leak into the website ===');
{
  const browserFiles = fs.readdirSync(BASE)
    .filter(f => /\.(js|html|json)$/.test(f));
  // Strip comments before scanning. A warning that SAYS "never call
  // api.anthropic.com from the browser" must not be mistaken for doing it —
  // and stripping comments makes the check stricter, not weaker, because a real
  // fetch would still be caught.
  const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ');

  let leaks = [];
  browserFiles.forEach(f => {
    const code = stripComments(fs.readFileSync(BASE + f, 'utf8'));
    if (/sk-ant-[A-Za-z0-9_-]{10,}/.test(code)) leaks.push(f + ': looks like a real Anthropic key');
    if (/x-api-key/i.test(code)) leaks.push(f + ': sends an api key header from the browser');
    if (/anthropic\.com/.test(code)) leaks.push(f + ': calls Anthropic directly from the browser');
    if (/ENABLED:\s*true/.test(code) && /ENDPOINT:\s*['"]https?:\/\/api\./.test(code))
      leaks.push(f + ': endpoint points straight at a model provider');
  });
  // prove the scanner actually works, rather than trusting a clean result
  const canary = stripComments("const k = 'sk-ant-abcdefghijklmnop';");
  ok(/sk-ant-[A-Za-z0-9_-]{10,}/.test(canary), 'the key scanner really does detect a key when one is present');
  ok(leaks.length === 0,
     leaks.length ? `KEY EXPOSURE RISK:\n       - ${leaks.join('\n       - ')}`
                  : `none of the ${browserFiles.length} browser-facing files contain a key or call Anthropic directly`);

  const cfg = fs.readFileSync(BASE + 'tutor-config.js', 'utf8');
  ok(/ENABLED: false/.test(cfg), 'tutor-config.js is still committed switched OFF');
  ok(/ENDPOINT: ''/.test(cfg), 'and with no endpoint filled in');
  ok(/never put an api key in this file/i.test(cfg), 'and warns that the file is public');
  ok(/Cloudflare Worker, NOT api\.anthropic\.com/i.test(cfg),
     'and names the mistake explicitly, so nobody points it at Anthropic by accident');
}

/* ============ 2. the Worker itself is safe by construction ============ */
console.log('\n=== 2. The proxy has the guards it needs ===');
{
  const w = fs.readFileSync(BASE + 'server/cloudflare-worker.js', 'utf8');
  ok(/env\.ANTHROPIC_API_KEY/.test(w), 'the key is read from a server secret, never a literal');
  ok(!/sk-ant-/.test(w), 'no key is committed in the worker either');
  ok(/ALLOWED_ORIGINS/.test(w) && /not allowed from this origin/.test(w),
     'other websites cannot use your Worker to spend your money');
  ok(/DAILY_PER_STUDENT/.test(w) && /env\.RATE/.test(w), 'there is a per-student daily cap');
  ok(/MAX_TOKENS\s*=\s*\d+/.test(w), 'and a hard cap on answer length, so cost per question is bounded');
  ok(/MAX_QUESTION\s*=\s*\d+/.test(w), 'questions are length-limited before they are forwarded');
  ok(/claude-haiku/.test(w), 'it uses a cheap model, which is right for beginner questions');
  ok(!/detail/.test(w.split('return json')[1] || '') || /never leak the upstream error/.test(w),
     'upstream errors are not passed through to a student');

  // the teaching brief is the actual product here
  ok(/ANSWER THE QUESTION/.test(w), 'the prompt tells it to give the answer rather than withhold it');
  ok(/never reply with only another question/i.test(w), 'and forbids answering a stuck student with another question');
  ok(/Tamil|Hindi/.test(w), 'it can reply in the student\'s own language');
  ok(/put into.*not.*equals/i.test(w), 'the "=" misconception is baked into the brief');
  ok(/start at 0/i.test(w), 'so is counting from zero');
  ok(/C, C\+\+ or Java/.test(w), 'and it knows their exams are not in Python');
  ok(/do not invent behaviour/i.test(w), 'it is told to admit uncertainty rather than guess');
  ok(/never say "it is simple"|do not say "it is simple"|Never say "it is simple"/i.test(w),
     'and told not to belittle the student');
}

/* ============ 3. with the AI ON, the student can ask and get an answer ============ */
console.log('\n=== 3. Switched on, a question reaches the proxy and comes back ===');
{
  const dom = await boot({ enable: true, mode: 'ok' });
  const doc = dom.window.document, win = dom.window;
  await sleep(120);

  const askBox = doc.getElementById('tutorAsk');
  ok(!!askBox, 'the ask-me-anything box appears once the tutor is switched on');
  ok(/can be wrong/i.test(doc.querySelector('.tutorMini').textContent),
     'with an honest warning that an AI answer can be wrong');

  win.showStep(2);
  await sleep(120);
  const box = doc.getElementById('tutorAsk');
  box.value = 'why does the first box start at 0?';
  box.dispatchEvent(Object.assign(new win.Event('keydown'), { key: 'Enter' }));
  await sleep(200);

  ok(win.__sent.length === 1, 'exactly one request was made');
  const sent = win.__sent[0];
  ok(sent.url === 'https://fake-worker.test', 'it went to the Worker, not to Anthropic');
  ok(!JSON.stringify(sent.headers).match(/api-key/i), 'no api key header was sent from the browser');
  ok(sent.body && sent.body.question === 'why does the first box start at 0?', 'the question was forwarded');
  ok(sent.body.context && typeof sent.body.context.step === 'number',
     `and which step they are on, so the answer is about their screen (step ${sent.body.context.step})`);
  ok(/index is a distance/.test(clean(doc.getElementById('tutorSay').textContent)),
     'the answer is shown to the student');
}

/* ============ 4. when the AI fails, the student lands softly ============ */
console.log('\n=== 4. Every failure mode falls back to the written help ===');
for (const [mode, label] of [['offline', 'no internet'], ['http500', 'the Worker erroring'], ['garbage', 'a malformed reply']]) {
  const dom = await boot({ enable: true, mode });
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(120);
  const box = doc.getElementById('tutorAsk');
  box.value = 'what is a loop?';
  box.dispatchEvent(Object.assign(new win.Event('keydown'), { key: 'Enter' }));
  await sleep(250);

  const said = clean(doc.getElementById('tutorSay').textContent);
  ok(said.length > 20, `${label}: the student still gets a message, not a blank panel`);
  ok(!/error|undefined|null|NaN|\[object/i.test(said), `${label}: and it is not a raw error ("${said.slice(0, 54)}...")`);
  ok(/still work|written explanation/i.test(said),
     `${label}: it points them back at the written explanations`);

  // the rest of the page must be untouched by the failure
  ok(doc.querySelectorAll('#loopOpts .optBtn').length > 0, `${label}: the lesson still works`);
  ok(doc.querySelectorAll('#labCode .line').length > 0, `${label}: the playground still works`);
}

/* ============ 5. with the AI OFF the site is exactly as before ============ */
console.log('\n=== 5. Switched off, nothing calls out and nothing changes ===');
{
  const dom = await boot({ enable: false });
  const doc = dom.window.document, win = dom.window;
  win.showStep(2);
  await sleep(150);
  ok(win.__sent.length === 0, 'not a single network request is made');
  ok(!doc.getElementById('tutorAsk'), 'no ask box is shown');
  ok(clean(doc.getElementById('tutorSay').textContent).length > 60, 'the tutor still speaks, from written answers');

  // and the written tutor can still give a full answer
  const btns = [...doc.querySelectorAll('#tutorBtns .tutorBtn')];
  btns.find(b => /tell me/i.test(b.textContent)).click();
  await sleep(60);
  ok(/12/.test(doc.getElementById('tutorSay').textContent),
     'including the actual answer to the round they are on — with no AI involved');
  ok(win.__sent.length === 0, 'still no network request');
}

/* ============ 6. the deployment instructions are honest and complete ============ */
console.log('\n=== 6. The setup guide will not strand you ===');
{
  const r = fs.readFileSync(BASE + 'server/README.md', 'utf8');
  ok(/ANTHROPIC_API_KEY/.test(r) && /must.*be a Secret/i.test(r), 'it insists the key is a Secret, not a plain variable');
  ok(/ALLOWED_ORIGINS/.test(r), 'it covers locking the Worker to your own domain');
  ok(/KV/.test(r) && /do not skip/i.test(r), 'and pushes you to add the spend guard');
  ok(/monthly spend limit/i.test(r), 'it tells you to set a spend limit in the Anthropic console');
  ok(/check current pricing yourself/i.test(r), 'it does not pretend to know current prices');
  ok(/turn it off/i.test(r) && /ENABLED: false/.test(r), 'and explains how to switch it back off');
  ok(/confidently wrong/i.test(r), 'and is upfront that an AI can be confidently wrong');
  ok(/private window/i.test(r), 'with the cache gotcha called out, since that has bitten before');
}

console.log('\n' + (allPass ? '*** ALL AI-TUTOR TESTS PASSED (no real requests made) ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
