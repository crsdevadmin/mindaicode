#include <forward_list>
#include <algorithm>
using namespace std;

forward_list<int> list;
list.push_front(9);        // insert at head, O(1)
list.remove(9);            // delete every node holding this value
auto it = find(list.begin(), list.end(), 4);   // O(n) search
// no malloc, no free - the list frees its own nodes
