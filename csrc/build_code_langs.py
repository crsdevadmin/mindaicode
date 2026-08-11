#!/usr/bin/env python3
"""Generate code-langs.js from the VERIFIED C/C++ sources in this folder.

Every snippet shipped to students is generated from a file that was compiled
with -Wall -Wextra and executed against test cases. Nothing is hand-typed into
the website, so the code on screen cannot drift from the code that was proven.
"""
import re, json, os, sys

SRC = os.path.dirname(os.path.abspath(__file__))

# page file  ->  { panel-id-prefix : source basename }
MAP = {
  'mindaicode-bubble-sort.html':      {'code':  's_bubble'},
  'mindaicode-selection-sort.html':   {'code':  's_selection'},
  'mindaicode-insertion-sort.html':   {'code':  's_insertion'},
  'mindaicode-merge-sort.html':       {'code':  's_merge'},
  'mindaicode-quick-sort.html':       {'code':  's_quick'},
  'mindaicode-heap-sort.html':        {'code':  's_heap'},
  'mindaicode-binary-search.html':    {'code':  's_bsearch'},
  'mindaicode-linear-structures.html':{'stack': 'd_stack', 'queue': 'd_queue', 'list': 'd_list'},
  'mindaicode-hashing.html':          {'hash':  'd_hash'},
  'mindaicode-trees.html':            {'bst':   'd_bst',  'heap':  'd_heap'},
  'mindaicode-graphs.html':           {'bfs':   'g_bfs',  'dfs':   'g_dfs', 'dijk': 'g_dijk'},
  'mindaicode-recursion-dp.html':     {'knap':  'dp_knap'},
}

KEYWORDS = set("""int char float double void long short unsigned signed const static
struct typedef enum union return if else for while do break continue switch case
default sizeof NULL true false bool auto class new delete this public private
protected template typename using namespace nullptr operator inline""".split())

TOKEN = re.compile(
    r'("(?:[^"\\]|\\.)*")'      # 1 double-quoted string
    r"|('(?:[^'\\]|\\.)*')"     # 2 char literal
    r'|(//[^\n]*)'              # 3 line comment
    r'|(\b\d+\b)'               # 4 number
    r'|([A-Za-z_]\w*)'          # 5 identifier
    r'|(\s+)'                   # 6 whitespace
    r'|(.)'                     # 7 anything else
)

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

STR_STYLE = 'style="color:#a5d6ff"'

def highlight(line):
    # preprocessor directives get their own simple treatment
    if line.lstrip().startswith('#'):
        m = re.match(r'^(\s*)(#\w+)(.*)$', line)
        if m:
            rest = esc(m.group(3))
            rest = re.sub(r'(&lt;[^&]*&gt;|&quot;[^&]*&quot;|"[^"]*")',
                          r'<span ' + STR_STYLE + r'>\1</span>', rest)
            return m.group(1) + '<span class="kw">' + esc(m.group(2)) + '</span>' + rest
    out = []
    for m in TOKEN.finditer(line):
        s, c, cm, num, ident, ws, other = m.groups()
        if s or c:
            out.append('<span ' + STR_STYLE + '>' + esc(s or c) + '</span>')
        elif cm:
            out.append('<span class="cm">' + esc(cm) + '</span>')
        elif num:
            out.append('<span class="num num2">' + num + '</span>')
        elif ident:
            if ident in KEYWORDS:
                out.append('<span class="kw">' + ident + '</span>')
            else:
                after = line[m.end():]
                if after[:1] == '(' or (after[:1] == ' ' and after.lstrip()[:1] == '('):
                    out.append('<span class="fn">' + ident + '</span>')
                else:
                    out.append(ident)
        elif ws:
            out.append(ws)
        else:
            out.append(esc(other))
    return ''.join(out)

MARK = re.compile(r'\s*//@(\S*)\s*$')

def build(basename, ext):
    path = os.path.join(SRC, basename + ext)
    raw = open(path).read().splitlines()
    rows, mapped = [], False
    for ln in raw:
        m = MARK.search(ln)
        tag = None
        if m:
            tag = m.group(1)
            ln = ln[:m.start()]
            if tag:
                mapped = True
        rows.append((ln.rstrip(), tag))
    html = []
    for text, tag in rows:
        attr = ''
        if mapped:
            attr = ' data-l="' + (tag or '') + '"'
        body = highlight(text) if text.strip() else '&nbsp;'
        html.append('<div class="line"' + attr + '>' + body + '</div>')
    return ''.join(html)

data = {}
for page, panels in MAP.items():
    data[page] = {}
    for base, src in panels.items():
        data[page][base] = {'c': build(src, '.c'), 'cpp': build(src, '.cpp')}

header = """/* MindAICode - C and C++ for every algorithm.
 *
 * GENERATED FILE - do not edit by hand.
 * Source of truth: csrc/*.c and csrc/*.cpp, regenerate with csrc/build_code_langs.py
 *
 * Every snippet below was compiled with gcc/g++ -Wall -Wextra and executed
 * against test cases before it was generated into this file, so the code a
 * student reads is code that provably compiles and produces correct results.
 */
window.MINDAICODE_CODE = """

runtime = open(os.path.join(SRC, 'runtime.js')).read()
out = header + json.dumps(data, indent=0, sort_keys=True) + ';\n\n' + runtime
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SRC, '..', 'code-langs.js')
open(dest, 'w').write(out)
print('wrote %s  (%d panels, %.1f KB)' %
      (dest, sum(len(v) for v in data.values()), len(out) / 1024.0))
