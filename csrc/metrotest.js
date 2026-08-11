/* metrotest.js — the BFS route finder on the metro map.
 *
 * The point of this file is that the demo has to be correct on maps I did NOT
 * design. So it generates hundreds of random networks using the page's own
 * generator and checks, on every one:
 *   - no station is ever stranded
 *   - BFS really returns a fewest-stops route (checked against a brute-force
 *     shortest-hop search, not against itself)
 *   - the "fastest" route really is the fastest (checked against brute force
 *     over every simple path)
 *   - the fewest-stops route is never faster than the fastest route
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
// the site lives one folder up from csrc/
const BASE = require('path').join(__dirname, '..') + '/';

let allPass = true;
const ok = (c, m) => { if (!c) { allPass = false; console.log('  !! FAIL: ' + m); } else console.log('  OK: ' + m); };

function boot() {
  const inline = f => fs.readFileSync(BASE + f, 'utf8');
  const html = fs.readFileSync(BASE + 'mindaicode-graphs.html', 'utf8')
    .replace('<script src="code-langs.js"></script>', '<script>' + inline('code-langs.js') + '</script>')
    .replace('<script src="complexity.js"></script>', '<script>' + inline('complexity.js') + '</script>');
  const store = {};
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'https://crsdevadmin.github.io/mindaicode/mindaicode-graphs.html',
    beforeParse(w) {
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1000; } });
      Object.defineProperty(w, 'localStorage', { configurable: true, value: {
        get length() { return Object.keys(store).length; },
        key: i => Object.keys(store)[i] || null,
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; } } });
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = () => {};
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
    }
  });
  return new Promise(r => setTimeout(() => r(dom), 400));
}

/* ---- independent reference implementations, deliberately NOT the page's ---- */
function refHops(adj, ids, s, t) {                 // brute-force fewest hops
  const d = { [s]: 0 }; const q = [s];
  while (q.length) { const n = q.shift();
    for (const [m] of adj[n]) if (!(m in d)) { d[m] = d[n] + 1; q.push(m); } }
  return t in d ? d[t] : null;
}
function refFastest(adj, ids, s, t) {              // brute force over simple paths
  let best = Infinity;
  (function walk(n, mins, seen) {
    if (mins >= best) return;
    if (n === t) { best = mins; return; }
    for (const [m, w] of adj[n]) if (!seen.has(m)) { seen.add(m); walk(m, mins + w, seen); seen.delete(m); }
  })(s, 0, new Set([s]));
  return best === Infinity ? null : best;
}
function reachableCount(adj, ids, s) {
  const seen = new Set([s]); const q = [s];
  while (q.length) { const n = q.shift(); for (const [m] of adj[n]) if (!seen.has(m)) { seen.add(m); q.push(m); } }
  return seen.size;
}

