#include <stack>
using namespace std;

stack<int> s;
s.push(7);           // add on top
int top = s.top();   // look at the top WITHOUT removing it
s.pop();             // remove the top - note: pop() returns nothing!
bool empty = s.empty();
