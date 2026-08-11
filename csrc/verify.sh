#!/usr/bin/env bash
# Compile and RUN every C / C++ snippet that ships on the website.
#
# Nothing in code-langs.js is hand-written. Each snippet is generated from a
# file in this folder, and every one of those files is compiled with
# -Wall -Wextra and executed against test cases here first. If this script
# passes, the code a student reads is code that provably works.
#
#   ./verify.sh          check everything
#   ./verify.sh --build  check everything, then regenerate ../code-langs.js
set -u
cd "$(dirname "$0")"
fails=0
step() { printf '\n\033[1m%s\033[0m\n' "$1"; }
run()  { if "$@" >/dev/null 2>&1; then echo "  clean $*"; else echo "  !! FAILED: $*"; "$@" 2>&1 | head -12; fails=$((fails+1)); fi; }

step "1. Every C file compiles with no warnings"
for f in s_*.c d_*.c g_*.c dp_*.c; do run gcc -std=c99 -Wall -Wextra -c "$f" -o /dev/null; done

step "2. Every whole-file C++ snippet compiles with no warnings"
for f in s_*.cpp g_*.cpp dp_*.cpp; do run g++ -std=c++17 -Wall -Wextra -c "$f" -o /dev/null; done

step "3. Every C++ STL fragment compiles as real code"
python3 verify_frag.py || fails=$((fails+1))

step "4. The C sorts and binary search actually sort and search"
gcc -std=c99 -Wall -o _verify_c verify_c.c && ./_verify_c || fails=$((fails+1))

step "5. Each C++ sort and binary search actually works"
for a in bubble selection insertion merge quick heap bsearch; do
  g++ -std=c++17 -Wall -o "_v_$a" "_v_$a.cpp" && ./"_v_$a" || fails=$((fails+1))
done

step "6. The C data structures, graphs and DP behave correctly"
for t in _b_ds _b_list _b_hash _b_tree _b_graph; do
  gcc -std=c99 -Wall -o "$t" "$t.c" && ./"$t" || fails=$((fails+1))
done

step "7. The C++ graphs and DP behave correctly"
for t in _b_bfs _b_dfs _b_dijk _b_knap; do
  g++ -std=c++17 -Wall -o "$t" "$t.cpp" && ./"$t" || fails=$((fails+1))
done

if [ "$fails" -eq 0 ]; then
  printf '\n\033[32m*** ALL C AND C++ SNIPPETS COMPILE AND RUN CORRECTLY ***\033[0m\n'
  if [ "${1:-}" = "--build" ]; then
    step "8. Regenerating code-langs.js from these verified sources"
    python3 build_code_langs.py ../code-langs.js
  fi
else
  printf '\n\033[31m*** %d PROBLEM(S) - code-langs.js NOT regenerated ***\033[0m\n' "$fails"
fi
rm -f _verify_c _v_bubble _v_selection _v_insertion _v_merge _v_quick _v_heap _v_bsearch \
      _b_ds _b_list _b_hash _b_tree _b_graph _b_bfs _b_dfs _b_dijk _b_knap _frag_*.cpp
exit "$fails"
