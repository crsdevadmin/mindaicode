#include <set>
using namespace std;

set<int> tree;                 // a self-balancing BST, ready-made
tree.insert(50);               // O(log n)
bool found = tree.count(50);   // O(log n)
tree.erase(50);
// iterating a set walks it in sorted order - that IS the inorder traversal
for (int v : tree) { /* ... */ }
