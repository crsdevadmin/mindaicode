int partition(int arr[], int lo, int hi);   // defined below //@
                                                             //@
void quickSort(int arr[], int lo, int hi) {                  //@0
    if (lo >= hi) return;                                    //@1
    int p = partition(arr, lo, hi);                          //@2
    quickSort(arr, lo, p - 1);                               //@9
    quickSort(arr, p + 1, hi);                               //@9
}                                                            //@9
                                                             //@
int partition(int arr[], int lo, int hi) {                   //@3
    int pivot = arr[hi];                                     //@3
    int i = lo - 1;      // end of the "smaller" zone        //@4
    for (int j = lo; j < hi; j++) {                          //@5
        if (arr[j] <= pivot) {                               //@6
            i++;                                             //@7
            int t = arr[i]; arr[i] = arr[j]; arr[j] = t;     //@7
        }                                                    //@7
    }                                                        //@7
    int t = arr[i+1]; arr[i+1] = arr[hi]; arr[hi] = t;       //@8
    return i + 1;        // the pivot's final home           //@8
}                                                            //@8