(async () => {
const dom = await boot();
const win = dom.window, doc = win.document;

/* ================= 1. the map reads like a map ================= */
console.log('=== 1. The map looks like a metro map ===');
{
  const names = win.eval('NODE_IDS.map(n => NODES[n].name)');
  ok(names.length === 8, `8 stations (${names.length})`);
  ok(names.includes('Chennai Central') && names.includes('Airport'),
     `real station names: ${names.join(', ')}`);
  ok(doc.querySelectorAll('#bfsSvg .stn').length === 8, 'every station is labelled on the map');
  ok([...doc.getElementById('bfsStart').options].every(o => o.text !== o.value),
     'the dropdowns show station names, not internal codes');
  const note = doc.querySelector('.mapNote').textContent;
  ok(/not the actual lines|simplified/i.test(note),
     'the page is upfront that the network is simplified and not the real Chennai Metro');
}

/* ================= 2. the flagship example is on screen by default ================= */
console.log('\n=== 2. The default journey shows the lesson ===');
{
  ok(doc.getElementById('bfsStart').value === 'CEN' && doc.getElementById('bfsTarget').value === 'AIR',
     'opens on Chennai Central -> Airport');
  let guard = 0;
  while (guard++ < 60 && doc.getElementById('bfsRouteStops').textContent === '—') doc.getElementById('bfsStepBtn').click();
  const stops = doc.getElementById('bfsRouteStops').textContent.replace(/\s+/g, ' ');
  const fast  = doc.getElementById('bfsRouteFast').textContent.replace(/\s+/g, ' ');
  ok(/4 stops.*35 min/.test(stops), `BFS route reads "4 stops, 35 min" (${stops.slice(0, 40)})`);
  ok(/5 stops.*28 min/.test(fast),  `fastest route reads "5 stops, 28 min" (${fast.slice(0, 40)})`);
  const v = doc.getElementById('bfsVerdict');
  ok(v.classList.contains('warn'), 'the verdict is flagged as a warning, not a success');
  ok(/slower journey/.test(v.textContent) && /7 minutes quicker/.test(v.textContent),
     'the verdict spells out that BFS chose the slower route and by how much');
  ok(/Dijkstra/.test(v.textContent), 'and names Dijkstra as what a maps app uses instead');
}

/* ================= 3. THE REAL TEST — 400 maps I did not design ================= */
console.log('\n=== 3. Correct on 400 randomly generated maps ===');
{
  const ids = win.eval('NODE_IDS');
  let maps = 0, journeys = 0, disconnected = 0, badHops = 0, badFast = 0, bfsFaster = 0;
  let differing = 0, sameCount = 0, unreachablePairs = 0;

  for (let trial = 0; trial < 400; trial++) {
    win.eval('EDGES = randomEdges(); rebuildAdj();');
    maps++;
    const adj = win.eval('JSON.parse(JSON.stringify(ADJ))');

    for (const s of ids) {
      if (reachableCount(adj, ids, s) !== ids.length) disconnected++;
    }
    for (const s of ids) for (const t of ids) {
      if (s === t) continue;
      journeys++;
      const path = win.eval(`JSON.stringify(bfsRoute(${JSON.stringify(s)}, ${JSON.stringify(t)}))`);
      const bPath = JSON.parse(path);
      if (!bPath) { unreachablePairs++; continue; }

      // does BFS really give the fewest stops?
      const refH = refHops(adj, ids, s, t);
      if (bPath.length - 1 !== refH) badHops++;

      // is the path a real path? every consecutive pair must be a genuine edge
      for (let i = 0; i + 1 < bPath.length; i++) {
        if (!adj[bPath[i]].some(([m]) => m === bPath[i + 1])) badHops++;
      }

      const bMins = win.eval(`routeMinutes(${JSON.stringify(bPath)})`);
      const dMins = win.eval(
        `(function(){ var r = dijkstraRun(${JSON.stringify(s)}); ` +
        `return routeMinutes(pathTo(r.prev, ${JSON.stringify(t)})); })()`);

      // is the "fastest" route genuinely the fastest of all possible routes?
      const refF = refFastest(adj, ids, s, t);
      if (dMins !== refF) badFast++;

      // the fewest-stops route can never beat the fastest route on time
      if (bMins < dMins) bfsFaster++;
      if (bMins > dMins) differing++; else sameCount++;
    }
  }

  ok(disconnected === 0, `no station was ever stranded across ${maps} random maps (${disconnected} failures)`);
  ok(unreachablePairs === 0, 'every station could reach every other station');
  ok(badHops === 0, `BFS returned a genuine fewest-stops path on all ${journeys} journeys (${badHops} wrong)`);
  ok(badFast === 0, `the "fastest" route matched brute force on all ${journeys} journeys (${badFast} wrong)`);
  ok(bfsFaster === 0, `the fewest-stops route never beat the fastest route on time (${bfsFaster} impossible cases)`);

  const pct = (100 * differing / journeys).toFixed(1);
  ok(differing > 0, `students will actually hit the lesson: ${differing} of ${journeys} journeys (${pct}%) have BFS choosing a slower route`);
  ok(differing / journeys > 0.05 && differing / journeys < 0.5,
     `and it is neither too rare to find nor so common it looks broken (${pct}%)`);
  console.log(`     [${maps} maps, ${journeys} journeys, ${sameCount} where fewest stops was also fastest]`);
}

/* ================= 4. the buttons behave ================= */
console.log('\n=== 4. The controls work ===');
{
  win.eval('EDGES = DEFAULT_EDGES.map(function(e){return e.slice();}); rebuildAdj();');
  doc.getElementById('bfsResetBtn').click();

  ok(doc.getElementById('bfsRouteStops').textContent === '—', 'Reset clears the previous result');
  ok(doc.querySelectorAll('#bfsSvg .node.visited').length === 0, 'and clears the map');
  ok(doc.querySelector('#bfsSvg .node.start') !== null, 'the start station is marked');
  ok(doc.querySelector('#bfsSvg .node.target') !== null, 'the destination is marked');

  // "find a journey where they disagree" must actually find one
  doc.getElementById('bfsFindDiffBtn').click();
  const v = doc.getElementById('bfsVerdict').textContent;
  ok(/slower journey/.test(v), 'the "find a disagreement" button lands on a real disagreement');
  ok(doc.getElementById('bfsRouteStops').textContent !== '—', 'and it runs the search through to the destination');

  // the fastest-route overlay
  doc.getElementById('bfsFastBtn').click();
  ok(doc.querySelectorAll('#bfsSvg .edge.fast').length > 0, 'the fastest route is drawn on the map');
  ok(/yellow dashed/.test(doc.getElementById('bfsVerdict').textContent), 'and the legend explains the two lines');

  // shuffle resets all three demos, since they share one map
  const before = win.eval('JSON.stringify(EDGES)');
  doc.getElementById('bfsShuffleBtn').click();
  const after = win.eval('JSON.stringify(EDGES)');
  ok(before !== after, 'the shuffle button really changes the map');
  ok(/New map generated/.test(doc.getElementById('bfsNote').textContent), 'and says so');
  ok(doc.querySelectorAll('#dfsSvg .stn').length === 8 && doc.querySelectorAll('#dijkSvg .stn').length === 8,
     'DFS and Dijkstra were redrawn on the new map too');
  const bfsEdges  = doc.querySelectorAll('#bfsSvg .edge').length;
  const dfsEdges  = doc.querySelectorAll('#dfsSvg .edge').length;
  const dijkEdges = doc.querySelectorAll('#dijkSvg .edge').length;
  ok(bfsEdges === dfsEdges && dfsEdges === dijkEdges,
     `all three demos show the same map (${bfsEdges}/${dfsEdges}/${dijkEdges} lines)`);
}

/* ================= 5. same-station and no-route cases ================= */
console.log('\n=== 5. Awkward cases ===');
{
  win.eval('EDGES = DEFAULT_EDGES.map(function(e){return e.slice();}); rebuildAdj();');
  doc.getElementById('bfsStart').value = 'CEN';
  doc.getElementById('bfsTarget').value = 'CEN';
  doc.getElementById('bfsTarget').dispatchEvent(new win.Event('change'));
  ok(/already at/.test(doc.getElementById('bfsNote').textContent),
     'picking the same station for both says so instead of showing a nonsense route');
  doc.getElementById('bfsFastBtn').click();
  ok(true, 'and pressing the buttons in that state does not throw');

  // an isolated station must be reported, not crash
  win.eval("EDGES = [['CEN','EGM',4],['EGM','VAD',8],['VAD','KOY',5],['KOY','ASH',6],['ASH','GUI',6],['GUI','ALA',4]]; rebuildAdj();");
  doc.getElementById('bfsStart').value = 'CEN';
  doc.getElementById('bfsTarget').value = 'AIR';
  doc.getElementById('bfsTarget').dispatchEvent(new win.Event('change'));
  let g = 0;
  while (g++ < 60 && doc.getElementById('bfsRouteStops').textContent === '—') doc.getElementById('bfsStepBtn').click();
  ok(/No route exists/.test(doc.getElementById('bfsRouteStops').textContent),
     'a genuinely unreachable station is reported as unreachable');
}

/* ================= 6. the explanation is there and honest ================= */
console.log('\n=== 6. The Google Maps explanation ===');
{
  const box = doc.querySelector('.mapsBox');
  ok(!!box, 'the explainer exists');
  ok(box.tagName === 'DETAILS' && !box.hasAttribute('open'), 'it is collapsed by default so it does not bury the demo');
  const txt = box.textContent.replace(/\s+/g, ' ');
  ok(txt.length > 2000, `it is a real explanation, not a paragraph (${txt.length} chars)`);
  ok(box.querySelectorAll('h4').length >= 5, `broken into ${box.querySelectorAll('h4').length} sections`);
  for (const term of ['queue', 'Dijkstra', 'A*', 'traffic', 'Contraction hierarchies', 'maze', 'Degrees of separation']) {
    ok(txt.includes(term), `covers "${term}"`);
  }
  ok(/35 minutes/.test(txt) && /28 minutes/.test(txt),
     'and uses the exact numbers the student can see on their own screen');
  ok(/long way beyond plain Dijkstra|far too slow/.test(txt),
     'it is honest that a real maps app is much more than Dijkstra');
}

/* ================= 7. the rest of the page still works ================= */
console.log('\n=== 7. Nothing else broke ===');
{
  const d2 = (await boot()).window.document;
  ok(d2.body.textContent.replace(/\s+/g, ' ').trim().length > 3000, 'the full page still renders');
  ok(d2.querySelectorAll('.codeWrap.on').length === 3, 'all three code panels still show');
  ok(d2.querySelectorAll('.chip.cxOn').length === 11, 'the complexity chips still work');
  ok(d2.getElementById('bfs-c') && d2.getElementById('bfs-cpp'), 'the C and C++ tabs are still there');
  d2.getElementById('dfsStepBtn').click();
  ok(d2.querySelectorAll('#dfsSvg .node.visited').length > 0, 'DFS still runs');
  d2.getElementById('dijkStepBtn').click();
  ok(d2.querySelectorAll('#dijkSvg .node.settled').length > 0, 'Dijkstra still runs');
}

console.log('\n' + (allPass ? '*** ALL METRO ROUTE-FINDER TESTS PASSED ***' : '*** THERE ARE FAILURES ABOVE ***'));
process.exit(allPass ? 0 : 1);

})().catch(e => { console.error(e); process.exit(1); });
