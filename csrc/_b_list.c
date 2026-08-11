#include <stdio.h>
#include "d_list.c"
static int len(Node*h){int c=0;for(;h;h=h->next)c++;return c;}
static int at(Node*h,int i){while(i--)h=h->next;return h->value;}
int main(){
  int bad=0; Node*h=NULL;
  h=insertHead(h,3); h=insertHead(h,2); h=insertHead(h,1);
  if(len(h)!=3||at(h,0)!=1||at(h,1)!=2||at(h,2)!=3) bad++;
  h=deleteValue(h,2); if(len(h)!=2||at(h,0)!=1||at(h,1)!=3) bad++;  /* middle */
  h=deleteValue(h,1); if(len(h)!=1||at(h,0)!=3) bad++;              /* head   */
  h=deleteValue(h,99); if(len(h)!=1) bad++;                          /* absent */
  h=deleteValue(h,3); if(h!=NULL) bad++;                             /* last   */
  if(deleteValue(NULL,1)!=NULL) bad++;                               /* empty  */
  puts(bad?"  !! linked list WRONG":"  linked list: insert, delete head/middle/last/absent/empty all correct");
  return bad;
}
