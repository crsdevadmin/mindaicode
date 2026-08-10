/* ============================================================================
   MindAICode — Programming Basics: level content
   Three levels per game. Beginner is always open; Intermediate unlocks when all
   six Beginner badges are earned, Pro when all six Intermediate ones are.

   Every answer key in this file was verified against a real execution before
   being written down (see the verification run in basicstest.js).
   ============================================================================ */

const LEVELS = ['beginner', 'intermediate', 'pro'];
const LEVEL_META = {
  beginner:     { label: 'Beginner',     icon: '🌱', blurb: 'No experience needed.' },
  intermediate: { label: 'Intermediate', icon: '⚡', blurb: 'You know the basics — now the sharp edges.' },
  pro:          { label: 'Pro',          icon: '🔥', blurb: 'Interview tricks, and why you should not ship them.' },
};

/* ---------------------------------------------------------------- GAME 1: SWAP */
/* op is applied as: target = compute(currentTarget, currentSource) */
const SWAP_LEVELS = {
  beginner: {
    jars: ['x', 'temp', 'y'],
    start: { x: 5, y: 10, temp: null },
    title: 'Two jars, and a swap that goes horribly wrong',
    brief: 'x holds 5, y holds 10. Get x to 10 and y to 5. You have a spare jar called <b>temp</b> — you will need it.',
    cards: [
      { id: 'b1', text: 'temp = x', to: 'temp', from: 'x', op: 'copy' },
      { id: 'b2', text: 'x = y',    to: 'x',    from: 'y', op: 'copy' },
      { id: 'b3', text: 'y = temp', to: 'y',    from: 'temp', op: 'copy' },
      { id: 'b4', text: 'y = x',    to: 'y',    from: 'x', op: 'copy' },
    ],
    solution: ['b1', 'b2', 'b3'],
    win: '🎉 <b>Swapped.</b> The trick was saving x into <b>temp</b> before overwriting it — once x was safely copied, you were free to clobber it.',
  },

  intermediate: {
    jars: ['x', 'y'],
    start: { x: 5, y: 10 },
    title: 'Now do it with no spare jar',
    brief: 'Same goal — x to 10, y to 5 — but this time there is <b>no temp jar</b>. Only x and y exist. Use arithmetic to hold both values inside one number.',
    cards: [
      { id: 'i1', text: 'x = x + y', to: 'x', from: 'y', op: 'add' },
      { id: 'i2', text: 'y = x - y', to: 'y', from: 'x', op: 'fromMinusTo' },
      { id: 'i3', text: 'x = x - y', to: 'x', from: 'y', op: 'toMinusFrom' },
      { id: 'i4', text: 'y = x + y', to: 'y', from: 'x', op: 'add' },
    ],
    solution: ['i1', 'i2', 'i3'],
    win: '🎉 <b>Swapped with only two variables.</b> After line 1, x holds the <em>sum</em> — both values packed into one number. Lines 2 and 3 subtract each one back out.',
    trap: {
      label: '⚠️ Now try it with decimals',
      run: { x: 0.1, y: 0.2 },
      verdict: (st) =>
        `Started with x=0.1, y=0.2. After the same three lines: <b>x=${st.x}</b>, <b>y=${st.y}</b>. ` +
        `y should be exactly 0.1 — it isn't. Adding and subtracting decimals loses precision, and the swap quietly corrupts the value. ` +
        `The <code>temp</code> version never has this problem.`,
    },
  },

  pro: {
    jars: ['x', 'y'],
    start: { x: 5, y: 10 },
    title: 'The XOR trick — and why not to use it',
    brief: '<code>^</code> is <b>exclusive or</b>: it flips bits, and applying it twice undoes it. That property lets two numbers swap with no temp and no arithmetic. <b>One of these lines is used twice</b> — the ♻ card can be clicked again.',
    cards: [
      { id: 'p1', text: 'x = x ^ y', to: 'x', from: 'y', op: 'xor', reusable: true },
      { id: 'p2', text: 'y = x ^ y', to: 'y', from: 'x', op: 'xor' },
      { id: 'p3', text: 'x = x ^ x', to: 'x', from: 'x', op: 'xor' },
    ],
    solution: ['p1', 'p2', 'p1'],
    win: '🎉 <b>Swapped with XOR.</b> 5 is 0101 and 10 is 1010 in binary. Each XOR flips exactly the bits where the two differ, and doing it three times lands them in each other\'s place.',
    trap: {
      label: '⚠️ Now swap a variable with ITSELF',
      alias: true,
      verdict: () =>
        `This is the bug that makes XOR swap dangerous. If both sides are the same variable — say <code>swap(arr[i], arr[j])</code> where <b>i and j happen to be equal</b> — then <code>x ^ x</code> is <b>0</b>, and the value is destroyed. ` +
        `It looks fine in testing and detonates on one unlucky input.`,
    },
    trap2: {
      label: '⚠️ Now try it with decimals',
      run: { x: 2.5, y: 7.5 },
      verdict: (st) =>
        `Started with x=2.5, y=7.5. Result: <b>x=${st.x}</b>, <b>y=${st.y}</b>. XOR only works on whole numbers, so both decimals were silently chopped off. No error, no warning — just wrong data.`,
    },
  },
};

