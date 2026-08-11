#include <vector>                                            //@
#include <algorithm>                                         //@
using namespace std;                                         //@
void siftDown(vector<int>& arr, int size, int i);            //@
                                                             //@
void heapSort(vector<int>& arr) {                            //@0
    int n = arr.size();                                      //@0
    // 1. turn the raw vector into a max-heap, bottom up     //@1
    for (int i = n/2 - 1; i >= 0; i--)                       //@1
        siftDown(arr, n, i);                                 //@1
    // 2. repeatedly pull the max to the back                //@9
    for (int end = n - 1; end > 0; end--) {                  //@9
        swap(arr[0], arr[end]);                              //@10
        siftDown(arr, end, 0);                               //@11
    }                                                        //@11
}                                                            //@11
                                                             //@
void siftDown(vector<int>& arr, int size, int i) {           //@2
    while (true) {                                           //@3
        int largest = i;                                     //@3
        int l = 2*i+1, r = 2*i+2;                            //@4
        if (l < size && arr[l] > arr[largest]) largest = l;  //@5
        if (r < size && arr[r] > arr[largest]) largest = r;  //@6
        if (largest == i) break;   // heap rule restored     //@7
        swap(arr[i], arr[largest]);                          //@8
        i = largest;                                         //@8
    }                                                        //@8
}                                                            //@8
