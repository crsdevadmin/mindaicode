#include <vector>                                            //@
using namespace std;                                         //@
                                                             //@
int binarySearch(const vector<int>& arr, int target) {       //@0
    int lo = 0, hi = arr.size() - 1;                         //@1
    while (lo <= hi) {                                       //@2
        int mid = lo + (hi - lo) / 2;  // avoids overflow    //@3
        if (arr[mid] == target) return mid;      // found it //@4
        else if (arr[mid] < target) lo = mid + 1; // drop left  //@5
        else hi = mid - 1;                        // drop right //@6
    }                                                        //@6
    return -1;             // not in the list                //@7
}                                                            //@7
