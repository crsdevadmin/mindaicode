#include <string.h>
int hashCode(const char *key, int tableSize) {
    int sum = 0;
    for (int i = 0; key[i] != '\0'; i++) sum += key[i];   // add the letters
    return sum % tableSize;
}

// Open addressing (linear probing): find the next free slot
int insert(char *table[], int n, char *key) {
    int i = hashCode(key, n);
    while (table[i] != NULL && strcmp(table[i], key) != 0)
        i = (i + 1) % n;        // probe forward, wrapping around
    table[i] = key;
    return i;
}
