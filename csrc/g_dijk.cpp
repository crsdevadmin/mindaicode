#include <vector>
#include <queue>
#include <climits>
using namespace std;
typedef pair<int,int> Edge;      // (weight, node)

vector<int> dijkstra(vector<vector<Edge>>& graph, int start) {
    vector<int> dist(graph.size(), INT_MAX);
    priority_queue<Edge, vector<Edge>, greater<Edge>> pq;   // min-heap
    dist[start] = 0; pq.push({0, start});
    while (!pq.empty()) {
        auto [d, node] = pq.top(); pq.pop();
        if (d > dist[node]) continue;        // a stale, worse copy - skip it
        for (auto [weight, next] : graph[node])
            if (d + weight < dist[next]) {
                dist[next] = d + weight;     // relax the edge
                pq.push({dist[next], next});
            }
    }
    return dist;
}
