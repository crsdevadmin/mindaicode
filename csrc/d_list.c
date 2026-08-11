#include <stdlib.h>
typedef struct Node {
    int value;
    struct Node *next;      // the pointer to the next carriage
} Node;

Node* insertHead(Node *head, int value) {
    Node *n = malloc(sizeof(Node));
    n->value = value;
    n->next = head;         // new node points at the old head
    return n;               // it becomes the new head
}
Node* deleteValue(Node *head, int value) {
    if (head == NULL) return NULL;
    if (head->value == value) {
        Node *rest = head->next;
        free(head);         // in C, YOU give the memory back
        return rest;
    }
    Node *prev = head;
    while (prev->next && prev->next->value != value) prev = prev->next;
    if (prev->next) {
        Node *gone = prev->next;
        prev->next = gone->next;   // relink around the found node
        free(gone);
    }
    return head;
}
