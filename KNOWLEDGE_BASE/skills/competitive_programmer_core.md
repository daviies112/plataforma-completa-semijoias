---
id: the_algorithmist
department: SPECIAL_OPS
role: COMPETITIVE_PROGRAMMING_EXPERT
status: ACTIVE
complexity: 10
---

# 🧠 The Algorithmist (Competitive Programming Expert)

**Objective: "Optimized Logic, O(n log n) or Better."**

## 1. CAPABILITIES
- **Advanced Algorithms:** Segment Trees, Graph Theory, DP.
- **Optimization:** Reduces time complexity of any given function.
- **Polyglot:** Python, C++, Java, JS optimization.


## 1.1 — Templates de Entrada/Saída Otimizados

### C++ — Template Campeão (usado por tourist e top competidores)
```cpp
#include <bits/stdc++.h>
using namespace std;

// Fast I/O — reduz tempo de leitura em até 10x
#define FAST_IO ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)

// Tipos curtos
typedef long long ll;
typedef unsigned long long ull;
typedef long double ld;
typedef pair<int,int> pii;
typedef pair<ll,ll> pll;
typedef vector<int> vi;
typedef vector<ll> vll;
typedef vector<pii> vpii;

// Constantes críticas (evita overflow/underflow)
const int INF = 1e9 + 7;
const ll LINF = 1e18;
const double EPS = 1e-9;
const int MOD = 1e9 + 7;
const double PI = acos(-1.0L);

// Macros produtivos
#define pb push_back
#define mp make_pair
#define fi first
#define se second
#define all(x) (x).begin(), (x).end()
#define rall(x) (x).rbegin(), (x).rend()
#define sz(x) (int)(x).size()
#define rep(i, a, b) for(int i = a; i < b; i++)
#define repr(i, a, b) for(int i = a; i >= b; i--)

int main() {
    FAST_IO;
    int t;
    cin >> t;
    while(t--) {
        // solução aqui
    }
    return 0;
}
```

### Python — Template de Alta Performance
```python
import sys
import os
from sys import stdin, stdout
from collections import defaultdict, deque, Counter, OrderedDict
from itertools import permutations, combinations, accumulate, product
from functools import lru_cache, reduce
from math import gcd, lcm, sqrt, ceil, floor, log2, inf
from heapq import heappush, heappop, heapify, nlargest, nsmallest
import bisect

# Leitura ultra-rápida
input = stdin.readline

def ri(): return int(input())
def rli(): return list(map(int, input().split()))
def rs(): return input().strip()
def rls(): return input().split()

# Aumenta limite de recursão (necessário para DFS/backtracking profundos)
sys.setrecursionlimit(300000)

# Output em buffer (muito mais rápido para múltiplas linhas)
def solve():
    out = []
    # ... lógica ...
    # out.append(str(resultado))
    print('\n'.join(out))

T = ri()
for _ in range(T):
    solve()
```

### Java — Template Competitivo Padrão
```java
import java.util.*;
import java.io.*;
import java.math.*;

public class Main {
    // BufferedReader é ~3x mais rápido que Scanner
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;
    static StringBuilder sb = new StringBuilder();
    
    static int nextInt() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return Integer.parseInt(st.nextToken());
    }
    
    static long nextLong() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return Long.parseLong(st.nextToken());
    }
    
    static String nextToken() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }
    
    static void solve() throws IOException {
        // lógica aqui
        // sb.append(resultado).append('\n');
    }
    
    public static void main(String[] args) throws IOException {
        int t = nextInt();
        while (t-- > 0) solve();
        System.out.print(sb);
    }
}
```

### JavaScript (Node.js) — Template para Competições Online
```javascript
process.stdin.resume();
process.stdin.setEncoding('utf8');
let inputData = '';

process.stdin.on('data', d => inputData += d);
process.stdin.on('end', () => {
    const lines = inputData.trim().split('\n');
    let idx = 0;
    
    const nextLine = () => lines[idx++].trim();
    const nextInt = () => parseInt(nextLine());
    const nextInts = () => nextLine().split(' ').map(Number);
    
    const out = [];
    const print = (x) => out.push(String(x));
    
    const T = nextInt();
    for (let t = 0; t < T; t++) {
        // solve(nextInts(), print);
    }
    
    process.stdout.write(out.join('\n') + '\n');
});
```

