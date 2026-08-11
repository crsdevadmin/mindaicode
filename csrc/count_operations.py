"""Count the REAL operations each algorithm performs.

Every figure quoted in complexity.js ("n=20 reversed costs 190 comparisons")
comes from running this. Each function mirrors the code shown in the lesson
panel line for line, and asserts its output against sorted() so the
instrumented version is provably faithful to the real algorithm.

    python3 count_operations.py

cxtest.js independently re-derives the same numbers in JavaScript, so the
figures on the site are checked twice, in two languages.
"""
import random, math

def bubble(a):                      # WITH the early-exit flag (as taught)
    a=a[:]; n=len(a); c=s=p=0
    for i in range(n):
        swapped=False; p+=1
        for j in range(n-i-1):
            c+=1
            if a[j]>a[j+1]:
                a[j],a[j+1]=a[j+1],a[j]; s+=1; swapped=True
        if not swapped: break
    return a,c,s,p

def bubble_noflag(a):               # WITHOUT it — what the panel used to show
    a=a[:]; n=len(a); c=s=0
    for i in range(n):
        for j in range(n-i-1):
            c+=1
            if a[j]>a[j+1]: a[j],a[j+1]=a[j+1],a[j]; s+=1
    return a,c,s,n

def selection(a):
    a=a[:]; n=len(a); c=s=0
    for i in range(n):
        m=i
        for j in range(i+1,n):
            c+=1
            if a[j]<a[m]: m=j
        a[i],a[m]=a[m],a[i]; s+=1
    return a,c,s,n

def insertion(a):
    a=a[:]; n=len(a); c=0; shifts=0
    for i in range(1,n):
        key=a[i]; j=i-1
        while j>=0:
            c+=1
            if a[j]>key: a[j+1]=a[j]; shifts+=1; j-=1
            else: break
        a[j+1]=key
    return a,c,shifts,n

def merge(a):
    a=a[:]; st={'c':0,'m':0}
    def ms(lo,hi):
        if hi-lo<=1: return
        mid=(lo+hi)//2; ms(lo,mid); ms(mid,hi)
        L,R=a[lo:mid],a[mid:hi]; i=j=0; k=lo
        while i<len(L) and j<len(R):
            st['c']+=1
            if L[i]<=R[j]: a[k]=L[i]; i+=1
            else: a[k]=R[j]; j+=1
            k+=1; st['m']+=1
        while i<len(L): a[k]=L[i]; i+=1; k+=1; st['m']+=1
        while j<len(R): a[k]=R[j]; j+=1; k+=1; st['m']+=1
    ms(0,len(a))
    return a,st['c'],st['m'],max(1,math.ceil(math.log2(max(len(a),1))))

def quick(a):
    a=a[:]; st={'c':0,'s':0,'d':0}
    def qs(lo,hi,depth):
        st['d']=max(st['d'],depth)
        if lo>=hi: return
        piv=a[hi]; i=lo-1
        for j in range(lo,hi):
            st['c']+=1
            if a[j]<=piv:
                i+=1; a[i],a[j]=a[j],a[i]; st['s']+=1
        a[i+1],a[hi]=a[hi],a[i+1]; st['s']+=1
        qs(lo,i,depth+1); qs(i+2,hi,depth+1)
    qs(0,len(a)-1,1)
    return a,st['c'],st['s'],st['d']

