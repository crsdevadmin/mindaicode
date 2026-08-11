#include <stdio.h>
#include "d_stack.c"
#include "d_queue.c"
int main(){
  int bad=0;
  Stack s; stackInit(&s); push(&s,10); push(&s,20); push(&s,30);
  if(peek(&s)!=30) bad++;
  if(pop(&s)!=30||pop(&s)!=20||pop(&s)!=10||pop(&s)!=-1) bad++;
  Queue q; queueInit(&q); enqueue(&q,1); enqueue(&q,2); enqueue(&q,3);
  if(dequeue(&q)!=1||dequeue(&q)!=2||dequeue(&q)!=3||dequeue(&q)!=-1) bad++;
  puts(bad?"  !! stack/queue WRONG":"  stack is LIFO, queue is FIFO, both handle empty");
  return bad;
}
