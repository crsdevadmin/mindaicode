#include <vector>
#include <queue>
using namespace std;

vector<int> bfs(vector<vector<int>>& graph, int start) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;                     // the STL queue does the work
    vector<int> order;
    visited[start] = true; q.push(start);
    while (!q.empty()) {
        int node = q.front(); q.pop();
        order.push_back(node);
        for (int next : graph[node])            // range-for over neighbours
            if (!visited[next]) { visited[next] = true; q.push(next); }
    }
    return order;
}