const SWAP_VERDICT_NOTE = {
  beginner: '',
  intermediate: 'Worth knowing for an interview. Worth avoiding in real code — see the trap below.',
  pro: 'Interviewers love asking about this. Good engineers do not ship it. Try both traps below to see why.',
};

/* --------------------------------------------------------------- GAME 2: ARRAYS */
const LOCKER_VALUES = [40, 15, 90, 3, 62];
const LOCKER_LEVELS = {
  beginner: [
    { ask: 'Click the box at <b>index 0</b>.', target: 0, teach: 'Index 0 is the <b>first</b> box. Counting starts at zero.' },
    { ask: 'Click the <b>3rd box</b> (the third one along).', target: 2, teach: 'The 3rd box is <b>index 2</b>. Position 3, index 2 — always one less.' },
    { ask: 'Click the <b>last</b> box.', target: 4, teach: 'With 5 boxes the last index is <b>4</b>, not 5. Length minus one.' },
    { ask: 'Click the box holding the value <b>90</b>.', target: 2, teach: '90 lives at <b>index 2</b>. The value and the index are different things.' },
    { ask: 'Click the box at <b>index 1</b>.', target: 1, teach: 'Index 1 is the <b>second</b> box. Feels off by one until it clicks.' },
  ],
  intermediate: [
    { ask: 'Click the box that <code>arr[-1]</code> refers to.', target: 4, teach: 'A negative index counts <b>backwards from the end</b>. -1 is the last item — a neat shortcut for "the last one" without needing the length.' },
    { ask: 'Click the box that <code>arr[-2]</code> refers to.', target: 3, teach: '-2 is the second from the end. Careful: negative indexing starts at -1, not -0.' },
    { ask: 'Click the box that <code>arr[len(arr) - 1]</code> refers to.', target: 4, teach: 'len(arr) is 5, so this is arr[4] — the last box. This is the long way of writing arr[-1].' },
    { ask: 'Click the box that <code>arr[len(arr) // 2]</code> refers to.', target: 2, teach: '5 // 2 is <b>2</b> (integer division throws away the remainder), so this is the middle box. Binary search uses exactly this.' },
    { ask: 'A loop runs <code>for i in range(1, 4)</code>. Click the <b>first</b> box it touches.', target: 1, teach: 'range(1, 4) starts at 1 and stops before 4, so it visits indexes 1, 2, 3 — starting here.' },
  ],
  pro: [
    { ask: '<code>for i in range(len(arr)-1, -1, -1)</code> — click the <b>first</b> box this visits.', target: 4, teach: 'It counts <b>backwards</b>: starts at len-1 = 4, steps by -1, stops before -1. So it begins at the last box.' },
    { ask: 'Same reversed loop — click the <b>last</b> box it visits.', target: 0, teach: 'It stops <em>before</em> -1, which means index 0 is the final one visited. That trailing -1 is what makes it reach index 0 at all.' },
    { ask: '<code>arr[1:4]</code> — click the <b>first</b> box included in that slice.', target: 1, teach: 'A slice starts <b>at</b> the first number. arr[1:4] begins at index 1.' },
    { ask: '<code>arr[1:4]</code> — click the first box that is <b>NOT</b> included.', target: 4, teach: 'A slice stops <em>before</em> the second number. arr[1:4] covers indexes 1, 2 and 3 — index 4 is excluded. Same off-by-one rule as range().' },
    { ask: '<code>arr[::2]</code> takes every second box. Click the <b>last</b> box it includes.', target: 4, teach: 'Starting at 0 and stepping by 2 gives indexes 0, 2, 4 — so it ends on the last box. With an even-length array it would not.' },
  ],
};

