#include <stdio.h>
#include "d_bst.c"
#include "d_heap.c"
int main(){
  int bad=0; Node*root=NULL; int vals[7]={50,30,70,20,40,60,80};
  for(int i=0;i<7;i++) root=insert(root,vals[i]);
  root=insert(root,50);  /* duplicate must be ignored */
  int out[20],k=0; inorder(root,out,&k);
  if(k!=7) bad++;
  for(int i=1;i<k;i++) if(out[i-1]>=out[i]) bad++;
  int heap[20],size=0,hv[6]={5,3,8,1,9,2};
  for(int i=0;i<6;i++) heapInsert(heap,&size,hv[i]);
  if(heap[0]!=1) bad++;
  if(extractMin(heap,&size)!=1||size!=5) bad++;
  puts(bad?"  !! BST/heap WRONG":"  BST inorder gives sorted order, duplicates ignored; min-heap root is the minimum");
  return bad;
}
