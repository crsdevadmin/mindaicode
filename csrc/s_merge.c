#include <stdlib.h>        // malloc / free                  //@
void merge(int arr[], int lo, int mid, int hi);  // defined below  //@
                                                             //@
void mergeSort(int arr[], int lo, int hi) {                  //@0
    if (hi - lo <= 1) return;   // one item is already sorted//@1
    int mid = (lo + hi) / 2;                                 //@2
    mergeSort(arr, lo, mid);                                 //@3
    mergeSort(arr, mid, hi);                                 //@3
    merge(arr, lo, mid, hi);                                 //@4
}                                                            //@4
                                                             //@
void merge(int arr[], int lo, int mid, int hi) {             //@5
    int nL = mid - lo, nR = hi - mid;                        //@6
    int *left  = malloc(nL * sizeof(int));                   //@6
    int *right = malloc(nR * sizeof(int));                   //@6
    for (int x = 0; x < nL; x++) left[x]  = arr[lo + x];     //@6
    for (int x = 0; x < nR; x++) right[x] = arr[mid + x];    //@6
    int i = 0, j = 0, k = lo;                                //@7
    while (i < nL && j < nR) {                               //@8
        if (left[i] <= right[j]) {                           //@9
            arr[k++] = left[i++];                            //@10
        } else {                                             //@11
            arr[k++] = right[j++];                           //@12
        }                                                    //@13
    }                                                        //@13
    // copy any leftovers!                                   //@14
    while (i < nL) arr[k++] = left[i++];                     //@14
    while (j < nR) arr[k++] = right[j++];                    //@14
    free(left); free(right);   // you allocated it, you free it //@14
}                                                            //@14
