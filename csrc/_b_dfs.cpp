#include <cstdio>
#include "g_dfs.cpp"
int main(){ vector<vector<int>> g(5); int E[5][2]={{0,1},{0,2},{1,3},{2,3},{3,4}};
 for(auto&e:E){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);}
 vector<bool> v(5,false); vector<int> o; dfs(g,0,v,o);
 bool bad = (o.size()!=5 || o[0]!=0 || o[1]!=1 || o[2]!=3);
 puts(bad?"  !! C++ DFS WRONG":"  C++ DFS dives deep first: 0 1 3 ..."); return bad; }
