void siftUp(int heap[], int i) {
    while (i > 0 && heap[(i-1)/2] > heap[i]) {
        int parent = (i - 1) / 2;
        int t = heap[i]; heap[i] = heap[parent]; heap[parent] = t;  // bubble up
        i = parent;
    }
}
void heapInsert(int heap[], int *size, int value) {
    heap[*size] = value;          // put it at the very end
    siftUp(heap, *size);          // then let it climb
    (*size)++;
}
int extractMin(int heap[], int *size) {
    int top = heap[0];
    heap[0] = heap[--(*size)];    // move the last item to the root
    // then sift that value DOWN until the heap rule holds again
    return top;
}
