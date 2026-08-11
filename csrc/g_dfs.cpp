#include <vector>
using namespace std;

void dfs(vector<vector<int>>& graph, int node,
         vector<bool>& visited, vector<int>& order) {
    if (visited[node]) return;
    visited[node] = true;
    order.push_back(node);
    for (int next : graph[node])
        dfs(graph, next, visited, order);   // recursion = an implicit stack
}
