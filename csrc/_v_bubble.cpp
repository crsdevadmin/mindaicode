#include <cstdio>
#include <cstdlib>
#include <algorithm>
#include "s_bubble.cpp"
int main(){
  srand(23); int fails=0;
  for(int t=0;t<3000;t++){
    int n=1+rand()%40; vector<int> base(n); for(auto&x:base) x=rand()%100-50;
    vector<int> ref=base; sort(ref.begin(),ref.end());
    vector<int> a=base;
#if defined(SORTCALL_RANGE)
#endif
    bubbleSort(a); if(a!=ref){puts("FAIL");fails++;}
  }
  if(fails) printf("C++ bubble FAILURES: %d\n",fails); else printf("C++ bubble: correct on 3000 random arrays\n");
  return fails!=0;
}