---

# PARTE 2: ALGORITMOS FUNDAMENTAIS

## 2.1 — Ordenação e Busca

### Binary Search — Template Universal
```python
# Python — bisect é nativo e C-speed
from bisect import bisect_left, bisect_right, insort

# Menor índice onde arr[i] >= target
def lower_bound(arr, target):
    return bisect_left(arr, target)

# Menor índice onde arr[i] > target
def upper_bound(arr, target):
    return bisect_right(arr, target)

# Binary Search em resposta (Busca na resposta — técnica avançada)
def binary_search_answer(lo, hi, check_func):
    """Encontra menor valor v em [lo,hi] onde check_func(v) é True"""
    while lo < hi:
        mid = (lo + hi) // 2
        if check_func(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

# Exemplo: menor velocidade para terminar trabalho em T horas
def can_finish(speed, piles, T):
    return sum(ceil(p / speed) for p in piles) <= T

# uso: binary_search_answer(1, max(piles), lambda s: can_finish(s, piles, T))
```

```cpp
// C++ — com floating point
double binary_search_float(double lo, double hi, auto check, int iters = 100) {
    for (int i = 0; i < iters; i++) {
        double mid = (lo + hi) / 2;
        if (check(mid)) hi = mid;
        else lo = mid;
    }
    return lo;
}
```

## 2.2 — Dois Ponteiros (Two Pointers)
```python
# Soma de subarray com soma exata K (elementos positivos)
def subarray_sum_k(arr, k):
    left = curr_sum = count = 0
    for right in range(len(arr)):
        curr_sum += arr[right]
        while curr_sum > k and left <= right:
            curr_sum -= arr[left]
            left += 1
        if curr_sum == k:
            count += 1
    return count

# Par com soma alvo em array ordenado
def two_sum_sorted(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo < hi:
        s = arr[lo] + arr[hi]
        if s == target: return (lo, hi)
        elif s < target: lo += 1
        else: hi -= 1
    return None
```

## 2.3 — Janela Deslizante (Sliding Window)
```python
from collections import defaultdict

# Maior substring com no máximo K caracteres distintos
def longest_substring_k_distinct(s, k):
    freq = defaultdict(int)
    left = result = 0
    for right, ch in enumerate(s):
        freq[ch] += 1
        while len(freq) > k:
            freq[s[left]] -= 1
            if freq[s[left]] == 0:
                del freq[s[left]]
            left += 1
        result = max(result, right - left + 1)
    return result

# Mínimo em janela de tamanho K — O(n) com deque
from collections import deque
def sliding_window_min(arr, k):
    dq = deque()  # armazena índices em ordem crescente de valor
    result = []
    for i, v in enumerate(arr):
        while dq and arr[dq[-1]] >= v:
            dq.pop()
        dq.append(i)
        if dq[0] == i - k:
            dq.popleft()
        if i >= k - 1:
            result.append(arr[dq[0]])
    return result
```

---

# PARTE 3: ESTRUTURAS DE DADOS AVANÇADAS

## 3.1 — Union-Find (Disjoint Set Union — DSU)
```python
# Python — versão com path compression + union by rank
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.size = [1] * n
        self.components = n
    
    def find(self, x):
        # Path compression iterativo (sem recursão — mais seguro)
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root
    
    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False  # já conectados
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        self.size[rx] += self.size[ry]
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        self.components -= 1
        return True
    
    def connected(self, x, y):
        return self.find(x) == self.find(y)
    
    def component_size(self, x):
        return self.size[self.find(x)]
```

```cpp
// C++ — DSU compacto e rápido
struct DSU {
    vector<int> parent, rank_, size_;
    int components;
    
    DSU(int n) : parent(n), rank_(n, 0), size_(n, 1), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }
    
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // path compression
        return parent[x];
    }
    
    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank_[x] < rank_[y]) swap(x, y);
        parent[y] = x;
        size_[x] += size_[y];
        if (rank_[x] == rank_[y]) rank_[x]++;
        components--;
        return true;
    }
    
    bool connected(int x, int y) { return find(x) == find(y); }
    int size(int x) { return size_[find(x)]; }
};
```

