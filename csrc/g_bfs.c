#define N 100
int graph[N][N], n;      // adjacency matrix: graph[a][b] = 1 means an edge

int bfs(int start, int order[]) {
    int visited[N] = {0}, queue[N];
    int front = 0, rear = 0, k = 0;
    visited[start] = 1;
    queue[rear++] = start;
    while (front < rear) {
        int node = queue[front++];      // FIFO - oldest discovered first
        order[k++] = node;
        for (int next = 0; next < n; next++) {
            if (graph[node][next] && !visited[next]) {
                visited[next] = 1;      // mark WHEN you enqueue, not later
                queue[rear++] = next;
            }
        }
    }
    return k;
}
