/* ============================================================================
   MindAICode — Programming Basics: game engine
   Questions live in basics-content.js, which must load first.
   ============================================================================ */

const STEP_IDS = ['variables', 'array', 'loop', 'function', 'recursion', 'quiz'];
const STEP_LABELS = ['Variables', 'Arrays', 'Loops', 'Functions', 'Recursion', 'Quiz'];
const XP_PER_STEP = 20;
let currentStep = 0;
let currentLevel = 'beginner';

function readFlag(k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
function setFlag(k) { try { localStorage.setItem(k, '1'); } catch (e) {} }

/* Beginner keeps the original key names so the course-path card keeps working. */
function badgeKey(level, id) { return level === 'beginner' ? 'mbas_badge_' + id : 'mbas_badge_' + level + '_' + id; }
function levelComplete(level) { return STEP_IDS.every(id => readFlag(badgeKey(level, id))); }
function levelUnlocked(level) {
  if (level === 'beginner') return true;
  if (level === 'intermediate') return levelComplete('beginner');
  return levelComplete('intermediate');
}
function levelEarned(level) { return STEP_IDS.filter(id => readFlag(badgeKey(level, id))).length; }
function xpTotal() { return LEVELS.reduce((s, l) => s + levelEarned(l), 0) * XP_PER_STEP; }

function setLevel(level) {
  if (!levelUnlocked(level)) return false;
  currentLevel = level;
  try { localStorage.setItem('mbas_level', level); } catch (e) {}
  renderLevelBar(); renderRail(); resetAllGames();
  return true;
}

function renderLevelBar() {
  const bar = document.getElementById('levelBar');
  if (!bar) return;
  bar.innerHTML = '';
  LEVELS.forEach(l => {
    const meta = LEVEL_META[l], open = levelUnlocked(l), done = levelComplete(l);
    const b = document.createElement('button');
    b.className = 'lvlBtn' + (l === currentLevel ? ' on' : '') + (open ? '' : ' locked');
    b.dataset.level = l;
    b.innerHTML = `<span class="lvlIcon">${open ? meta.icon : '🔒'}</span>` +
      `<span class="lvlName">${meta.label}</span>` +
      `<span class="lvlCount">${done ? 'done ✓' : levelEarned(l) + '/' + STEP_IDS.length}</span>`;
    b.title = open ? meta.blurb
      : (l === 'intermediate' ? 'Finish all six Beginner games to unlock' : 'Finish all six Intermediate games to unlock');
    b.onclick = () => {
      if (!setLevel(l)) {
        const prev = l === 'intermediate' ? 'beginner' : 'intermediate';
        showToastRaw(`🔒 Locked <small>Finish all six ${LEVEL_META[prev].label} games first — you're at ${levelEarned(prev)}/6</small>`);
      }
    };
    bar.appendChild(b);
  });
  const meta = LEVEL_META[currentLevel];
  document.getElementById('levelBlurb').innerHTML = `${meta.icon} <b>${meta.label}</b> — ${meta.blurb}`;
}

function renderRail() {
  const rail = document.getElementById('rail');
  rail.innerHTML = '';
  STEP_IDS.forEach((id, i) => {
    const done = readFlag(badgeKey(currentLevel, id));
    const el = document.createElement('div');
    el.className = 'railStep' + (done ? ' done' : '') + (i === currentStep ? ' current' : '');
    el.innerHTML = `<div class="railDot">${done ? '✓' : (i + 1)}</div><div class="railLbl">${STEP_LABELS[i]}</div>`;
    el.onclick = () => showStep(i);
    rail.appendChild(el);
  });
  document.getElementById('xpTotal').textContent = xpTotal();
  document.getElementById('stepLabel').textContent = `Step ${currentStep + 1} of ${STEP_IDS.length}`;
}

function showStep(i) {
  if (i < 0 || i >= STEP_IDS.length) return;
  currentStep = i;
  STEP_IDS.forEach((_, k) => document.getElementById('step' + k).classList.toggle('on', k === i));
  document.getElementById('backBtn').style.visibility = i === 0 ? 'hidden' : 'visible';
  document.getElementById('nextBtn').style.visibility = i === STEP_IDS.length - 1 ? 'hidden' : 'visible';
  renderRail();
  try { localStorage.setItem('mbas_last_step', String(i)); } catch (e) {}
  const panel = document.getElementById('hintPanel');
  if (panel && panel.classList.contains('on')) renderHint();
  if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
}

let toastTimer = null;
const CELEBRATIONS = ['Nice — variables done.', 'Indexing cracked.', 'Loops sorted.', 'You ran a function by hand.', 'Recursion: understood.', 'That level is complete.'];
function showToastRaw(html) {
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 3400);
}
function completeStep(i) {
  const key = badgeKey(currentLevel, STEP_IDS[i]);
  const already = readFlag(key);
  setFlag(key);
  renderRail(); renderLevelBar();
  if (already) return;
  const left = STEP_IDS.length - levelEarned(currentLevel);
  if (left === 0) {
    const next = currentLevel === 'beginner' ? 'intermediate' : currentLevel === 'intermediate' ? 'pro' : null;
    showToastRaw(next
      ? `🎉 ${LEVEL_META[currentLevel].label} complete! <small>${LEVEL_META[next].icon} ${LEVEL_META[next].label} is now unlocked</small>`
      : `🏆 Pro complete — you've finished everything here.`);
  } else {
    showToastRaw(`✅ ${CELEBRATIONS[i]} <small>+${XP_PER_STEP} XP · ${left} game${left === 1 ? '' : 's'} left at ${LEVEL_META[currentLevel].label}</small>`);
  }
}

function setFb(el, kind, html) { el.className = 'feedback on ' + kind; el.innerHTML = html; }