## 3.2 — Segment Tree (Árvore de Segmentos)
```python
# Python — Segment Tree iterativa (mais rápida que recursiva)
class SegTree:
    def __init__(self, n, identity=float('inf'), func=min):
        self.n = n
        self.identity = identity
        self.func = func
        self.tree = [identity] * (2 * n)
    
    def build(self, arr):
        for i, v in enumerate(arr):
            self.tree[self.n + i] = v
        for i in range(self.n - 1, 0, -1):
            self.tree[i] = self.func(self.tree[2*i], self.tree[2*i+1])
    
    def update(self, pos, val):
        pos += self.n
        self.tree[pos] = val
        while pos > 1:
            pos >>= 1
            self.tree[pos] = self.func(self.tree[2*pos], self.tree[2*pos+1])
    
    def query(self, lo, hi):  # [lo, hi) — intervalo semi-aberto
        res = self.identity
        lo += self.n; hi += self.n
        while lo < hi:
            if lo & 1:
                res = self.func(res, self.tree[lo]); lo += 1
            if hi & 1:
                hi -= 1; res = self.func(res, self.tree[hi])
            lo >>= 1; hi >>= 1
        return res
```

```cpp
// C++ — Lazy Segment Tree (para range updates)
template<typename T>
struct LazySegTree {
    int n;
    vector<T> tree, lazy;
    
    LazySegTree(int n) : n(n), tree(4*n, 0), lazy(4*n, 0) {}
    
    void push_down(int node) {
        if (lazy[node]) {
            tree[2*node] += lazy[node];
            lazy[2*node] += lazy[node];
            tree[2*node+1] += lazy[node];
            lazy[2*node+1] += lazy[node];
            lazy[node] = 0;
        }
    }
    
    void update(int node, int start, int end, int l, int r, T val) {
        if (r < start || end < l) return;
        if (l <= start && end <= r) {
            tree[node] += val; lazy[node] += val; return;
        }
        push_down(node);
        int mid = (start + end) / 2;
        update(2*node, start, mid, l, r, val);
        update(2*node+1, mid+1, end, l, r, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }
    
    T query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        push_down(node);
        int mid = (start + end) / 2;
        return query(2*node, start, mid, l, r) +
               query(2*node+1, mid+1, end, l, r);
    }
    
    void update(int l, int r, T val) { update(1, 0, n-1, l, r, val); }
    T query(int l, int r) { return query(1, 0, n-1, l, r); }
};
```

## 3.3 — Fenwick Tree (Binary Indexed Tree)
```python
# Python — BIT clássico para soma de prefixo com updates
class BIT:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (n + 1)
    
    def update(self, i, delta):  # i 1-indexed
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)
    
    def query(self, i):  # soma [1, i]
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)
        return s
    
    def range_query(self, l, r):  # soma [l, r]
        return self.query(r) - self.query(l - 1)
    
    # Para encontrar k-ésimo menor: O(log n)
    def kth(self, k):
        pos = 0
        log = self.n.bit_length()
        for i in range(log, -1, -1):
            if pos + (1 << i) <= self.n and self.tree[pos + (1 << i)] < k:
                pos += (1 << i)
                k -= self.tree[pos]
        return pos + 1
```

---

# PARTE 4: GRAFOS

## 4.1 — BFS e DFS
```python
from collections import deque

# BFS — distância mínima em grafo não ponderado
def bfs(graph, start, n):
    dist = [-1] * n
    dist[start] = 0
    q = deque([start])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

# DFS iterativo (evita recursão e stack overflow)
def dfs_iterative(graph, start, n):
    visited = [False] * n
    stack = [start]
    order = []
    while stack:
        u = stack.pop()
        if visited[u]: continue
        visited[u] = True
        order.append(u)
        for v in graph[u]:
            if not visited[v]:
                stack.append(v)
    return order

# Detecção de ciclo em grafo dirigido
def has_cycle_directed(graph, n):
    color = [0] * n  # 0=branco, 1=cinza, 2=preto
    def dfs(u):
        color[u] = 1
        for v in graph[u]:
            if color[v] == 1: return True  # back edge = ciclo
            if color[v] == 0 and dfs(v): return True
        color[u] = 2
        return False
    return any(color[i] == 0 and dfs(i) for i in range(n))
```

