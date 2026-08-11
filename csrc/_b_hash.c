#include <stdio.h>
#include "d_hash.c"
int main(){
  char *table[7]={0}; char *keys[4]={"ravi","asha","kiran","meena"};
  int slots[4], bad=0;
  for(int i=0;i<4;i++) slots[i]=insert(table,7,keys[i]);
  for(int i=0;i<4;i++) for(int j=i+1;j<4;j++) if(slots[i]==slots[j]) bad++;
  int filled=0; for(int i=0;i<7;i++) if(table[i]) filled++;
  if(filled!=4) bad++;
  printf(bad?"  !! hashing WRONG\n":"  hashing: 3 of 4 keys collide on slot %d, probing still stores all 4\n",
         hashCode("ravi",7));
  return bad;
}
