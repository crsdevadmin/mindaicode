#include <cstdio>
#include "dp_knap.cpp"
int main(){ vector<int> w={2,3,4,5}, v={3,4,5,6};
 bool bad=false;
 if(knapsack(w,v,5)!=7) bad=true;
 if(knapsack(w,v,0)!=0) bad=true;
 if(knapsack(w,v,14)!=18) bad=true;
 puts(bad?"  !! C++ knapsack WRONG":"  C++ knapsack: cap 5 -> 7, cap 0 -> 0, cap 14 -> 18 (all items)"); return bad; }
