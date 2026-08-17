/* MindAICode — the tutor who sits next to you.
 *
 * Not a help button you have to go and find. A small panel that is always there,
 * watches what the student is doing, and speaks up at each step — warm, and
 * willing to just tell them the answer when they ask. A student who is stuck and
 * cannot get unstuck loses confidence; that matters more than making them sweat.
 *
 * Every word here is written down and tested, so it works offline and can never
 * be wrong. If tutor-config.js is switched on, an "ask me anything" box appears
 * as well — with these scripted answers still the fallback.
 */

window.MINDAICODE_TUTOR_SCRIPT = {

  /* what the tutor says when a student arrives at each step */
  steps: [
    { title: 'Variables',
      greet: "Right — first idea, and it's an easy one. A <b>variable</b> is just a labelled box. Drag the cards into an order and press Run; if it goes wrong, nothing breaks. I'll be here.",
      hint:  "Think about what happens to whatever was already in the box when you copy something new into it. It gets overwritten — that's the whole puzzle.",
      tell:  "Use the third box. Copy <b>x</b> into <b>temp</b> first, then copy <b>y</b> into <b>x</b>, then copy <b>temp</b> into <b>y</b>. The middle box is what saves the value you would otherwise lose." },

    { title: 'Arrays and index',
      greet: "Now a row of boxes. The one thing that trips everyone up: the first box is number <b>0</b>, not 1. Not because anyone is being awkward — an index is a <i>distance</i> from the start.",
      hint:  "Count how many steps along from the very first box, rather than counting the boxes themselves.",
      tell:  "Index 0 is the first box, index 1 is the second, and so on. With 5 boxes the last one is index <b>4</b> — there is no index 5, and asking for it stops the program." },

    { title: 'Loops',
      greet: "This is the big one, so take your time. Do the job by hand first with the picture — you don't need to read any code yet. Once you answer, I'll show you the code for what you just did.",
      hint:  "Work through the picture one item at a time and keep a running total in your head. Watch for anything in the job that says <i>skip</i> or <i>stop</i>.",
      tell:  "Go item by item, adding as you go, and pay attention to where it stops. Then use <b>Build your own loop</b> underneath — change the numbers to anything you like and press Run. That is the fastest way to make this stick." },

    { title: 'Functions and decisions',
      greet: "A function is a machine: something goes in, a decision happens, something comes out. Same input, same output, every single time.",
      hint:  "Work out what value goes in, then follow the <code>if</code> tests from the top and stop at the first one that is true.",
      tell:  "Read the tests in order from the top. The first one that is true wins and the rest are skipped entirely — that is why the order of the tests changes the answer." },

    { title: 'Recursion',
      greet: "Last one, and the one people find strangest. Start with the loop-versus-recursion panel — it shows why this is <i>not</i> just another loop.",
      hint:  "Nothing gets calculated on the way down. Follow the calls until one of them can answer without asking anyone else, then come back up.",
      tell:  "The chain of calls goes all the way down to the <b>base case</b> — the one that can answer on its own. Only then do answers travel back up, each call adding its bit. The pile of waiting calls is what makes it recursion rather than a loop." }
  ],

  /* reactions to an answer, so it feels like someone is watching */
  right: [
    "That's it. Well done.",
    "Correct — and you worked it out yourself, which is the part that counts.",
    "Exactly right.",
    "Spot on. Nice.",
    "Yes! That's the one."
  ],
  wrong: [
    "Not quite — and honestly this is the one most people get wrong first time. Look at the explanation below and it'll click.",
    "Close. Getting this wrong once is how everybody learns it — read what happened and try the next one.",
    "Wrong answer, right effort. The explanation below shows exactly where it went sideways.",
    "Nope — but don't let that put you off. This particular one catches almost everyone."
  ],

  /* nudges for the loop rounds specifically, keyed by level and round */
  loopHints: {
    beginner: [
      { hint: "Open the boxes left to right and keep a running total. Nothing tricky here — just don't miss one.",
        tell: "Add all three: 3 + 7 + 2 = <b>12</b>." },
      { hint: "Count the numbers she actually calls out. She starts at 0 and stops BEFORE 5 — so does she ever call 5?",
        tell: "She calls 0, 1, 2, 3, 4. Count them: that's <b>5</b> numbers, so 5 ticks. 5 itself is never called." },
      { hint: "Read the job again — one box is not to be opened at all. Add up only the ones you do open.",
        tell: "You skip the last box, so you only collect 10 + 20 + 30 = <b>60</b>. The 40 is never touched." }
    ],
    intermediate: [
      { hint: "For every single one of the 3 outer rounds, the inner ticking happens 4 times over.",
        tell: "3 rounds, 4 ticks in each: 3 × 4 = <b>12</b>. Nested loops multiply — they don't add." },
      { hint: "You tick, then check. Or check, then tick? Read the order carefully — it decides whether 3 gets counted.",
        tell: "You walk out AT 3, before ticking for it. So you only ticked for 0, 1 and 2 — that's <b>3</b>." },
      { hint: "Cross out the even ones first, then add up what's left.",
        tell: "0, 2 and 4 are skipped. That leaves 1 + 3 = <b>4</b>." }
    ],
    pro: [
      { hint: "Each time you remove something, everything to its right slides left — but you carry on from where you were, so you step over whatever slid into that spot.",
        tell: "You remove the first 2, everything slides left, and the second 2 lands in the slot you just handled — so you walk straight past it. Result: <b>[1, 2, 3]</b>." },
      { hint: "Write out the numbers you actually land on, then count them.",
        tell: "0, 3, 6, 9 — the next would be 12, past the stop. That's <b>4</b> numbers." },
      { hint: "Track i and the step count together: i = 0, then 2, then 4, then 6. When does the test fail?",
        tell: "It runs with i at 0, 2 and 4 — three steps. At 6 the test fails. So <b>3</b>." }
    ]
  },

  /* said when they use the free playground, because that is the behaviour to encourage */
  labPraise: [
    "Good — that's the right instinct. Break it on purpose and see what happens.",
    "Yes, change the numbers. You learn far more from that than from anything I say.",
    "Try something silly next. Nothing here can break, and surprises are where it clicks."
  ]
};

