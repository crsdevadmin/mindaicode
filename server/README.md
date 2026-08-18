# Turning the AI tutor on

About ten minutes. Free tier is plenty to start.

**The one rule: your Anthropic key never goes in this repository.** Every file here
is public on GitHub Pages. A key in the site would be scraped by bots and billed
to you within days. That is the only reason this little server exists.

---

## 1. Create the Worker

1. Sign in at <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Create Worker**.
2. Name it something like `mindaicode-tutor`. Deploy the default hello-world.
3. Click **Edit code**. Delete everything and paste in the whole of
   `cloudflare-worker.js` from this folder. **Deploy**.

## 2. Add your key as a secret

In the Worker → **Settings** → **Variables and Secrets**:

| Name | Type | Value |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Secret** | your key, starting `sk-ant-...` |
| `ALLOWED_ORIGINS` | Text | `https://crsdevadmin.github.io` |

`ANTHROPIC_API_KEY` **must** be a Secret, not Text — a Secret cannot be read back
out of the dashboard afterwards.

`ALLOWED_ORIGINS` stops other websites pointing at your Worker and spending your
money. Comma-separate if you add a custom domain later. Leave off any trailing slash.

## 3. Add the spend guard (recommended — do not skip)

This caps each student at 25 questions a day, so one person cannot drain your credit.

1. Worker → **Settings** → **Bindings** → **Add** → **KV namespace**.
2. Create a namespace called `mindaicode_rate`.
3. Bind it with the variable name **`RATE`** (exactly that).

Without it the tutor still works, but there is no daily limit. I would not run it
that way in a real classroom.

## 4. Point the site at it

Copy your Worker URL — something like
`https://mindaicode-tutor.<your-name>.workers.dev`.

In `tutor-config.js` at the repo root:

```js
ENABLED: true,
ENDPOINT: 'https://mindaicode-tutor.your-name.workers.dev',
```

Commit and push. The "ask me anything" box appears on the tutor panel and in the
tap-a-line explanations.

## 5. Check it

Open the site in a **private window**, go to Programming Basics, and ask the tutor
something like *"why does the first box start at 0?"*

- **A real answer** → done.
- **"I cannot reach my brain right now"** → the Worker was not reachable. Check the
  URL, and that `ALLOWED_ORIGINS` exactly matches your site's origin.
- **No ask box at all** → `ENABLED` is still `false`, or the browser is showing a
  cached copy. Hard refresh.

---

## What it costs

Haiku, roughly 400 output tokens a question. At the time of writing that is a
fraction of a rupee per question — but **check current pricing yourself** at
<https://www.anthropic.com/pricing>, because I cannot promise what it is today.

Set a **monthly spend limit** in the Anthropic console before you share the site
widely. That is your real safety net; the daily per-student cap is the second one.

## If you want to turn it off

Set `ENABLED: false` in `tutor-config.js` and push. The site falls straight back to
the written explanations, which cover every line of code on the page and work
offline. Nothing breaks, and no student sees an error.

## A word on what the AI is for

The written explanations are checked and cannot be wrong. The AI is for the
questions nobody anticipated. Where they disagree, trust the written one — the
tutor panel tells students exactly that.

Also worth knowing: an AI can be confidently wrong, and a beginner is precisely the
person who cannot spot it. That is why the prompt tells it to admit uncertainty
rather than guess, and why the scripted answers were built first rather than as an
afterthought.
