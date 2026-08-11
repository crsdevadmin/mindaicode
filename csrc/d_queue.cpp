#include <queue>
using namespace std;

queue<int> q;
q.push(5);              // enqueue: join the rear
int front = q.front();  // who is being served right now
q.pop();                // dequeue: the front person leaves
