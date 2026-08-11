#define MAX 100
typedef struct {
    int items[MAX];
    int top;            // index of the top item; -1 means empty
} Stack;

void stackInit(Stack *s) { s->top = -1; }

void push(Stack *s, int value) {
    if (s->top == MAX - 1) return;   // overflow - the array is full
    s->items[++s->top] = value;
}
int pop(Stack *s) {
    if (s->top == -1) return -1;     // underflow - nothing to pop
    return s->items[s->top--];
}
int peek(Stack *s) {
    return s->top == -1 ? -1 : s->items[s->top];
}
