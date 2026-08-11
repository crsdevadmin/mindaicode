/* MindAICode — what those Big-O chips actually mean.
 *
 * Every chip on every algorithm page becomes clickable and opens a plain-English
 * explanation: what makes the bound that number, which input triggers it, and
 * whether it matters in practice.
 *
 * All the counts quoted below were MEASURED, not asserted — see
 * csrc/../complexity/count.py, which runs each algorithm with a counter attached
 * and checks its output against sorted() so the instrumented version is faithful.
 */

window.MINDAICODE_COMPLEXITY = {

/* ============================ SORTING ============================ */

'mindaicode-bubble-sort.html': { bubble: [
  { label: 'Worst: O(n²)',
    head: 'Reverse-sorted input — every pair is wrong',
    body: '<p>The worst input is a list sorted <b>backwards</b>. Every single neighbour pair is out of order, so every comparison causes a swap and no pass is ever "clean".</p>' +
          '<p>Pass 1 makes n−1 comparisons, pass 2 makes n−2, and so on. Adding those up gives <code>n(n−1)/2</code>.</p>' +
          '<p><b>Counted for real, n = 20 reversed:</b> 190 comparisons and 190 swaps — and 190 is exactly 20×19/2.</p>' +
          '<p>Doubling the list roughly <b>quadruples</b> the work. That is what O(n²) means: 20 items → 190, 50 items → 1,225.</p>' },
  { label: 'Average: O(n²)',
    head: 'Random data is barely better than the worst case',
    body: '<p>On shuffled data about half the pairs are out of order, so you save roughly half the <i>swaps</i> — but you still do nearly all the <i>comparisons</i>, because the early-exit only fires once the whole list is clean.</p>' +
          '<p><b>Counted, n = 20 random:</b> 184 comparisons and 103 swaps, versus 190 and 190 for reversed input.</p>' +
          '<p>184 vs 190 is a rounding error. Halving the swaps does not change the shape of the curve — it is still n², just with a slightly smaller constant. This is why Bubble Sort is never used on real data.</p>' },
  { label: 'Best: O(n)',
    head: 'Already sorted — and only because of the swapped flag',
    body: '<p>If a full pass finishes without a single swap, everything is already in order and the algorithm breaks out. That is the <code>swapped</code> flag in the code above.</p>' +
          '<p><b>Counted, n = 20 already sorted:</b> 19 comparisons, 0 swaps, <b>1 pass</b>. One clean sweep and it stops.</p>' +
          '<p><b>Remove that flag and the same input costs 190 comparisons</b> instead of 19 — ten times the work for nothing. Without the flag the best case is O(n²), not O(n).</p>' +
          '<p>This is the one thing Bubble Sort is genuinely good at: noticing that data is already sorted. Selection Sort cannot do this at all.</p>' },
  { label: 'Space: O(1)',
    head: 'It sorts in place — one spare variable',
    body: '<p>No second array is ever created. The only extra memory is a handful of variables: <code>i</code>, <code>j</code>, the <code>swapped</code> flag and the temporary <code>t</code> used during a swap.</p>' +
          '<p>That count does not grow with the list. Sorting 10 items and sorting 10 million items both use the same few bytes of scratch space — which is what O(1) means.</p>' +
          '<p>Compare with Merge Sort, which needs a whole second array of size n. On a memory-constrained device that difference can matter more than speed.</p>' },
]},

'mindaicode-selection-sort.html': { selection: [
  { label: 'Worst: O(n²)',
    head: 'Two nested loops that always run to the end',
    body: '<p>The outer loop runs n times. For each of those, the inner loop scans the entire unsorted remainder looking for the minimum — n−1 items, then n−2, then n−3...</p>' +
          '<p>That sum is <code>n(n−1)/2</code> comparisons, and nothing in the code can cut it short. There is no early exit and no condition that skips the scan.</p>' +
          '<p><b>Counted:</b> n=20 → 190 comparisons. n=50 → 1,225. n=1,000 → 499,500. Every one matches n(n−1)/2 exactly.</p>' },
  { label: 'Average: O(n²)',
    head: 'Identical to the worst case — the data is never consulted',
    body: '<p>To find the smallest value in a range you have to look at every value in that range. There is no shortcut, so the arrangement of the data changes nothing about how much work is done.</p>' +
          '<p><b>Counted at n = 20: sorted → 190, reversed → 190, random → 190.</b> Byte for byte the same.</p>' +
          '<p>This is unusual and worth remembering. Most algorithms have an average case that is meaningfully better than the worst. Selection Sort does not.</p>' },
  { label: 'Best: O(n²)',
    head: 'Hand it a sorted list and it still does all the work',
    body: '<p>This is the chip that surprises people, and it is the most important thing to understand about Selection Sort.</p>' +
          '<p>Give it a perfectly sorted list and it <b>still</b> makes all 190 comparisons at n=20. It has no idea the list is sorted, because it never compares neighbours — it only ever hunts for a minimum.</p>' +
          '<p>Contrast with the same input:<br>• Selection Sort: <b>190</b> comparisons<br>• Bubble Sort: <b>19</b><br>• Insertion Sort: <b>19</b></p>' +
          '<p>Best = Average = Worst is a real weakness. It means the algorithm can never take advantage of data that is already partly in order — and real-world data very often is.</p>' },
  { label: 'Swaps: O(n) max',
    head: 'The one thing it beats every other O(n²) sort at',
    body: '<p>Each pass finds the minimum and performs exactly <b>one</b> swap to put it in place. n passes, n swaps. That is it.</p>' +
          '<p><b>Counted at n = 20: exactly 20 swaps</b> on sorted, reversed and random input alike. Bubble Sort on reversed input does <b>190</b>.</p>' +
          '<p>Why care? Because a swap is a <i>write</i>, and on some hardware writes are far more expensive than reads — EEPROM and flash memory wear out after a limited number of writes.</p>' +
          '<p>So if reading is cheap and writing is costly, Selection Sort\'s guaranteed n swaps can genuinely beat a "faster" algorithm. It is a narrow use case, but it is a real one.</p>' },
  { label: 'Space: O(1)',
    head: 'In place — just an index and a temp',
    body: '<p>The only extra memory is the loop counters and <code>minIdx</code>, the index of the smallest value found so far, plus one temporary during the swap.</p>' +
          '<p>That is a fixed amount no matter how big the list gets, which is what O(1) means. The sorting all happens by rearranging the original array.</p>' },
]},

'mindaicode-insertion-sort.html': { insertion: [
  { label: 'Best: O(n)',
    head: 'Already sorted — the inner loop never runs',
    body: '<p>For each card you pick up, the <code>while</code> loop asks "is the card to my left bigger?" On a sorted list the answer is immediately no, so the loop exits after a single comparison and the card stays put.</p>' +
          '<p>n−1 cards × 1 comparison each = n−1 comparisons.</p>' +
          '<p><b>Counted, n = 20 sorted: 19 comparisons and 0 shifts.</b> Nothing moved at all, because nothing needed to.</p>' +
          '<p>This is why Insertion Sort is the algorithm of choice for small or nearly-sorted data, and why real library sorts (like Timsort in Python and Java) switch to it for small chunks.</p>' },
  { label: 'Average: O(n²)',
    head: 'On average each card sinks about halfway back',
    body: '<p>With shuffled data, a card picked up at position i typically has to travel about halfway through the sorted portion to its left — roughly i/2 shifts.</p>' +
          '<p>Summing i/2 over all n cards gives about n²/4: still quadratic, but with half the constant of the worst case.</p>' +
          '<p><b>Counted, n = 20 random: 116 comparisons, 103 shifts</b> — versus 190/190 for reversed input. That is a genuine ~40% saving, unlike Bubble Sort where random and reversed were nearly identical (184 vs 190).</p>' },
  { label: 'Worst: O(n²)',
    head: 'Reverse-sorted — every card travels the whole way',
    body: '<p>When the list is backwards, every card you pick up is smaller than everything already sorted, so it has to be shifted past <i>all</i> of them to reach the front.</p>' +
          '<p>Card 2 shifts past 1, card 3 past 2, ... card n past n−1. That is <code>n(n−1)/2</code> again.</p>' +
          '<p><b>Counted, n = 20 reversed: 190 comparisons and 190 shifts</b> — the maximum possible.</p>' },
  { label: 'Stable: Yes',
    head: 'Equal values keep their original order',
    body: '<p>The loop condition is <code>arr[j] &gt; key</code> — <b>strictly</b> greater than. When it meets a value equal to the one being placed, the condition is false, the loop stops, and the card is dropped to the <i>right</i> of its equal.</p>' +
          '<p>So two equal items never swap places relative to each other. That property is called <b>stability</b>.</p>' +
          '<p>Why it matters: sort a list of students by marks, then by name. If the second sort is stable, students with the same name stay in marks order. If it is not, that ordering is destroyed.</p>' +
          '<p>Change that <code>&gt;</code> to <code>&gt;=</code> and you silently break stability while the sort still appears to work perfectly.</p>' },
  { label: 'Space: O(1)',
    head: 'In place — one card held in your hand',
    body: '<p>The only extra storage is <code>key</code>, the single value lifted out and held while the bigger items shift right, plus the loop counters.</p>' +
          '<p>One variable, regardless of list size. The shifting happens inside the original array.</p>' },
]},

'mindaicode-merge-sort.html': { merge: [
  { label: 'Worst: O(n log n)',
    head: 'Halving depth × one full pass per level',
    body: '<p>Two independent facts multiply together:</p>' +
          '<p><b>1. Depth is log₂n.</b> Halving 20 items gives 10, 5, 3, 2, 1 — about 5 levels. Halving a million gives about 20 levels.</p>' +
          '<p><b>2. Each level touches every item once.</b> The merges at any one level, added together, walk through all n items.</p>' +
          '<p>n items × log n levels = O(n log n), and no input can escape it because the splitting never looks at the values.</p>' +
          '<p><b>Counted, n = 20:</b> sorted → 40 comparisons, reversed → 48, random → 64. The gap between best and worst is tiny — that predictability is Merge Sort\'s selling point.</p>' },
  { label: 'Average: O(n log n)',
    head: 'Same as the worst case, by design',
    body: '<p>The array is split at the midpoint every time, regardless of what the values are. There is no pivot to choose badly and no arrangement of data that unbalances the recursion.</p>' +
          '<p>So the tree of recursive calls is the same shape for every input of the same size. Only the comparisons inside each merge vary slightly.</p>' +
          '<p><b>Counted, n = 20:</b> the spread across sorted, reversed and random input is only 40 to 64 comparisons — a 1.6× ratio. Quick Sort on the same sizes swings from 66 to 190, nearly 3×.</p>' },
  { label: 'Best: O(n log n)',
    head: 'It cannot go faster — even on sorted data',
    body: '<p>Merge Sort splits all the way down to single items before it merges anything back, and it does that whether or not the data is already in order. It never checks.</p>' +
          '<p><b>Counted, n = 20 already sorted: still 40 comparisons and 88 moves</b> — compared with Insertion Sort\'s 19 comparisons and 0 moves on the identical input.</p>' +
          '<p>The flip side is a guarantee: O(n log n) every single time, with no bad input that can make it degrade. Quick Sort is usually faster but has no such guarantee.</p>' },
  { label: 'Stable: Yes',
    head: 'The <= in the merge is what makes it stable',
    body: '<p>When the merge step finds a tie between the left and right halves, the condition <code>left[i] &lt;= right[j]</code> takes from the <b>left</b> half first.</p>' +
          '<p>The left half held the items that came earlier in the original array, so equal items come out in their original relative order.</p>' +
          '<p>Change that <code>&lt;=</code> to <code>&lt;</code> and Merge Sort stops being stable — with no other visible difference. It is a one-character bug that only shows up when you sort by two keys in sequence.</p>' },
  { label: 'Space: O(n)',
    head: 'The real cost — a second array',
    body: '<p>Merging cannot be done in place efficiently, so each merge copies its two halves into temporary arrays first. At the widest point that is a full extra copy of the data.</p>' +
          '<p><b>Counted, n = 20: 88 element moves</b> on every input, sorted or not. Those moves are copies in and out of the temporary buffers.</p>' +
          '<p>Sorting 100 MB needs 100 MB of scratch space. That is why Merge Sort is the standard for sorting <b>files on disk</b>, where you are streaming anyway, but Quick Sort or Heap Sort win for in-memory arrays.</p>' +
          '<p>In C you pay for this explicitly with <code>malloc</code> and <code>free</code>; in C++ the <code>vector</code> copies do it for you.</p>' },
]},

'mindaicode-quick-sort.html': { quick: [
  { label: 'Average: O(n log n)',
    head: 'A decent pivot halves the problem each time',
    body: '<p>If the pivot lands anywhere near the middle, each partition splits the array roughly in two, giving about log₂n levels of recursion. Each level partitions every item once, so n × log n.</p>' +
          '<p>Remarkably, the pivot does not need to be a good one. Even a split as lopsided as 25/75 every single time still gives O(n log n) — just with a bigger constant.</p>' +
          '<p><b>Counted, n = 20 random: 66 comparisons and recursion depth 7.</b> Merge Sort needed 64 on the same input, so they are neck and neck — but Quick Sort did it with no extra array.</p>' },
  { label: 'Worst: O(n²)',
    head: 'Already-sorted input is the disaster case',
    body: '<p>This code takes the <b>last element</b> as the pivot. On a sorted array the last element is the largest, so every other item goes to its left and the "split" is n−1 and 0. Nothing is halved.</p>' +
          '<p>That turns the recursion into a chain n levels deep instead of log n, with a full scan at each level: n(n−1)/2 comparisons.</p>' +
          '<p><b>Counted, n = 20 already sorted: 190 comparisons, recursion depth 20</b> — against 66 comparisons and depth 7 on random data. Sorted input is nearly 3× slower.</p>' +
          '<p>The depth is the real danger: deep recursion means a deep call stack, and on a large sorted array this is a genuine cause of stack overflow crashes.</p>' +
          '<p><b>The fix</b> is to not pick a fixed position: choose a random pivot, or the median of the first, middle and last elements. Both make this worst case vanishingly unlikely.</p>' },
  { label: 'Best: O(n log n)',
    head: 'The pivot lands exactly in the middle every time',
    body: '<p>A perfectly balanced split gives the shallowest possible recursion, log₂n levels, with n work per level.</p>' +
          '<p>In practice you will not hit this exactly, and it barely matters — the average case is already O(n log n). The gap between "lucky" and "typical" is small; the gap between "typical" and "unlucky" is the one that hurts.</p>' },
  { label: 'Stable: No',
    head: 'Partitioning throws equal items across the array',
    body: '<p>Partitioning swaps items between distant positions. Two equal values can easily end up on opposite sides of a pivot, in the reverse of their original order.</p>' +
          '<p>Merge Sort and Insertion Sort are stable; Quick Sort and Heap Sort are not. That is exactly why Java uses Quick Sort for <code>int[]</code> — where two equal ints are indistinguishable so stability is meaningless — but a stable merge-based sort for arrays of objects, where it matters.</p>' },
  { label: 'Space: O(log n)',
    head: 'No extra array, but the call stack is not free',
    body: '<p>Quick Sort partitions in place, so unlike Merge Sort it needs no second array. But recursion is not free: each pending call keeps a stack frame alive.</p>' +
          '<p>With balanced splits the recursion is about log₂n deep, so O(log n) stack. <b>Counted at n = 20: depth 7 on random data.</b></p>' +
          '<p>But on the sorted worst case above, <b>depth was 20</b> — one frame per element, O(n) stack. On a million sorted items that is a million frames and a crash.</p>' +
          '<p>So the O(log n) space figure quietly assumes you fixed the pivot choice.</p>' },
]},

'mindaicode-heap-sort.html': { heap: [
  { label: 'Worst: O(n log n)',
    head: 'n extractions, each costing log n to repair the heap',
    body: '<p>Two phases. Build the heap once, then repeatedly swap the root to the back and sift the new root down.</p>' +
          '<p>A heap of n items is a tree of height log₂n, so sifting a value down costs at most log n comparisons. You do that n times: O(n log n).</p>' +
          '<p><b>Counted, n = 20:</b> sorted → 121 comparisons, reversed → 105, random → 114. A spread of only 15% between the extremes.</p>' },
  { label: 'Average: O(n log n)',
    head: 'The tree height sets the cost, not the data',
    body: '<p>The work is governed by the shape of the tree, and the tree is always a complete binary tree of height log₂n no matter what the values are.</p>' +
          '<p>That is why the three measured figures above are so close together. Heap Sort is boringly consistent — there is no input you can hand it that makes it noticeably faster or slower.</p>' },
  { label: 'Best: O(n log n)',
    head: 'Even sorted input gives no discount',
    body: '<p><b>Counted, n = 20 already sorted: 121 comparisons</b> — actually the <i>highest</i> of the three inputs measured, not the lowest.</p>' +
          '<p>An ascending array is the worst possible starting shape for a max-heap: every value has to sink from the root. Heap Sort has no notion of "already sorted".</p>' +
          '<p><b>One part is better than O(n log n) though.</b> Building the initial heap is O(n), not O(n log n). Measured comparisons to build:<br>n=1,000 → 1,867<br>n=10,000 → 18,777<br>n=100,000 → 188,062</p>' +
          '<p>Divide each by n and you get 1.87, 1.88, 1.88 — flat. If building were O(n log n) that ratio would climb with n. It is the repeated extraction, not the build, that costs the log n.</p>' },
  { label: 'Stable: No',
    head: 'Sifting moves values across the whole array',
    body: '<p>The root of the heap is swapped with the last element on every extraction, flinging values between distant positions. Equal items routinely end up reversed.</p>' +
          '<p>So Heap Sort gives you Merge Sort\'s worst-case guarantee with Quick Sort\'s memory usage — but you give up stability to get it.</p>' },
  { label: 'Space: O(1)',
    head: 'The heap lives inside the original array',
    body: '<p>This is Heap Sort\'s real advantage. The heap is not a separate tree object — it is the array itself, read as a tree by index arithmetic: the children of <code>i</code> are <code>2i+1</code> and <code>2i+2</code>.</p>' +
          '<p>So no second array (unlike Merge Sort\'s O(n)) and no recursion stack if you write the sift as a loop (unlike Quick Sort\'s O(log n)).</p>' +
          '<p>Guaranteed O(n log n) time in genuinely constant space is a combination no other common sort offers. The price is being unstable and, in practice, slower than Quick Sort because it jumps around memory unpredictably.</p>' },
]},

/* ============================ SEARCHING ============================ */

'mindaicode-binary-search.html': {
  linear: [
    { label: 'Best: O(1)', tone: 'g', head: 'The very first item is the one you want',
      body: '<p>One comparison and you are done.</p>' +
            '<p>This is worth being sceptical about. A best case of O(1) sounds impressive, but it describes a single lucky arrangement you have no control over — it says almost nothing about how the algorithm will behave on your data.</p>' +
            '<p>That is why best case is the least useful of the three figures. When someone tells you an algorithm is "O(1) in the best case", the honest follow-up is "and what about the other two?"</p>' },
    { label: 'Average: O(n)', head: 'On average you check half the list',
      body: '<p>If the value is present and equally likely to be anywhere, you look at about n/2 items before finding it.</p>' +
            '<p>Constant factors are dropped in Big-O, so n/2 is still O(n). Halving the work does not change the shape of the growth.</p>' },
    { label: 'Worst: O(n)', head: 'The item is last — or missing entirely',
      body: '<p>You only know something is absent after checking every single item.</p>' +
            '<p><b>Counted worst case: n=100 → 100 comparisons. n=10,000 → 10,000. n=1,000,000 → 1,000,000.</b> The work grows exactly in step with the list.</p>' },
    { label: 'Needs sorted: No', tone: 'g', head: 'Its one real advantage',
      body: '<p>Linear search works on any list in any order. Binary and Jump search both require sorted data.</p>' +
            '<p>So if the data is unsorted and you only need to search once, linear search wins — sorting first would cost O(n log n), which is more than the O(n) search you were trying to avoid.</p>' },
    { label: 'Space: O(1)', tone: 'g', head: 'Just a loop counter',
      body: '<p>One index variable, whatever the list size. Searching ten items and ten million use identical scratch memory.</p>' +
            '<p>Linear search also has a property the other two lack: it never needs the whole list in memory at once. You can run it over a <b>stream</b> — reading a huge file line by line, checking each one and throwing it away.</p>' +
            '<p>Binary search cannot do that. It has to jump to the middle, so the data must be fully in memory or on a seekable disk.</p>' },
  ],
  jump: [
    { label: 'Best: O(1)', tone: 'g', head: 'The first block you land on holds it',
      body: '<p>The first hop lands on or past the target and it is sitting right at the front of that block.</p>' +
            '<p>As with linear search, treat this figure with suspicion — it is one lucky position out of n, and says nothing about typical behaviour.</p>' +
            '<p>The number that actually matters for Jump Search is the worst case of 2√n, because unlike the best case, that one is guaranteed.</p>' },
    { label: 'Worst: O(√n)', head: 'Hop through blocks, then walk one block',
      body: '<p>With a block size of √n there are √n blocks. Worst case you hop through all of them, then walk back through the √n items of the block you landed in: √n + √n = 2√n steps.</p>' +
            '<p><b>Counted worst case:</b><br>n=100 → 20 probes (√100 = 10)<br>n=10,000 → 200 probes (√10,000 = 100)<br>n=1,000,000 → 2,000 probes (√1,000,000 = 1,000)</p>' +
            '<p>Every measured figure is exactly 2√n. Far better than linear search\'s 1,000,000 — but far worse than binary search\'s 20.</p>' +
            '<p>√n is why the block size is √n: making blocks bigger means fewer hops but a longer final walk, and the two balance exactly at √n.</p>' },
    { label: 'Needs sorted: Yes', tone: 'r', head: 'Skipping ahead only works on sorted data',
      body: '<p>The whole idea is "if the last item of this block is still too small, the target cannot be anywhere inside it, so skip the whole block". That reasoning collapses the moment the list is unordered.</p>' +
            '<p>On unsorted data it does not crash — it simply reports "not found" for values that are present. A silent wrong answer is the worst kind of bug.</p>' +
            '<p>So why use Jump Search when Binary Search is faster with the same requirement? Because Jump Search only ever moves <b>forward</b>. On a singly linked list, or a tape, where jumping backwards is expensive or impossible, that matters.</p>' },
    { label: 'Space: O(1)', tone: 'g', head: 'A couple of index variables',
      body: '<p>The current block start and the step size. Nothing that grows with n.</p>' +
            '<p>All three searches on this page are O(1) space, so memory is not what separates them — speed and the sorted-data requirement are.</p>' +
            '<p>The summary worth memorising, for n = 1,000,000: <b>linear</b> needs 1,000,000 probes but no sorting; <b>jump</b> needs 2,000 and only moves forward; <b>binary</b> needs 20 but must be able to jump anywhere.</p>' },
  ],
  bsearch: [
    { label: 'Best: O(1)', tone: 'g', head: 'The middle element is the target',
      body: '<p>First probe, direct hit.</p>' +
            '<p>Unusually, this best case is not purely luck. Binary Search always probes the middle first, so if you are looking for the median value it finds it immediately — every time, by construction rather than by chance.</p>' +
            '<p>But this is not the reason to choose Binary Search. The reason is that its <b>worst</b> case is only 20 probes for a million items. An algorithm with an excellent worst case is far more valuable than one with an excellent best case.</p>' },
    { label: 'Worst: O(log n)', tone: 'g', head: 'Each probe throws away half of what is left',
      body: '<p>Every comparison eliminates half the remaining range. Starting from n, you get n → n/2 → n/4 → ... → 1. The number of halvings to reach 1 is log₂n.</p>' +
            '<p><b>Counted worst case:</b><br>n=100 → 7 probes<br>n=10,000 → 14 probes<br>n=1,000,000 → <b>20 probes</b></p>' +
            '<p>Read that last one again. A million items, twenty questions. Linear search would need a million.</p>' +
            '<p>And doubling the data adds just <b>one</b> probe. Going from a million to two million items costs one extra comparison. That is what logarithmic growth means, and it is why binary search underpins databases, dictionaries and git bisect.</p>' },
    { label: 'Needs sorted: Yes', tone: 'r', head: 'The catch — and the real cost',
      body: '<p>"Throw away the left half" is only sound if everything to the left is smaller. On unsorted data binary search returns nonsense, quietly, with no error.</p>' +
            '<p>Sorting first costs O(n log n) — more than a single O(n) linear scan. So binary search only pays off when you search the same sorted data <b>many times</b>.</p>' +
            '<p>Sort once at O(n log n), then every later lookup is 20 probes instead of a million. That is the trade, and it is the reason databases build indexes.</p>' },
    { label: 'Space: O(1)', tone: 'g', head: 'Two variables, lo and hi',
      body: '<p>The iterative version shown here uses only <code>lo</code>, <code>hi</code> and <code>mid</code>.</p>' +
            '<p>Written recursively instead it would use O(log n) stack space — a good reminder that recursion is never free.</p>' },
  ],
},

/* ====================== LINEAR DATA STRUCTURES ====================== */

'mindaicode-linear-structures.html': {
  stack: [
    { label: 'Push: O(1)', tone: 'g', head: 'Always the same cost, however tall the stack',
      body: '<p>Pushing writes to one index and moves the <code>top</code> pointer up by one. Nothing shifts, nothing is scanned.</p>' +
            '<p>A stack of 10 trays and a stack of 10 million behave identically — that is what O(1) means.</p>' },
    { label: 'Pop: O(1)', tone: 'g', head: 'Read the top, move the pointer down',
      body: '<p>Same reasoning as push. The item removed is always the one the pointer already points at, so there is nothing to search for.</p>' +
            '<p>Note that popping does not erase anything — it just decrements <code>top</code>. The old value is still sitting in memory until it is overwritten.</p>' },
    { label: 'Peek: O(1)', tone: 'g', head: 'Look without removing',
      body: '<p>A single array read at index <code>top</code>.</p>' +
            '<p>In C++ this is <code>s.top()</code>, and it is a separate call from <code>s.pop()</code> — which returns nothing. Forgetting that is one of the most common C++ STL mistakes.</p>' },
    { label: 'Search: O(n)', head: 'The thing a stack is bad at',
      body: '<p>To find out whether a value is in a stack you must pop everything above it — and to keep the stack intact you have to push it all back.</p>' +
            '<p>That is n operations. A stack deliberately gives up random access in exchange for its O(1) ends.</p>' +
            '<p>If you find yourself searching a stack, you have probably picked the wrong structure.</p>' },
    { label: 'Space: O(n)', head: 'One slot per item held',
      body: '<p>Memory grows in step with the number of items stored.</p>' +
            '<p>The fixed-array version shown in C also caps out: push beyond <code>MAX</code> and you get <b>stack overflow</b> — the same phrase you see when recursion goes too deep, because the call stack is exactly this data structure.</p>' },
  ],
  queue: [
    { label: 'Enqueue: O(1)', tone: 'g', head: 'Join at the rear, one write',
      body: '<p>Write at the <code>rear</code> index and advance it by one. Nothing is scanned and nothing is shifted, so the cost is the same whether two people are waiting or two million.</p>' +
            '<p>This is the same reasoning as pushing onto a stack. The only difference is <i>which end</i> you are allowed to touch: a stack adds and removes at the same end, a queue adds at one end and removes at the other.</p>' +
            '<p>That single difference is what turns LIFO into FIFO.</p>' },
    { label: 'Dequeue: O(1)', tone: 'g', head: 'Leave from the front — but only if you do it right',
      body: '<p>The version here moves a <code>front</code> index forward instead of shifting everybody down. That is what keeps it O(1).</p>' +
            '<p><b>The classic mistake</b> is using a plain array or Python list and removing element 0 — that shifts every remaining item left, making dequeue O(n).</p>' +
            '<p>This is exactly why the Python code uses <code>collections.deque</code> rather than a list, and why C++ uses <code>std::queue</code>.</p>' },
    { label: 'Peek: O(1)', tone: 'g', head: 'Who is being served right now',
      body: '<p>One read at the <code>front</code> index — no searching, because a queue always knows exactly who is next.</p>' +
            '<p>Watch the naming across languages. In C++ <code>q.front()</code> is the next to be served and <code>q.back()</code> is the newest arrival; in Java the method is <code>peek()</code>. Same operation, different names.</p>' +
            '<p>And as with a stack, C++ <code>pop()</code> returns nothing — call <code>front()</code> first if you want the value.</p>' },
    { label: 'Search: O(n)', head: 'Same weakness as a stack',
      body: '<p>A queue only exposes its front, so checking whether some value is in the middle means dequeuing everything ahead of it — and re-enqueuing it all afterwards to leave the queue intact.</p>' +
            '<p>That is n operations. Like a stack, a queue deliberately trades away random access to get its O(1) ends.</p>' +
            '<p>If you need both "serve in order" and "look anything up fast", the standard answer is to pair a queue with a hash table: the queue holds the order, the hash table answers the membership question in O(1).</p>' },
    { label: 'Space: O(n)', head: 'One slot per waiting item',
      body: '<p>Grows with the number of items queued.</p>' +
            '<p>The simple two-index version here has a subtle flaw: <code>front</code> and <code>rear</code> only ever move forward, so the space at the start is never reused and the queue eventually reports "full" while half-empty. The fix is a <b>circular queue</b>, which wraps the indices around with <code>% MAX</code>.</p>' },
  ],
  list: [
    { label: 'Insert head: O(1)', tone: 'g', head: 'The linked list\'s superpower',
      body: '<p>Point the new node at the current head, then call it the head. Two assignments, done — regardless of list length.</p>' +
            '<p>Compare with inserting at the front of an <b>array</b>: every existing element has to shift right, which is O(n). On a million items that is a million moves versus two.</p>' },
    { label: 'Delete head: O(1)', tone: 'g', head: 'Skip past it',
      body: '<p>Move the head pointer to <code>head.next</code> and the old node is out of the list. One assignment, regardless of length.</p>' +
            '<p>In C you must then <code>free()</code> the old node, and the order matters: read <code>head-&gt;next</code> <b>before</b> freeing, or you are reading memory you have already handed back. That is a use-after-free, and it is one of the most common bugs in C.</p>' +
            '<p>Deleting from the <b>middle</b> is a different story — you first have to walk the list to find the node before it, which is O(n). The O(1) applies only to the head.</p>' },
    { label: 'Search: O(n)', head: 'You must walk from the front',
      body: '<p>Nodes are scattered across memory and only connected by pointers, so there is no way to jump into the middle. Finding a value means following <code>next</code> from the head.</p>' +
            '<p>And because the nodes are scattered, each hop is likely a <b>cache miss</b> — which is why in practice an array often beats a linked list even when Big-O says otherwise.</p>' },
    { label: 'Index access: O(n)', tone: 'r', head: 'There is no list[500]',
      body: '<p>An array computes the address of element 500 with one multiplication — O(1). A linked list has to follow 500 pointers to get there.</p>' +
            '<p>This is the central trade: arrays give O(1) access but O(n) insertion at the front; linked lists give O(1) insertion at the front but O(n) access. Neither is "better" — pick the one matching what your program does most.</p>' },
    { label: 'Space: O(n)', head: 'Plus a pointer per node',
      body: '<p>Every node stores a <code>next</code> pointer alongside its value — 8 extra bytes per node on a 64-bit machine.</p>' +
            '<p>Storing a million 4-byte integers costs 4 MB in an array but around 16 MB in a linked list once you count pointers and allocator overhead. The Big-O is the same; the constant is not.</p>' },
  ],
},

/* ============================ HASHING ============================ */

'mindaicode-hashing.html': { hash: [
  { label: 'Insert: O(1) avg', tone: 'g', head: 'Compute the slot, write to it',
    body: '<p>Hashing the key gives the slot directly — no searching. The size of the table does not enter into it, which is why this is O(1) rather than O(log n).</p>' +
          '<p>The word <b>average</b> is doing real work here. It assumes the hash function spreads keys evenly and the table is not too full.</p>' },
  { label: 'Search: O(1) avg', tone: 'g', head: 'Why dictionaries feel instant',
    body: '<p>One hash computation, one array read. A table with 10 keys and a table with 10 million behave the same.</p>' +
          '<p>This is the whole reason Python <code>dict</code>, Java <code>HashMap</code> and C++ <code>unordered_map</code> exist and why they are everywhere.</p>' +
          '<p>Compare against searching a sorted array: 20 probes for a million items with binary search, versus about 1 here.</p>' },
  { label: 'Worst: O(n)', tone: 'r', head: 'When every key collides',
    body: '<p>If every key hashes to the same slot, chaining degenerates into one long linked list and you are back to scanning n items.</p>' +
          '<p>The demo on this page shows this in miniature: with a table of 7, the keys <i>ravi</i>, <i>asha</i> and <i>meena</i> all hash to slot 0. Probing still stores all of them, but each collision costs an extra step.</p>' +
          '<p>This is not just theory — it is a real attack. Feed a web server thousands of deliberately colliding keys and its O(1) lookups become O(n), and the server falls over. That is a <b>hash-flooding denial of service</b>, and it is why modern languages randomise their hash seed at startup.</p>' },
  { label: 'Load factor matters', tone: 'p', head: 'A hash table has to stay roughly half empty',
    body: '<p>Load factor = items ÷ slots. As it approaches 1, linear probing has to walk further and further to find a free slot. Using Knuth\'s formula for probes per insert:</p>' +
          '<p>50% full → about <b>2.5</b> probes<br>75% full → about <b>8.5</b> probes<br>90% full → about <b>50</b> probes<br>99% full → about <b>5,000</b> probes</p>' +
          '<p>The "constant time" promise quietly collapses as the table fills. That is why real hash tables <b>resize</b> — typically doubling and rehashing everything once they pass about 70% full.</p>' +
          '<p>That resize is an expensive O(n) operation, but it happens rarely enough that the cost averaged over all inserts is still O(1). That argument is called <b>amortised</b> analysis.</p>' },
  { label: 'Space: O(n)', head: 'You deliberately buy extra room',
    body: '<p>A hash table is always bigger than the data it holds — that empty space is what keeps collisions rare.</p>' +
          '<p>So hashing trades memory for speed. It is the clearest example in this whole course of a <b>space–time trade-off</b>.</p>' },
]},

/* ============================== TREES ============================== */

'mindaicode-trees.html': {
  bst: [
    { label: 'Search: O(log n) avg', tone: 'g', head: 'Each comparison discards half the tree',
      body: '<p>At every node you go left or right, which throws away an entire subtree. That is binary search again, but on a tree instead of an array.</p>' +
            '<p>A balanced tree of a million nodes is about 20 levels deep, so a lookup takes around 20 comparisons.</p>' },
    { label: 'Insert: O(log n) avg', tone: 'g', head: 'Walk down, hang the new node off a leaf',
      body: '<p>Finding where the value belongs is the same downward walk as a search. Once you reach an empty spot you attach the node there.</p>' +
            '<p>Unlike a sorted array, nothing has to shift — inserting into the middle of a sorted array is O(n).</p>' },
    { label: 'Worst: O(n)', tone: 'r', head: 'Insert sorted data and your tree becomes a linked list',
      body: '<p>This is the failure every student should see once. Insert 1, 2, 3, 4, 5 in that order: each value is bigger than the last, so each goes to the right. You end up with a single chain going right — a linked list wearing a tree costume.</p>' +
            '<p>Now every search walks all n nodes instead of log n. On a million sorted inserts that is a million steps instead of twenty.</p>' +
            '<p>The fix is a <b>self-balancing</b> tree — AVL or red-black — which rotates nodes on insert to keep the height at log n. That is what C++ <code>std::set</code> and Java <code>TreeMap</code> actually use.</p>' },
    { label: 'Inorder: O(n)', head: 'Sorted output, and it has to touch everything',
      body: '<p>Inorder traversal visits left subtree, then the node, then the right subtree — and that order always comes out sorted. It is a genuinely satisfying property.</p>' +
            '<p>It is O(n) because producing n values requires visiting n nodes; no traversal can do better.</p>' },
    { label: 'Space: O(n)', head: 'A node and two pointers per value',
      body: '<p>Each node stores a value plus <code>left</code> and <code>right</code> pointers.</p>' +
            '<p>Recursive insert and traversal also use stack space equal to the height — O(log n) when balanced, but O(n) on the degenerate chain above, which is another way that failure bites.</p>' },
  ],
  heap: [
    { label: 'Insert: O(log n)', tone: 'g', head: 'Add at the end, then climb',
      body: '<p>The new value goes into the first free slot at the bottom, then swaps upward past any parent bigger than it until the heap rule holds again.</p>' +
            '<p>A heap is always a <b>complete</b> tree — every level full except possibly the last — so its height is exactly log₂n. The climb therefore can never exceed log n swaps.</p>' +
            '<p>For a heap of a million items the height is about 20, so an insert is at most about 20 swaps. Compare that with keeping a sorted array in order, where inserting in the middle shifts up to a million elements.</p>' },
    { label: 'Extract-min: O(log n)', tone: 'g', head: 'Take the root, then repair downward',
      body: '<p>Reading the minimum is free — it is the root. The cost is putting the heap back together afterwards.</p>' +
            '<p>You move the <i>last</i> item into the empty root and sink it back down, swapping with its smaller child each time. At most log n levels, so at most log n swaps.</p>' +
            '<p>Why the last item rather than promoting a child? Because promoting a child would leave a hole in the middle of the tree and break completeness. Taking the last item keeps the shape correct, and fixing the ordering afterwards is the cheaper problem.</p>' },
    { label: 'Peek min: O(1)', tone: 'g', head: 'The smallest is always at index 0',
      body: '<p>No searching at all — the heap property guarantees the minimum sits at the root.</p>' +
            '<p>This is exactly what Dijkstra\'s algorithm needs: repeatedly grab the closest unvisited city.</p>' },
    { label: 'Build heap: O(n)', tone: 'p', head: 'Faster than it looks — and this surprises people',
      body: '<p>Building a heap from n items looks like it should be n inserts × log n each = O(n log n). It is actually <b>O(n)</b>.</p>' +
            '<p>The reason: most nodes are near the bottom and barely move. Half the nodes are leaves and sift zero levels; only the single root can sift the full log n.</p>' +
            '<p><b>Measured comparisons to build:</b><br>n=1,000 → 1,867<br>n=10,000 → 18,777<br>n=100,000 → 188,062</p>' +
            '<p>Divide by n: 1.87, 1.88, 1.88. Flat. If it were O(n log n) that ratio would rise with n — it does not.</p>' },
    { label: 'Space: O(n)', head: 'A heap is just an array',
      body: '<p>There are no node objects and no pointers. The tree structure is pure index arithmetic: the children of <code>i</code> live at <code>2i+1</code> and <code>2i+2</code>.</p>' +
            '<p>That makes heaps compact and cache-friendly — a real speed advantage over pointer-based trees that Big-O does not capture.</p>' },
  ],
},

/* ============================== GRAPHS ============================== */

'mindaicode-graphs.html': {
  bfs: [
    { label: 'Time: O(V + E)', tone: 'g', head: 'Every city once, every road twice',
      body: '<p>V is the number of vertices (cities), E the number of edges (roads).</p>' +
            '<p>Each city is enqueued and dequeued exactly once — that is the V. While handling a city you look at each of its roads — across the whole run every road is examined once from each end, giving the E.</p>' +
            '<p>You cannot do better: any algorithm that visits the whole graph must at minimum look at every city and every road.</p>' },
    { label: 'Shortest path: unweighted', tone: 'p', head: 'BFS finds the fewest hops — but ignores distance',
      body: '<p>BFS explores in rings: everything 1 hop away, then everything 2 hops away, and so on. So the first time it reaches a city, it has arrived by the fewest possible hops.</p>' +
            '<p>That is a genuine shortest path <b>if every road counts the same</b>. The moment roads have different lengths, "fewest roads" stops meaning "shortest distance" — three short hops can beat one long one.</p>' +
            '<p>That is precisely the gap Dijkstra fills.</p>' },
    { label: 'Space: O(V)', head: 'The queue plus the visited set',
      body: '<p>In the worst case the queue holds an entire level of the graph at once, which can be a large fraction of V. The visited set is V too.</p>' +
            '<p>On a wide, shallow graph BFS can use much more memory than DFS — the trade-off runs the other way on deep, narrow graphs.</p>' },
    { label: 'Marks when enqueued', tone: 'r', head: 'The bug almost everyone writes first',
      body: '<p>You must mark a city visited <b>when you add it to the queue</b>, not when you take it out.</p>' +
            '<p>Mark on dequeue and a city with two neighbours pointing at it gets queued twice, processed twice, and its neighbours queued again. On a dense graph this snowballs badly.</p>' +
            '<p>The code on this page marks on enqueue — worth looking at again with this in mind.</p>' },
  ],
  dfs: [
    { label: 'Time: O(V + E)', tone: 'g', head: 'Same total work as BFS',
      body: '<p>DFS visits every city once and inspects every road once from each end, exactly like BFS. The <b>order</b> is completely different; the total work is identical.</p>' +
            '<p>So choosing between them is never about speed — it is about what you need: shortest hops (BFS) or path/cycle structure (DFS).</p>' },
    { label: 'Finds shortest: No', tone: 'r', head: 'DFS commits to a direction and dives',
      body: '<p>DFS follows one path as far as it goes before backtracking. The first route it finds to a city may be an enormous detour.</p>' +
            '<p>Use DFS for: detecting cycles, topological sorting, finding connected components, maze generation. Use BFS when you want the shortest route.</p>' },
    { label: 'Space: O(V)', head: 'The recursion stack is the cost',
      body: '<p>DFS stores the current path rather than the current level. On a long chain of cities the recursion goes V deep.</p>' +
            '<p>That is a practical hazard: DFS on a graph with a million-node chain will overflow the call stack in most languages. The fix is to write it iteratively with your own explicit stack — which is exactly what the recursion was doing invisibly.</p>' },
  ],
  dijk: [
    { label: 'Time: O((V+E) log V)', tone: 'g', head: 'With a priority queue',
      body: '<p>Each city is extracted from the priority queue once, at log V each. Each road can trigger one push, also log V. Total: O((V + E) log V).</p>' +
            '<p>The simple version on this page instead scans every city to find the nearest unsettled one, which makes it O(V²). For a sparse road network the heap version is dramatically faster; for a dense one they are comparable.</p>' +
            '<p>This is why the C++ tab uses <code>priority_queue</code> and the Java version uses <code>PriorityQueue</code>.</p>' },
    { label: 'Negative weights: No', tone: 'r', head: 'The one assumption that breaks it',
      body: '<p>Dijkstra settles a city and never revisits it, on the reasoning that no later route could be shorter. A negative edge destroys that reasoning — a longer-looking path could still drop below via a negative road.</p>' +
            '<p>It does not error. It quietly returns a wrong answer, which is worse.</p>' +
            '<p>For negative weights use <b>Bellman-Ford</b>: O(V×E), slower, but it handles them and can even detect negative cycles.</p>' },
    { label: 'Greedy: always settles nearest', tone: 'p', head: 'Why settling the closest city is provably safe',
      body: '<p>Take the unsettled city with the smallest tentative distance. Could a shorter route to it exist? It would have to pass through another unsettled city first — but every one of those is <i>already at least as far away</i>, and roads cannot have negative length.</p>' +
            '<p>So no such route exists, and that distance is final. That short argument is the entire correctness proof, and it shows exactly where non-negative weights are required.</p>' },
    { label: 'Space: O(V)', head: 'Distances, settled set, and the queue',
      body: '<p>One distance per city, plus the settled set — both O(V).</p>' +
            '<p>The priority queue is the subtle part. Most implementations cannot cheaply update a distance already sitting in the heap, so instead they push a <i>new</i> entry and leave the old one behind. The queue can therefore grow to hold up to E entries, not V.</p>' +
            '<p>Those leftovers are called <b>stale</b> entries, and you have to ignore them when they surface — which is exactly what <code>if (d &gt; dist[node]) continue;</code> does in the C++ code above.</p>' +
            '<p>Leave that line out and the algorithm still terminates, but it re-processes cities it already finalised and quietly does far more work than it should.</p>' },
  ],
},

/* ================== DYNAMIC PROGRAMMING ================== */

'mindaicode-recursion-dp.html': { knap: [
  { label: 'Time: O(n × W)', tone: 'g', head: 'One cell of the table, once each',
    body: '<p>The table has n rows (items) and W+1 columns (capacities from 0 to W). Each cell is filled exactly once, and filling it is a comparison and an addition — constant work.</p>' +
          '<p>So the total is the number of cells: n × W.</p>' },
  { label: 'Brute force: O(2ⁿ)', tone: 'r', head: 'What DP is saving you from',
    body: '<p>Without DP you would try every subset of items — take it or leave it, n times over, giving 2ⁿ combinations.</p>' +
          '<p>For the 4 items here that is only 16, so it hardly matters. For 50 items it is about <b>1,000,000,000,000,000</b> combinations. The DP table for 50 items and capacity 100 is 5,000 cells.</p>' +
          '<p>That gap — quadrillions down to thousands — is the entire point of dynamic programming.</p>' },
  { label: 'Space: O(n × W)', head: 'The table itself — and you can shrink it',
    body: '<p>The full table is n × W cells.</p>' +
          '<p>But look at the recurrence: row <code>i</code> only ever reads row <code>i−1</code>. You never need the older rows, so you can keep just two rows and drop to O(W) space.</p>' +
          '<p>With a little more care — iterating capacity <b>downward</b> — a single row suffices. That is a standard interview follow-up: "now do it in O(W) space."</p>' },
  { label: 'Pseudo-polynomial', tone: 'p', head: 'Why O(n × W) is not really polynomial',
    body: '<p>O(n × W) looks polynomial, but W is a <i>value</i>, not an input size. Writing the number 1,000,000 takes only about 20 bits — so the runtime is exponential in the number of bits of input.</p>' +
          '<p>That is why 0/1 Knapsack is still classed as NP-hard despite this neat table. Give it a capacity of one billion and the table becomes unusable, even with only a handful of items.</p>' +
          '<p>Not something a first-year exam needs, but it is the kind of detail that stands out in an interview.</p>' },
]},

};