def heap(a):
    a=a[:]; n=len(a); st={'c':0,'s':0}
    def sift(size,i):
        while True:
            big=i; l=2*i+1; r=2*i+2
            if l<size: st['c']+=1
            if l<size and a[l]>a[big]: big=l
            if r<size: st['c']+=1
            if r<size and a[r]>a[big]: big=r
            if big==i: break
            a[i],a[big]=a[big],a[i]; st['s']+=1; i=big
    for i in range(n//2-1,-1,-1): sift(n,i)
    for e in range(n-1,0,-1):
        a[0],a[e]=a[e],a[0]; st['s']+=1; sift(e,0)
    return a,st['c'],st['s'],0

def bsearch(a,t):
    lo,hi=0,len(a)-1; probes=0
    while lo<=hi:
        probes+=1; mid=lo+(hi-lo)//2
        if a[mid]==t: return probes
        elif a[mid]<t: lo=mid+1
        else: hi=mid-1
    return probes

ALGOS=[('Bubble (early-exit)',bubble),('Bubble (no flag)',bubble_noflag),
       ('Selection',selection),('Insertion',insertion),
       ('Merge',merge),('Quick (last pivot)',quick),('Heap',heap)]

random.seed(3)
print('%-20s %-9s %7s %9s %9s %7s' % ('algorithm','input','n','compares','swaps/mv','passes'))
print('-'*68)
for n in (8, 20, 50):
    cases=[('sorted',list(range(n))),('reversed',list(range(n,0,-1))),
           ('random',random.sample(range(n*3),n))]
    for name,fn in ALGOS:
        for cname,data in cases:
            out,c,s,p=fn(data)
            assert out==sorted(data), (name,cname)   # transliteration is faithful
            print('%-20s %-9s %7d %9d %9d %7d' % (name,cname,n,c,s,p))
    print('-'*68)

print()
print('Selection sort compares n(n-1)/2 every single time:')
for n in (8,20,50,100,1000):
    _,c,s,_=selection(list(range(n)))
    print('   n=%-5d compares=%-8d  n(n-1)/2=%-8d  swaps=%d' % (n,c,n*(n-1)//2,s))

print()
print('Binary search probes vs list size (worst case = ceil(log2(n+1))):')
for n in (10,100,1000,1000000):
    a=list(range(n))
    worst=max(bsearch(a,t) for t in [0,n-1,n//2,-1])
    print('   n=%-9d worst probes=%-3d  log2(n)=%.1f  linear search would need %d' %
          (n,worst,math.log2(n),n))


print()
print('build-heap is O(n), not O(n log n) - the ratio to n must stay FLAT:')
def build_ops(a):
    a=a[:]; n=len(a); c=[0]
    def sift(size,i):
        while True:
            big=i; l=2*i+1; r=2*i+2
            if l<size: c[0]+=1
            if l<size and a[l]>a[big]: big=l
            if r<size: c[0]+=1
            if r<size and a[r]>a[big]: big=r
            if big==i: break
            a[i],a[big]=a[big],a[i]; i=big
    for i in range(n//2-1,-1,-1): sift(n,i)
    return c[0]
random.seed(1)
for n in (1000,10000,100000):
    avg=sum(build_ops(random.sample(range(n*3),n)) for _ in range(20))/20
    print('   n=%-8d build=%-9.0f  ratio to n = %.2f   (n log2 n would be %d)'
          % (n, avg, avg/n, n*math.log2(n)))

print()
print('Jump search worst case is exactly 2*sqrt(n):')
def jump(a,t):
    n=len(a); step0=math.isqrt(n); step=step0; prev=0; probes=0
    while prev<n:
        probes+=1
        if a[min(step,n)-1]>=t: break
        prev=step; step+=step0
        if prev>=n: return probes
    while prev<min(step,n):
        probes+=1
        if a[prev]==t: return probes
        prev+=1
    return probes
for n in (100,10_000,1_000_000):
    a=list(range(n))
    w=max(jump(a,t) for t in (0,n-1,n//2,3,n-2))
    print('   n=%-9d worst=%-6d 2*sqrt(n)=%-6d  linear would need %d'
          % (n, w, 2*math.isqrt(n), n))

print()
print('Hash tables: probes per insert as the table fills (Knuth, linear probing):')
for lf in (0.5,0.75,0.9,0.99):
    print('   %3d%% full -> about %.1f probes' % (lf*100, (1+1/(1-lf)**2)/2))
