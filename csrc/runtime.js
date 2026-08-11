/* ------------------------------------------------------------------
   Runtime: add the C and C++ tabs to whatever code panels this page has,
   keep every panel on the page in sync, and remember the student's choice
   so they don't have to re-pick their language on every single lesson.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var KEY   = 'mai_codelang';
  var ORDER = ['py', 'java', 'c', 'cpp'];
  var LABEL = { py: 'Python', java: 'Java', c: 'C', cpp: 'C++' };

  function read()  { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v){ try { localStorage.setItem(KEY, v); }    catch (e) {} }

  function pageKey() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }

  /* 'py' from data-lang="py", from data-target="stack-py", or from id="stack-py" */
  function langOf(el) {
    var v = (el.dataset && (el.dataset.lang || el.dataset.target)) || el.id || '';
    var parts = v.split('-');
    return parts[parts.length - 1];
  }

  function wrapsAfter(group) {
    var out = [], el = group.nextElementSibling;
    while (el && el.classList && el.classList.contains('codeWrap')) {
      out.push(el);
      el = el.nextElementSibling;
    }
    return out;
  }

  /* find the .tabs group that belongs to a code panel */
  function groupFor(panel) {
    var el = panel.previousElementSibling;
    while (el && !(el.classList && el.classList.contains('tabs'))) el = el.previousElementSibling;
    return el;
  }

  /* ---------- 1. inject the C and C++ panels + buttons ---------- */
  var page = (window.MINDAICODE_CODE || {})[pageKey()] || {};

  Object.keys(page).forEach(function (base) {
    var py = document.getElementById(base + '-py');
    if (!py) return;                       // page doesn't have this panel
    var group = groupFor(py);
    if (!group) return;

    var usesLang = !!group.querySelector('.tab[data-lang]');
    var last = document.getElementById(base + '-java') || py;

    ['c', 'cpp'].forEach(function (lg) {
      var src = page[base][lg];
      if (!src) return;
      if (document.getElementById(base + '-' + lg)) return;   // already there

      var wrap = document.createElement('div');
      wrap.className = 'codeWrap';
      wrap.id = base + '-' + lg;
      wrap.innerHTML = '<div class="code">' + src + '</div>';
      last.parentNode.insertBefore(wrap, last.nextSibling);
      last = wrap;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab';
      btn.textContent = LABEL[lg];
      if (usesLang) btn.dataset.lang = lg; else btn.dataset.target = base + '-' + lg;
      group.appendChild(btn);
    });
  });

  /* ---------- 2. take over tab switching for every code group ---------- */
  var groups = [];
  Array.prototype.forEach.call(document.querySelectorAll('.tabs'), function (g) {
    var wraps = wrapsAfter(g);
    if (!wraps.length) return;                                  // not a code group
    var tabs = Array.prototype.slice.call(g.querySelectorAll('.tab'));
    if (!tabs.some(function (t) { return ORDER.indexOf(langOf(t)) >= 0; })) return;
    groups.push({ tabs: tabs, wraps: wraps });
  });

  function apply(lang, save) {
    var changed = false;
    groups.forEach(function (G) {
      // only switch a group that actually offers this language
      if (!G.tabs.some(function (t) { return langOf(t) === lang; })) return;
      G.tabs.forEach(function (t) { t.classList.toggle('on', langOf(t) === lang); });
      G.wraps.forEach(function (w) { w.classList.toggle('on', langOf(w) === lang); });
      changed = true;
    });
    if (changed && save) write(lang);
    return changed;
  }

  groups.forEach(function (G) {
    G.tabs.forEach(function (t) {
      t.onclick = function () { apply(langOf(t), true); };
    });
  });

  /* ---------- 3. restore the language they picked last time ---------- */
  var saved = read();
  if (saved && ORDER.indexOf(saved) >= 0) apply(saved, false);

  /* ---------- 4. let the rest of the page ask what's selected ---------- */
  window.MindAICodeLang = {
    /* the exact tab showing: 'py' | 'java' | 'c' | 'cpp' */
    current: function () {
      var on = document.querySelector('.tab.on');
      var lg = on ? langOf(on) : 'py';
      return ORDER.indexOf(lg) >= 0 ? lg : 'py';
    },
    /* the syntax family, for explanations: Python, or everything C-shaped */
    family: function () {
      return this.current() === 'py' ? 'py' : 'java';
    },
    set: function (lang) { return apply(lang, true); },
    LABEL: LABEL
  };
})();
