/* MindAICode — the Loop Lab.
 *
 * Everything else on this page shows the student something and asks them to
 * answer. This is the opposite: they build the loop themselves, out of their own
 * numbers and their own choices, and the code is GENERATED from what they picked.
 * So the syntax arrives as a consequence of a decision they made, not as a wall.
 *
 * Nothing is pre-baked. The answer is computed by actually running the loop the
 * student described, so any combination they invent — including ones we never
 * thought of — gives a truthful result. loopLabTest.js checks the simulator
 * against an independent implementation.
 */

window.MINDAICODE_LOOPLAB = (function () {
  'use strict';

  /* ---------------------------------------------------------------- the state */
  const DEFAULT = {
    items: [3, 7, 2],
    howMany: 'each',      // each | exceptLast | fixed
    exceptLast: 1,
    fixed: 5,
    body: 'addItem',      // addItem | count | addI | addOddI
    stopEarly: false,
    stopAt: 2
  };

  function clampInt(v, lo, hi, dflt) {
    const n = parseInt(v, 10);
    if (!isFinite(n)) return dflt;
    return Math.max(lo, Math.min(hi, n));
  }

  /* ------------------------------------------------------------ how many passes
     Returns the list of values i takes, before any break is applied. */
  function counterValues(s) {
    if (s.howMany === 'fixed') {
      const n = clampInt(s.fixed, 0, 12, 5);
      return Array.from({ length: n }, (_, k) => k);
    }
    const len = s.items.length;
    const stop = s.howMany === 'exceptLast'
      ? Math.max(0, len - clampInt(s.exceptLast, 0, 9, 1))
      : len;
    return Array.from({ length: stop }, (_, k) => k);
  }

  const usesList = s => s.howMany !== 'fixed' || s.body === 'addItem';
  const accName  = s => (s.body === 'count' ? 'count' : 'total');

  /* ------------------------------------------------------------------ SIMULATE
     Runs the loop the student described. This is the single source of truth for
     the answer — nothing is looked up from a table. */
  function simulate(state) {
    const s = Object.assign({}, DEFAULT, state || {});
    const values = counterValues(s);
    const trace = [];
    let acc = 0;
    let stopped = false;

    for (let k = 0; k < values.length; k++) {
      const i = values[k];

      if (s.stopEarly && i === clampInt(s.stopAt, 0, 12, 2)) {
        // break happens BEFORE the body, so nothing is added for this pass
        trace.push({ at: k, acc: acc, stop: true });
        stopped = true;
        break;
      }

      if (s.body === 'addOddI' && i % 2 === 0) {
        // continue: skip the rest of this pass
        trace.push({ at: k, acc: acc, skip: true });
        continue;
      }

      if (s.body === 'addItem')      acc += Number(s.items[i]) || 0;
      else if (s.body === 'count')   acc += 1;
      else                           acc += i;      // addI and addOddI

      trace.push({ at: k, acc: acc });
    }

    return {
      kind: usesList(s) && s.howMany !== 'fixed' ? 'array' : 'range',
      items: (usesList(s) && s.howMany !== 'fixed') ? s.items.slice() : values,
      acc: accName(s),
      accStart: 0,
      trace: trace,
      answer: acc,
      passes: trace.filter(t => !t.stop).length,
      stopped: stopped,
      counterValues: values
    };
  }

  /* ------------------------------------------------------------- GENERATE CODE
     The code is written FROM the student's choices, so changing a dropdown
     visibly rewrites a line. That link is the whole point. */
  function generate(state) {
    const s = Object.assign({}, DEFAULT, state || {});
    const lines = [];
    const acc = accName(s);

    if (usesList(s) && s.howMany !== 'fixed') {
      lines.push('arr = [' + s.items.join(', ') + ']');
    }
    lines.push(acc + ' = 0');

    if (s.howMany === 'each')            lines.push('for i in range(len(arr)):');
    else if (s.howMany === 'exceptLast') lines.push('for i in range(len(arr) - ' + clampInt(s.exceptLast, 0, 9, 1) + '):');
    else                                 lines.push('for i in range(' + clampInt(s.fixed, 0, 12, 5) + '):');

    if (s.stopEarly) {
      lines.push('    if i == ' + clampInt(s.stopAt, 0, 12, 2) + ':');
      lines.push('        break');
    }
    if (s.body === 'addOddI') {
      lines.push('    if i % 2 == 0:');
      lines.push('        continue');
    }

    if (s.body === 'addItem')     lines.push('    ' + acc + ' = ' + acc + ' + arr[i]');
    else if (s.body === 'count')  lines.push('    ' + acc + ' = ' + acc + ' + 1');
    else                          lines.push('    ' + acc + ' = ' + acc + ' + i');

    lines.push('print(' + acc + ')');
    return lines;
  }

  /* -------------------------------------------------------- plain-words summary
     What the student just described, said back to them in English. */
  function describe(state) {
    const s = Object.assign({}, DEFAULT, state || {});
    const r = simulate(s);
    const bits = [];

    if (s.howMany === 'each')            bits.push('go through <b>every</b> item in your list');
    else if (s.howMany === 'exceptLast') bits.push('go through your list but <b>stop ' + clampInt(s.exceptLast, 0, 9, 1) + ' short of the end</b>');
    else {
      const n = clampInt(s.fixed, 0, 12, 5);
      // "count from 0 up to -1" is nonsense to a beginner, so say what actually happens
      if (n === 0)      bits.push('<b>not go round at all</b>');
      else if (n === 1) bits.push('go round <b>once</b>, with the counter at 0');
      else              bits.push('count the counter from <b>0</b> up to <b>' + (n - 1) + '</b>');
    }

    if (s.body === 'addItem')      bits.push('adding each item to the total');
    else if (s.body === 'count')   bits.push('ticking once each time');
    else if (s.body === 'addI')    bits.push('adding the counter itself to the total');
    else                           bits.push('skipping every even counter, adding the odd ones');

    if (s.stopEarly) bits.push('and walking out the moment the counter hits <b>' + clampInt(s.stopAt, 0, 12, 2) + '</b>');

    return 'You said: ' + bits.join(', ') + '. That runs <b>' + r.passes +
           '</b> time' + (r.passes === 1 ? '' : 's') + ' and ends with <b>' + accName(s) +
           ' = ' + r.answer + '</b>.';
  }

  return { DEFAULT, simulate, generate, describe, counterValues, accName, clampInt };
})();

