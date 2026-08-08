import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the MindAICode Bubble Sort lesson", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Bubble Sort Visualizer \| MindAICode<\/title>/i);
  assert.match(html, /Bubble Sort,/);
  assert.match(html, /Start visualizing/);
  assert.match(html, /Bubble sort values: 72, 38, 86, 24, 58, 46, 68, 32/);
  assert.match(html, /PASS<\/span><strong>1<!-- --> \/ <!-- -->7/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders usable visualizer controls and navigation targets", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /aria-label="Shuffle values"/);
  assert.match(html, />Play<\/button>/);
  assert.match(html, /aria-label="Move one step forward"/);
  assert.match(html, /aria-label="Animation speed"/);
  assert.match(html, /id="visualizer"/);
  assert.match(html, /id="learn"/);
  assert.match(html, /id="practice"/);
  assert.match(html, /id="progress"/);
  assert.match(html, /Login is not configured yet/);
});
