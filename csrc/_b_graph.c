#include <stdio.h>
#define graph BFSg
#define n BFSn
#include "g_bfs.c"
#undef graph
#undef n
#define graph DFSg
#define n DFSn
#include "g_dfs.c"
#undef graph
#undef n
#include "g_dijk.c"
#include "dp_knap.c"
int main(){
  int bad=0, E[5][2]={{0,1},{0,2},{1,3},{2,3},{3,4}};
  BFSn=DFSn=n=5;
  for(int i=0;i<5;i++){int a=E[i][0],b=E[i][1];BFSg[a][b]=BFSg[b][a]=1;DFSg[a][b]=DFSg[b][a]=1;}
  int order[100],k=bfs(0,order);
  if(k!=5||order[0]!=0||order[1]!=1||order[2]!=2||order[3]!=3||order[4]!=4) bad++;
  k=0; dfs(0,order,&k);
  if(k!=5||order[0]!=0||order[1]!=1||order[2]!=3) bad++;   /* depth first */
  int W[5][3]={{0,1,4},{0,2,1},{2,1,2},{1,3,5},{2,3,8}};
  for(int i=0;i<5;i++){int a=W[i][0],b=W[i][1],ww=W[i][2];w[a][b]=w[b][a]=ww;}
  int dist[100]; dijkstra(0,dist);
  if(dist[1]!=3||dist[2]!=1||dist[3]!=8) bad++;  /* 0->2->1 beats the direct 0->1 */
  int wt[4]={2,3,4,5}, vl[4]={3,4,5,6};
  if(knapsack(wt,vl,4,5)!=7) bad++;
  puts(bad?"  !! graph/DP WRONG":"  BFS breadth-order, DFS depth-order, Dijkstra picks 0->2->1 (3) over direct (4), knapsack = 7");
  return bad;
}
