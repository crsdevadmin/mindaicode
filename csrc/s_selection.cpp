#include <vector>                                            //@
#include <algorithm>                                         //@
using namespace std;                                         //@
                                                             //@
void selectionSort(vector<int>& arr) {                       //@0
    int n = arr.size();                                      //@1
    for (int i = 0; i < n; i++) {                            //@2
        int minIdx = i;                                      //@3
        for (int j = i + 1; j < n; j++) {                    //@4
            if (arr[j] < arr[minIdx]) {                      //@5
                minIdx = j;                                  //@6
            }                                                //@6
        }                                                    //@6
        swap(arr[i], arr[minIdx]);   // one swap per pass    //@7
    }                                                        //@8
}                                                            //@8
