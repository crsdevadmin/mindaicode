# MindAICode — Data Structures & Algorithms Course Path

This maps the full DSA syllabus taught in most college courses onto MindAICode's animated-page format (the same treatment as the Bubble Sort page: visualization modes, live code + variables, quiz, AI Explainer, badges, experiments). Each module lists what it covers, what it requires first, and its visual theme.

## Module 0 — Foundations
**Prerequisite:** none
**Covers:** what an algorithm is, Big-O notation, time vs space complexity, arrays as the base data structure.
**Visual theme:** a single interactive page comparing O(1), O(n), O(n log n), O(n²) growth curves side by side — this becomes the shared vocabulary every later module's "Race" feature depends on.
**Why first:** every other module's quiz and AI Explainer references Big-O; without this, those explanations land on nothing.

## Module 1 — Sorting
**Prerequisite:** Module 0
**Covers:** Bubble Sort *(built)*, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort.
**Visual theme:** balls / bars / students, consistent across all six so the Race feature can pit any two against each other.
**Suggested build order:** Bubble → Selection → Insertion (all O(n²), reinforce the same intuition three ways) → Merge → Quick (introduce divide-and-conquer) → Heap (bridges into Module 5's trees).

## Module 2 — Searching
**Prerequisite:** Module 1 (assumes a sorted array for Binary/Jump Search)
**Covers:** Linear Search, Binary Search, Jump Search.
**Visual theme:** treasure chest hunt — Binary Search halves the search space each guess, shown as narrowing a room in half.

## Module 3 — Linear Data Structures
**Prerequisite:** Module 0 (independent of sorting/searching, can run in parallel)
**Covers:** Stack, Queue, Circular Queue, Linked List (singly + doubly).
**Visual theme:** Stack as cafeteria plates, Queue as a ticket-counter line, Linked List as train carriages linking up.

## Module 4 — Hashing
**Prerequisite:** Module 3 (builds on array + linked-list ideas for collision chaining)
**Covers:** Hash Tables, collision handling (chaining vs open addressing), load factor.
**Visual theme:** lockers with numbered slots; collisions shown as two people assigned the same locker needing a resolution rule.

## Module 5 — Trees
**Prerequisite:** Module 3
**Covers:** Binary Search Tree (insert/search/delete), Tree Traversals (inorder/preorder/postorder), Heaps (min/max), Tries.
**Visual theme:** literally growing trees — each insert sprouts a new branch in the right spot.

## Module 6 — Graphs
**Prerequisite:** Module 5 (trees are a special case of graphs)
**Covers:** BFS, DFS, Dijkstra's Shortest Path, Topological Sort, Union-Find / Kruskal's Minimum Spanning Tree.
**Visual theme:** cities connected by roads — BFS as water flooding outward pipe by pipe, DFS as a person exploring a maze one corridor at a time, Dijkstra as the fastest delivery route lighting up.

## Module 7 — Recursion & Dynamic Programming
**Prerequisite:** Modules 1–2 (needs comfort with algorithmic thinking first)
**Covers:** Factorial/Fibonacci (recursive vs memoized, showing the exponential-to-linear speedup directly), Knapsack, Longest Common Subsequence.
**Visual theme:** a call-stack tower that visibly grows and collapses; memoization shown as a notebook of already-solved answers being reused instead of recomputed.

## Module 8 — Interview Prep / Capstone
**Prerequisite:** all of the above
**Covers:** mixed timed challenges pulling from every module, a leaderboard, and a "mock interview" mode where the AI Explainer flips roles and asks the student to explain the algorithm back.
**Ties into your brand vision's "Interview preparation for top companies" and "Coding competitions and leaderboards."**

---

## Suggested two-semester mapping

**Semester 1 (Foundations):** Module 0 → Module 1 (Sorting) → Module 2 (Searching) → Module 3 (Linear Data Structures).
**Semester 2 (Advanced):** Module 4 (Hashing) → Module 5 (Trees) → Module 6 (Graphs) → Module 7 (Recursion & DP) → Module 8 (Interview Prep / Capstone).

This mirrors how most college DSA courses are split (arrays/sorting/searching/linear structures in term one; trees/graphs/DP/interview readiness in term two), so it should feel familiar to any student or professor evaluating the platform.

## Cross-cutting platform features (not tied to one module)

- **Shared student profile:** badges and streaks currently reset per page (stored in each page's own `localStorage`); centralizing this lets progress carry across the whole course.
- **Course path screen:** a single landing page showing modules in order, locked/unlocked based on prerequisites above, with progress bars per module.
- **Leaderboard:** ties into Module 8, but could show cross-module stats (fastest quiz completion, longest predict-mode streak, etc.).
