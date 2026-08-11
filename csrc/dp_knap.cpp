#include <vector>
#include <algorithm>
using namespace std;

int knapsack(vector<int>& weight, vector<int>& value, int capacity) {
    int n = weight.size();
    // dp[i][c] = best value using the first i items with capacity c
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= capacity; c++) {
            if (weight[i-1] > c) {
                dp[i][c] = dp[i-1][c];       // item doesn't fit, skip it
            } else {
                dp[i][c] = max(dp[i-1][c],
                               dp[i-1][c - weight[i-1]] + value[i-1]);
            }
        }
    }
    return dp[n][capacity];
}
