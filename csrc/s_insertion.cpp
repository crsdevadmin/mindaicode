#include <vector>                                            //@
using namespace std;                                         //@
                                                             //@
void insertionSort(vector<int>& arr) {                       //@0
    int n = arr.size();                                      //@1
    for (int i = 1; i < n; i++) {                            //@2
        int key = arr[i];      // the card in your hand      //@3
        int j = i - 1;                                       //@4
        while (j >= 0 && arr[j] > key) {                     //@5
            arr[j + 1] = arr[j];   // shift the bigger right //@6
            j--;                                             //@7
        }                                                    //@7
        arr[j + 1] = key;      // drop the card into the gap //@8
    }                                                        //@9
}                                                            //@9
