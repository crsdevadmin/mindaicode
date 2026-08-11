#include <cstdio>
#include "g_bfs.cpp"
int main(){ vector<vector<int>> g(5); int E[5][2]={{0,1},{0,2},{1,3},{2,3},{3,4}};
 for(auto&e:E){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);}
 auto o=bfs(g,0); vector<int> want={0,1,2,3,4};
 bool bad = o!=want; puts(bad?"  !! C++ BFS WRONG":"  C++ BFS visits in breadth order 0 1 2 3 4"); return bad; }
