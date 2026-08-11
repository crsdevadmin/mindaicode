#define MAX 100
typedef struct {
    int items[MAX];
    int front, rear;   // front = next to serve, rear = next free slot
} Queue;

void queueInit(Queue *q) { q->front = q->rear = 0; }

void enqueue(Queue *q, int value) {
    if (q->rear == MAX) return;          // full
    q->items[q->rear++] = value;         // join at the rear
}
int dequeue(Queue *q) {
    if (q->front == q->rear) return -1;  // empty
    return q->items[q->front++];         // leave from the front
}