## 4.2 — Dijkstra (Menor Caminho Ponderado)
```python
import heapq

def dijkstra(graph, start, n):
    """
    graph: lista de adjacência [(vizinho, peso)]
    Retorna distâncias mínimas de start para todos os nós
    """
    dist = [float('inf')] * n
    dist[start] = 0
    heap = [(0, start)]
    
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue  # entrada obsoleta — crucial para performance
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    
    return dist
```

```cpp
// C++ — Dijkstra com priority_queue
vector<ll> dijkstra(int src, int n, vector<vector<pair<int,int>>>& adj) {
    vector<ll> dist(n, LINF);
    priority_queue<pair<ll,int>, vector<pair<ll,int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});
    
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
```

## 4.3 — Bellman-Ford (Detecta Ciclos Negativos)
```python
def bellman_ford(edges, n, src):
    """edges: lista de (u, v, peso)"""
    dist = [float('inf')] * n
    dist[src] = 0
    
    for _ in range(n - 1):  # relaxa n-1 vezes
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    
    # Detecta ciclo negativo
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            return None  # ciclo negativo existe
    
    return dist
```

## 4.4 — Floyd-Warshall (Todos os Pares)
```python
def floyd_warshall(n, edges):
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    for i in range(n): dist[i][i] = 0
    for u, v, w in edges:
        dist[u][v] = min(dist[u][v], w)
    
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    # Verifica ciclo negativo: dist[i][i] < 0
    return dist
```

## 4.5 — Ordenação Topológica (Kahn's Algorithm)
```python
from collections import deque

def topological_sort(n, adj):
    in_degree = [0] * n
    for u in range(n):
        for v in adj[u]:
            in_degree[v] += 1
    
    q = deque(i for i in range(n) if in_degree[i] == 0)
    order = []
    
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                q.append(v)
    
    if len(order) != n:
        return None  # ciclo detectado
    return order
```

## 4.6 — MST: Kruskal e Prim
```python
# Kruskal (com DSU) — O(E log E)
def kruskal(n, edges):
    """edges: lista de (peso, u, v)"""
    edges.sort()
    dsu = DSU(n)
    mst_cost = 0
    mst_edges = []
    
    for w, u, v in edges:
        if dsu.union(u, v):
            mst_cost += w
            mst_edges.append((u, v, w))
    
    return mst_cost, mst_edges

# Prim (com heap) — melhor para grafos densos
def prim(n, adj):
    """adj: lista de adjacência [(vizinho, peso)]"""
    visited = [False] * n
    min_heap = [(0, 0)]  # (custo, nó)
    total = 0
    
    while min_heap:
        cost, u = heapq.heappop(min_heap)
        if visited[u]: continue
        visited[u] = True
        total += cost
        for v, w in adj[u]:
            if not visited[v]:
                heapq.heappush(min_heap, (w, v))
    
    return total
```

---

# PARTE 5: PROGRAMAÇÃO DINÂMICA

## 5.1 — Padrões Fundamentais de DP

### Knapsack 0/1
```python
def knapsack_01(weights, values, capacity):
    n = len(weights)
    dp = [0] * (capacity + 1)
    
    for i in range(n):
        # Iterar de trás para frente evita usar item duas vezes
        for w in range(capacity, weights[i] - 1, -1):
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    
    return dp[capacity]

# Knapsack Ilimitado (unbounded)
def knapsack_unbounded(weights, values, capacity):
    dp = [0] * (capacity + 1)
    for w in range(1, capacity + 1):
        for i in range(len(weights)):
            if weights[i] <= w:
                dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[capacity]
```

### Longest Common Subsequence (LCS)
```python
def lcs(s, t):
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]

# Versão O(n) de espaço
def lcs_space_optimized(s, t):
    m, n = len(s), len(t)
    if m < n: s, t, m, n = t, s, n, m
    prev = [0] * (n + 1)
    for c in s:
        curr = [0] * (n + 1)
        for j, d in enumerate(t, 1):
            curr[j] = prev[j-1] + 1 if c == d else max(prev[j], curr[j-1])
        prev = curr
    return prev[n]
```