/* -------------------------------------------------------------- illustrations */
function jarSVG(val) {
  const empty = (val === null || val === undefined || val === '—');
  const shown = (typeof val === 'number' && !Number.isInteger(val)) ? String(val).slice(0, 7) : val;
  const small = String(shown).length > 4;
  return `<svg viewBox="0 0 72 90" role="img" aria-label="glass jar">
    <rect class="jarLid"  x="19" y="2"  width="34" height="10" rx="3"/>
    <rect class="jarNeck" x="26" y="12" width="20" height="6"/>
    <rect class="jarGlass" x="9" y="18" width="54" height="66" rx="11"/>
    <rect class="jarShine" x="15" y="26" width="7" height="34" rx="3.5"/>
    ${empty ? '' : '<rect class="jarFill" x="14" y="42" width="44" height="37" rx="8"/>'}
    ${empty ? '<text class="jarEmptyTxt" x="36" y="62">empty</text>'
            : `<text class="jarVal" x="36" y="66"${small ? ' style="font-size:13px"' : ''}>${shown}</text>`}
  </svg>`;
}
function postBoxSVG(val) {
  return `<svg viewBox="0 0 58 74" role="img" aria-label="post box">
    <rect class="boxLeg" x="24" y="60" width="10" height="12" rx="2"/>
    <rect class="boxFoot" x="17" y="69" width="24" height="4" rx="2"/>
    <path class="boxShell" d="M4 22 Q4 4 29 4 Q54 4 54 22 L54 55 Q54 60 49 60 L9 60 Q4 60 4 55 Z"/>
    <rect class="boxLip"  x="13" y="14" width="32" height="3"  rx="1.5"/>
    <rect class="boxSlot" x="14" y="17" width="30" height="6"  rx="3"/>
    <rect class="boxDoor" x="11" y="29" width="36" height="26" rx="4"/>
    <circle class="boxKey" cx="42" cy="42" r="2"/>
    <text class="boxVal" x="29" y="47">${val}</text>
  </svg>`;
}
function seatSVG() {
  return `<svg viewBox="0 0 58 62" role="img" aria-label="cinema seat">
    <circle class="seatHead" cx="29" cy="13" r="8.5"/>
    <rect class="seatArm" x="3"  y="32" width="7" height="20" rx="3.5"/>
    <rect class="seatArm" x="48" y="32" width="7" height="20" rx="3.5"/>
    <rect class="seatBack" x="10" y="24" width="38" height="30" rx="7"/>
  </svg>`;
}

/* =========================================================== GAME 1 — THE SWAP */
function swapCfg() { return SWAP_LEVELS[currentLevel]; }
function swapCompute(op, to, from) {
  switch (op) {
    case 'copy': return from;
    case 'add': return to + from;
    case 'toMinusFrom': return to - from;
    case 'fromMinusTo': return from - to;
    case 'xor': return to ^ from;
  }
  return to;
}
function runSwapProgram(ids, startOverride) {
  const cfg = swapCfg();
  const st = { ...(startOverride || cfg.start) };
  ids.forEach(id => {
    const c = cfg.cards.find(x => x.id === id);
    if (c) st[c.to] = swapCompute(c.op, st[c.to], st[c.from]);
  });
  return st;
}
let swapProgram = [], swapState = {}, swapExecIdx = 0, swapTimer = null;
let SWAP_STEP_MS = 1100;

