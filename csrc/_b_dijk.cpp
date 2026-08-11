#include <cstdio>
#include "g_dijk.cpp"
int main(){ vector<vector<Edge>> g(5); int W[5][3]={{0,1,4},{0,2,1},{2,1,2},{1,3,5},{2,3,8}};
 for(auto&e:W){g[e[0]].push_back({e[2],e[1]});g[e[1]].push_back({e[2],e[0]});}
 auto d=dijkstra(g,0);
 bool bad = (d[1]!=3||d[2]!=1||d[3]!=8);
 puts(bad?"  !! C++ Dijkstra WRONG":"  C++ Dijkstra: 0->2->1 costs 3, beating the direct edge of 4"); return bad; }