### Longest Increasing Subsequence (LIS) — O(n log n)
```python
from bisect import bisect_left

def lis(arr):
    """Retorna comprimento da LIS — O(n log n)"""
    tails = []  # tails[i] = menor elemento final de IS de tamanho i+1
    for x in arr:
        pos = bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)

def lis_with_reconstruction(arr):
    """Reconstrói a sequência"""
    n = len(arr)
    tails = []
    pos = [0] * n
    parent = [-1] * n
    
    for i, x in enumerate(arr):
        p = bisect_left(tails, x)
        pos[i] = p
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
        parent[i] = -1  # simplificado
    
    return len(tails)
```

### DP em Intervalo (Interval DP)
```python
def matrix_chain_multiplication(dims):
    """
    dims[i] x dims[i+1] = dimensão da i-ésima matriz
    Retorna mínimo de multiplicações
    """
    n = len(dims) - 1
    dp = [[0] * n for _ in range(n)]
    
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = float('inf')
            for k in range(i, j):
                cost = dp[i][k] + dp[k+1][j] + dims[i] * dims[k+1] * dims[j+1]
                dp[i][j] = min(dp[i][j], cost)
    
    return dp[0][n-1]
```

### DP com Bitmask (para conjuntos pequenos, n≤20)
```python
def tsp_bitmask(dist, n):
    """Travelling Salesman — O(n² * 2^n)"""
    FULL = (1 << n) - 1
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0  # começa no nó 0, máscara = 0001
    
    for mask in range(1 << n):
        for u in range(n):
            if not (mask >> u & 1) or dp[mask][u] == INF:
                continue
            for v in range(n):
                if mask >> v & 1:
                    continue
                nmask = mask | (1 << v)
                dp[nmask][v] = min(dp[nmask][v], dp[mask][u] + dist[u][v])
    
    return min(dp[FULL][v] + dist[v][0] for v in range(1, n))
```

---

# PARTE 6: MATEMÁTICA COMPETITIVA

## 6.1 — Teoria dos Números
```python
# Crivo de Eratóstenes — todos os primos até N
def sieve(n):
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i*i, n+1, i):
                is_prime[j] = False
    return [i for i in range(2, n+1) if is_prime[i]]

# Crivo Linear — O(n) — mais rápido para grandes N
def linear_sieve(n):
    primes = []
    min_prime = [0] * (n + 1)
    for i in range(2, n + 1):
        if not min_prime[i]:
            primes.append(i)
            min_prime[i] = i
        for p in primes:
            if p > min_prime[i] or i * p > n:
                break
            min_prime[i * p] = p
    return primes

# MDC / MMC
from math import gcd
def lcm(a, b): return a * b // gcd(a, b)

# Exponenciação Modular — O(log exp)
def power(base, exp, mod):
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        base = base * base % mod
        exp >>= 1
    return result

# Inverso Modular (Fermat — mod primo)
def mod_inverse(a, mod):
    return power(a, mod - 2, mod)

# Combinação com pré-computação
def precompute_factorials(n, mod):
    fact = [1] * (n + 1)
    inv_fact = [1] * (n + 1)
    for i in range(1, n + 1):
        fact[i] = fact[i-1] * i % mod
    inv_fact[n] = power(fact[n], mod - 2, mod)
    for i in range(n - 1, -1, -1):
        inv_fact[i] = inv_fact[i+1] * (i+1) % mod
    return fact, inv_fact

def C(n, r, fact, inv_fact, mod):
    if r < 0 or r > n: return 0
    return fact[n] * inv_fact[r] % mod * inv_fact[n-r] % mod
```

## 6.2 — Algoritmo de Euclides Estendido
```python
def extended_gcd(a, b):
    """Retorna (g, x, y) onde a*x + b*y = g = gcd(a,b)"""
    if b == 0:
        return a, 1, 0
    g, x, y = extended_gcd(b, a % b)
    return g, y, x - (a // b) * y

# Solução de equação linear diofantina ax + by = c
def solve_linear_diophantine(a, b, c):
    g, x0, y0 = extended_gcd(a, b)
    if c % g != 0:
        return None  # sem solução
    x0 = x0 * (c // g)
    y0 = y0 * (c // g)
    # Solução geral: x = x0 + k*(b//g), y = y0 - k*(a//g)
    return x0, y0, b // g, -(a // g)
```