function renderSwapPool() {
  const cfg = swapCfg(), pool = document.getElementById('swapPool');
  pool.innerHTML = '';
  cfg.cards.forEach(c => {
    const spent = !c.reusable && swapProgram.includes(c.id);
    const el = document.createElement('div');
    el.className = 'instrCard' + (spent ? ' used' : '') + (c.reusable ? ' reusable' : '');
    el.textContent = c.text + (c.reusable ? '  ♻' : '');
    el.dataset.cid = c.id;
    el.title = c.reusable ? 'This line can be used more than once' : '';
    el.onclick = () => {
      if ((!c.reusable && swapProgram.includes(c.id)) || swapProgram.length >= 3) return;
      swapProgram.push(c.id);
      renderSwapPool(); renderSwapProgram();
      document.getElementById('swapStepBtn').disabled = false;
      document.getElementById('swapFb').className = 'feedback';
    };
    pool.appendChild(el);
  });
}
function renderSwapProgram() {
  const cfg = swapCfg(), box = document.getElementById('swapProgram');
  if (!swapProgram.length) { box.innerHTML = '<div class="progEmpty">Empty — click up to 3 cards above to build your program.</div>'; return; }
  box.innerHTML = '';
  swapProgram.forEach((cid, i) => {
    const card = cfg.cards.find(c => c.id === cid);
    const line = document.createElement('div');
    line.className = 'progLine';
    line.innerHTML = `<span><span class="num">${i + 1}</span>${card.text}</span>`;
    const rm = document.createElement('button');
    rm.className = 'rmBtn'; rm.textContent = '✕';
    rm.onclick = () => { swapProgram.splice(i, 1); renderSwapPool(); renderSwapProgram(); resetSwapRun(); };
    line.appendChild(rm);
    box.appendChild(line);
  });
}
function renderJars(st, cls) {
  const cfg = swapCfg();
  document.getElementById('jarRow').innerHTML = cfg.jars.map(k =>
    `<div class="jar"><div class="jarBody${cls ? ' ' + cls : ''}" id="jar_${k}">${jarSVG(st[k])}</div><div class="jarLbl">${k}</div></div>`
  ).join('');
}
function flyValue(fromKey, toKey, value) {
  const row = document.getElementById('jarRow');
  const a = document.getElementById('jar_' + fromKey), b = document.getElementById('jar_' + toKey);
  if (!row || !a || !b || !a.offsetWidth) return;
  const tok = document.createElement('div');
  tok.className = 'flyToken';
  tok.textContent = value;
  tok.style.left = (a.offsetLeft + a.offsetWidth / 2 - 21) + 'px';
  tok.style.top = (a.offsetTop + 44) + 'px';
  row.appendChild(tok);
  void tok.offsetWidth;  // commit the start position or the transition never plays
  tok.style.left = (b.offsetLeft + b.offsetWidth / 2 - 21) + 'px';
  tok.style.top = (b.offsetTop + 44) + 'px';
  setTimeout(() => {
    tok.classList.add('landing');
    const d = document.getElementById('jar_' + toKey);
    if (d) { d.classList.add('pop'); setTimeout(() => d.classList.remove('pop'), 420); }
  }, 720);
  setTimeout(() => tok.remove(), 1150);
}
function ghostValue(atKey, value) {
  const row = document.getElementById('jarRow'), a = document.getElementById('jar_' + atKey);
  if (!row || !a || !a.offsetWidth) return;
  const g = document.createElement('div');
  g.className = 'ghostToken'; g.textContent = '💨 ' + value;
  g.style.left = (a.offsetLeft + a.offsetWidth / 2 - 22) + 'px';
  g.style.top = (a.offsetTop + 26) + 'px';
  row.appendChild(g);
  setTimeout(() => g.remove(), 1200);
}
function highlightProgLine(i) {
  document.querySelectorAll('#swapProgram .progLine').forEach((el, k) => el.classList.toggle('running', k === i));
}
const OP_WORD = { copy: 'copies', add: 'adds', toMinusFrom: 'subtracts', fromMinusTo: 'subtracts', xor: 'XORs' };
function swapStep() {
  if (swapExecIdx >= swapProgram.length) return true;
  const cfg = swapCfg();
  const card = cfg.cards.find(c => c.id === swapProgram[swapExecIdx]);
  const before = swapState[card.to], src = swapState[card.from];
  highlightProgLine(swapExecIdx);
  swapState[card.to] = swapCompute(card.op, before, src);

  const stillAlive = cfg.jars.some(k => swapState[k] === before);
  const destroyed = before !== null && before !== undefined && !stillAlive && card.op === 'copy';
  const hint = document.getElementById('swapHint');
  if (src === null || src === undefined) {
    hint.innerHTML = `<b>${card.text}</b> — but <b>${card.from}</b> is empty, so nothing gets copied.`;
  } else if (destroyed) {
    hint.innerHTML = `<b>${card.text}</b> — copies <b>${src}</b> into ${card.to}. <span class="gone">The ${before} that was in ${card.to} is gone forever.</span>`;
    ghostValue(card.to, before);
  } else if (card.op === 'copy') {
    hint.innerHTML = `<b>${card.text}</b> — copies <b>${src}</b> from ${card.from} into ${card.to}. <span style="color:var(--muted)">(${card.from} keeps its value — it's a copy, not a move.)</span>`;
  } else {
    hint.innerHTML = `<b>${card.text}</b> — ${OP_WORD[card.op]} ${card.from}'s <b>${src}</b> with ${card.to}'s <b>${before}</b>, giving <b>${swapState[card.to]}</b>.`;
  }
  if (src !== null && src !== undefined && card.from !== card.to) flyValue(card.from, card.to, src);

  renderJars(swapState, destroyed ? 'lost' : 'changed');
  swapExecIdx++;
  if (swapExecIdx >= swapProgram.length) {
    if (swapProgram.length === 3) finishSwap();
    else {
      clearInterval(swapTimer); highlightProgLine(-1);
      setFb(document.getElementById('swapFb'), 'neutral',
        `Line ${swapProgram.length} done. <b>Add the next instruction card</b> and run it — you can build the program one line at a time.`);
    }
    return true;
  }
  return false;
}
function finishSwap() {
  clearInterval(swapTimer); highlightProgLine(-1);
  const cfg = swapCfg(), st = swapState, fb = document.getElementById('swapFb');
  const won = st.x === 10 && st.y === 5, duplicated = st.x === st.y;
  renderJars(st, won ? 'win' : (duplicated ? 'lost' : ''));
  document.getElementById('swapStepBtn').disabled = true;
  if (won) {
    setFb(fb, 'good', cfg.win + (SWAP_VERDICT_NOTE[currentLevel] ? `<br><br><span style="color:var(--muted)">${SWAP_VERDICT_NOTE[currentLevel]}</span>` : ''));
    completeStep(0);
    showSwapTraps();
  } else if (duplicated) {
    setFb(fb, 'bad', `💥 <b>Both jars now hold ${st.x}.</b> One value was overwritten with nowhere else to live, so it is gone. Press Clear and try a different order.`);
  } else {
    setFb(fb, 'bad', `Not quite — x is ${st.x}, y is ${st.y}${cfg.jars.includes('temp') ? `, temp is ${st.temp === null ? 'still empty' : st.temp}` : ''}. You want x=10 and y=5.`);
  }
}
function showSwapTraps() {
  const cfg = swapCfg(), wrap = document.getElementById('swapTraps');
  const traps = [cfg.trap, cfg.trap2].filter(Boolean);
  if (!traps.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  wrap.innerHTML = `<div class="trapHead">🧪 It works. Now break it.</div>` +
    `<div class="trapSub">This is the part interviewers actually care about — knowing when the clever version fails.</div>` +
    `<div class="controls" id="trapBtns"></div><div class="feedback" id="trapFb"></div>`;
  const btns = wrap.querySelector('#trapBtns');
  traps.forEach(t => {
    const b = document.createElement('button');
    b.className = 'secondary'; b.textContent = t.label;
    b.onclick = () => {
      let st;
      if (t.alias) {
        st = { x: 42, y: 42 };
        cfg.solution.forEach(id => { const c = cfg.cards.find(x => x.id === id); st.x = swapCompute(c.op, st.x, st.x); });
        st.y = st.x;
      } else st = runSwapProgram(cfg.solution, t.run);
      renderJars(st, 'lost');
      setFb(document.getElementById('trapFb'), 'bad', t.verdict(st));
    };
    btns.appendChild(b);
  });
}
function resetSwapRun() {
  clearInterval(swapTimer);
  swapState = { ...swapCfg().start };
  swapExecIdx = 0;
  highlightProgLine(-1);
  renderJars(swapState, '');
  const sb = document.getElementById('swapStepBtn');
  if (sb) sb.disabled = false;
  document.getElementById('swapHint').innerHTML = '';
  document.getElementById('swapFb').className = 'feedback';
}
function renderSwapGame() {
  const cfg = swapCfg();
  document.getElementById('swapTitle').innerHTML = cfg.title;
  document.getElementById('swapBrief').innerHTML = cfg.brief;
  document.getElementById('swapTraps').style.display = 'none';
  swapProgram = [];
  renderSwapPool(); renderSwapProgram(); resetSwapRun();
}
function guardHasSomethingToRun() {
  if (!swapProgram.length) { setFb(document.getElementById('swapFb'), 'neutral', 'Click an instruction card above first, then run it.'); return false; }
  if (swapExecIdx >= swapProgram.length) {
    setFb(document.getElementById('swapFb'), 'neutral',
      swapProgram.length < 3 ? 'All your lines have run. <b>Add the next card</b> to keep going.' : 'This program has finished — press <b>Clear</b> to try a different order.');
    return false;
  }
  return true;
}

/* ======================================================== GAME 2 — LOCKER HUNT */
let lockerRound = 0, lockerScore = 0, lockerLives = 3, lockerLocked = false;
function lockerRounds() { return LOCKER_LEVELS[currentLevel]; }
function renderLockerLives() {
  document.getElementById('lockerLives').innerHTML =
    '❤️'.repeat(Math.max(0, lockerLives)) + '<span style="opacity:.25">' + '❤️'.repeat(Math.max(0, 3 - lockerLives)) + '</span>';
}
function renderLocker() {
  const rs = lockerRounds(), r = rs[lockerRound];
  document.getElementById('lockerPrompt').innerHTML = r.ask;
  document.getElementById('lockerRound').textContent = `Round ${lockerRound + 1} of ${rs.length}`;
  document.getElementById('lockerScore').textContent = `Score ${lockerScore}`;
  renderLockerLives();
  const box = document.getElementById('lockerBoxes');
  box.innerHTML = '';
  LOCKER_VALUES.forEach((v, i) => {
    const col = document.createElement('div');
    col.className = 'boxCol';
    col.innerHTML = `<div class="box" data-i="${i}">${postBoxSVG(v)}</div><div class="idxLbl">index ${i}</div>`;
    col.querySelector('.box').onclick = () => lockerGuess(i);
    box.appendChild(col);
  });
  document.getElementById('lockerFb').className = 'feedback';
  document.getElementById('lockerNextBtn').style.display = 'none';
}
function lockerGuess(i) {
  if (lockerLocked) return;
  lockerLocked = true;
  const rs = lockerRounds(), r = rs[lockerRound];
  const boxes = document.querySelectorAll('#lockerBoxes .box'), fb = document.getElementById('lockerFb');
  boxes.forEach(b => b.classList.add('noclick'));
  if (i === r.target) { lockerScore++; boxes[i].classList.add('correct'); setFb(fb, 'good', '✅ Correct! ' + r.teach); }
  else {
    lockerLives--; boxes[i].classList.add('wrong'); boxes[r.target].classList.add('correct');
    setFb(fb, 'bad', `❌ That was index <b>${i}</b>. The right one is green. ${r.teach}`);
  }
  document.getElementById('lockerScore').textContent = `Score ${lockerScore}`;
  renderLockerLives();
  if (lockerLives <= 0) {
    setFb(fb, 'bad', fb.innerHTML + '<br><br>💔 <b>Out of hearts.</b> No shame — indexing catches everyone. Play it again now you have seen the pattern.');
    document.getElementById('lockerRetryBtn').style.display = 'inline-block';
    return;
  }
  if (lockerRound < rs.length - 1) document.getElementById('lockerNextBtn').style.display = 'inline-block';
  else {
    const perfect = lockerScore === rs.length;
    setFb(fb, perfect ? 'good' : 'neutral', fb.innerHTML +
      `<br><br>🏁 <b>Finished: ${lockerScore}/${rs.length}.</b> ` + (perfect ? 'Perfect run.' : 'Worth one more go to lock it in.'));
    document.getElementById('lockerRetryBtn').style.display = 'inline-block';
    completeStep(1);
  }
}
function resetLocker() {
  lockerRound = 0; lockerScore = 0; lockerLives = 3; lockerLocked = false;
  const rb = document.getElementById('lockerRetryBtn');
  if (rb) rb.style.display = 'none';
  renderLocker();
}

/* ============================================================== GAME 3 — LOOPS */
let loopRound = 0, loopScore = 0, loopLocked = false, loopTimer = null;
function loopRounds() { return LOOP_LEVELS[currentLevel]; }
function renderLoopRound() {
  const rs = loopRounds(), r = rs[loopRound];
  document.getElementById('loopRound').textContent = `Round ${loopRound + 1} of ${rs.length}`;
  document.getElementById('loopScore').textContent = `Score ${loopScore}`;
  document.getElementById('loopCode').innerHTML = r.code.map(l => `<div class="line">${l}</div>`).join('');
  document.getElementById('loopQuestion').innerHTML = r.question;
  const opts = document.getElementById('loopOpts');
  opts.innerHTML = '';
  r.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'optBtn'; b.textContent = o; b.onclick = () => loopGuess(i);
    opts.appendChild(b);
  });
  document.getElementById('loopBoxes').innerHTML = '';
  document.getElementById('loopRunning').textContent = '';
  document.getElementById('loopFb').className = 'feedback';
  document.getElementById('loopNextBtn').style.display = 'none';
}
function animateLoopRun(r) {
  const boxWrap = document.getElementById('loopBoxes'), runEl = document.getElementById('loopRunning');
  clearInterval(loopTimer);
  if (!r.arr) { runEl.innerHTML = `answer: <b>${r.correctVal}</b>`; boxWrap.innerHTML = ''; return; }
  const limit = r.code.some(l => l.includes('- 1')) ? r.arr.length - 1 : r.arr.length;
  boxWrap.innerHTML = r.arr.map((v, i) =>
    `<div class="boxCol"><div class="box noclick" data-i="${i}">${postBoxSVG(v)}</div><div class="idxLbl">index ${i}</div></div>`).join('');
  let i = 0, total = 0;
  runEl.textContent = 'total = 0';
  loopTimer = setInterval(() => {
    if (i >= limit) { runEl.innerHTML = `total = <b>${total}</b>`; clearInterval(loopTimer); return; }
    const boxes = boxWrap.querySelectorAll('.box');
    boxes.forEach(b => b.classList.remove('hi'));
    boxes[i].classList.add('hi', 'done');
    total += r.arr[i]; runEl.innerHTML = `total = ${total}`; i++;
  }, 550);
}
function loopGuess(i) {
  if (loopLocked) return;
  loopLocked = true;
  const rs = loopRounds(), r = rs[loopRound];
  const btns = document.querySelectorAll('#loopOpts .optBtn');
  btns.forEach(b => b.disabled = true);
  const fb = document.getElementById('loopFb');
  if (i === r.ans) { loopScore++; btns[i].classList.add('correct'); setFb(fb, 'good', '✅ Correct! ' + r.teach); }
  else { btns[i].classList.add('wrong'); btns[r.ans].classList.add('correct'); setFb(fb, 'bad', '❌ Not quite. ' + r.teach); }
  document.getElementById('loopScore').textContent = `Score ${loopScore}`;
  animateLoopRun(r);
  if (loopRound < rs.length - 1) document.getElementById('loopNextBtn').style.display = 'inline-block';
  else {
    document.getElementById('loopRetryBtn').style.display = 'inline-block';
    setFb(fb, i === r.ans ? 'good' : 'bad', fb.innerHTML + `<br><br>🏁 <b>Finished: ${loopScore}/${rs.length}.</b>`);
    completeStep(2);
  }
}
function resetLoops() {
  clearInterval(loopTimer);
  loopRound = 0; loopScore = 0; loopLocked = false;
  const rb = document.getElementById('loopRetryBtn');
  if (rb) rb.style.display = 'none';
  renderLoopRound();
}

