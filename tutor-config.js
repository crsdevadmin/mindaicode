/* MindAICode — optional AI tutor.
 *
 * SHIPS DISABLED. While ENABLED is false the site behaves exactly as it does
 * today: every explanation comes from explain.js, which is written down and
 * tested, so nothing incorrect can reach a student and nothing costs you money.
 *
 * Turn it on only when you are ready to pay per question and to run a small
 * proxy. Never put an API key in this file — it is public. The key belongs on
 * your own server; this file only holds the address of that server.
 *
 *   1. Deploy a tiny endpoint that accepts { question, context } and returns
 *      { answer }. It holds the key and calls the model.
 *   2. Set ENABLED: true and ENDPOINT to its URL.
 *
 * Even switched on, the scripted explanations stay as the offline fallback, so
 * a student with no connection loses nothing.
 */
window.MINDAICODE_TUTOR = {

  ENABLED: false,

  /* Your own proxy, NOT the model provider. Never a raw provider URL from a
     public page — that would expose the key to anyone who views source. */
  ENDPOINT: '',

  /* Shown next to the button so a student knows what it is and what it costs. */
  BUTTON_LABEL: '💬 Ask anything about this line',
  NOTICE: 'This sends your question to an AI. It needs internet, and it can be wrong — the written explanation above was checked by a human.',

  /* Hard limits, so one student cannot run up a bill or hang the page. */
  MAX_QUESTION_CHARS: 300,
  TIMEOUT_MS: 12000,

  /* Called with the student's question plus the line they were looking at.
     Returns a promise for a plain-text answer. Replace the body if your
     endpoint has a different shape. */
  ask: function (question, context) {
    var self = window.MINDAICODE_TUTOR;
    if (!self.ENABLED || !self.ENDPOINT) {
      return Promise.reject(new Error('tutor-disabled'));
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, self.TIMEOUT_MS);

    return fetch(self.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: String(question).slice(0, self.MAX_QUESTION_CHARS),
        context: context || {}
      }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('tutor-http-' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d || typeof d.answer !== 'string') throw new Error('tutor-bad-response');
        return d.answer;
      })
      .finally(function () { clearTimeout(timer); });
  }
};