## 6.3 — Fast Fourier Transform (FFT) para multiplicação de polinômios
```python
from cmath import exp, pi

def fft(poly, invert=False):
    n = len(poly)
    if n == 1: return poly
    
    even = fft(poly[0::2], invert)
    odd  = fft(poly[1::2], invert)
    
    angle = 2 * pi / n * (-1 if invert else 1)
    w, wn = 1, exp(1j * angle)
    result = [0] * n
    
    for i in range(n // 2):
        result[i]         = even[i] + w * odd[i]
        result[i + n//2]  = even[i] - w * odd[i]
        if invert:
            result[i] /= 2
            result[i + n//2] /= 2
        w *= wn
    
    return result

def multiply_polynomials(a, b):
    result_size = len(a) + len(b) - 1
    n = 1
    while n < result_size: n <<= 1
    
    fa = fft(a + [0] * (n - len(a)))
    fb = fft(b + [0] * (n - len(b)))
    fc = [x * y for x, y in zip(fa, fb)]
    result = fft(fc, invert=True)
    
    return [round(x.real) for x in result[:result_size]]
```

---

# PARTE 7: STRINGS

## 7.1 — KMP (Knuth-Morris-Pratt)
```python
def build_kmp_table(pattern):
    """Tabela de falha para KMP"""
    n = len(pattern)
    fail = [0] * n
    j = 0
    for i in range(1, n):
        while j > 0 and pattern[i] != pattern[j]:
            j = fail[j-1]
        if pattern[i] == pattern[j]:
            j += 1
        fail[i] = j
    return fail

def kmp_search(text, pattern):
    """Retorna todos os índices de início de pattern em text"""
    if not pattern: return []
    fail = build_kmp_table(pattern)
    matches = []
    j = 0
    for i, c in enumerate(text):
        while j > 0 and c != pattern[j]:
            j = fail[j-1]
        if c == pattern[j]:
            j += 1
        if j == len(pattern):
            matches.append(i - len(pattern) + 1)
            j = fail[j-1]
    return matches
```

## 7.2 — Z-Function
```python
def z_function(s):
    """z[i] = comprimento do maior prefixo de s que começa em s[i]"""
    n = len(s)
    z = [0] * n
    z[0] = n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def find_all_occurrences(text, pattern):
    """Usando Z-function — mais simples que KMP"""
    s = pattern + '$' + text
    z = z_function(s)
    m = len(pattern)
    return [i - m - 1 for i in range(m + 1, len(s)) if z[i] >= m]
```

## 7.3 — Suffix Array
```python
def build_suffix_array(s):
    """O(n log² n) — suficiente para a maioria das competições"""
    s += chr(0)  # sentinela
    n = len(s)
    sa = sorted(range(n), key=lambda i: s[i:])
    rank = [0] * n
    
    for i, idx in enumerate(sa):
        rank[idx] = i
    
    k = 1
    while k < n:
        def sort_key(i):
            return (rank[i], rank[i+k] if i+k < n else -1)
        sa.sort(key=sort_key)
        new_rank = [0] * n
        for i in range(1, n):
            new_rank[sa[i]] = new_rank[sa[i-1]]
            if sort_key(sa[i]) != sort_key(sa[i-1]):
                new_rank[sa[i]] += 1
        rank = new_rank
        if rank[sa[-1]] == n - 1: break
        k <<= 1
    
    return sa[1:]  # remove sentinela
```

## 7.4 — Hashing de Strings (Polynomial Rolling Hash)
```python
class StringHash:
    """Hashing duplo para evitar colisões"""
    MOD1, MOD2 = 10**9 + 7, 10**9 + 9
    BASE1, BASE2 = 131, 137
    
    def __init__(self, s):
        n = len(s)
        self.h1 = [0] * (n + 1)
        self.h2 = [0] * (n + 1)
        self.p1 = [1] * (n + 1)
        self.p2 = [1] * (n + 1)
        
        for i, c in enumerate(s):
            self.h1[i+1] = (self.h1[i] * self.BASE1 + ord(c)) % self.MOD1
            self.h2[i+1] = (self.h2[i] * self.BASE2 + ord(c)) % self.MOD2
            self.p1[i+1] = self.p1[i] * self.BASE1 % self.MOD1
            self.p2[i+1] = self.p2[i] * self.BASE2 % self.MOD2
    
    def get(self, l, r):  # [l, r] inclusive, 0-indexed
        v1 = (self.h1[r+1] - self.h1[l] * self.p1[r-l+1]) % self.MOD1
        v2 = (self.h2[r+1] - self.h2[l] * self.p2[r-l+1]) % self.MOD2
        return (v1, v2)
    
    def lcp(self, i, j):
        """Longest Common Prefix entre sufixos i e j — O(log n)"""
        lo, hi = 0, min(len(self.h1) - 1 - i, len(self.h1) - 1 - j)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if self.get(i, i+mid-1) == self.get(j, j+mid-1):
                lo = mid
            else:
                hi = mid - 1
        return lo
```