/* ========================================================== GAME 4 — FUNCTIONS */
let fnRound = 0, fnScore = 0, fnLocked = false;
function fnCfg() { return FN_LEVELS[currentLevel]; }
function fnCount() { const c = fnCfg(); return c.isRef ? c.cases.length : c.inputs.length; }
function renderFnRound() {
  const c = fnCfg();
  document.getElementById('fnRound').textContent = `Round ${fnRound + 1} of ${fnCount()}`;
  document.getElementById('fnScore').textContent = `Score ${fnScore}`;
  document.getElementById('fnPrompt').textContent = c.prompt;
  const callEl = document.getElementById('fnCall');
  if (c.isRef) {
    document.getElementById('fnCode').innerHTML = c.cases[fnRound].code.map(l => `<div class="line">${l}</div>`).join('');
    callEl.innerHTML = 'Does the caller see the change?';
    callEl.style.fontSize = '16px';
  } else {
    document.getElementById('fnCode').innerHTML = c.code.map(l => `<div class="line">${l}</div>`).join('');
    callEl.textContent = c.call(c.inputs[fnRound]);
    callEl.style.fontSize = '';
  }
  const opts = document.getElementById('fnOpts');
  opts.innerHTML = '';
  c.opts.forEach((label, i) => {
    const b = document.createElement('button');
    b.className = 'optBtn'; b.textContent = label; b.onclick = () => fnGuess(i);
    opts.appendChild(b);
  });
  document.getElementById('fnFb').className = 'feedback';
  document.getElementById('fnNextBtn').style.display = 'none';
}
function fnGuess(chosen) {
  if (fnLocked) return;
  fnLocked = true;
  const c = fnCfg();
  const truth = c.isRef ? c.cases[fnRound].ans : c.answer(c.inputs[fnRound]);
  const explain = c.isRef ? c.cases[fnRound].teach : c.explain(c.inputs[fnRound]);
  const btns = document.querySelectorAll('#fnOpts .optBtn');
  btns.forEach(b => b.disabled = true);
  const fb = document.getElementById('fnFb');
  if (chosen === truth) { fnScore++; btns[chosen].classList.add('correct'); setFb(fb, 'good', '✅ Correct! ' + explain); }
  else { btns[chosen].classList.add('wrong'); btns[truth].classList.add('correct'); setFb(fb, 'bad', '❌ Not quite. ' + explain); }
  document.getElementById('fnScore').textContent = `Score ${fnScore}`;
  if (fnRound < fnCount() - 1) document.getElementById('fnNextBtn').style.display = 'inline-block';
  else {
    document.getElementById('fnRetryBtn').style.display = 'inline-block';
    setFb(fb, chosen === truth ? 'good' : 'bad', fb.innerHTML + `<br><br>🏁 <b>Finished: ${fnScore}/${fnCount()}.</b>`);
    completeStep(3);
  }
}
function resetFns() {
  fnRound = 0; fnScore = 0; fnLocked = false;
  const rb = document.getElementById('fnRetryBtn');
  if (rb) rb.style.display = 'none';
  renderFnRound();
}

