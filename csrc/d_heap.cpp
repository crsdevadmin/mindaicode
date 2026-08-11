#include <queue>
#include <vector>
using namespace std;

// greater<int> makes it a MIN-heap; the default is a max-heap
priority_queue<int, vector<int>, greater<int>> heap;
heap.push(30);              // O(log n) insert
int smallest = heap.top();  // O(1) peek at the minimum
heap.pop();                 // O(log n) extract-min