---

# PARTE 8: TÉCNICAS AVANÇADAS

## 8.1 — Sparse Table (RMQ — Range Minimum Query) — O(1) por query
```python
import math

class SparseTable:
    def __init__(self, arr, func=min):
        n = len(arr)
        self.func = func
        LOG = max(1, int(math.log2(n)) + 1)
        self.table = [[0] * n for _ in range(LOG)]
        self.table[0] = arr[:]
        
        for j in range(1, LOG):
            for i in range(n - (1 << j) + 1):
                self.table[j][i] = func(
                    self.table[j-1][i],
                    self.table[j-1][i + (1 << (j-1))]
                )
    
    def query(self, l, r):  # [l, r] inclusive
        k = int(math.log2(r - l + 1))
        return self.func(self.table[k][l], self.table[k][r - (1 << k) + 1])
```

## 8.2 — Mo's Algorithm (Queries Offline)
```python
def mo_algorithm(queries, arr, add, remove, get_answer):
    """
    Processa queries [l, r] em ordem de Mo para minimizar operações.
    queries: lista de (l, r, idx)
    """
    n = len(arr)
    block = max(1, int(n**0.5))
    
    # Ordenação de Mo
    queries.sort(key=lambda q: (q[0] // block, q[1] if (q[0] // block) % 2 == 0 else -q[1]))
    
    answers = [0] * len(queries)
    curr_l, curr_r = 0, -1
    
    for l, r, idx in queries:
        while curr_r < r: curr_r += 1; add(arr[curr_r])
        while curr_l > l: curr_l -= 1; add(arr[curr_l])
        while curr_r > r: remove(arr[curr_r]); curr_r -= 1
        while curr_l < l: remove(arr[curr_l]); curr_l += 1
        answers[idx] = get_answer()
    
    return answers
```

## 8.3 — Busca Ternária (Funções Unimodais)
```python
def ternary_search_int(f, lo, hi):
    """Encontra mínimo de função convexa em inteiros"""
    while hi - lo > 2:
        m1 = lo + (hi - lo) // 3
        m2 = hi - (hi - lo) // 3
        if f(m1) < f(m2):
            hi = m2
        else:
            lo = m1
    return min(range(lo, hi+1), key=f)

def ternary_search_float(f, lo, hi, iterations=200):
    """Versão para contínuo"""
    for _ in range(iterations):
        m1 = lo + (hi - lo) / 3
        m2 = hi - (hi - lo) / 3
        if f(m1) < f(m2):
            hi = m2
        else:
            lo = m1
    return (lo + hi) / 2
```

---

# PARTE 9: PADRÕES DE ROBUSTEZ (CODE QUALITY)

## 9.1 — Verificações de Segurança Críticas
```python
# NUNCA ignore overflow em Python — mas em C++ e Java é crítico
# Usar: long long em C++, long em Java para qualquer conta > 10^9

# Divisão por zero
def safe_divide(a, b, default=0):
    return a // b if b != 0 else default

# Módulo com números negativos (comportamento diferente entre linguagens)
def mod(a, m):
    return ((a % m) + m) % m  # sempre positivo

# Acesso seguro a listas
def safe_get(arr, i, default=None):
    return arr[i] if 0 <= i < len(arr) else default
```

```cpp
// C++ — Checagens essenciais
// Overflow check antes de multiplicar
bool mul_overflow(long long a, long long b) {
    if (a == 0 || b == 0) return false;
    return abs(a) > LLONG_MAX / abs(b);
}

// Soma segura em módulo
ll addmod(ll a, ll b, ll mod) { return (a % mod + b % mod + mod) % mod; }
ll mulmod(ll a, ll b, ll mod) { return (__int128)a * b % mod; }  // usa __int128!
```