/* ========================================================== GAME 5 — RECURSION */
const CINEMA_ROWS = 5;
let cinemaAsking = CINEMA_ROWS, cinemaPhase = 'ask', cinemaAnswered = {};
let recLocked = false, recSteps = [], recIdx = 0, recStack = [], recOutput = [], recTimer = null;
function recCfg() { return REC_LEVELS[currentLevel]; }

function renderCinema() {
  const row = document.getElementById('cinemaRow');
  row.innerHTML = '';
  for (let r = 1; r <= CINEMA_ROWS; r++) {
    const seat = document.createElement('div');
    seat.className = 'seat';
    let cls = 'seatBody';
    if (r === CINEMA_ROWS) cls += ' you';
    if (r === 1 && cinemaAsking <= 1) cls += ' base';
    if (cinemaAnswered[r] !== undefined) cls += ' answered';
    else if (r === cinemaAsking && cinemaPhase === 'ask') cls += ' asking';
    const known = cinemaAnswered[r] !== undefined ? `<b>row ${cinemaAnswered[r]}</b>` : '?';
    seat.innerHTML = `<div class="${cls}">${seatSVG()}</div><div class="seatLbl">${known}</div>` +
      (r === CINEMA_ROWS ? '<div class="youTag">YOU</div>' : '');
    row.appendChild(seat);
  }
}
function cinemaAsk() {
  const fb = document.getElementById('cinemaFb');
  if (cinemaPhase === 'ask') {
    if (cinemaAsking > 1) {
      cinemaAsking--;
      renderCinema();
      if (cinemaAsking === 1) {
        setFb(fb, 'neutral', `Everyone has passed the question forward. The person in <b>row 1</b> can answer without asking anyone — they can see they are at the front. <b>That is the base case.</b> Keep clicking to send answers back.`);
        cinemaPhase = 'answer';
      } else setFb(fb, 'neutral', `Row ${cinemaAsking + 1} did not know either, so they asked row ${cinemaAsking}. Nobody has an answer yet — everyone is <em>waiting</em>.`);
    }
    return;
  }
  if (cinemaPhase === 'answer') {
    const next = Object.keys(cinemaAnswered).length === 0 ? 1 : Math.max(...Object.keys(cinemaAnswered).map(Number)) + 1;
    cinemaAnswered[next] = next;
    renderCinema();
    if (next === 1) setFb(fb, 'good', `Row 1 says <b>"I'm row 1"</b> — no asking needed. Now that answer travels back.`);
    else if (next < CINEMA_ROWS) setFb(fb, 'good', `Row ${next - 1} said "${next - 1}", so row ${next} adds one and says <b>"${next}"</b>.`);
    else {
      setFb(fb, 'good', `🎉 You have your answer: <b>row ${CINEMA_ROWS}</b>. The question travelled <em>forward</em>, then the answer came <em>back</em> in reverse.`);
      cinemaPhase = 'done';
      document.getElementById('predictBox').style.display = 'block';
      document.getElementById('cinemaAskBtn').disabled = true;
    }
  }
}
function renderRecPredict() {
  const c = recCfg();
  document.getElementById('recFnName').textContent = c.fnName;
  document.getElementById('recCode').innerHTML = c.code.map(l => `<div class="line">${l}</div>`).join('');
  document.getElementById('recQuestion').innerHTML = c.question;
  const box = document.getElementById('recOpts');
  box.innerHTML = '';
  c.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'optBtn'; b.textContent = o;
    b.onclick = () => {
      if (recLocked) return;
      recLocked = true;
      const btns = box.querySelectorAll('.optBtn');
      btns.forEach(x => x.disabled = true);
      const fb = document.getElementById('recFb');
      if (i === c.ans) { btns[i].classList.add('correct'); setFb(fb, 'good', c.right); }
      else { btns[i].classList.add('wrong'); btns[c.ans].classList.add('correct'); setFb(fb, 'bad', c.wrong); }
      document.getElementById('recRunWrap').style.display = 'block';
      completeStep(4);
    };
    box.appendChild(b);
  });
  document.getElementById('recFb').className = 'feedback';
  document.getElementById('recRunWrap').style.display = 'none';
  recLocked = false;
  recSteps = c.trace(); recIdx = 0; recStack = []; recOutput = [];
  renderRecStack();
  setFb(document.getElementById('recStepFb'), 'neutral', 'Press Step to make the first call.');
}
function renderRecStack() {
  const stage = document.getElementById('recStack');
  stage.innerHTML = recStack.length === 0 ? '<div class="stackEmpty">No calls waiting.</div>'
    : recStack.map((lbl, i) => `<div class="frame${i === recStack.length - 1 ? ' top' : ''}">${lbl}${i === recStack.length - 1 ? ' ← running' : ' — waiting'}</div>`).join('');
  document.getElementById('recOut').innerHTML = recOutput.map(t => `<span class="outChip">${t}</span>`).join('');
}
function recStep() {
  if (recIdx >= recSteps.length) { clearInterval(recTimer); return true; }
  const s = recSteps[recIdx], fb = document.getElementById('recStepFb');
  if (s.type === 'call') {
    recStack.push(s.label);
    setFb(fb, 'neutral', `<b>${s.label}</b> starts — and calls deeper before finishing its own work.`);
  } else {
    recOutput.push(s.text); recStack.pop();
    setFb(fb, 'good', `<b>${s.label}</b> → <b>${s.text}</b>, and returns to whoever was waiting.`);
  }
  renderRecStack();
  recIdx++;
  if (recIdx >= recSteps.length) { setFb(fb, 'good', `🏁 Done. ${recCfg().done}`); clearInterval(recTimer); return true; }
  return false;
}
function resetRecursion() {
  clearInterval(recTimer);
  const isBeginner = currentLevel === 'beginner';
  document.getElementById('cinemaCard').style.display = isBeginner ? 'block' : 'none';
  cinemaAsking = CINEMA_ROWS; cinemaPhase = 'ask'; cinemaAnswered = {};
  const askBtn = document.getElementById('cinemaAskBtn');
  if (askBtn) askBtn.disabled = false;
  renderCinema();
  setFb(document.getElementById('cinemaFb'), 'neutral', 'Nobody has asked anything yet. Tap the button to ask the person in front of you.');
  document.getElementById('predictBox').style.display = isBeginner ? 'none' : 'block';
  renderRecPredict();
}

