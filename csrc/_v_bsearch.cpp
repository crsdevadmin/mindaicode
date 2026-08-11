#include <cstdio>
#include <cstdlib>
#include <algorithm>
#include "s_bsearch.cpp"
int main(){
  srand(23); int fails=0;
  for(int t=0;t<3000;t++){
    int n=1+rand()%40; vector<int> base(n); for(auto&x:base) x=rand()%100-50;
    vector<int> ref=base; sort(ref.begin(),ref.end());
    vector<int> a=base;
#if defined(SORTCALL_RANGE)
#endif
    for(int q=0;q<5;q++){bool hit=rand()%2; int tg=hit?ref[rand()%n]:999; int idx=binarySearch(ref,tg); if(!hit){if(idx!=-1){puts("FALSE POSITIVE");fails++;}} else if(idx<0||ref[idx]!=tg){puts("FAIL");fails++;}}
  }
  if(fails) printf("C++ bsearch FAILURES: %d\n",fails); else printf("C++ bsearch: correct on 3000 random arrays\n");
  return fails!=0;
}
