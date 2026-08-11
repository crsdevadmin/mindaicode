# csrc — where the C and C++ on the website comes from

Students see C and C++ on every algorithm page. None of it is typed straight
into the HTML. Every snippet lives here as a real source file that is
**compiled and executed** before it reaches the site.

## Why bother

A wrong code sample on a teaching site is worse than no code sample. A student
copies it, it doesn't compile, and they assume they made the mistake. So the
rule here is simple: nothing ships unless a compiler has accepted it and a test
has run it.

## How to check everything

```bash
cd csrc
./verify.sh
```

That will:

1. compile every `.c` with `gcc -std=c99 -Wall -Wextra`
2. compile every whole-file `.cpp` with `g++ -std=c++17 -Wall -Wextra`
3. compile the C++ STL fragments (they're statement sequences, so `verify_frag.py`
   hoists their `#include` lines and wraps the rest in a `main()`)
4. run the six C sorts and binary search against **3000 random arrays**, checking
   they all agree with each other
5. run each C++ sort and binary search against 3000 random arrays
6. run the C stack, queue, linked list, hash table, BST, heap, BFS, DFS,
   Dijkstra and knapsack against known-answer tests
7. run the same for the C++ graph and DP code

## How to change a snippet

Edit the `.c` / `.cpp` file here, then:

```bash
./verify.sh --build
```

This re-verifies everything and only then regenerates `../code-langs.js`.
If any check fails, `code-langs.js` is left alone.

**Never edit `code-langs.js` directly** — it's generated, and the next build
would silently throw your change away.

## The `//@N` markers

On the sorting and searching pages the running line of code lights up as the
animation plays. The `//@N` comment at the end of a line says which animation
step that line belongs to:

```c
for (int j = 0; j < n - i - 1; j++) {   //@3
```

`build_code_langs.py` strips the marker and turns it into `data-l="3"`, which is
what the page's `highlight()` looks for. The numbers must match the ones already
used by the Python and Java panels on that page, otherwise a step would light up
nothing. `clangtest.js` checks this.

## Files

| Prefix | What it is |
|---|---|
| `s_*` | sorting + binary search (the pages with line highlighting) |
| `d_*` | data structures — stack, queue, linked list, hash, BST, heap |
| `g_*` | graphs — BFS, DFS, Dijkstra |
| `dp_*` | dynamic programming — knapsack |
| `_v_*`, `_b_*`, `verify_c.c` | the test harnesses `verify.sh` runs |
| `runtime.js` | the browser-side half of `code-langs.js` (tab injection + memory) |
| `count_operations.py` | counts real operations, for the Big-O explanations |
| `clangtest.js` | jsdom tests for the C / C++ language tabs |
| `cxtest.js` | jsdom tests for the complexity chips, plus number checking |

## The Big-O explanations

Tapping a chip like **Worst: O(n²)** opens an explanation written in
`../complexity.js`. Those explanations quote concrete figures — "n=20 reversed
costs 190 comparisons", "a million items needs 20 probes" — and none of them are
guesses.

```bash
python3 count_operations.py
```

runs each algorithm with a counter attached and prints the real numbers. Every
counted function asserts its own output against `sorted()` first, so the
instrumented copy is provably the same algorithm.

`cxtest.js` then re-derives the same figures independently in JavaScript and
fails if any of them disagree with what the website says. So each number is
checked twice, in two languages:

```bash
npm install jsdom && node cxtest.js
```

That test also refuses to pass if any explanation is shorter than two paragraphs
— a guard against a chip quietly shipping with a one-line non-answer.

## A note on C vs C++

They are deliberately **not** the same code with a different `#include`.

- **C** shows what a first-year exam expects: raw arrays, an explicit `n`
  parameter, a manual temp-variable swap, `malloc`/`free`, a hand-rolled hash
  probe, an adjacency matrix.
- **C++** shows what a competitive programmer writes: `vector`, `std::swap`,
  `stack`/`queue`/`priority_queue`, `unordered_map`, `set`, structured bindings.

Seeing both side by side is the point — it's how a student works out what the
STL is actually saving them.
