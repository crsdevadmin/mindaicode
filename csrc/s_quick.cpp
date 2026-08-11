#include <vector>                                            //@
#include <algorithm>                                         //@
using namespace std;                                         //@
int partition(vector<int>& arr, int lo, int hi);             //@
                                                             //@
void quickSort(vector<int>& arr, int lo, int hi) {           //@0
    if (lo >= hi) return;                                    //@1
    int p = partition(arr, lo, hi);                          //@2
    quickSort(arr, lo, p - 1);                               //@9
    quickSort(arr, p + 1, hi);                               //@9
}                                                            //@9
                                                             //@
int partition(vector<int>& arr, int lo, int hi) {            //@3
    int pivot = arr[hi];                                     //@3
    int i = lo - 1;      // end of the "smaller" zone        //@4
    for (int j = lo; j < hi; j++) {                          //@5
        if (arr[j] <= pivot) {                               //@6
            i++;                                             //@7
            swap(arr[i], arr[j]);                            //@7
        }                                                    //@7
    }                                                        //@7
    swap(arr[i+1], arr[hi]);                                 //@8
    return i + 1;        // the pivot's final home           //@8
}                                                            //@8