/* =============================================================== FINAL QUIZ */
let qi = 0, qCorrect = 0;
function quizBank() { return QUIZ_LEVELS[currentLevel]; }
function showQuiz() {
  const bank = quizBank(), item = bank[qi];
  document.getElementById('quizQ').innerHTML = `<strong>Q${qi + 1}/${bank.length}:</strong> ${item.q}`;
  const box = document.getElementById('quizOpts');
  box.innerHTML = '';
  document.getElementById('quizFb').textContent = '';
  item.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'secondary';
    b.style.cssText = 'display:block; width:100%; text-align:left; margin-bottom:8px; font-weight:500;';
    b.innerHTML = o;
    b.onclick = () => {
      box.querySelectorAll('button').forEach(x => x.disabled = true);
      const ok = i === item.ans;
      if (ok) qCorrect++;
      b.style.borderColor = ok ? 'var(--green)' : 'var(--red)';
      b.style.background = ok ? 'rgba(63,185,80,.15)' : 'rgba(248,81,73,.15)';
      if (!ok) { const r = box.children[item.ans]; r.style.borderColor = 'var(--green)'; r.style.background = 'rgba(63,185,80,.15)'; }
      let tail = '';
      if (qi < bank.length - 1) tail = ' <a href="#" id="nq" style="color:var(--accent)">Next →</a>';
      else {
        tail = ` 🎉 Done — ${qCorrect}/${bank.length} correct.` + (qCorrect < bank.length ? ' <a href="#" id="rq" style="color:var(--accent)">Try again</a>' : '');
        if (qCorrect === bank.length) completeStep(5);
        renderFinishCard();
      }
      document.getElementById('quizFb').innerHTML = (ok ? '✅ Correct! ' : '❌ Not quite. ') + item.why + tail;
      const nq = document.getElementById('nq');
      if (nq) nq.onclick = e => { e.preventDefault(); qi++; showQuiz(); };
      const rq = document.getElementById('rq');
      if (rq) rq.onclick = e => { e.preventDefault(); qi = 0; qCorrect = 0; showQuiz(); };
    };
    box.appendChild(b);
  });
}
function renderFinishCard() {
  const card = document.getElementById('finishCard');
  card.style.display = 'block';
  const next = currentLevel === 'beginner' ? 'intermediate' : currentLevel === 'intermediate' ? 'pro' : null;
  const done = levelComplete(currentLevel);
  document.getElementById('finishTitle').innerHTML = done ? `🎉 ${LEVEL_META[currentLevel].label} complete` : 'Nearly there';
  document.getElementById('finishBody').innerHTML = done && next
    ? `You have finished every ${LEVEL_META[currentLevel].label} game. <b>${LEVEL_META[next].icon} ${LEVEL_META[next].label}</b> is now unlocked — same six ideas, harder questions.`
    : done ? 'That is every level of every game here. You know the vocabulary the rest of this site assumes.'
    : 'Finish the remaining games at this level to unlock the next one.';
  const btn = document.getElementById('finishNextLevel');
  if (done && next) {
    btn.style.display = 'inline-block';
    btn.textContent = `${LEVEL_META[next].icon} Start ${LEVEL_META[next].label} →`;
    btn.onclick = () => { setLevel(next); showStep(0); };
  } else btn.style.display = 'none';
}

