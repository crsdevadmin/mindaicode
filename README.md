# 🧠 MindAICode

**Learn. Visualize. Code. Master.**

A free, animated Data Structures & Algorithms course for college students. Every algorithm is
animated with a real-world metaphor, explained line by line as it runs, and paired with quizzes,
prediction games and progress badges.

No build step, no backend, no dependencies — every page is a single self-contained HTML file that
works offline once loaded.

---

## Live site

Once GitHub Pages is enabled (see below), the site is served at:

```
https://<your-username>.github.io/<repo-name>/
```

---

## The course

Start at **Programming Basics** if you've never written code. Otherwise jump straight to Module 0.

| | Module | Page |
|---|---|---|
| — | **Programming Basics** — variables, arrays, indexing, loops, functions, recursion, taught as six games | `mindaicode-programming-basics.html` |
| 0 | Foundations — Big-O notation | `mindaicode-big-o.html` |
| 1 | Sorting — Bubble, Selection, Insertion, Merge, Quick, Heap | `mindaicode-bubble-sort.html` … `mindaicode-heap-sort.html` |
| 2 | Searching — Linear vs Jump vs Binary | `mindaicode-binary-search.html` |
| 3 | Linear Data Structures — Stack, Queue, Linked List | `mindaicode-linear-structures.html` |
| 4 | Hashing — chaining vs open addressing | `mindaicode-hashing.html` |
| 5 | Trees — BST, traversals, min-heap | `mindaicode-trees.html` |
| 6 | Graphs — BFS, DFS, Dijkstra | `mindaicode-graphs.html` |
| 7 | Recursion & Dynamic Programming — Fibonacci, Knapsack, LCS | `mindaicode-recursion-dp.html` |
| 8 | Interview Prep Capstone — timed challenge, leaderboard, mock interview | `mindaicode-capstone.html` |

**Extras:** all-six sorting race (`mindaicode-race-all.html`), editable code sandbox
(`mindaicode-sandbox.html`), stability explainer (`mindaicode-stability.html`), revision mode
(`mindaicode-revision.html`), and a course roadmap (`mindaicode-course-path.html`).

---

## Features

- **Animated visualizations** — balls, bars and students, with real-world metaphors throughout
- **Predict mode** — guess the next step before the algorithm takes it
- **AI Explainer** — pause any sort and ask what a line does (on the six sorting pages)
- **7 languages** on the sorting pages — English, தமிழ், हिंदी, తెలుగు, ಕನ್ನಡ, বাংলা, मराठी
- **Classroom mode** — larger text and slower animations for projecting to a class
- **Progress & badges** — saved locally in the browser, with a course-wide roadmap
- **Works offline** — installable as an app (PWA) once served over HTTPS

---

## Running it

**Locally** — just open `mindaicode-home.html` in a browser. Everything works except the offline
service worker and app install, which browsers only permit over `http://` or `https://`.

To get those locally too, serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Deploying to GitHub Pages

1. Create a new repository on GitHub.
2. Upload every file in this folder to the repository root (or `git push` it).
3. In the repo, go to **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**, pick branch `main` and folder `/ (root)`.
5. Save. After a minute the site is live at `https://<username>.github.io/<repo>/`.

`index.html` redirects to the home page, so the bare URL works.

---

## Tests

Every page has an automated test suite built on [jsdom](https://github.com/jsdom/jsdom) — 20 files
covering algorithm correctness, UI wiring, edge cases and accessibility of the teaching content.
Algorithm results are cross-checked against independent brute-force implementations rather than
against themselves.

```bash
npm install jsdom
node basicstest.js      # Programming Basics — 175 assertions
node searchtest.js      # Linear / Jump / Binary Search
node graphtest.js       # BFS / DFS / Dijkstra
# …and so on for each *test.js file
```

---

## Licence

Free to use for teaching and learning.

> **Note on translations:** the Telugu, Kannada, Bengali and Marathi translations were machine-generated
> and have **not** yet been reviewed by native speakers. Corrections are very welcome.
