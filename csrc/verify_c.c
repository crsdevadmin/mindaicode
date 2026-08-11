#include <stdio.h>
#include <stdlib.h>
#include "s_bubble.c"
#include "s_selection.c"
#include "s_insertion.c"
#include "s_merge.c"
#include "s_quick.c"
#include "s_heap.c"
#include "s_bsearch.c"
static int sorted(int a[],int n){for(int i=1;i<n;i++) if(a[i-1]>a[i]) return 0; return 1;}
int main(){
  srand(7); int fails=0;
  for(int t=0;t<3000;t++){
    int n = 1 + rand()%40, base[64];
    for(int i=0;i<n;i++) base[i]=rand()%100-50;
    int a[64],b[64],c[64],d[64],e[64],f[64];
    for(int i=0;i<n;i++) a[i]=b[i]=c[i]=d[i]=e[i]=f[i]=base[i];
    bubbleSort(a,n); selectionSort(b,n); insertionSort(c,n);
    mergeSort(d,0,n); quickSort(e,0,n-1); heapSort(f,n);
    if(!sorted(a,n)){puts("bubble FAIL");fails++;}
    if(!sorted(b,n)){puts("selection FAIL");fails++;}
    if(!sorted(c,n)){puts("insertion FAIL");fails++;}
    if(!sorted(d,n)){puts("merge FAIL");fails++;}
    if(!sorted(e,n)){puts("quick FAIL");fails++;}
    if(!sorted(f,n)){puts("heap FAIL");fails++;}
    for(int i=0;i<n;i++) if(a[i]!=b[i]||a[i]!=c[i]||a[i]!=d[i]||a[i]!=e[i]||a[i]!=f[i]){puts("DISAGREE");fails++;break;}
    for(int q=0;q<5;q++){
      int hit = rand()%2, target = hit ? a[rand()%n] : 999;
      int idx = binarySearch(a,n,target);
      if(!hit){ if(idx!=-1){puts("bsearch FALSE POSITIVE");fails++;} }
      else if(idx<0||a[idx]!=target){puts("bsearch FAIL");fails++;}
    }
  }
  if(fails) printf("C FAILURES: %d\n",fails);
  else puts("C: 6 sorts + binary search correct on 3000 random arrays");
  return fails!=0;
}
