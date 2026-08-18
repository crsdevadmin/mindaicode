/* MindAICode — AI tutor proxy (Cloudflare Worker).
 *
 * WHY THIS EXISTS
 * Your Anthropic key must never go in the website. GitHub Pages files are public,
 * so a key there would be scraped and billed to you within days. This tiny server
 * holds the key instead: the page asks this Worker, this Worker asks Anthropic.
 *
 * WHAT IT PROTECTS YOU FROM
 *   - key theft        : the key lives in a Worker secret, never sent to a browser
 *   - other sites      : only your own domain is allowed to call it
 *   - runaway cost     : a per-student daily cap, plus a hard token limit
 *   - abuse            : long questions are rejected, prompts are size-capped
 *
 * See server/README.md for the ten-minute deploy.
 */

const MODEL = 'claude-haiku-4-5-20251001';   // cheap and fast; plenty for beginner Q&A
const MAX_TOKENS = 400;                       // answers are short by design
const MAX_QUESTION = 300;                      // characters
const DAILY_PER_STUDENT = 25;                  // questions per IP per day

/* The teaching brief. This is the most important part of the whole file — it is
   what makes the answers useful to a struggling student rather than a textbook. */
const SYSTEM = `You are a warm, patient programming tutor sitting next to an Indian school or college student who is learning to code for the first time on a site called MindAICode. Many of them find programming frightening and have been told they are "not technical". Your job is to make them feel capable.

HOW TO ANSWER
- Reply in 2 to 4 short sentences. They are usually on a phone.
- Plain words. No jargon unless you immediately explain it in the same breath.
- ANSWER THE QUESTION. Do not withhold it to make them work harder, and never reply with only another question. A student who stays stuck loses confidence.
- Then, if it helps, add one short "why" so they understand rather than memorise.
- Be encouraging but never fake. Do not praise a wrong idea; say what is wrong kindly and correct it.
- If they ask in Tamil, Hindi, Telugu, Kannada, Bengali or Marathi, reply in that language.

THINGS THAT MATTER FOR THIS AUDIENCE
- "=" means "put into", not "equals". Say so if it comes up.
- Indexes start at 0. Say it plainly whenever it is relevant.
- Their exams are usually in C, C++ or Java, so if they ask how something differs in those languages, answer directly.
- Never say "it is simple" or "just" or "obviously". For them it is not simple.

WHAT NOT TO DO
- Do not invent behaviour. If you are unsure what some code does, say you are not certain rather than guessing.
- Do not write long code listings. One or two lines at most.
- If the question is not about programming or this lesson, say kindly that you can only help with the lesson.`;

function cors(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {})
  });
}

export default {
  async fetch(request, env) {
    // ALLOWED_ORIGINS is a comma-separated list you set when deploying.
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const head = cors(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: head });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, head);

    // only your own site may call this
    if (allowed.length && !allowed.includes(origin)) {
      return json({ error: 'not allowed from this origin' }, 403, head);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'server is not configured' }, 500, head);
    }

    let payload;
    try { payload = await request.json(); }
    catch (e) { return json({ error: 'bad request' }, 400, head); }

    const question = String((payload && payload.question) || '').trim().slice(0, MAX_QUESTION);
    if (!question) return json({ error: 'no question' }, 400, head);

    /* ---- daily cap per student, so one person cannot drain your credit ----
       Needs a KV namespace bound as RATE. If you skip KV the tutor still works;
       you just lose this protection, which I would not recommend. */
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const key = `q:${day}:${ip}`;
    if (env.RATE) {
      const used = parseInt(await env.RATE.get(key) || '0', 10);
      if (used >= DAILY_PER_STUDENT) {
        return json({
          answer: "You have asked me quite a few questions today — that is a good thing! I have to rest now, but every written explanation on the page still works. Tap any line of code to see it explained."
        }, 200, head);
      }
      await env.RATE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 30 });
    }

    /* what the student was looking at, so the answer is about THEIR screen */
    const ctx = (payload && payload.context) || {};
    const bits = [];
    if (ctx.line)    bits.push('The line of code they are looking at: ' + String(ctx.line).slice(0, 200));
    if (ctx.reading) bits.push('The written explanation already shown to them: ' + String(ctx.reading).slice(0, 400));
    if (ctx.lesson)  bits.push('Lesson: ' + String(ctx.lesson).slice(0, 100));
    if (typeof ctx.step === 'number') {
      bits.push('They are on step ' + (ctx.step + 1) + ' of the beginner course ' +
                '(1 variables, 2 arrays, 3 loops, 4 functions, 5 recursion).');
    }
    if (ctx.language) bits.push('They are reading the code in: ' + String(ctx.language).slice(0, 20));

    const userMsg = (bits.length ? bits.join('\n') + '\n\n' : '') + 'Their question: ' + question;

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: env.MODEL || MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM,
          messages: [{ role: 'user', content: userMsg }]
        })
      });

      if (!r.ok) {
        const detail = await r.text();
        console.log('anthropic error', r.status, detail.slice(0, 300));
        // never leak the upstream error to a student
        return json({
          answer: "Sorry — I could not think of an answer just then. The written explanations on the page all still work, so nothing is lost. Try me again in a moment."
        }, 200, head);
      }

      const data = await r.json();
      const answer = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
        .trim();

      if (!answer) {
        return json({ answer: "I did not manage an answer that time. Tap the line of code and the written explanation will help." }, 200, head);
      }
      return json({ answer }, 200, head);

    } catch (e) {
      console.log('proxy failure', String(e).slice(0, 200));
      return json({
        answer: "I cannot reach my brain right now — probably the internet. Everything else on this page works without it."
      }, 200, head);
    }
  }
};