## 9.2 — Debugging Tips (Competição)
```python
import sys

# Print para stderr (não interfere na saída do problema)
def debug(*args):
    print(*args, file=sys.stderr)

# Visualizar grafo
def print_adj(adj):
    for u, neighbors in enumerate(adj):
        debug(f"{u}: {neighbors}")

# Verificar DP
def print_dp(dp):
    for i, row in enumerate(dp):
        debug(f"dp[{i}]: {row}")

# Timer para medir performance
import time
class Timer:
    def __enter__(self): self.t = time.time(); return self
    def __exit__(self, *args): debug(f"Elapsed: {time.time()-self.t:.3f}s")

# uso:
# with Timer(): solve()
```

## 9.3 — Tratamento de Casos Especiais
```python
# Padrão para evitar bugs comuns em competições

def solve():
    n = ri()
    
    # 1. Valide inputs extremos
    if n == 0: print(0); return
    if n == 1: print(arr[0]); return
    
    # 2. Verifique overflow antes de calcular
    # Python não tem overflow, mas C++/Java sim!
    
    # 3. Pense nos limites do problema
    # n=10^5: O(n log n) OK, O(n²) NÃO
    # n=10^3: O(n²) OK, O(n³) NÃO
    # n=20: O(2^n) OK
    
    # 4. Verifique conexidade antes de rodar Dijkstra/BFS
    
    # 5. Arrays 1-indexed vs 0-indexed — mantenha consistência!
```

---

# PARTE 10: CHEAT SHEET DE COMPLEXIDADES

## Guia de Referência Rápida

| Operação | Estrutura | Complexidade |
|----------|-----------|-------------|
| Busca/Insert/Delete | Hash Table | O(1) amortizado |
| Busca/Insert/Delete | BST balanceada | O(log n) |
| Min/Max | Heap | O(log n) insert, O(1) peek |
| Range Sum | BIT | O(log n) |
| Range Query | Segment Tree | O(log n) |
| Range Query | Sparse Table | O(1) query, O(n log n) build |
| Sort | Merge/Quick/Heap | O(n log n) |
| LIS | Patience Sort | O(n log n) |
| Shortest Path | Dijkstra | O((V+E) log V) |
| Shortest Path | Bellman-Ford | O(VE) |
| All Pairs | Floyd-Warshall | O(V³) |
| MST | Kruskal/Prim | O(E log V) |
| String Match | KMP/Z | O(n + m) |

## Limites Práticos (para calibrar complexidade)
```
10^8 operações simples ≈ 1 segundo em C++
10^7 operações simples ≈ 1 segundo em Python
10^9 = limite seguro para int (32-bit)
10^18 = limite para long long (64-bit)
```

## Tamanho de Input → Algoritmo Esperado
```
n ≤ 10        → O(n!) backtracking
n ≤ 20        → O(2^n) bitmask DP
n ≤ 300       → O(n³) Floyd-Warshall, interval DP
n ≤ 5000      → O(n²) DP padrão
n ≤ 10^5      → O(n log n) sort, segment tree, Dijkstra
n ≤ 10^6      → O(n) linear — sieve, BFS/DFS, two pointers
n ≤ 10^9      → O(√n) ou O(log n) — binary search, math
```

---

# APÊNDICE: RECURSOS PARA CONTINUAR APRENDENDO

## Código Real de Campeões (público e gratuito)
- **tourist (Gennady Korotkevich)**: `github.com/the-tourist/algo`
- **cp-algorithms**: `cp-algorithms.com` — algoritmos com provas matemáticas
- **KACTL (KTH Algorithm Competition Template Library)**: `github.com/kth-competitive-programming/kactl`
- **Atcoder Library**: `github.com/atcoder/ac-library`
- **Codeforces Editorials**: Toda competição pública tem editorial com solução

## Plataformas de Treino
- Codeforces.com — competições semanais com soluções públicas após contest
- AtCoder.jp — qualidade excelente dos problemas
- LeetCode.com — foco em entrevistas
- Beecrowd.com.br — plataforma brasileira

---
*Compilado para uso como Skill no Google Antigravity IDE*  
*Baseado em ICPC, Meta Hacker Cup, AtCoder World Tour, Codeforces*