/* ---------------------------------------------------------------- GAME 3: LOOPS */
const LOOP_LEVELS = {
  beginner: [
    { arr: [3, 7, 2],
      code: ['arr = [3, 7, 2]', 'total = 0', 'for i in range(len(arr)):', '    total = total + arr[i]'],
      question: 'What is <b>total</b> at the end?', opts: ['10', '12', '3'], ans: 1, correctVal: 12,
      teach: 'It adds every item: 3 + 7 + 2 = <b>12</b>. The loop visited index 0, 1 and 2 — every box exactly once.' },
    { arr: null,
      code: ['count = 0', 'for i in range(5):', '    count = count + 1'],
      question: 'How many times does the loop body run?', opts: ['4', '5', '6'], ans: 1, correctVal: 5,
      teach: '<b>5 times.</b> range(5) gives 0, 1, 2, 3, 4 — five values. It never reaches 5 itself.' },
    { arr: [10, 20, 30, 40],
      code: ['arr = [10, 20, 30, 40]', 'total = 0', 'for i in range(len(arr) - 1):', '    total = total + arr[i]'],
      question: 'What is <b>total</b> at the end? (look closely at line 3)', opts: ['100', '60', '90'], ans: 1, correctVal: 60,
      teach: 'That <code>- 1</code> makes it stop early: indexes 0, 1, 2 only, so 10 + 20 + 30 = <b>60</b>. The 40 is never touched.' },
  ],
  intermediate: [
    { arr: null,
      code: ['count = 0', 'for i in range(3):', '    for j in range(4):', '        count = count + 1'],
      question: 'How many times does the innermost line run?', opts: ['7', '12', '4'], ans: 1, correctVal: 12,
      teach: 'The inner loop runs fully for <em>each</em> pass of the outer one: 3 × 4 = <b>12</b>. Nested loops multiply, they do not add — this is exactly why bubble sort is O(n²).' },
    { arr: null,
      code: ['count = 0', 'for i in range(10):', '    if i == 3:', '        break', '    count = count + 1'],
      question: 'What is <b>count</b> at the end?', opts: ['3', '4', '10'], ans: 0, correctVal: 3,
      teach: '<code>break</code> leaves the loop immediately. It counted i = 0, 1, 2 and then quit at i = 3 <em>before</em> counting, so <b>3</b>.' },
    { arr: null,
      code: ['total = 0', 'for i in range(5):', '    if i % 2 == 0:', '        continue', '    total = total + i'],
      question: 'What is <b>total</b> at the end?', opts: ['6', '4', '10'], ans: 1, correctVal: 4,
      teach: '<code>continue</code> skips the rest of <em>this</em> pass and moves on. Evens 0, 2, 4 are skipped, so it adds 1 + 3 = <b>4</b>.' },
  ],
  pro: [
    { arr: null,
      code: ['a = [1, 2, 2, 3]', 'for x in a:', '    if x % 2 == 0:', '        a.remove(x)'],
      question: 'What is <b>a</b> at the end?', opts: ['[1, 3]', '[1, 2, 3]', '[1, 2, 2, 3]'], ans: 1, correctVal: '[1, 2, 3]',
      teach: 'Removing while looping shifts everything left, so the loop <b>skips</b> the item that moves into the slot it just handled. One of the 2s survives: <b>[1, 2, 3]</b>. Never mutate a list you are iterating — loop over a copy instead.' },
    { arr: null,
      code: ['r = []', 'for i in range(0, 10, 3):', '    r.append(i)'],
      question: 'How many items end up in <b>r</b>?', opts: ['3', '4', '10'], ans: 1, correctVal: 4,
      teach: 'The third number is the <b>step</b>. It gives 0, 3, 6, 9 — the next would be 12, past the stop. So <b>4</b> items.' },
    { arr: null,
      code: ['i = 0', 'steps = 0', 'while i < 5:', '    i = i + 2', '    steps = steps + 1'],
      question: 'What is <b>steps</b> when the loop ends?', opts: ['2', '3', '5'], ans: 1, correctVal: 3,
      teach: 'i goes 0 → 2 → 4 → 6. It runs on 0, 2 and 4, then 6 fails the test. <b>3</b> steps — and note i ends on 6, overshooting 5 entirely. A while loop can skip straight past its stop value.' },
  ],
};

