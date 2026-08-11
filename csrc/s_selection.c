void selectionSort(int arr[], int n) {                       //@0
    // n is passed in - a C array has no .length             //@1
    for (int i = 0; i < n; i++) {                            //@2
        int minIdx = i;                                      //@3
        for (int j = i + 1; j < n; j++) {                    //@4
            if (arr[j] < arr[minIdx]) {                      //@5
                minIdx = j;                                  //@6
            }                                                //@6
        }                                                    //@6
        // swap ONCE, after the whole scan                   //@7
        int t = arr[i];                                      //@7
        arr[i] = arr[minIdx];                                //@7
        arr[minIdx] = t;                                     //@7
    }                                                        //@8
}                                                            //@8