/* ------------------------------------------------------------------ hints */
const HINTS = {
  beginner: [
    { title: 'Hint · The Swap', body: 'Ask yourself: <b>the moment you overwrite x, where has the old 5 gone?</b> Nowhere — unless you put it somewhere first. So your very first line should copy x into the spare jar.' },
    { title: 'Hint · Locker Hunt', body: 'Read the index labels under each box. The rule: <b>the Nth box is always at index N − 1</b>. So the 1st box is index 0, and with 5 boxes the last is index 4.' },
    { title: 'Hint · Guess the Output', body: 'Do it on paper: write what <b>i</b> is each pass and what <b>total</b> becomes. Watch for <b>range(n) stopping before n</b>, and any <code>- 1</code> that ends the loop early.' },
    { title: 'Hint · Be the Machine', body: 'Forget the code: <b>can this number split into two equal whole halves?</b> If yes it is even. And <b>0 counts as even</b> — it splits into two halves of nothing with no remainder.' },
    { title: 'Hint · Cinema Row', body: '<code>countdown(n - 1)</code> sits <b>above</b> <code>print(n)</code>, so countdown(4) hands over before it ever prints. Everyone asks forward before anyone answers. Who finishes first?' },
    { title: 'Hint · Final Check', body: 'Every answer here is something you already did in one of the five games. If one stumps you, go <b>Back</b> and replay that game — nothing is lost.' },
  ],
  intermediate: [
    { title: 'Hint · Swap with no temp', body: 'You need one number to hold <b>both</b> values at once. Adding them does that: x + y contains both. Then subtracting one out leaves the other.' },
    { title: 'Hint · Negative & computed indexes', body: 'Negative indexes count backwards, and <b>-1 is the last item</b> (there is no -0). For <code>//</code>, remember it throws the remainder away: 5 // 2 is 2, not 2.5.' },
    { title: 'Hint · Nested loops, break, continue', body: 'Nested loops <b>multiply</b> — the inner one runs fully for every outer pass. <code>break</code> leaves the loop entirely; <code>continue</code> only abandons the current pass.' },
    { title: 'Hint · Grades', body: 'The checks run <b>top to bottom</b> and the first true one wins. And <code>&gt;=</code> means "or equal" — a score sitting exactly on a boundary goes to the higher grade.' },
    { title: 'Hint · Factorial', body: 'Nothing is calculated on the way down — every call just waits. The multiplying happens as calls <b>return</b>, starting from the base case: 1, then 2×1, then 3×2...' },
    { title: 'Hint · Final Check', body: 'These come straight from the five Intermediate games. Replay any of them from the rail at the top — your progress is kept.' },
  ],
  pro: [
    { title: 'Hint · XOR swap', body: 'XOR has one magic property: <b>applying the same value twice cancels out</b>. a ^ b ^ b gives back a. Three XORs in the right order exploit exactly that.' },
    { title: 'Hint · Slices and reverse loops', body: 'Both <code>range()</code> and slices <b>stop before</b> their end value. And a reverse <code>range(len-1, -1, -1)</code> needs that -1 so it can reach index 0.' },
    { title: 'Hint · Loop traps', body: 'When you remove an item, everything after it <b>shifts left</b> — but the index keeps going up, so something gets skipped. For while loops, check whether the counter can step straight over the stop value.' },
    { title: 'Hint · Pass by reference', body: 'Ask one question: does this line <b>mutate the existing object</b> (.append, d[k]=v) or <b>rebind the name</b> to a new one (lst = [...])? Mutating is visible to the caller. Rebinding never is.' },
    { title: 'Hint · fib call count', body: 'Each call makes <b>two</b> more. Draw the tree for fib(5) and count every node, including the repeats — the same small values get computed again and again.' },
    { title: 'Hint · Final Check', body: 'Pro is about knowing when the clever answer is the wrong answer. If unsure, re-run the traps in the swap game.' },
  ],
};
function renderHint() {
  const set = HINTS[currentLevel] || HINTS.beginner;
  const h = set[currentStep] || set[0];
  document.getElementById('hintTitle').textContent = h.title;
  document.getElementById('hintText').innerHTML = h.body;
}

