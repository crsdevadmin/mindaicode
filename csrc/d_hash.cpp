#include <unordered_map>
#include <string>
using namespace std;

unordered_map<string,int> table;   // hashing, already done for you
table["ravi"] = 42;                // average O(1) insert
int marks = table["ravi"];         // average O(1) lookup
bool here = table.count("asha");   // is this key present?
table.erase("ravi");
// collisions are handled internally by chaining - you never see them
