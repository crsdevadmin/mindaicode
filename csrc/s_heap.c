void siftDown(int arr[], int size, int i);   // defined below//@
                                                             //@
void heapSort(int arr[], int n) {                            //@0
    // 1. turn the raw array into a max-heap, bottom up      //@1
    for (int i = n/2 - 1; i >= 0; i--)                       //@1
        siftDown(arr, n, i);                                 //@1
    // 2. repeatedly pull the max to the back                //@9
    for (int end = n - 1; end > 0; end--) {                  //@9
        int t = arr[0]; arr[0] = arr[end]; arr[end] = t;     //@10
        siftDown(arr, end, 0);                               //@11
    }                                                        //@11
}                                                            //@11
                                                             //@
void siftDown(int arr[], int size, int i) {                  //@2
    while (1) {                                              //@3
        int largest = i;                                     //@3
        int l = 2*i+1, r = 2*i+2;                            //@4
        if (l < size && arr[l] > arr[largest]) largest = l;  //@5
        if (r < size && arr[r] > arr[largest]) largest = r;  //@6
        if (largest == i) break;   // heap rule restored     //@7
        int t = arr[i]; arr[i] = arr[largest]; arr[largest] = t; //@8
        i = largest;                                         //@8
    }                                                        //@8
}                                                            //@8
