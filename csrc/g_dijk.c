#define N 100
#define INF 1000000000
int w[N][N], n;          // w[a][b] = edge weight, 0 means no edge

void dijkstra(int start, int dist[]) {
    int settled[N] = {0};
    for (int i = 0; i < n; i++) dist[i] = INF;
    dist[start] = 0;
    for (int step = 0; step < n; step++) {
        int node = -1;                    // pick the closest unsettled city
        for (int i = 0; i < n; i++)
            if (!settled[i] && (node == -1 || dist[i] < dist[node])) node = i;
        if (node == -1 || dist[node] == INF) break;
        settled[node] = 1;                // its distance is now FINAL
        for (int next = 0; next < n; next++)
            if (w[node][next] && dist[node] + w[node][next] < dist[next])
                dist[next] = dist[node] + w[node][next];   // relax the edge
    }
}