/* ------------------------------------------------------------- GAME 4: FUNCTIONS */
const FN_LEVELS = {
  beginner: {
    code: ['def isEven(n):', '    if n % 2 == 0:   # "%" gives the REMAINDER after dividing', '        return True', '    else:', '        return False'],
    prompt: 'Someone calls your function with:',
    call: n => `isEven(${n})`,
    inputs: [4, 7, 0, 13, 100],
    opts: ['True', 'False'],
    answer: n => (n % 2 === 0 ? 0 : 1),
    explain: n => `${n} % 2 = <b>${n % 2}</b>, so the <b>${n % 2 === 0 ? 'if' : 'else'}</b> branch runs and it returns <b>${n % 2 === 0}</b>.` +
      (n === 0 ? ' Zero catches people out — 0 divided by 2 leaves no remainder, so zero <em>is</em> even.' : ''),
  },
  intermediate: {
    code: ['def grade(score):', '    if score >= 90:', '        return "A"', '    elif score >= 75:', '        return "B"', '    elif score >= 50:', '        return "C"', '    else:', '        return "F"'],
    prompt: 'A student scored:',
    call: n => `grade(${n})`,
    inputs: [95, 90, 89, 75, 49],
    opts: ['A', 'B', 'C', 'F'],
    answer: n => (n >= 90 ? 0 : n >= 75 ? 1 : n >= 50 ? 2 : 3),
    explain: n => {
      const g = n >= 90 ? 'A' : n >= 75 ? 'B' : n >= 50 ? 'C' : 'F';
      const why = n >= 90 ? `${n} >= 90, so the first branch wins` :
        n >= 75 ? `${n} is under 90 but >= 75` :
        n >= 50 ? `${n} is under 75 but >= 50` : `${n} failed every test, so else runs`;
      let extra = '';
      if (n === 90 || n === 75) extra = ` <b>Boundary case:</b> >= means "or equal", so ${n} lands in the higher grade.`;
      if (n === 89) extra = ' One mark short of an A — the checks run top to bottom and the first true one wins.';
      return `${why} → returns <b>"${g}"</b>.${extra}`;
    },
  },
  pro: {
    code: ['# Does the change inside the function survive', '# after the function has finished?'],
    prompt: 'Read this carefully:',
    isRef: true,
    inputs: [0, 1, 2, 3],
    opts: ['Yes, the caller sees the change', 'No, the caller is unaffected'],
    cases: [
      { code: ['def f(n):', '    n = n + 1', '', 'x = 5', 'f(x)', 'print(x)'],
        ans: 1, teach: 'A number is passed <b>by value</b> — the function gets its own copy. x is still 5. Reassigning a parameter never touches the caller\'s variable.' },
      { code: ['def f(lst):', '    lst.append(4)', '', 'a = [1, 2, 3]', 'f(a)', 'print(a)'],
        ans: 0, teach: 'A list is passed <b>by reference</b> — both names point at the same list in memory. <code>.append()</code> modifies that shared list, so the caller sees <b>[1, 2, 3, 4]</b>.' },
      { code: ['def f(lst):', '    lst = [9, 9]', '', 'a = [1, 2, 3]', 'f(a)', 'print(a)'],
        ans: 1, teach: 'This one catches nearly everyone. <code>lst = [9, 9]</code> <b>rebinds the local name</b> to a brand new list — it does not modify the original. a is untouched. Mutating (<code>.append</code>) and reassigning (<code>=</code>) are completely different operations.' },
      { code: ['def f(d):', '    d["k"] = 1', '', 'cfg = {}', 'f(cfg)', 'print(cfg)'],
        ans: 0, teach: 'A dictionary behaves like a list here — passed by reference, so setting a key inside the function changes the caller\'s dictionary to <b>{"k": 1}</b>.' },
    ],
  },
};