/* ------------------------------------------------------------------ the panel */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  const S = window.MINDAICODE_TUTOR_SCRIPT;
  const OPEN_KEY = 'mai_tutor_open';
  let currentStep = 0;
  let pick = 0;

  const CSS = [
    '.tutorDock{position:fixed;right:16px;bottom:16px;z-index:60;max-width:330px;}',
    '@media (max-width:640px){.tutorDock{right:8px;left:8px;bottom:8px;max-width:none;}}',
    '.tutorBubble{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--green);',
    '  border-radius:12px;padding:12px 14px;box-shadow:0 8px 28px rgba(0,0,0,.45);}',
    '.tutorTop{display:flex;align-items:center;gap:9px;margin-bottom:8px;}',
    '.tutorFace{flex:0 0 auto;}',
    '.tutorWho{font-size:12.5px;font-weight:800;line-height:1.2;}',
    '.tutorWho small{display:block;font-size:10.5px;color:var(--muted);font-weight:600;}',
    '.tutorX{margin-left:auto;background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:0 2px;}',
    '.tutorX:hover{color:var(--text);}',
    '.tutorSay{font-size:13px;line-height:1.65;color:var(--text);}',
    '.tutorSay b{color:var(--green);} .tutorSay code{font-family:Consolas,monospace;font-size:12px;',
    '  background:rgba(110,118,129,.25);padding:1px 4px;border-radius:4px;}',
    '.tutorBtns{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}',
    '.tutorBtn{background:var(--panel2);color:var(--muted);border:1px solid var(--border);border-radius:7px;',
    '  padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;}',
    '.tutorBtn:hover{color:var(--text);border-color:var(--green);}',
    '.tutorBtn.go{color:var(--green);border-color:rgba(63,185,80,.5);}',
    '.tutorTab{background:var(--green);color:#0d1117;border:none;border-radius:22px;padding:9px 15px;',
    '  font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.4);',
    '  display:flex;align-items:center;gap:7px;}',
    '.tutorAskWrap{margin-top:9px;}',
    '.tutorAskWrap input{width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);',
    '  padding:7px 9px;border-radius:7px;font-size:12.5px;font-family:inherit;}',
    '.tutorMini{font-size:10.5px;color:var(--muted);margin-top:5px;line-height:1.45;}'
  ].join('\n');
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  function faceSVG(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" role="img" aria-label="your tutor">' +
      '<circle cx="20" cy="20" r="19" fill="rgba(63,185,80,.16)" stroke="#3fb950" stroke-width="1.6"/>' +
      '<circle cx="20" cy="15" r="6" fill="#3fb950" opacity=".85"/>' +
      '<path d="M8 34 Q20 23 32 34" fill="#3fb950" opacity=".7"/>' +
      '</svg>';
  }

  function isOpen() { try { return localStorage.getItem(OPEN_KEY) !== '0'; } catch (e) { return true; } }
  function setOpen(v) { try { localStorage.setItem(OPEN_KEY, v ? '1' : '0'); } catch (e) {} }

  let dock, msgEl, btnsEl;

  function build() {
    dock = document.createElement('div');
    dock.className = 'tutorDock';
    dock.id = 'tutorDock';
    document.body.appendChild(dock);
    paintShell();
  }

  function paintShell() {
    if (!isOpen()) {
      dock.innerHTML = '<button type="button" class="tutorTab" id="tutorOpen">' +
        faceSVG(20) + ' Ask your tutor</button>';
      document.getElementById('tutorOpen').onclick = () => { setOpen(true); paintShell(); greet(currentStep); };
      return;
    }
    dock.innerHTML =
      '<div class="tutorBubble">' +
        '<div class="tutorTop">' +
          '<span class="tutorFace">' + faceSVG(34) + '</span>' +
          '<span class="tutorWho">Your tutor<small>sitting right here with you</small></span>' +
          '<button type="button" class="tutorX" id="tutorClose" title="hide">&#10005;</button>' +
        '</div>' +
        '<div class="tutorSay" id="tutorSay"></div>' +
        '<div class="tutorBtns" id="tutorBtns"></div>' +
      '</div>';
    document.getElementById('tutorClose').onclick = () => { setOpen(false); paintShell(); };
    msgEl = document.getElementById('tutorSay');
    btnsEl = document.getElementById('tutorBtns');
  }

  function say(html, buttons) {
    if (!isOpen()) return;
    if (!msgEl) paintShell();
    msgEl.innerHTML = html;
    btnsEl.innerHTML = '';
    (buttons || []).forEach(b => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'tutorBtn' + (b.go ? ' go' : '');
      el.textContent = b.label;
      el.onclick = b.act;
      btnsEl.appendChild(el);
    });
    const T = window.MINDAICODE_TUTOR || {};
    if (T.ENABLED) {
      const w = document.createElement('div');
      w.className = 'tutorAskWrap';
      w.innerHTML = '<input type="text" id="tutorAsk" maxlength="' + (T.MAX_QUESTION_CHARS || 300) +
        '" placeholder="or just ask me anything..."><div class="tutorMini">' + (T.NOTICE || '') + '</div>';
      btnsEl.parentNode.appendChild(w);
      w.querySelector('input').onkeydown = ev => {
        if (ev.key !== 'Enter' || !ev.target.value.trim()) return;
        const q = ev.target.value.trim();
        msgEl.innerHTML = 'Let me think about that...';
        T.ask(q, { step: currentStep })
          .then(a => say(a, [{ label: 'thanks', act: () => greet(currentStep) }]))
          .catch(() => say("I can't reach the internet right now, so I can't answer that one — but the written explanations on the page all still work.",
                           [{ label: 'ok', act: () => greet(currentStep) }]));
      };
    }
    if (window.MindAICodeExplainUI && window.MindAICodeExplainUI.voiceOn()) {
      window.MindAICodeExplainUI.say(html.replace(/<[^>]+>/g, ''));
    }
  }

  function stepInfo(i) { return S.steps[i] || S.steps[0]; }

  /* which loop round the student is on, so a hint can be about THAT round */
  function loopCtx() {
    try {
      const lvl = (typeof currentLevel !== 'undefined') ? currentLevel : 'beginner';
      const n = (typeof loopRound !== 'undefined') ? loopRound : 0;
      const set = S.loopHints[lvl] || S.loopHints.beginner;
      return set[n] || null;
    } catch (e) { return null; }
  }

  function greet(i) {
    currentStep = i;
    const s = stepInfo(i);
    say(s.greet, [
      { label: '💡 give me a hint', act: () => hint(i) },
      { label: '🙋 just tell me', go: true, act: () => tell(i) }
    ]);
  }
  function hint(i) {
    const ctx = (i === 2) ? loopCtx() : null;
    say('<b>Hint.</b> ' + ((ctx && ctx.hint) || stepInfo(i).hint), [
      { label: '🙋 still stuck — tell me', go: true, act: () => tell(i) },
      { label: 'got it, thanks', act: () => greet(i) }
    ]);
  }
  function tell(i) {
    const ctx = (i === 2) ? loopCtx() : null;
    say('<b>Here you go.</b> ' + ((ctx && ctx.tell) || stepInfo(i).tell) +
        '<br><br>No shame in asking — that is what I am here for.', [
      { label: 'thanks', act: () => greet(i) }
    ]);
  }

  function reactToAnswer(correct) {
    const pool = correct ? S.right : S.wrong;
    const line = pool[(pick++) % pool.length];
    say(line, correct
      ? [{ label: 'carry on', act: () => greet(currentStep) }]
      : [{ label: '💡 explain it to me', go: true, act: () => tell(currentStep) },
         { label: 'ok', act: () => greet(currentStep) }]);
  }

  function praiseLab() {
    say(S.labPraise[(pick++) % S.labPraise.length],
        [{ label: 'ok', act: () => greet(currentStep) }]);
  }

  /* ---------- hook into the page without touching the game code ---------- */
  function start() {
    build();
    greet(typeof currentStep === 'number' ? currentStep : 0);

    // follow the student from step to step
    if (typeof window.onStepShown === 'function') {
      for (let i = 0; i < S.steps.length; i++) {
        (function (n) { window.onStepShown(n, () => greet(n)); })(i);
      }
    }

    // react to answers in any of the games, without editing them
    document.addEventListener('click', function (e) {
      const b = e.target.closest && e.target.closest('.optBtn');
      if (b) {
        setTimeout(() => {
          const row = b.parentNode;
          if (!row) return;
          const gotIt = b.classList.contains('correct');
          const anyMarked = row.querySelector('.correct, .wrong');
          if (anyMarked) reactToAnswer(gotIt);
        }, 60);
        return;
      }
      if (e.target.closest && e.target.closest('#loopLab')) {
        // only praise occasionally, so it does not nag
        if (Math.random() < 0.25) setTimeout(praiseLab, 120);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 120));
  else setTimeout(start, 120);

  window.MindAICodeTutorUI = {
    greet: greet, hint: hint, tell: tell, say: say,
    reactToAnswer: reactToAnswer, isOpen: isOpen, setOpen: setOpen,
    stepCount: S.steps.length
  };
})();
