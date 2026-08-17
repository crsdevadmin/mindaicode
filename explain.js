/* MindAICode — the line decoder.
 *
 * The wall for a beginner is not the loop. It is the line. `total = total + arr[i]`
 * packs five ideas into twenty characters: "=" means put-into rather than equals,
 * the right side runs first, arr[i] is a lookup, i changes every pass, and the
 * same name sits on both sides — which in maths would be nonsense.
 *
 * So: tap any line and it comes apart into labelled pieces, with a plain-English
 * reading of the whole thing. Nothing here calls out to a server; every
 * explanation is written down and tested (see csrc/explaintest.js).
 */

window.MINDAICODE_EXPLAIN = (function () {
  'use strict';

  /* ---------------------------------------------------------------- glossary
     Meanings for single tokens. Used to label chunks and to answer a tap on a
     bare word. Written for someone who has never programmed. */
  const GLOSSARY = {
    '=':   'put into — NOT "equals". The right side is worked out first, then stored on the left.',
    '==':  'is this the same as that? Asks a question, gives back true or false.',
    '!=':  'is this NOT the same as that?',
    '<':   'is less than',
    '>':   'is greater than',
    '<=':  'is less than or equal to',
    '>=':  'is greater than or equal to',
    '+':   'add (or, for text and lists, join together)',
    '-':   'subtract',
    '*':   'multiply',
    '/':   'divide',
    '//':  'divide and throw away the remainder',
    '%':   'the REMAINDER after dividing. 7 % 2 is 1. Mostly used to test odd/even.',
    '^':   'bitwise XOR — a bit-by-bit trick, not "to the power of"',
    ':':   'everything indented below this line belongs to it',
    'for': 'do the lines below once for each value',
    'in':  'taking each value from',
    'while': 'keep repeating for as long as this stays true',
    'if':  'only do the lines below when this is true',
    'elif': 'otherwise, if THIS is true instead',
    'else': 'otherwise, when none of the above were true',
    'def': 'define a function — describe it now, run it later',
    'return': 'send an answer back to whoever called this function, and stop here',
    'break': 'leave the loop immediately, no more passes',
    'continue': 'skip the rest of THIS pass and start the next one',
    'True': 'the value true',
    'False': 'the value false',
    'None': 'nothing / no value at all',
    'and': 'both sides must be true',
    'or':  'either side being true is enough',
    'not': 'flips true to false and false to true',
    'len': 'how many items are in it',
    'range': 'a run of whole numbers, starting at 0 unless told otherwise',
    'print': 'show this on the screen',
    'append': 'add onto the end of a list',
    'remove': 'take the first matching item out of a list',
  };

  /* ------------------------------------------------------------------ helpers */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const b = s => '<b>' + esc(s) + '</b>';

  /* Pull a trailing #comment off, but never one inside quotes. */
  function splitComment(line) {
    let inS = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inS) { if (c === inS && line[i - 1] !== '\\') inS = null; }
      else if (c === '"' || c === "'") inS = c;
      else if (c === '#') return [line.slice(0, i).replace(/\s+$/, ''), line.slice(i)];
    }
    return [line, null];
  }

  const NAME = '[A-Za-z_]\\w*';

  /* Label a value by what it actually looks like, rather than a vague "this". */
  function describeValue(v) {
    v = String(v).trim();
    var m = /^([A-Za-z_]\w*)\s*\[\s*(.+?)\s*\]$/.exec(v);
    if (m) return 'the item in ' + m[1] + ' at position ' + m[2];
    if (/^-?\d+$/.test(v)) return 'the number ' + v;
    if (/^["'].*["']$/.test(v)) return 'this exact text, letter for letter';
    if (/^(True|False)$/.test(v)) return 'the value ' + v.toLowerCase();
    if (/^[A-Za-z_]\w*$/.test(v)) return 'whatever ' + v + ' is holding';
    if (/^[A-Za-z_]\w*\s*\(/.test(v)) return 'the answer that ' + v.split('(')[0] + '() gives back';
    return 'this worked out first';
  }

  /* -------------------------------------------------------------------- rules
     Ordered — the first match wins, so put the specific ones first.
     chunks : the line broken into tappable pieces, each with a label
     reading: the whole line said in plain words
     deeper : the "I still don't get it" answer — a different angle, not a repeat */
  const RULES = [

    /* ---- the tuple swap, before plain assignment can grab it ---- */
    { id: 'swap2',
      re: new RegExp('^(' + NAME + '(?:\\[[^\\]]*\\])?)\\s*,\\s*(' + NAME + '(?:\\[[^\\]]*\\])?)\\s*=\\s*(\\2)\\s*,\\s*(\\1)$'),
      chunks: m => [
        { t: m[1], l: 'this one', k: 'name' }, { t: ',', l: 'and', k: 'op' },
        { t: m[2], l: 'that one', k: 'name' },
        { t: '=', l: 'both get new values at once', k: 'op' },
        { t: m[3], l: 'that one\'s OLD value', k: 'name' }, { t: ',', l: 'and', k: 'op' },
        { t: m[4], l: 'this one\'s OLD value', k: 'name' },
      ],
      reading: m => `Swap ${b(m[1])} and ${b(m[2])} in one go.`,
      deeper: m => `Python works out the whole right-hand side <i>first</i>, holding both old values, and only then stores them. That is why it does not need a temporary variable, and why the two names can appear on both sides safely.`
    },

    /* ---- building a value up from itself ---- */
    { id: 'accumulate',
      re: new RegExp('^(' + NAME + ')\\s*=\\s*\\1\\s*([-+*/^%])\\s*(.+)$'),
      chunks: m => [
        { t: m[1], l: 'the box being filled up', k: 'name' },
        { t: '=', l: 'put into', k: 'op' },
        { t: m[1], l: 'what it holds RIGHT NOW', k: 'name' },
        { t: m[2], l: GLOSSARY[m[2]] || 'combine with', k: 'op' },
        { t: m[3], l: describeValue(m[3]), k: 'value' },
      ],
      reading: m => `Take what ${b(m[1])} is holding right now, ${(({'+':'add','-':'subtract','*':'multiply by','/':'divide by','%':'take the remainder with','^':'XOR with'})[m[2]])} ${b(m[3])}, and put the answer back into ${b(m[1])}.`,
      deeper: m => `The same name on both sides looks wrong, but this is not a maths equation — it is an instruction. Read it right-to-left: work out <code>${esc(m[1] + ' ' + m[2] + ' ' + m[3])}</code> first, then overwrite ${b(m[1])} with the result. The old value is gone.`
    },

    /* ---- lists and dicts ---- */
    { id: 'listlit',
      re: new RegExp('^(' + NAME + ')\\s*=\\s*\\[(.*)\\]$'),
      chunks: m => [
        { t: m[1], l: 'the name for the whole row', k: 'name' },
        { t: '=', l: 'put into', k: 'op' },
        { t: '[' + m[2] + ']', l: m[2].trim() ? 'a row of ' + m[2].split(',').length + ' items, in this order' : 'an EMPTY row, ready to be filled', k: 'value' },
      ],
      reading: m => m[2].trim()
        ? `Make a row of ${b(m[2].split(',').length)} items and call the whole row ${b(m[1])}. The first item sits at position <b>0</b>, not 1.`
        : `Make an ${b('empty')} row called ${b(m[1])}. It has nothing in it yet — things get added later.`,
      deeper: m => `The square brackets mean "a list". Later, <code>${esc(m[1])}[0]</code> gets the first item out of it. Counting from 0 is the single most common thing beginners trip over.`
    },
    { id: 'dictlit',
      re: new RegExp('^(' + NAME + ')\\s*=\\s*\\{\\s*\\}$'),
      chunks: m => [
        { t: m[1], l: 'the name', k: 'name' },
        { t: '=', l: 'put into', k: 'op' },
        { t: '{}', l: 'an empty label-and-value store', k: 'value' },
      ],
      reading: m => `Make an empty ${b('dictionary')} called ${b(m[1])} — a store where each value is filed under a label instead of a number.`,
      deeper: () => `A list finds things by position (<code>0, 1, 2</code>). A dictionary finds them by name (<code>"marks"</code>). Curly braces mean dictionary; square brackets mean list.`
    },
    { id: 'dictset',
      re: new RegExp('^(' + NAME + ')\\[([^\\]]+)\\]\\s*=\\s*(.+)$'),
      chunks: m => [
        { t: m[1], l: 'the store', k: 'name' },
        { t: '[' + m[2] + ']', l: 'filed under this label', k: 'index' },
        { t: '=', l: 'put into', k: 'op' },
        { t: m[3], l: describeValue(m[3]), k: 'value' },
      ],
      reading: m => `Store the value ${b(m[3])} inside ${b(m[1])}, filed under the label ${b(m[2])}. Later you fetch it back by asking for that same label rather than a position number.`,
      deeper: m => `If that label already existed, its old value is replaced. Nothing warns you — this is how data quietly gets overwritten.`
    },

    /* ---- for loops ---- */
    { id: 'forRangeLenMinus',
      re: new RegExp('^for\\s+(' + NAME + ')\\s+in\\s+range\\(\\s*len\\(\\s*(' + NAME + ')\\s*\\)\\s*-\\s*(\\d+)\\s*\\)\\s*:$'),
      chunks: m => [
        { t: 'for', l: 'do the lines below once for each value', k: 'kw' },
        { t: m[1], l: 'the counter — a different value every pass', k: 'name' },
        { t: 'in', l: 'taking each value from', k: 'kw' },
        { t: 'range(len(' + m[2] + ') - ' + m[3] + ')', l: 'stops ' + m[3] + ' early — the last item is never reached', k: 'call' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => `Do the indented lines once for each item in ${b(m[2])} — <b>except the last ${m[3]}</b>. ${b(m[1])} counts 0, 1, 2 and so on, but stops ${m[3]} short.`,
      deeper: m => `<code>len(${esc(m[2])})</code> is how many items there are. Subtracting ${m[3]} means the loop finishes early, so the final item is never touched. Sometimes that is a deliberate trick; often it is a bug.`
    },
    { id: 'forRangeLen',
      re: new RegExp('^for\\s+(' + NAME + ')\\s+in\\s+range\\(\\s*len\\(\\s*(' + NAME + ')\\s*\\)\\s*\\)\\s*:$'),
      chunks: m => [
        { t: 'for', l: 'do the lines below once for each value', k: 'kw' },
        { t: m[1], l: 'the counter — 0, then 1, then 2 ...', k: 'name' },
        { t: 'in', l: 'taking each value from', k: 'kw' },
        { t: 'range(len(' + m[2] + '))', l: 'one number for every item in ' + m[2], k: 'call' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => `Do the indented lines once for every item in ${b(m[2])}. ${b(m[1])} is the position: 0 first, then 1, then 2 — never the count itself.`,
      deeper: m => `Read it inside-out. <code>len(${esc(m[2])})</code> gives the number of items, say 3. <code>range(3)</code> gives 0, 1, 2. So ${b(m[1])} visits every valid position exactly once, and there is no position 3.`
    },
    { id: 'forRangeStep',
      re: new RegExp('^for\\s+(' + NAME + ')\\s+in\\s+range\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\\s*:$'),
      chunks: m => [
        { t: 'for', l: 'do the lines below once for each value', k: 'kw' },
        { t: m[1], l: 'the counter', k: 'name' },
        { t: 'in', l: 'taking each value from', k: 'kw' },
        { t: 'range(' + m[2] + ', ' + m[3] + ', ' + m[4] + ')', l: 'start at ' + m[2] + ', stop BEFORE ' + m[3] + ', jump ' + m[4] + ' at a time', k: 'call' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => {
        const vals = []; for (let v = +m[2]; v < +m[3]; v += +m[4]) vals.push(v);
        return `Start ${b(m[1])} at ${b(m[2])}, add ${b(m[4])} each pass, and stop before ${b(m[3])}. So ${b(m[1])} takes the values ${b(vals.join(', '))} — that is ${b(vals.length)} passes.`;
      },
      deeper: m => `The three numbers are <b>start</b>, <b>stop</b> and <b>step</b>. The stop value is never included — the loop ends the moment it would reach or pass it.`
    },
    { id: 'forRange',
      re: new RegExp('^for\\s+(' + NAME + ')\\s+in\\s+range\\(\\s*(\\d+)\\s*\\)\\s*:$'),
      chunks: m => [
        { t: 'for', l: 'do the lines below once for each value', k: 'kw' },
        { t: m[1], l: 'the counter', k: 'name' },
        { t: 'in', l: 'taking each value from', k: 'kw' },
        { t: 'range(' + m[2] + ')', l: 'the ' + m[2] + ' numbers 0 to ' + (+m[2] - 1) + ' — never ' + m[2] + ' itself', k: 'call' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => {
        const n = +m[2];
        const list = n <= 6 ? Array.from({ length: n }, (_, k) => k).join(', ') : '0, 1, 2 ... ' + (n - 1);
        return `Do the indented lines ${b(n)} times. Each pass ${b(m[1])} is the next value: ${b(list)}. It stops <b>before</b> ${m[2]}, so ${b(m[1])} is never ${m[2]}.`;
      },
      deeper: m => `Counting from 0 is why <code>range(${esc(m[2])})</code> runs ${m[2]} times but the last value is ${+m[2] - 1}. Count the values on your fingers once and it sticks: that really is ${m[2]} of them.`
    },
    { id: 'forEach',
      re: new RegExp('^for\\s+(' + NAME + ')\\s+in\\s+(' + NAME + ')\\s*:$'),
      chunks: m => [
        { t: 'for', l: 'do the lines below once for each item', k: 'kw' },
        { t: m[1], l: 'holds the ITEM itself, not its position', k: 'name' },
        { t: 'in', l: 'taking each item from', k: 'kw' },
        { t: m[2], l: 'this list', k: 'name' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => `Go through ${b(m[2])} one item at a time. Each pass, ${b(m[1])} <b>is</b> the item — the actual value, not a position number.`,
      deeper: m => `This is the difference between <code>for x in a</code> and <code>for i in range(len(a))</code>. The first gives you the values; the second gives you the positions and you look the values up yourself with <code>a[i]</code>.`
    },

    /* ---- while ---- */
    { id: 'while',
      re: new RegExp('^while\\s+(.+?)\\s*:$'),
      chunks: m => [
        { t: 'while', l: 'keep repeating for as long as', k: 'kw' },
        { t: m[1], l: 'this stays true — checked BEFORE every pass', k: 'value' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => `Keep doing the indented lines over and over, for as long as ${b(m[1])} is true. It is checked before each pass, so if it is false at the start the lines never run at all.`,
      deeper: () => `A <code>for</code> loop knows how many passes it will do. A <code>while</code> loop does not — something inside the loop must change the condition, or it runs forever and the program hangs. That mistake is called an infinite loop.`
    },

    /* ---- conditions ---- */
    { id: 'ifMod',
      re: new RegExp('^(if|elif)\\s+(.+?)\\s*%\\s*(\\d+)\\s*==\\s*(\\d+)\\s*:$'),
      chunks: m => [
        { t: m[1], l: GLOSSARY[m[1]], k: 'kw' },
        { t: m[2], l: 'the value being tested', k: 'name' },
        { t: '%', l: GLOSSARY['%'], k: 'op' },
        { t: m[3], l: 'divide by this', k: 'value' },
        { t: '==', l: 'and ask: is the remainder', k: 'op' },
        { t: m[4], l: 'this?', k: 'value' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => (m[3] === '2' && m[4] === '0')
        ? `Divide ${b(m[2])} by 2. If nothing is left over, ${b(m[2])} is ${b('even')} — and then the indented lines run.`
        : `Divide ${b(m[2])} by ${b(m[3])}. If the remainder is exactly ${b(m[4])}, run the indented lines.`,
      deeper: m => `<code>%</code> is not a percentage. It hands back what is left over: 7 % 2 is 1, 8 % 2 is 0. Testing <code>% 2 == 0</code> is the standard way to ask "is this even?"`
    },
    { id: 'ifCmp',
      re: new RegExp('^(if|elif)\\s+(.+?)\\s*(==|!=|<=|>=|<|>)\\s*(.+?)\\s*:$'),
      chunks: m => [
        { t: m[1], l: GLOSSARY[m[1]], k: 'kw' },
        { t: m[2], l: 'this', k: 'name' },
        { t: m[3], l: GLOSSARY[m[3]], k: 'op' },
        { t: m[4], l: describeValue(m[4]), k: 'value' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => {
        const w = { '==': 'is exactly the same as', '!=': 'is not the same as', '<': 'is less than',
                    '>': 'is greater than', '<=': 'is less than or equal to', '>=': 'is greater than or equal to' }[m[3]];
        const lead = m[1] === 'elif' ? 'Only if the earlier tests all failed: check whether' : 'Check whether';
        return `${lead} ${b(m[2])} ${w} ${b(m[4])}. If yes, run the indented lines below. If no, skip them.`;
      },
      deeper: m => m[3] === '=='
        ? `One <code>=</code> stores a value; two <code>==</code> ask a question. Writing <code>=</code> here is one of the most common beginner errors, and Python will refuse to run rather than guess.`
        : `This gives back only true or false. Nothing is stored and nothing is changed — it just decides whether the indented block runs.`
    },
    { id: 'else',
      re: /^else\s*:$/,
      chunks: () => [
        { t: 'else', l: 'when every test above failed', k: 'kw' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: () => `If none of the tests above were true, do the indented lines here instead. This is the catch-all, and it needs no condition of its own.`,
      deeper: () => `Exactly one branch out of the whole if / elif / else group ever runs — never two. Once one matches, the rest are skipped entirely.`
    },

    /* ---- loop escapes ---- */
    { id: 'break',
      re: /^break$/,
      chunks: () => [{ t: 'break', l: 'walk out of the loop right now', k: 'kw' }],
      reading: () => `Leave the loop ${b('immediately')}. No more passes happen, even if there were plenty left to do.`,
      deeper: () => `<code>break</code> abandons the whole loop. <code>continue</code> only abandons the current pass and carries on with the next. Mixing those two up changes the answer completely — that is exactly what the Intermediate rounds test.`
    },
    { id: 'continue',
      re: /^continue$/,
      chunks: () => [{ t: 'continue', l: 'skip the rest of THIS pass only', k: 'kw' }],
      reading: () => `Stop part-way through this pass and jump straight to the next one. The loop itself keeps going.`,
      deeper: () => `Nothing below this line runs for the current value — but the loop is not finished. Compare with <code>break</code>, which ends the loop altogether.`
    },

    /* ---- function definition and calls ---- */
    { id: 'def',
      re: new RegExp('^def\\s+(' + NAME + ')\\s*\\(([^)]*)\\)\\s*:$'),
      chunks: m => [
        { t: 'def', l: 'describe a machine — do not run it yet', k: 'kw' },
        { t: m[1], l: 'the name you will call it by', k: 'call' },
        { t: '(' + m[2] + ')', l: m[2].trim() ? 'what goes IN: ' + m[2] : 'nothing goes in', k: 'value' },
        { t: ':', l: GLOSSARY[':'], k: 'op' },
      ],
      reading: m => m[2].trim()
        ? `Define a function called ${b(m[1])} that takes ${b(m[2])} in. Nothing happens yet — this only describes it. It runs when someone writes <code>${esc(m[1])}(...)</code>.`
        : `Define a function called ${b(m[1])} that takes nothing in. Nothing happens yet; it runs only when called.`,
      deeper: m => `Think of the vending machine from Game 4. <code>def</code> is building the machine and putting a label on it. Calling <code>${esc(m[1])}(...)</code> is putting a coin in. Building it does not dispense anything.`
    },
    { id: 'returnExpr',
      re: /^return\s+(.+)$/,
      chunks: m => [
        { t: 'return', l: 'send this answer back, and stop here', k: 'kw' },
        { t: m[1], l: describeValue(m[1]), k: 'value' },
      ],
      reading: m => `Send ${b(m[1])} back to whoever called this function, and stop the function right here. Any lines after this never run.`,
      deeper: () => `<code>return</code> does two jobs at once: it hands a value back, and it exits the function immediately. Beginners often expect the following lines to run too — they do not.`
    },
    { id: 'returnBare',
      re: /^return$/,
      chunks: () => [{ t: 'return', l: 'stop the function here, with no answer', k: 'kw' }],
      reading: () => `Leave the function now without sending anything back. Used just to stop early.`,
      deeper: () => `A function with no <code>return</code> value still hands something back: <code>None</code>, meaning "nothing". That is why printing the result of such a function shows <code>None</code>.`
    },
    { id: 'method',
      re: new RegExp('^(' + NAME + ')\\.(' + NAME + ')\\(([^)]*)\\)$'),
      chunks: m => [
        { t: m[1], l: 'the thing being changed', k: 'name' },
        { t: '.', l: 'ask it to do something to itself', k: 'op' },
        { t: m[2], l: GLOSSARY[m[2]] || 'this action', k: 'call' },
        { t: '(' + m[3] + ')', l: m[3] ? 'using this' : 'no extra information needed', k: 'value' },
      ],
      reading: m => {
        if (m[2] === 'append') return `Add ${b(m[3])} onto the ${b('end')} of the list ${b(m[1])}, making it one item longer.`;
        if (m[2] === 'remove') return `Take the ${b('first')} item equal to ${b(m[3])} out of the list ${b(m[1])}. Everything after it shuffles left.`;
        return `Ask ${b(m[1])} to run its own ${b(m[2])} action${m[3] ? ' with ' + b(m[3]) : ''}.`;
      },
      deeper: m => m[2] === 'remove'
        ? `This changes ${b(m[1])} itself rather than making a copy — and because everything shuffles left, removing while you are looping over the same list makes the loop skip an item. That is the trap in the Pro round.`
        : `The dot means "belonging to". <code>${esc(m[1])}.${esc(m[2])}(...)</code> is an action that ${b(m[1])} knows how to perform on itself, and it changes ${b(m[1])} in place.`
    },
    { id: 'print',
      re: /^print\((.*)\)$/,
      chunks: m => [
        { t: 'print', l: 'show something on the screen', k: 'call' },
        { t: '(' + m[1] + ')', l: 'this is what gets shown', k: 'value' },
      ],
      reading: m => /^["']/.test(m[1])
        ? `Show the exact text ${b(m[1])} on the screen. Quotes mean "these characters literally".`
        : `Show the current value of ${b(m[1])} on the screen. It does not change anything — it only displays.`,
      deeper: m => /^["']/.test(m[1])
        ? `With quotes you get the letters themselves. Without quotes Python looks for something by that name and shows its value instead. That one difference causes a lot of confusion early on.`
        : `<code>print</code> is how you see inside a running program. When you cannot work out what your code is doing, adding a print is the oldest and still one of the best debugging tools.`
    },
    { id: 'call',
      re: new RegExp('^(' + NAME + ')\\(([^)]*)\\)$'),
      chunks: m => [
        { t: m[1], l: 'run this function now', k: 'call' },
        { t: '(' + m[2] + ')', l: m[2] ? 'giving it ' + m[2] : 'giving it nothing', k: 'value' },
      ],
      reading: m => `Run the function ${b(m[1])}${m[2] ? `, handing it ${b(m[2])}` : ''}. Everything inside it happens now, then we carry on from here.`,
      deeper: m => `Control jumps into ${b(m[1])}, runs it to the end (or to a <code>return</code>), then comes back to this exact spot. If ${b(m[1])} calls itself, that is recursion — see Game 5.`
    },

    /* ---- copying one variable into another: THE line the swap game turns on ---- */
    { id: 'copyVar',
      re: new RegExp('^(' + NAME + ')\\s*=\\s*(' + NAME + ')$'),
      chunks: m => [
        { t: m[1], l: 'gets overwritten — whatever was here is LOST', k: 'name' },
        { t: '=', l: 'copy into', k: 'op' },
        { t: m[2], l: 'the source — this one does NOT change', k: 'name' },
      ],
      reading: m => `Copy whatever ${b(m[2])} is holding into ${b(m[1])}. ${b(m[2])} is left exactly as it was — but whatever ${b(m[1])} used to hold is now <b>gone</b>.`,
      deeper: m => `This one line is why swapping two values needs a third variable. The moment you write <code>${esc(m[1] + ' = ' + m[2])}</code>, the old contents of ${b(m[1])} are overwritten and cannot be recovered. If you still needed that value, you had to copy it somewhere safe first — which is exactly the job of <code>temp</code> in Game 1.`
    },

    /* ---- plain assignment, last so the specific rules get first refusal ---- */
    { id: 'assignIndex',
      re: new RegExp('^(' + NAME + ')\\[([^\\]]+)\\]\\s*=\\s*(.+)$'),
      chunks: m => [
        { t: m[1], l: 'the row', k: 'name' },
        { t: '[' + m[2] + ']', l: 'the slot at position ' + m[2], k: 'index' },
        { t: '=', l: 'put into', k: 'op' },
        { t: m[3], l: describeValue(m[3]), k: 'value' },
      ],
      reading: m => `Put ${b(m[3])} into slot ${b(m[2])} of ${b(m[1])}, replacing whatever was there.`,
      deeper: m => `The old value at that slot is gone for good. And if position ${esc(m[2])} does not exist, the program stops with an "index out of range" error rather than growing the list.`
    },
    { id: 'assignExpr',
      re: new RegExp('^(' + NAME + ')\\s*=\\s*(.+)$'),
      chunks: m => [
        { t: m[1], l: 'the name — the label on the jar', k: 'name' },
        { t: '=', l: GLOSSARY['='], k: 'op' },
        { t: m[2], l: 'worked out FIRST, then stored', k: 'value' },
      ],
      reading: m => /^-?\d+$/.test(m[2].trim())
        ? `Put the number ${b(m[2])} into ${b(m[1])}. From now on, ${b(m[1])} means ${b(m[2])} until something changes it.`
        : `Work out ${b(m[2])}, then store the result in ${b(m[1])}.`,
      deeper: m => `Remember the jar from Game 1: ${b(m[1])} is the label, and ${b(m[2])} is what goes inside. The label stays put; the contents can be swapped out any number of times.`
    },
  ];

  /* ------------------------------------------------------------------ decode */
  function decodeLine(raw) {
    const line = String(raw == null ? '' : raw).replace(/ /g, ' ').replace(/\s+$/, '');
    const indentLen = line.length - line.replace(/^\s+/, '').length;
    const indent = line.slice(0, indentLen);
    const [codePart, comment] = splitComment(line.trim());

    const out = { indent, indentLevel: Math.round(indentLen / 4), chunks: [], reading: '', deeper: '', rule: null, comment: comment };

    if (indentLen > 0) {
      out.chunks.push({
        t: '⇥', k: 'indent',
        l: 'indented — this line is INSIDE the block above it. The spaces are not decoration; they are what tells Python where the block ends.'
      });
    }

    if (!codePart) {
      // a comment-only line
      if (comment) {
        out.rule = 'commentOnly';
        out.chunks.push({ t: comment, l: 'a note for humans', k: 'comment' });
        out.reading = `This whole line is a ${b('comment')}. Python ignores it completely — it is a note left for whoever reads the code.`;
        out.deeper = `Anything after a <code>#</code> is skipped. Comments cost nothing to run and are the cheapest way to make code understandable later.`;
      }
      return out;
    }

    for (const r of RULES) {
      const m = r.re.exec(codePart);
      if (!m) continue;
      out.rule = r.id;
      out.chunks = out.chunks.concat(r.chunks(m));
      out.reading = r.reading(m);
      out.deeper = r.deeper(m);
      break;
    }

    if (!out.rule) {
      // Nothing matched. Say so honestly rather than inventing an explanation.
      out.rule = 'unknown';
      out.chunks.push({ t: codePart, l: 'this line', k: 'value' });
      out.reading = `This line runs <code>${esc(codePart)}</code>.`;
      out.deeper = `Tap the individual words in the code above — most of them have their own explanation.`;
    }

    if (comment) {
      out.chunks.push({ t: comment, l: 'a note for humans — Python ignores this', k: 'comment' });
      out.reading += ` The <code>#</code> part is a note for people; the computer skips it.`;
    }
    return out;
  }

  /* Plain text for the speech synthesiser — no markup, no code punctuation soup. */
  function speakable(html) {
    return String(html)
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, ' less than ').replace(/&gt;/g, ' greater than ').replace(/&amp;/g, ' and ')
      .replace(/==/g, ' is the same as ').replace(/=/g, ' gets ')
      .replace(/\s+/g, ' ').trim();
  }

  return { decodeLine, speakable, GLOSSARY, RULES_COUNT: RULES.length };
})();

/* ------------------------------------------------------------------
   Runtime: make every code line tappable, show the decode underneath,
   offer read-aloud, and leave a clean seam for a real AI tutor.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  // The decoder above must stay usable with no browser at all, so the tests can
  // check every explanation headlessly. Only the UI half needs a document.
  if (typeof document === 'undefined') return;

  var E = window.MINDAICODE_EXPLAIN;
  var VOICE_KEY = 'mai_readaloud';

  var CSS = [
    '.code .line[data-xp]{cursor:pointer;border-radius:4px;transition:background .15s;position:relative;}',
    '.code .line[data-xp]:hover{background:rgba(88,166,255,.14);}',
    '.code .line[data-xp]:focus-visible{outline:2px solid #58a6ff;outline-offset:-2px;}',
    '.code .line[data-xp].xpOpen{background:rgba(88,166,255,.2);box-shadow:inset 3px 0 0 #58a6ff;}',
    '.xpTip{font-size:11.5px;color:#8b949e;font-style:italic;padding:6px 14px 0;}',
    '.xpPanel{display:none;margin-top:10px;background:#1c2333;border:1px solid #30363d;',
    '  border-left:3px solid #58a6ff;border-radius:8px;padding:14px;}',
    '.xpPanel.on{display:block;}',
    '.xpWhat{font-size:11px;font-weight:800;color:#58a6ff;letter-spacing:.6px;margin-bottom:10px;}',
    '.xpChunks{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}',
    '.xpChunk{background:#0d1117;border:1px solid #30363d;border-radius:7px;padding:6px 9px;max-width:200px;}',
    '.xpChunk .xpT{font-family:Consolas,monospace;font-size:13.5px;font-weight:700;display:block;}',
    '.xpChunk .xpL{font-size:10.5px;color:#8b949e;line-height:1.4;display:block;margin-top:3px;}',
    '.xpChunk.k-name .xpT{color:#79c0ff;} .xpChunk.k-op .xpT{color:#ff7b72;}',
    '.xpChunk.k-kw .xpT{color:#ff7b72;} .xpChunk.k-call .xpT{color:#d2a8ff;}',
    '.xpChunk.k-value .xpT{color:#e6edf3;} .xpChunk.k-index .xpT{color:#d29922;}',
    '.xpChunk.k-comment .xpT{color:#6e7681;} .xpChunk.k-indent{border-style:dashed;}',
    '.xpChunk.k-indent .xpT{color:#d29922;}',
    '.xpRead{font-size:14px;line-height:1.7;color:#e6edf3;}',
    '.xpRead b{color:#fff;} .xpRead code{font-family:Consolas,monospace;font-size:12.5px;',
    '  background:rgba(110,118,129,.25);padding:1px 5px;border-radius:4px;}',
    '.xpDeeper{display:none;margin-top:12px;padding-top:12px;border-top:1px dashed #30363d;',
    '  font-size:13.5px;line-height:1.7;color:#8b949e;}',
    '.xpDeeper.on{display:block;} .xpDeeper b{color:#e6edf3;}',
    '.xpBtns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}',
    '.xpBtn{background:#0d1117;color:#8b949e;border:1px solid #30363d;border-radius:7px;',
    '  padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}',
    '.xpBtn:hover{color:#e6edf3;border-color:#58a6ff;}',
    '.xpBtn.on{color:#3fb950;border-color:rgba(63,185,80,.5);}',
    '.xpAsk{display:none;margin-top:12px;}.xpAsk.on{display:block;}',
    '.xpAsk input{width:100%;background:#0d1117;border:1px solid #30363d;color:#e6edf3;',
    '  padding:8px 10px;border-radius:7px;font-size:13px;font-family:inherit;}',
    '.xpAskNote{font-size:11px;color:#8b949e;margin-top:6px;line-height:1.5;}',
    '.xpVoiceBar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;',
    '  color:#8b949e;margin-bottom:12px;}'
  ].join('\n');

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ---------- read aloud ---------- */
  function voiceOn() { try { return localStorage.getItem(VOICE_KEY) === '1'; } catch (e) { return false; } }
  function setVoice(v) { try { localStorage.setItem(VOICE_KEY, v ? '1' : '0'); } catch (e) {} }
  function canSpeak() { return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'; }
  function say(text) {
    if (!canSpeak()) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(E.speakable(text));
      u.rate = 0.95;
      u.lang = 'en-IN';
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- attach to a code block ----------
     The games rewrite these blocks as rounds change, which wipes the handlers,
     so this must be safe to call over and over. It re-attaches only when the
     lines have lost their hooks, and keeps ONE panel per block rather than
     piling up a new one on every render. */
  function attach(codeEl) {
    var real = Array.prototype.slice.call(codeEl.querySelectorAll('.line'))
      .filter(function (l) { return l.textContent.replace(/\s|\u00a0/g, '') !== ''; });
    if (!real.length) return;
    if (real.every(function (l) { return l.dataset.xp === '1'; })) return;

    var host = codeEl.parentNode;
    var tip = null, panel = null;
    Array.prototype.forEach.call(host.children, function (c) {
      if (c.classList && c.classList.contains('xpTip')) tip = c;
      if (c.classList && c.classList.contains('xpPanel')) panel = c;
    });
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'xpTip';
      tip.textContent = '\uD83D\uDC46 Not sure what a line means? Tap it.';
      host.insertBefore(tip, codeEl.nextSibling);
    }
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'xpPanel';
      host.insertBefore(panel, tip.nextSibling);
    } else {
      panel.classList.remove('on');   // the code changed, so any open decode is stale
    }

    real.forEach(function (line) {
      line.dataset.xp = '1';
      line.setAttribute('role', 'button');
      line.setAttribute('tabindex', '0');

      function open() {
        var already = line.classList.contains('xpOpen');
        real.forEach(function (l) { l.classList.remove('xpOpen'); });
        if (already) { panel.classList.remove('on'); return; }
        line.classList.add('xpOpen');

        var src = line.textContent.replace(/ /g, ' ');
        var d = E.decodeLine(src);
        var tutor = window.MINDAICODE_TUTOR || {};

        panel.innerHTML =
          (canSpeak() ? '<div class="xpVoiceBar"><button type="button" class="xpBtn xpSpeak">🔊 Read this aloud</button>' +
            '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;">' +
            '<input type="checkbox" class="xpAuto"' + (voiceOn() ? ' checked' : '') + '> read every line aloud automatically</label></div>' : '') +
          '<div class="xpWhat">WHAT THIS LINE SAYS, PIECE BY PIECE</div>' +
          '<div class="xpChunks">' +
            d.chunks.map(function (c) {
              return '<span class="xpChunk k-' + c.k + '"><span class="xpT">' +
                     c.t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                     '</span><span class="xpL">' + c.l + '</span></span>';
            }).join('') +
          '</div>' +
          '<div class="xpRead">' + d.reading + '</div>' +
          '<div class="xpDeeper">' + d.deeper + '</div>' +
          '<div class="xpBtns">' +
            '<button type="button" class="xpBtn xpMore">🤔 I still don\'t get it</button>' +
            (tutor.ENABLED ? '<button type="button" class="xpBtn xpAskBtn">' + (tutor.BUTTON_LABEL || 'Ask anything') + '</button>' : '') +
            '<button type="button" class="xpBtn xpClose">Close</button>' +
          '</div>' +
          (tutor.ENABLED ? '<div class="xpAsk"><input type="text" class="xpAskIn" maxlength="' +
            (tutor.MAX_QUESTION_CHARS || 300) + '" placeholder="Type your question and press Enter">' +
            '<div class="xpAskNote">' + (tutor.NOTICE || '') + '</div></div>' : '');

        panel.classList.add('on');

        var sp = panel.querySelector('.xpSpeak');
        if (sp) sp.onclick = function () { if (!say(d.reading)) sp.textContent = '🔇 no voice on this device'; };
        var auto = panel.querySelector('.xpAuto');
        if (auto) auto.onchange = function () { setVoice(auto.checked); if (auto.checked) say(d.reading); };

        var more = panel.querySelector('.xpMore');
        more.onclick = function () {
          var dd = panel.querySelector('.xpDeeper');
          dd.classList.toggle('on');
          more.classList.toggle('on', dd.classList.contains('on'));
          more.textContent = dd.classList.contains('on') ? '🤔 hide the longer answer' : '🤔 I still don\'t get it';
          if (dd.classList.contains('on') && voiceOn()) say(d.deeper);
        };
        panel.querySelector('.xpClose').onclick = function () {
          panel.classList.remove('on');
          line.classList.remove('xpOpen');
          line.focus();
        };

        var askBtn = panel.querySelector('.xpAskBtn');
        if (askBtn) {
          var box = panel.querySelector('.xpAsk');
          askBtn.onclick = function () { box.classList.add('on'); box.querySelector('.xpAskIn').focus(); };
          box.querySelector('.xpAskIn').onkeydown = function (ev) {
            if (ev.key !== 'Enter') return;
            var q = ev.target.value.trim();
            if (!q) return;
            var note = box.querySelector('.xpAskNote');
            note.textContent = 'Thinking...';
            window.MINDAICODE_TUTOR.ask(q, { line: src, reading: E.speakable(d.reading) })
              .then(function (a) { note.innerHTML = '<b style="color:#e6edf3">' + a + '</b>'; if (voiceOn()) say(a); })
              .catch(function () {
                note.innerHTML = 'Could not reach the AI tutor. The written explanation above still stands — it was checked by a human.';
              });
          };
        }

        if (voiceOn()) say(d.reading);
      }

      line.onclick = open;
      line.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      };
    });
  }

  var scanning = false;
  function scan() {
    if (scanning) return;          // our own DOM edits must not retrigger us
    scanning = true;
    try { Array.prototype.forEach.call(document.querySelectorAll('.code'), attach); }
    finally { scanning = false; }
  }

  function start() {
    scan();
    if (typeof MutationObserver === 'undefined') return;
    var queued = false;
    var mo = new MutationObserver(function () {
      if (scanning || queued) return;
      queued = true;
      setTimeout(function () { queued = false; scan(); }, 30);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // this file loads before the game engine, so wait for the first render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }

  window.MindAICodeExplainUI = { attach: attach, scan: scan, start: start, say: say, voiceOn: voiceOn, setVoice: setVoice };
})();