/* ------------------------------------------------------------- GAME 5: RECURSION */
const REC_LEVELS = {
  beginner: {
    fnName: 'countdown(4)',
    code: ['def countdown(n):', '    if n == 0:', '        print("Liftoff!")', '        return', '    countdown(n - 1)   # ask forward FIRST', '    print(n)            # ...print only after that returns', '', 'countdown(4)'],
    question: 'What gets printed <b>first</b>?',
    opts: ['4', '1', 'Liftoff!'], ans: 2,
    right: '✅ Correct — <b>"Liftoff!"</b> prints first, even though countdown(4) was called first.',
    wrong: '❌ Very natural guess — most people say <b>4</b>. But countdown(4) calls countdown(3) <em>before</em> it reaches its own print line, so it has to wait. The innermost call finishes first.',
    trace: () => {
      const s = [];
      for (let i = 4; i >= 0; i--) s.push({ type: 'call', label: `countdown(${i})`, n: i });
      for (let i = 0; i <= 4; i++) s.push({ type: 'out', label: `countdown(${i})`, text: i === 0 ? 'Liftoff!' : String(i) });
      return s;
    },
    done: 'Printed order is the exact reverse of the call order — the stack unwinding, just like answers coming back up the cinema row.',
  },
  intermediate: {
    fnName: 'factorial(4)',
    code: ['def factorial(n):', '    if n <= 1:', '        return 1        # base case', '    return n * factorial(n - 1)', '', 'print(factorial(4))'],
    question: 'What does <code>factorial(4)</code> return?',
    opts: ['10', '24', '4'], ans: 1,
    right: '✅ Correct — <b>24</b>. It multiplies on the way <em>back up</em>: 4 × 3 × 2 × 1.',
    wrong: '❌ Not quite — it is <b>24</b>. A common wrong answer is 10, which is what you get if you <em>add</em> instead of multiply. Step through it below and watch each return value get multiplied on the way back.',
    trace: () => {
      const s = [];
      for (let i = 4; i >= 1; i--) s.push({ type: 'call', label: `factorial(${i})`, n: i });
      let acc = 1;
      for (let i = 1; i <= 4; i++) { acc = i <= 1 ? 1 : acc * i; s.push({ type: 'out', label: `factorial(${i})`, text: `returns ${acc}` }); }
      return s;
    },
    done: 'Nothing multiplies on the way down — every call just waits. All the work happens as the calls return, innermost first.',
  },
  pro: {
    fnName: 'fib(5)',
    code: ['def fib(n):', '    if n < 2:', '        return n', '    return fib(n - 1) + fib(n - 2)', '', 'print(fib(5))'],
    question: 'How many times does <code>fib</code> get called in total for <code>fib(5)</code>?',
    opts: ['5', '15', '25'], ans: 1,
    right: '✅ Correct — <b>15 calls</b> for a result of just 5. Two recursive calls per level means the work doubles at every step.',
    wrong: '❌ It is <b>15</b>. This is the trap: because the function calls itself <em>twice</em>, the call count grows exponentially, not linearly. fib(5) needs 15 calls; fib(30) needs over 2.6 million.',
    trace: () => {
      const s = [];
      (function go(n) {
        s.push({ type: 'call', label: `fib(${n})`, n });
        if (n < 2) { s.push({ type: 'out', label: `fib(${n})`, text: `returns ${n}` }); return n; }
        const a = go(n - 1), b = go(n - 2);
        s.push({ type: 'out', label: `fib(${n})`, text: `returns ${a + b}` });
        return a + b;
      })(5);
      return s;
    },
    done: 'Look how many times the same small values were recomputed. That waste is exactly what memoization removes — you will meet it properly in Module 7.',
  },
};