/* ------------------------------------------------------------------
   Runtime: turn every chip into something a student can tap, and show
   the explanation right underneath. Injects its own CSS so no page
   stylesheet has to be touched.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var CSS = [
    '.complexity{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center;}',
    '.complexity .chip.cxNew{background:rgba(247,129,102,.12);color:#f78166;',
    '  border:1px solid rgba(247,129,102,.35);padding:3px 10px;border-radius:14px;',
    '  font-size:12.5px;font-weight:600;font-family:inherit;line-height:1.5;}',
    '.complexity .chip.cxNew.g{background:rgba(63,185,80,.12);color:#3fb950;border-color:rgba(63,185,80,.35);}',
    '.complexity .chip.cxNew.r{background:rgba(248,81,73,.12);color:#f85149;border-color:rgba(248,81,73,.38);}',
    '.complexity .chip.cxNew.p{background:rgba(210,168,255,.12);color:#d2a8ff;border-color:rgba(210,168,255,.35);}',
    '.chip.cxOn{cursor:pointer;user-select:none;transition:filter .15s,transform .1s;}',
    '.chip.cxOn:hover{filter:brightness(1.35);}',
    '.chip.cxOn:active{transform:scale(.96);}',
    '.chip.cxOn:focus-visible{outline:2px solid currentColor;outline-offset:2px;}',
    '.chip.cxOn::after{content:" \\24D8";opacity:.6;font-weight:700;}',
    '.chip.cxOn.cxOpenChip{filter:brightness(1.45);box-shadow:0 0 0 1px currentColor inset;}',
    '.chip.cxOn.cxOpenChip::after{content:" \\2715";opacity:.85;}',
    '.cxHint{font-size:11.5px;color:#8b949e;font-style:italic;margin-left:2px;}',
    '.cxPanel{display:none;margin-top:10px;background:rgba(88,166,255,.06);',
    '  border:1px solid rgba(88,166,255,.28);border-left:3px solid #58a6ff;',
    '  border-radius:8px;padding:14px 16px;}',
    '.cxPanel.on{display:block;animation:cxIn .18s ease-out;}',
    '@keyframes cxIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}',
    '.cxPanel .cxTitle{font-size:13px;font-weight:800;color:#58a6ff;margin-bottom:2px;',
    '  font-family:Consolas,monospace;letter-spacing:.2px;}',
    '.cxPanel .cxHead{font-size:14.5px;font-weight:700;margin-bottom:8px;line-height:1.4;}',
    '.cxPanel p{font-size:13.5px;line-height:1.65;margin-bottom:9px;}',
    '.cxPanel p:last-child{margin-bottom:0;}',
    '.cxPanel code{font-family:Consolas,monospace;font-size:12.5px;background:rgba(110,118,129,.25);',
    '  padding:1px 5px;border-radius:4px;}',
    '.cxPanel b{color:#e6edf3;}',
    '.cxClose{margin-top:10px;font-size:11.5px;color:#8b949e;background:none;border:none;',
    '  cursor:pointer;padding:0;font-family:inherit;text-decoration:underline;}',
    '@media (max-width:640px){.cxPanel{padding:12px;}.cxPanel p{font-size:13px;}}'
  ].join('\n');

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  function pageKey() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  var data = (window.MINDAICODE_COMPLEXITY || {})[pageKey()];
  if (!data) return;

  Array.prototype.forEach.call(document.querySelectorAll('.complexity[data-cx]'), function (row) {
    var spec = data[row.dataset.cx];
    if (!spec || !spec.length) return;

    var panel = document.createElement('div');
    panel.className = 'cxPanel';
    row.parentNode.insertBefore(panel, row.nextSibling);

    var existing = {};
    Array.prototype.forEach.call(row.querySelectorAll('.chip'), function (c) {
      existing[norm(c.textContent)] = c;
    });

    var chips = [];

    spec.forEach(function (item, i) {
      var chip = existing[norm(item.label)];
      if (!chip) {
        // this page had no chip row yet - build the chip too
        chip = document.createElement('span');
        chip.className = 'chip cxNew' + (item.tone ? ' ' + item.tone : '');
        chip.textContent = item.label;
        row.appendChild(chip);
      }
      chip.classList.add('cxOn');
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-expanded', 'false');
      chip.dataset.cxi = String(i);
      chips.push(chip);

      function open() {
        var already = chip.classList.contains('cxOpenChip');
        chips.forEach(function (c) {
          c.classList.remove('cxOpenChip');
          c.setAttribute('aria-expanded', 'false');
        });
        if (already) { panel.classList.remove('on'); return; }
        panel.innerHTML =
          '<div class="cxTitle">' + item.label + '</div>' +
          '<div class="cxHead">' + item.head + '</div>' +
          item.body +
          '<button type="button" class="cxClose">Close</button>';
        panel.classList.add('on');
        chip.classList.add('cxOpenChip');
        chip.setAttribute('aria-expanded', 'true');
        panel.querySelector('.cxClose').onclick = function () {
          panel.classList.remove('on');
          chip.classList.remove('cxOpenChip');
          chip.setAttribute('aria-expanded', 'false');
          chip.focus();
        };
      }

      chip.onclick = open;
      chip.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      };
    });

    if (chips.length) {
      var hint = document.createElement('span');
      hint.className = 'cxHint';
      hint.textContent = 'tap any of these to see why';
      row.appendChild(hint);
    }
  });
})();
