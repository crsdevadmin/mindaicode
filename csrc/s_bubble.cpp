#include <vector>                                            //@
#include <algorithm>       // gives you std::swap            //@
using namespace std;                                         //@
                                                             //@
void bubbleSort(vector<int>& arr) {                          //@0
    int n = arr.size();    // a vector DOES know its size    //@1
    for (int i = 0; i < n; i++) {                            //@2
        bool swapped = false;                                //@2
        for (int j = 0; j < n - i - 1; j++) {                //@3
            if (arr[j] > arr[j+1]) {                         //@4
                // std::swap writes the temp variable for you//@5
                swap(arr[j], arr[j+1]);                      //@6
                swapped = true;                              //@6
            }                                                //@7
        }                                                    //@8
        if (!swapped) break;  // a clean pass means sorted   //@11
    }                                                        //@9
}                                                            //@10
