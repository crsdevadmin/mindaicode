#include <vector>                                            //@
using namespace std;                                         //@
void merge(vector<int>& arr, int lo, int mid, int hi);       //@
                                                             //@
void mergeSort(vector<int>& arr, int lo, int hi) {           //@0
    if (hi - lo <= 1) return;   // one item is already sorted//@1
    int mid = (lo + hi) / 2;                                 //@2
    mergeSort(arr, lo, mid);                                 //@3
    mergeSort(arr, mid, hi);                                 //@3
    merge(arr, lo, mid, hi);                                 //@4
}                                                            //@4
                                                             //@
void merge(vector<int>& arr, int lo, int mid, int hi) {      //@5
    // vector copies its own memory - no malloc, no free     //@6
    vector<int> left (arr.begin()+lo,  arr.begin()+mid);     //@6
    vector<int> right(arr.begin()+mid, arr.begin()+hi);      //@6
    int i = 0, j = 0, k = lo;                                //@7
    int nL = left.size(), nR = right.size();                 //@7
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
}                                                            //@14
