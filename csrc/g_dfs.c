#define N 100
int graph[N][N], n, visited[N];

void dfs(int node, int order[], int *k) {
    visited[node] = 1;
    order[(*k)++] = node;
    for (int next = 0; next < n; next++)
        if (graph[node][next] && !visited[next])
            dfs(next, order, k);   // go deep first - the call stack IS the stack
}