/* --------------------------------------------------------------- FINAL QUIZZES */
const QUIZ_LEVELS = {
  beginner: [
    { q: 'What is the index of the FIRST item in an array?', opts: ['1', '0', 'It depends'], ans: 1,
      why: 'Almost every language starts at 0. arr[0] is the first item — think of it as "0 boxes away from the start."' },
    { q: '"for i in range(5)" — how many times does the body run?', opts: ['4 times', '5 times, with i = 0,1,2,3,4', '6 times'], ans: 1,
      why: 'range(5) produces 0, 1, 2, 3, 4 — five values, stopping before 5.' },
    { q: 'To swap two variables x and y, why do you need a third variable?', opts: ['You don\'t, x = y then y = x works fine', 'Because the first assignment overwrites x, destroying its value before you can use it', 'Because languages require three variables'], ans: 1,
      why: 'Once x = y runs, x\'s old value is gone. temp parks that value safely first.' },
    { q: 'What does a function\'s "return value" mean?', opts: ['The input you gave it', 'The name of the function', 'The result it hands back after it finishes'], ans: 2,
      why: 'Return sends a value back to whoever called the function, so the rest of the program can use it.' },
    { q: 'What is a "base case" in recursion?', opts: ['The first line of the function', 'The condition that stops it calling itself again', 'A kind of error'], ans: 1,
      why: 'It is the person in row 1 — the one who can answer without asking anyone else. Without it, the calls never stop.' },
    { q: 'In most languages, what is the difference between = and ==?', opts: ['No difference', '= stores a value; == asks whether two values are equal', '== is a typo for ='], ans: 1,
      why: 'x = 5 puts 5 into x. x == 5 asks "is x currently 5?" and changes nothing.' },
  ],
  intermediate: [
    { q: 'What does <code>arr[-1]</code> give you?', opts: ['An error', 'The last item', 'The first item'], ans: 1,
      why: 'Negative indexes count backwards from the end, so -1 is the last item — a shortcut that avoids needing len(arr).' },
    { q: 'A loop nested inside another: outer runs 3 times, inner runs 4. How many times does the inner body run?', opts: ['7', '12', '4'], ans: 1,
      why: 'Nested loops multiply: 3 × 4 = 12. This multiplying is exactly why an O(n) algorithm becomes O(n²) once you nest it.' },
    { q: 'What is the difference between <code>break</code> and <code>continue</code>?', opts: ['They are the same', 'break exits the loop entirely; continue skips to the next pass', 'break skips one pass; continue exits the loop'], ans: 1,
      why: 'break abandons the whole loop. continue abandons only the current pass and carries on with the next one.' },
    { q: 'Swapping two variables using <code>x = x + y</code> arithmetic — what is the risk?', opts: ['There is none, it is always better', 'It loses precision with decimals, and breaks if both sides are the same variable', 'It only works on strings'], ans: 1,
      why: 'Adding and subtracting decimals introduces rounding error, so the value comes back subtly wrong. And swapping a variable with itself zeroes it.' },
    { q: 'In <code>grade(score)</code> with <code>if score >= 90 ... elif score >= 75</code>, what does a score of exactly 90 return?', opts: ['A', 'B', 'An error'], ans: 0,
      why: '>= means "greater than OR equal", so 90 satisfies the first test and returns "A". Boundary values are where off-by-one bugs hide.' },
  ],
  pro: [
    { q: 'You pass a list to a function and the function calls <code>.append()</code> on it. Does the caller see the change?', opts: ['Yes — lists are passed by reference', 'No — the function gets a copy', 'Only if you return it'], ans: 0,
      why: 'Both names point at the same list in memory, so mutating it inside the function is visible outside.' },
    { q: 'Inside a function you write <code>lst = [9, 9]</code>. Does the caller\'s list change?', opts: ['Yes, same as append', 'No — that rebinds the local name to a new list', 'It raises an error'], ans: 1,
      why: 'Mutating (.append) and reassigning (=) are different. Reassigning points the local name at a new object and leaves the original untouched.' },
    { q: 'Why is the XOR swap trick dangerous in real code?', opts: ['It is slower to type', 'It zeroes the value if both sides are the same variable, and truncates decimals', 'It only works in C'], ans: 1,
      why: 'x ^ x is 0, so swap(arr[i], arr[j]) destroys data when i equals j. It also only works on integers. Compilers optimise the plain temp swap perfectly anyway.' },
    { q: 'You remove items from a list while looping over that same list. What happens?', opts: ['Nothing unusual', 'Some items get skipped, because removing shifts everything left', 'The program always crashes'], ans: 1,
      why: 'The index keeps advancing while the list shrinks underneath it, so items slide into slots the loop has already passed. Loop over a copy instead.' },
    { q: 'Naive recursive <code>fib(n)</code> calls itself twice per level. How does the number of calls grow?', opts: ['Linearly with n', 'Exponentially — roughly doubling per step', 'It stays constant'], ans: 1,
      why: 'Each call spawns two more, so the call tree doubles at every level. fib(5) takes 15 calls; fib(30) takes over 2.6 million. Memoization collapses it back to linear.' },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEVELS, LEVEL_META, SWAP_LEVELS, SWAP_VERDICT_NOTE, LOCKER_VALUES, LOCKER_LEVELS, LOOP_LEVELS, FN_LEVELS, REC_LEVELS, QUIZ_LEVELS };
}
