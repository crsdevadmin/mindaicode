#!/usr/bin/env python3
"""C++ STL fragments are statement sequences, not whole files. Hoist their
   #include / using / typedef lines and compile the rest inside main()."""
import subprocess, sys, os
FRAGS = ['d_stack.cpp','d_queue.cpp','d_list.cpp','d_hash.cpp','d_bst.cpp','d_heap.cpp']
fail = 0
for f in FRAGS:
    head, body = [], []
    for ln in open(f).read().splitlines():
        (head if ln.startswith(('#include','using ','typedef ')) else body).append(ln)
    prog = '\n'.join(head) + '\nint main() {\n' + '\n'.join(body) + '\n return 0;\n}\n'
    open('_frag_' + f, 'w').write(prog)
    r = subprocess.run(['g++','-std=c++17','-Wall','-Wextra',
                        '-Wno-unused-variable','-Wno-unused-but-set-variable',
                        '-o','/dev/null','_frag_'+f], capture_output=True, text=True)
    if r.returncode:
        fail += 1; print('  !! ' + f + ' DOES NOT COMPILE\n' + r.stderr[:900])
    else:
        print('  clean ' + f + ' (compiles as real C++ inside main)')
sys.exit(1 if fail else 0)