/* ------------------------------------------------------------------ the UI ---- */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  const L = window.MINDAICODE_LOOPLAB;
  let state = null;

  const CSS = [
    '.lab{background:var(--bg);border:1px dashed var(--border);border-radius:12px;padding:18px;margin-bottom:14px;}',
    '.labHead{font-size:14px;font-weight:800;margin-bottom:4px;}',
    '.labSub{font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.55;}',
    '.labGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}',
    '@media (max-width:760px){.labGrid{grid-template-columns:1fr;}}',
    '.labBox{background:var(--panel2);border:1px solid var(--border);border-radius:10px;padding:12px;}',
    '.labBoxH{font-size:11px;font-weight:800;color:var(--accent);letter-spacing:.5px;margin-bottom:10px;}',
    '.labRow{margin-bottom:12px;}',
    '.labLbl{display:block;font-size:12px;color:var(--muted);font-weight:700;margin-bottom:5px;}',
    '.labSel,.labNum{background:var(--bg);border:1px solid var(--border);color:var(--text);',
    '  padding:7px 9px;border-radius:7px;font-size:13px;font-family:inherit;}',
    '.labSel{width:100%;} .labNum{width:64px;text-align:center;font-family:Consolas,monospace;}',
    '.labItems{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}',
    '.labItems input{width:46px;text-align:center;background:var(--bg);border:1px solid var(--border);',
    '  color:var(--text);border-radius:6px;padding:6px 2px;font-family:Consolas,monospace;font-size:13px;}',
    '.labMini{background:var(--panel);border:1px solid var(--border);color:var(--muted);border-radius:6px;',
    '  width:28px;height:28px;font-size:15px;font-weight:800;cursor:pointer;padding:0;line-height:1;}',
    '.labMini:hover{color:var(--text);border-color:var(--accent);}',
    '.labChk{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted);cursor:pointer;}',
    '.labSays{font-size:13.5px;line-height:1.7;background:rgba(88,166,255,.07);border-left:3px solid var(--accent);',
    '  border-radius:8px;padding:11px 13px;margin-top:12px;}',
    '.labSays b{color:var(--text);}',
    '.labAnswer{font-family:Consolas,monospace;font-size:22px;font-weight:800;color:var(--green);text-align:center;',
    '  padding:8px 0;}',
    '.labNote{font-size:12px;color:var(--muted);text-align:center;font-style:italic;}',
    '.labWarn{font-size:12.5px;color:var(--yellow);margin-top:8px;line-height:1.55;}'
  ].join('\n');
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function hl(line) {
    return esc(line)
      .replace(/\b(for|in|if|while|break|continue|print|range|len)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
  }

  function render() {
    const host = document.getElementById('loopLab');
    if (!host) return;
    const s = state;
    const sim = L.simulate(s);
    const code = L.generate(s);
    const showList = sim.kind === 'array';

    host.innerHTML =
      '<div class="labHead">&#128295; Build your own loop</div>' +
      '<div class="labSub">Nothing here is fixed. Put in your own numbers, change what the loop does, and the code below rewrites itself. ' +
      'Press <b>Run it</b> and see the real answer &mdash; even if you build something strange.</div>' +
      '<div class="labGrid">' +

        '<div class="labBox">' +
          '<div class="labBoxH">YOUR CHOICES</div>' +
          (showList ? '<div class="labRow"><span class="labLbl">Your list of numbers</span>' +
            '<div class="labItems" id="labItems"></div></div>' : '') +
          '<div class="labRow"><span class="labLbl">How many times should it go round?</span>' +
            '<select class="labSel" id="labHowMany">' +
              '<option value="each">once for every item in my list</option>' +
              '<option value="exceptLast">every item EXCEPT the last few</option>' +
              '<option value="fixed">a fixed number of times</option>' +
            '</select>' +
            '<div id="labHowExtra" style="margin-top:7px;"></div>' +
          '</div>' +
          '<div class="labRow"><span class="labLbl">What should it do each time?</span>' +
            '<select class="labSel" id="labBody">' +
              (showList ? '<option value="addItem">add that item to the total</option>' : '') +
              '<option value="count">just tick once (count)</option>' +
              '<option value="addI">add the counter i itself</option>' +
              '<option value="addOddI">skip even counters, add the odd ones</option>' +
            '</select>' +
          '</div>' +
          '<div class="labRow"><label class="labChk"><input type="checkbox" id="labStop">' +
            ' walk out early when the counter reaches' +
            ' <input class="labNum" id="labStopAt" type="number" min="0" max="12"></label>' +
          '</div>' +
        '</div>' +

        '<div class="labBox">' +
          '<div class="labBoxH">THE CODE THAT DOES IT</div>' +
          '<div class="code" id="labCode">' +
            code.map(l => '<div class="line">' + hl(l) + '</div>').join('') +
          '</div>' +
          '<div style="margin-top:12px;"><span class="labLbl">What happens when it runs</span>' +
            '<div class="boxRow" id="labBoxes"></div>' +
            '<div class="labAnswer" id="labAnswer">&mdash;</div>' +
            '<div class="labNote" id="labRunning"></div>' +
          '</div>' +
          '<div class="controls" style="margin-top:12px;">' +
            '<button id="labRunBtn">&#9654; Run it</button>' +
            '<button id="labResetBtn" class="ghost">&#8634; Start over</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="labSays" id="labSays"></div>';

    // the list editor
    if (showList) {
      const box = document.getElementById('labItems');
      box.innerHTML = s.items.map((v, i) =>
        '<input type="number" data-i="' + i + '" value="' + v + '">').join('') +
        '<button class="labMini" id="labAdd" title="add a number">+</button>' +
        '<button class="labMini" id="labDel" title="remove the last number">&minus;</button>';
      box.querySelectorAll('input').forEach(inp => {
        inp.onchange = () => {
          s.items[+inp.dataset.i] = L.clampInt(inp.value, -999, 999, 0);
          render();
        };
      });
      document.getElementById('labAdd').onclick = () => {
        if (s.items.length < 8) { s.items.push(5); render(); }
      };
      document.getElementById('labDel').onclick = () => {
        if (s.items.length > 1) { s.items.pop(); if (s.exceptLast >= s.items.length) s.exceptLast = 1; render(); }
      };
    }

    const how = document.getElementById('labHowMany');
    how.value = s.howMany;
    how.onchange = () => {
      s.howMany = how.value;
      if (s.howMany === 'fixed' && s.body === 'addItem') s.body = 'count';
      render();
    };
    const extra = document.getElementById('labHowExtra');
    if (s.howMany === 'exceptLast') {
      extra.innerHTML = '<span class="labLbl" style="display:inline">stop this many short of the end: </span>' +
        '<input class="labNum" id="labExcept" type="number" min="0" max="' + Math.max(0, s.items.length) + '" value="' + s.exceptLast + '">';
      document.getElementById('labExcept').onchange = e => {
        s.exceptLast = L.clampInt(e.target.value, 0, s.items.length, 1); render();
      };
    } else if (s.howMany === 'fixed') {
      extra.innerHTML = '<span class="labLbl" style="display:inline">how many times: </span>' +
        '<input class="labNum" id="labFixed" type="number" min="0" max="12" value="' + s.fixed + '">';
      document.getElementById('labFixed').onchange = e => {
        s.fixed = L.clampInt(e.target.value, 0, 12, 5); render();
      };
    } else extra.innerHTML = '';

    const body = document.getElementById('labBody');
    body.value = s.body;
    body.onchange = () => { s.body = body.value; render(); };

    const stop = document.getElementById('labStop');
    stop.checked = !!s.stopEarly;
    stop.onchange = () => { s.stopEarly = stop.checked; render(); };
    const stopAt = document.getElementById('labStopAt');
    stopAt.value = s.stopAt;
    stopAt.disabled = !s.stopEarly;
    stopAt.onchange = () => { s.stopAt = L.clampInt(stopAt.value, 0, 12, 2); render(); };

    document.getElementById('labSays').innerHTML = L.describe(s);

    // idle picture
    drawLab(sim, -1);

    document.getElementById('labRunBtn').onclick = () => runLab(sim);
    document.getElementById('labResetBtn').onclick = () => {
      state = JSON.parse(JSON.stringify(L.DEFAULT));
      render();
    };

    // the generated code is real code, so the line decoder should work on it
    if (window.MindAICodeExplainUI) window.MindAICodeExplainUI.scan();

    // honest warning for the degenerate cases a student WILL try
    const warn = [];
    if (sim.passes === 0) warn.push('That runs <b>zero</b> times &mdash; the body never happens at all. Not a bug: perfectly legal, and a real source of confusion when it happens by accident.');
    if (sim.stopped) warn.push('The <code>break</code> fires before the body, so nothing is added on that pass.');
    if (warn.length) document.getElementById('labSays').innerHTML += '<div class="labWarn">&#9888;&#65039; ' + warn.join(' ') + '</div>';
  }

  function drawLab(sim, step) {
    const wrap = document.getElementById('labBoxes');
    const run = document.getElementById('labRunning');
    const ans = document.getElementById('labAnswer');
    if (!wrap) return;
    const cur = step >= 0 && sim.trace.length ? sim.trace[Math.min(step, sim.trace.length - 1)] : null;
    const done = step >= sim.trace.length - 1;
    const visited = new Set(sim.trace.slice(0, Math.max(0, step + 1)).map(t => t.at));
    const skipped = new Set(sim.trace.slice(0, Math.max(0, step + 1)).filter(t => t.skip).map(t => t.at));

    wrap.innerHTML = sim.items.map((v, i) => {
      let cls = '';
      if (cur && cur.at === i) cls = ' hi';
      else if (skipped.has(i)) cls = ' skipped';
      else if (visited.has(i)) cls = ' done';
      return sim.kind === 'array'
        ? '<div class="boxCol"><div class="box noclick' + cls + '" data-i="' + i + '">' +
          '<svg viewBox="0 0 58 74" role="img" aria-label="post box">' +
          '<path class="boxShell" d="M4 22 Q4 4 29 4 Q54 4 54 22 L54 55 Q54 60 49 60 L9 60 Q4 60 4 55 Z"/>' +
          '<rect class="boxSlot" x="14" y="17" width="30" height="6" rx="3"/>' +
          '<rect class="boxDoor" x="11" y="29" width="36" height="26" rx="4"/>' +
          '<text class="boxVal" x="29" y="47">' + v + '</text></svg></div>' +
          '<div class="idxLbl">index ' + i + '</div></div>'
        : '<div class="boxCol"><div class="rangeTok' + cls + '" data-i="' + i + '">' + v + '</div>' +
          '<div class="idxLbl">i = ' + v + '</div></div>';
    }).join('');

    if (step < 0) { ans.innerHTML = '&mdash;'; run.textContent = 'press Run it'; return; }
    ans.textContent = sim.acc + ' = ' + (cur ? cur.acc : 0);
    run.innerHTML = done
      ? '&#10003; finished after <b>' + sim.passes + '</b> pass' + (sim.passes === 1 ? '' : 'es')
      : (cur && cur.stop ? 'walked out early' : (cur && cur.skip ? 'skipped this one' : 'pass ' + (step + 1)));
  }

  let labTimer = null;
  function runLab(sim) {
    clearInterval(labTimer);
    if (!sim.trace.length) { drawLab(sim, 0); return; }
    let step = -1;
    drawLab(sim, step);
    labTimer = setInterval(() => {
      step++;
      if (step >= sim.trace.length) {
        clearInterval(labTimer);
        drawLab(sim, sim.trace.length - 1);
        document.getElementById('labAnswer').textContent = sim.acc + ' = ' + sim.answer;
        return;
      }
      drawLab(sim, step);
    }, 560);
  }

  function init() {
    if (!document.getElementById('loopLab')) return;
    state = JSON.parse(JSON.stringify(L.DEFAULT));
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);

  window.MindAICodeLoopLab = { init: init, render: () => render(), getState: () => state, setState: s => { state = s; render(); } };
})();