/* ------------------------------------------------------------------- wiring */
function resetAllGames() {
  renderSwapGame(); resetLocker(); resetLoops(); resetFns(); resetRecursion();
  qi = 0; qCorrect = 0; showQuiz();
  document.getElementById('finishCard').style.display = 'none';
}
function initBasics() {
  try { const l = localStorage.getItem('mbas_level'); if (l && LEVELS.includes(l) && levelUnlocked(l)) currentLevel = l; } catch (e) {}

  document.getElementById('nextBtn').onclick = () => showStep(currentStep + 1);
  document.getElementById('backBtn').onclick = () => showStep(currentStep - 1);
  document.getElementById('swapStepBtn').onclick = () => { if (!guardHasSomethingToRun()) return; clearInterval(swapTimer); swapStep(); };
  document.getElementById('swapRunBtn').onclick = () => {
    if (!guardHasSomethingToRun()) return;
    clearInterval(swapTimer);
    if (swapStep()) return;
    swapTimer = setInterval(() => { if (swapStep()) clearInterval(swapTimer); }, SWAP_STEP_MS);
  };
  document.getElementById('swapClearBtn').onclick = () => {
    swapProgram = []; renderSwapPool(); renderSwapProgram(); resetSwapRun();
    document.getElementById('swapTraps').style.display = 'none';
  };
  document.getElementById('lockerNextBtn').onclick = () => { lockerRound++; lockerLocked = false; renderLocker(); };
  document.getElementById('lockerRetryBtn').onclick = resetLocker;
  document.getElementById('loopNextBtn').onclick = () => { loopRound++; loopLocked = false; renderLoopRound(); };
  document.getElementById('loopRetryBtn').onclick = resetLoops;
  document.getElementById('fnNextBtn').onclick = () => { fnRound++; fnLocked = false; renderFnRound(); };
  document.getElementById('fnRetryBtn').onclick = resetFns;
  document.getElementById('cinemaAskBtn').onclick = cinemaAsk;
  document.getElementById('cinemaResetBtn').onclick = resetRecursion;
  document.getElementById('recStepBtn').onclick = () => { clearInterval(recTimer); recStep(); };
  document.getElementById('recPlayBtn').onclick = () => {
    clearInterval(recTimer);
    if (recIdx >= recSteps.length) { recIdx = 0; recStack = []; recOutput = []; renderRecStack(); }
    recTimer = setInterval(() => { if (recStep()) clearInterval(recTimer); }, 650);
  };
  document.querySelectorAll('.peekBtn').forEach(btn => {
    btn.onclick = () => {
      const body = document.getElementById(btn.dataset.peek);
      const open = body.classList.toggle('on');
      btn.textContent = open ? '🙈 Hide the code' : '👀 Peek at the real code';
    };
  });
  document.getElementById('hintFab').onclick = () => {
    const p = document.getElementById('hintPanel');
    const open = !p.classList.contains('on');
    if (open) renderHint();
    p.classList.toggle('on', open);
    document.getElementById('hintFab').classList.toggle('open', open);
  };
  document.getElementById('hintClose').onclick = () => {
    document.getElementById('hintPanel').classList.remove('on');
    document.getElementById('hintFab').classList.remove('open');
  };

  renderLevelBar();
  resetAllGames();

  let last = 0;
  try { last = parseInt(localStorage.getItem('mbas_last_step'), 10); } catch (e) { last = 0; }
  if (!Number.isInteger(last) || last < 0 || last >= STEP_IDS.length) last = 0;
  showStep(last);
  if (last > 0) showToastRaw(`👋 Welcome back <small>${LEVEL_META[currentLevel].label} · picking up at step ${last + 1} of ${STEP_IDS.length}</small>`);
}
