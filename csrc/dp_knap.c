// dp[i][c] = best value using the first i items with capacity c
int knapsack(int weight[], int value[], int n, int capacity) {
    int dp[64][64] = {{0}};
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= capacity; c++) {
            if (weight[i-1] > c) {
                dp[i][c] = dp[i-1][c];       // item doesn't fit, skip it
            } else {
                int take = dp[i-1][c - weight[i-1]] + value[i-1];
                int skip = dp[i-1][c];
                dp[i][c] = take > skip ? take : skip;   // C has no max()
            }
        }
    }
    return dp[n][capacity];
}
