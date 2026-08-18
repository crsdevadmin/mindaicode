/* MindAICode — AI tutor proxy, Google Cloud version.
 *
 * Same job as the Cloudflare one: hold your Anthropic key on a server so it never
 * appears in the website. Use THIS one if you would rather stay inside Google
 * Cloud — which makes sense here, because MindAICode already uses Firebase, so
 * you have a Google project and Firestore already.
 *
 * Deploy as a Cloud Run function (Node 20), pasted straight into the Google
 * Console — no command line needed. See SETUP-AI-TUTOR.html for the clicks.
 *
 * Environment you set in the Console:
 *   ANTHROPIC_API_KEY   the key, added as a SECRET (Secret Manager), not plain text
 *   ALLOWED_ORIGINS     https://crsdevadmin.github.io
 *   USE_FIRESTORE       "true" to switch on the 25-a-day cap (recommended)
 */

const functions = require('@google-cloud/functions-framework');

const MODEL = process.env.MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 400;
const MAX_QUESTION = 300;
const DAILY_PER_STUDENT = 25;

/* The teaching brief — the most important part of this file. It is what makes the
   answers useful to a frightened beginner rather than a textbook dump. */
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

/* Firestore is loaded lazily so the function still starts if you have not
   switched the cap on yet. */
let db = null;
function firestore() {
  if (db) return db;
  const { Firestore } = require('@google-cloud/firestore');
  db = new Firestore();
  return db;
}

/* Count this student's questions for today, and refuse politely past the cap.
   Uses a transaction so two quick taps cannot both slip through. */
async function withinDailyCap(ip) {
  if (String(process.env.USE_FIRESTORE).toLowerCase() !== 'true') return true;
  const day = new Date().toISOString().slice(0, 10);
  const ref = firestore().collection('tutorUsage').doc(`${day}_${ip}`);
  try {
    return await firestore().runTransaction(async t => {
      const snap = await t.get(ref);
      const used = snap.exists ? (snap.data().count || 0) : 0;
      if (used >= DAILY_PER_STUDENT) return false;
      t.set(ref, { count: used + 1, day, updated: new Date() }, { merge: true });
      return true;
    });
  } catch (e) {
    // A Firestore problem must not take the tutor down. Log it and let it through.
    console.error('firestore cap check failed, allowing through:', e.message);
    return true;
  }
}

function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  const ok = !allowed.length || allowed.includes(origin);
  res.set('Access-Control-Allow-Origin', ok ? origin : (allowed[0] || ''));
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '86400');
  res.set('Vary', 'Origin');
  return ok;
}

functions.http('tutor', async (req, res) => {
  const originOk = setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!originOk) return res.status(403).json({ error: 'not allowed from this origin' });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'server is not configured' });
  }

  const body = req.body || {};
  const question = String(body.question || '').trim().slice(0, MAX_QUESTION);
  if (!question) return res.status(400).json({ error: 'no question' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!(await withinDailyCap(ip))) {
    return res.status(200).json({
      answer: "You have asked me quite a few questions today — that is a good thing! I have to rest now, but every written explanation on the page still works. Tap any line of code to see it explained."
    });
  }

  /* what the student was looking at, so the answer is about THEIR screen */
  const ctx = body.context || {};
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
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('anthropic error', r.status, detail.slice(0, 300));
      // never pass an upstream error through to a student
      return res.status(200).json({
        answer: "Sorry — I could not think of an answer just then. The written explanations on the page all still work, so nothing is lost. Try me again in a moment."
      });
    }

    const data = await r.json();
    const answer = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    if (!answer) {
      return res.status(200).json({
        answer: "I did not manage an answer that time. Tap the line of code and the written explanation will help."
      });
    }
    return res.status(200).json({ answer });

  } catch (e) {
    console.error('proxy failure', String(e).slice(0, 200));
    return res.status(200).json({
      answer: "I cannot reach my brain right now — probably the internet. Everything else on this page works without it."
    });
  }
});
