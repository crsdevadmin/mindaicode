void bubbleSort(int arr[], int n) {                          //@0
    // a C array does not know its own size, so n comes in   //@1
    for (int i = 0; i < n; i++) {                            //@2
        int swapped = 0;   // C has no bool before C99       //@2
        for (int j = 0; j < n - i - 1; j++) {                //@3
            if (arr[j] > arr[j+1]) {                         //@4
                // C has no built-in swap - do it by hand    //@5
                int t = arr[j];                              //@6
                arr[j] = arr[j+1];                           //@6
                arr[j+1] = t;                                //@6
                swapped = 1;                                 //@6
            }                                                //@7
        }                                                    //@8
        if (!swapped) break;  // a clean pass means sorted   //@11
    }                                                        //@9
}                                                            //@10
