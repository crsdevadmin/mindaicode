#include <stdlib.h>
typedef struct Node {
    int value;
    struct Node *left, *right;
} Node;

Node* insert(Node *node, int value) {
    if (node == NULL) {                     // empty spot - plant it here
        Node *n = malloc(sizeof(Node));
        n->value = value; n->left = n->right = NULL;
        return n;
    }
    if (value < node->value)      node->left  = insert(node->left, value);
    else if (value > node->value) node->right = insert(node->right, value);
    return node;                            // duplicates are ignored
}
void inorder(Node *node, int out[], int *k) {
    if (node == NULL) return;
    inorder(node->left, out, k);
    out[(*k)++] = node->value;    // visiting BETWEEN the two subtrees
    inorder(node->right, out, k); // always yields sorted order!
}
