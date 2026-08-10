/* ============================================================================
   MindAICode — sign-in and cross-device progress sync
   ----------------------------------------------------------------------------
   Design rules this file sticks to:

   * The site MUST work with Firebase switched off or unreachable. Every entry
     point is guarded; if anything is missing we simply do nothing and the
     browser-only experience continues untouched.
   * We never block content. A student can finish the whole site without ever
     signing in. Sign-in is offered once, after they finish their first game,
     because that is when "save my progress" actually means something to them.
   * We only ever sync keys this site owns (the badge/progress prefixes below).
   ============================================================================ */

(function () {
  'use strict';

  var CFG = (typeof MINDAICODE_FIREBASE !== 'undefined') ? MINDAICODE_FIREBASE : null;
  var SYNC_PREFIXES = ['mbas_', 'mac_', 'msel_', 'mins_', 'mmrg_', 'mqs_', 'mhp_',
                       'mbigo_', 'mbsr_', 'mlds_', 'mhsh_', 'mtre_', 'mgph_', 'mrdp_',
                       'mcap_', 'mrev_', 'msbx_'];
  var PROMPT_SHOWN_KEY = 'mai_prompted';
  var auth = null, db = null, currentUser = null, profile = null;
  var pushTimer = null, ready = false;

  function ls(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }
  function isSyncKey(k) { return SYNC_PREFIXES.some(function (p) { return k.indexOf(p) === 0; }); }
  function configured() {
    return !!(CFG && CFG.ENABLED && CFG.FIREBASE &&
              CFG.FIREBASE.apiKey && CFG.FIREBASE.apiKey.indexOf('PASTE_') !== 0);
  }

  /* ------------------------------------------------------------------ styles */
  function injectStyles() {
    if (document.getElementById('maiStyles')) return;
    var s = document.createElement('style');
    s.id = 'maiStyles';
    s.textContent = [
      '.maiBtn{background:var(--panel2,#1c2333);border:1px solid var(--border,#30363d);color:var(--text,#e6edf3);',
      'border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;',
      'display:inline-flex;align-items:center;gap:7px;}',
      '.maiBtn:hover{border-color:var(--accent,#58a6ff);}',
      '.maiAvatar{width:22px;height:22px;border-radius:50%;object-fit:cover;}',
      '.maiInitial{width:22px;height:22px;border-radius:50%;background:var(--accent,#58a6ff);color:#0d1117;',
      'display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;}',
      '.maiOverlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:200;display:flex;',
      'align-items:center;justify-content:center;padding:20px;}',
      '.maiCard{background:var(--panel,#161b22);border:1px solid var(--border,#30363d);border-radius:16px;',
      'padding:26px;max-width:430px;width:100%;max-height:90vh;overflow-y:auto;}',
      '.maiCard h3{font-size:19px;margin-bottom:8px;color:var(--text,#e6edf3);}',
      '.maiCard p{font-size:13.5px;color:var(--muted,#8b949e);line-height:1.65;margin-bottom:16px;}',
      '.maiField{margin-bottom:14px;}',
      '.maiField label{display:block;font-size:12.5px;font-weight:700;color:var(--muted,#8b949e);margin-bottom:5px;}',
      '.maiField input,.maiField select{width:100%;background:var(--panel2,#1c2333);border:1px solid var(--border,#30363d);',
      'color:var(--text,#e6edf3);padding:9px 12px;border-radius:8px;font-size:14px;font-family:inherit;}',
      '.maiField .opt{font-weight:400;opacity:.75;}',
      '.maiGoogle{width:100%;background:#fff;color:#1f1f1f;border:none;border-radius:9px;padding:11px;',
      'font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;',
      'justify-content:center;gap:10px;}',
      '.maiGoogle:hover{filter:brightness(.95);}',
      '.maiRow{display:flex;gap:10px;margin-top:6px;}',
      '.maiRow button{flex:1;}',
      '.maiGhost{background:transparent;border:1px solid var(--border,#30363d);color:var(--muted,#8b949e);',
      'border-radius:9px;padding:10px;font-size:13.5px;cursor:pointer;font-family:inherit;font-weight:600;}',
      '.maiPrimary{background:var(--green,#3fb950);color:#0d1117;border:none;border-radius:9px;padding:10px;',
      'font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;}',
      '.maiPrimary:disabled{opacity:.45;cursor:not-allowed;}',
      '.maiPrivacy{font-size:11.5px;color:var(--muted,#8b949e);line-height:1.6;background:var(--panel2,#1c2333);',
      'border-radius:8px;padding:10px 12px;margin-bottom:14px;}',
      '.maiErr{color:var(--red,#f85149);font-size:12.5px;min-height:18px;margin-top:4px;}',
      '.maiMenu{position:absolute;right:0;top:34px;background:var(--panel,#161b22);border:1px solid var(--border,#30363d);',
      'border-radius:10px;padding:6px;min-width:190px;z-index:100;box-shadow:0 10px 30px rgba(0,0,0,.5);}',
      '.maiMenu button{display:block;width:100%;text-align:left;background:none;border:none;color:var(--text,#e6edf3);',
      'padding:8px 10px;border-radius:6px;font-size:13px;cursor:pointer;font-family:inherit;}',
      '.maiMenu button:hover{background:var(--panel2,#1c2333);}',
      '.maiMenu button.danger{color:var(--red,#f85149);}',
      '.maiWrap{position:relative;display:inline-block;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------- modal */
  function closeModal() {
    var o = document.getElementById('maiOverlay');
    if (o) o.remove();
  }
  function modal(innerHTML) {
    closeModal();
    injectStyles();
    var o = document.createElement('div');
    o.className = 'maiOverlay';
    o.id = 'maiOverlay';
    o.innerHTML = '<div class="maiCard">' + innerHTML + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(); });
    document.body.appendChild(o);
    return o;
  }

  var GOOGLE_G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.9c-.3 2.1-1.7 5.3-4.9 7.4l7.6 5.9c4.5-4.2 6.9-10.3 6.9-17.4z"/>' +
    '<path fill="#FBBC05" d="M10.4 28.2c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 15.9 0 19.8 0 23.5s1 7.6 2.6 10.8l7.8-6.1z"/>' +
    '<path fill="#34A853" d="M24 47c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2 1.4-4.7 2.4-7.7 2.4-6.3 0-11.7-4.2-13.6-9.9l-7.8 6.1C6.5 42.1 14.6 47 24 47z"/></svg>';

  function showSignIn(reason) {
    modal(
      '<h3>' + (reason || 'Save your progress') + '</h3>' +
      '<p>Sign in with Google and your badges, level and XP follow you to any device — phone, laptop, lab computer. ' +
      'You can carry on without signing in; your progress just stays on this browser only.</p>' +
      '<div class="maiPrivacy">' + (CFG ? CFG.PRIVACY_NOTE : '') + '</div>' +
      '<button class="maiGoogle" id="maiGoogleBtn">' + GOOGLE_G + ' Continue with Google</button>' +
      '<div class="maiErr" id="maiErr"></div>' +
      '<div class="maiRow"><button class="maiGhost" id="maiLater">Not now — keep going</button></div>'
    );
    document.getElementById('maiLater').onclick = closeModal;
    document.getElementById('maiGoogleBtn').onclick = doSignIn;
  }

  function showProfileForm() {
    var studyOpts = (CFG.STUDY_OPTIONS || []).map(function (o) {
      return '<option value="' + o + '">' + o + '</option>';
    }).join('');
    var phoneRequired = !!CFG.REQUIRE_PHONE;
    modal(
      '<h3>Almost there 👋</h3>' +
      '<p>Just so we can set things up for you. This is stored against your account only.</p>' +
      '<div class="maiField"><label>Name</label><input id="maiName" value="' +
        ((currentUser && currentUser.displayName) || '').replace(/"/g, '&quot;') + '"></div>' +
      (CFG.ASK_STUDY ?
        '<div class="maiField"><label>What are you studying?</label><select id="maiStudy">' +
        '<option value="">Choose one…</option>' + studyOpts + '</select></div>' : '') +
      '<div class="maiField"><label>Mobile number ' +
        (phoneRequired ? '' : '<span class="opt">— optional</span>') +
        '</label><input id="maiPhone" type="tel" inputmode="numeric" placeholder="10 digits"></div>' +
      '<div class="maiPrivacy">' + (CFG ? CFG.PRIVACY_NOTE : '') + '</div>' +
      '<div class="maiErr" id="maiErr"></div>' +
      '<div class="maiRow">' +
        '<button class="maiGhost" id="maiSkip">Skip</button>' +
        '<button class="maiPrimary" id="maiSave">Save and continue</button>' +
      '</div>'
    );
    document.getElementById('maiSkip').onclick = function () { saveProfile(true); };
    document.getElementById('maiSave').onclick = function () { saveProfile(false); };
  }

  function saveProfile(skipped) {
    var err = document.getElementById('maiErr');
    var name = (document.getElementById('maiName') || {}).value || '';
    var studyEl = document.getElementById('maiStudy');
    var study = studyEl ? studyEl.value : '';
    var phone = (document.getElementById('maiPhone') || {}).value || '';
    phone = phone.replace(/\D/g, '');

    if (!skipped) {
      if (!name.trim()) { err.textContent = 'Please enter your name.'; return; }
      if (CFG.ASK_STUDY && !study) { err.textContent = 'Please pick what you are studying.'; return; }
      if (CFG.REQUIRE_PHONE && phone.length !== 10) { err.textContent = 'Please enter a 10-digit mobile number.'; return; }
      if (phone && phone.length !== 10) { err.textContent = 'That mobile number does not look like 10 digits. Clear it or fix it.'; return; }
    }
    profile = {
      name: name.trim() || (currentUser && currentUser.displayName) || '',
      email: (currentUser && currentUser.email) || '',
      study: study || '',
      phone: skipped ? '' : phone,
      profileComplete: !skipped,
      updatedAt: Date.now(),
    };
    writeDoc({ profile: profile }).then(closeModal).catch(function () { closeModal(); });
    renderButton();
  }

  /* --------------------------------------------------------------- firestore */
  function docRef() {
    if (!db || !currentUser) return null;
    return db.collection('students').doc(currentUser.uid);
  }
  function writeDoc(patch) {
    var ref = docRef();
    if (!ref) return Promise.resolve();
    return ref.set(patch, { merge: true });
  }
  function collectLocalProgress() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && isSyncKey(k)) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }
  function pushProgress() {
    if (!currentUser) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      writeDoc({ progress: collectLocalProgress(), updatedAt: Date.now() }).catch(function () {});
    }, 1200);
  }
  /* Merge remote into local. A badge earned anywhere is kept — we never wipe
     work the student did on another device just because this browser is newer. */
  function mergeRemote(remote) {
    if (!remote) return 0;
    var added = 0;
    Object.keys(remote).forEach(function (k) {
      if (!isSyncKey(k)) return;
      var local = ls(function () { return localStorage.getItem(k); }, null);
      if (local === null) { ls(function () { localStorage.setItem(k, remote[k]); }); added++; }
      else if (local !== '1' && remote[k] === '1') { ls(function () { localStorage.setItem(k, '1'); }); added++; }
    });
    return added;
  }

  /* ------------------------------------------------------------------ button */
  function renderButton() {
    var slot = document.querySelector('.tagline');
    if (!slot) return;
    injectStyles();
    var wrap = document.getElementById('maiWrap');
    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'maiWrap';
      wrap.id = 'maiWrap';
      slot.appendChild(wrap);
    }
    if (!currentUser) {
      wrap.innerHTML = '<button class="maiBtn" id="maiSignIn">Sign in to save progress</button>';
      document.getElementById('maiSignIn').onclick = function () { showSignIn(); };
      return;
    }
    var nm = (profile && profile.name) || currentUser.displayName || currentUser.email || 'You';
    var pic = currentUser.photoURL
      ? '<img class="maiAvatar" src="' + currentUser.photoURL + '" alt="">'
      : '<span class="maiInitial">' + nm.charAt(0).toUpperCase() + '</span>';
    wrap.innerHTML = '<button class="maiBtn" id="maiMe">' + pic + '<span>' + nm.split(' ')[0] + '</span></button>';
    document.getElementById('maiMe').onclick = function (e) {
      e.stopPropagation();
      var open = document.getElementById('maiMenu');
      if (open) { open.remove(); return; }
      var m = document.createElement('div');
      m.className = 'maiMenu';
      m.id = 'maiMenu';
      m.innerHTML =
        '<button id="maiEdit">Edit my details</button>' +
        '<button id="maiSyncNow">Sync now</button>' +
        '<button id="maiOut">Sign out</button>' +
        '<button class="danger" id="maiDelete">Delete my account</button>';
      wrap.appendChild(m);
      document.getElementById('maiEdit').onclick = function () { m.remove(); showProfileForm(); };
      document.getElementById('maiSyncNow').onclick = function () { m.remove(); pushProgress(); };
      document.getElementById('maiOut').onclick = function () { m.remove(); auth.signOut(); };
      document.getElementById('maiDelete').onclick = function () { m.remove(); confirmDelete(); };
      setTimeout(function () {
        document.addEventListener('click', function once() {
          var mm = document.getElementById('maiMenu');
          if (mm) mm.remove();
          document.removeEventListener('click', once);
        });
      }, 0);
    };
  }

  function confirmDelete() {
    modal(
      '<h3>Delete your account?</h3>' +
      '<p>This permanently removes your name, email, course and saved progress from our database. ' +
      'It cannot be undone. Progress already stored in this browser stays until you clear it.</p>' +
      '<div class="maiErr" id="maiErr"></div>' +
      '<div class="maiRow">' +
        '<button class="maiGhost" id="maiCancel">Cancel</button>' +
        '<button class="maiPrimary" id="maiReally" style="background:var(--red,#f85149);">Delete everything</button>' +
      '</div>'
    );
    document.getElementById('maiCancel').onclick = closeModal;
    document.getElementById('maiReally').onclick = function () {
      var ref = docRef();
      var done = function () { auth.signOut().then(closeModal).catch(closeModal); };
      if (ref) ref.delete().then(function () {
        if (currentUser && currentUser.delete) currentUser.delete().then(done).catch(done);
        else done();
      }).catch(done);
      else done();
    };
  }

  /* ------------------------------------------------------------------- auth */
  function doSignIn() {
    var err = document.getElementById('maiErr');
    if (!auth) {
      if (err) err.textContent = ready
        ? 'Sign-in is not configured yet.'
        : 'Could not reach the sign-in service — your network may be blocking it. Your progress is still being saved in this browser.';
      return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function (e) {
      if (err) err.textContent = (e && e.code === 'auth/popup-closed-by-user')
        ? 'Sign-in was cancelled.'
        : 'Could not sign in. Please try again.';
    });
  }

  function onUser(user) {
    currentUser = user || null;
    renderButton();
    if (!user) { profile = null; return; }
    var ref = docRef();
    if (!ref) return;
    ref.get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      profile = data.profile || null;
      var added = mergeRemote(data.progress);
      writeDoc({
        progress: collectLocalProgress(),
        lastSeen: Date.now(),
        profile: profile || { email: user.email || '', name: user.displayName || '' },
      }).catch(function () {});
      closeModal();
      if (!profile || !profile.profileComplete) showProfileForm();
      renderButton();
      if (added > 0 && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('mai:progress-merged', { detail: { added: added } }));
      }
    }).catch(function () { renderButton(); });
  }

  /* ------------------------------------ offer sign-in after the FIRST badge */
  function watchForFirstWin() {
    var raw = ls(function () { return localStorage.setItem; }, null);
    if (!raw) return;
    var original = localStorage.setItem.bind(localStorage);
    try {
      localStorage.setItem = function (k, v) {
        original(k, v);
        if (!isSyncKey(k)) return;
        if (currentUser) { pushProgress(); return; }
        if (!configured()) return;
        if (k.indexOf('_badge_') === -1 || v !== '1') return;
        if (ls(function () { return localStorage.getItem(PROMPT_SHOWN_KEY); }, '1')) return;
        ls(function () { original(PROMPT_SHOWN_KEY, '1'); });
        setTimeout(function () {
          showSignIn('Nice — first game done! 🎉');
        }, 1400);
      };
    } catch (e) { /* some browsers refuse; sync just becomes manual */ }
  }

  /* ------------------------------------------------------------------- init */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function start() {
    watchForFirstWin();
    if (!configured()) return;              // site runs exactly as before
    if (!location.protocol.startsWith('http')) return;  // popups need http(s)

    /* Show the button straight away. If the Firebase CDN is blocked — school
       wifi and corporate firewalls do block gstatic — the student still sees
       the control and gets a clear message on click, instead of silently
       being offered nothing. */
    renderButton();

    var base = 'https://www.gstatic.com/firebasejs/10.12.2/';
    loadScript(base + 'firebase-app-compat.js')
      .then(function () { return loadScript(base + 'firebase-auth-compat.js'); })
      .then(function () { return loadScript(base + 'firebase-firestore-compat.js'); })
      .then(function () {
        firebase.initializeApp(CFG.FIREBASE);
        auth = firebase.auth();
        db = firebase.firestore();
        ready = true;
        renderButton();
        auth.onAuthStateChanged(onUser);
      })
      .catch(function () { /* offline or blocked — stay local-only */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.MindAICodeAuth = {
    isConfigured: configured,
    isReady: function () { return ready; },
    user: function () { return currentUser; },
    profile: function () { return profile; },
    showSignIn: showSignIn,
    collectLocalProgress: collectLocalProgress,
    mergeRemote: mergeRemote,
    _isSyncKey: isSyncKey,
  };
})();
