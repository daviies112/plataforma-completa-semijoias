---
id: the_guardian
department: SPECIAL_OPS
role: ROBUSTNESS_ARCHITECT
status: ACTIVE
complexity: 10
---

# 🛡️ The Guardian (Robustness & Security Architect)

**Objective: "Defense in Depth. Zero Flaws."**

## 1. CAPABILITIES
- **Design Patterns:** Strategy, Observer, Repository, Builder.
- **Error Handling:** Circuit Breakers, Retries, Result Types.
- **Security:** SQL Injection prevention, Input Sanitization.


## 11.1 — Strategy Pattern (Algoritmos Intercambiáveis)
```python
from abc import ABC, abstractmethod
from typing import List

class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: list) -> list: ...

class QuickSort(SortStrategy):
    def sort(self, data: list) -> list:
        if len(data) <= 1: return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        mid  = [x for x in data if x == pivot]
        right= [x for x in data if x > pivot]
        return self.sort(left) + mid + self.sort(right)

class MergeSort(SortStrategy):
    def sort(self, data: list) -> list:
        if len(data) <= 1: return data
        mid = len(data) // 2
        left  = self.sort(data[:mid])
        right = self.sort(data[mid:])
        return self._merge(left, right)
    
    def _merge(self, l, r):
        result, i, j = [], 0, 0
        while i < len(l) and j < len(r):
            if l[i] <= r[j]: result.append(l[i]); i += 1
            else: result.append(r[j]); j += 1
        return result + l[i:] + r[j:]

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy
    
    def sort(self, data: list) -> list:
        return self._strategy.sort(data)
```

```cpp
// C++ — Strategy com template (zero overhead)
template<typename Compare = std::less<int>>
void sort_with(std::vector<int>& v, Compare cmp = Compare{}) {
    std::sort(v.begin(), v.end(), cmp);
}

// uso:
// sort_with(v);                           // crescente
// sort_with(v, std::greater<int>{});      // decrescente
// sort_with(v, [](int a, int b){ return abs(a) < abs(b); }); // valor absoluto
```

## 11.2 — Observer Pattern (Event-Driven)
```python
from typing import Callable, Dict, List

class EventEmitter:
    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}
    
    def on(self, event: str, callback: Callable) -> 'EventEmitter':
        self._listeners.setdefault(event, []).append(callback)
        return self
    
    def off(self, event: str, callback: Callable) -> None:
        if event in self._listeners:
            self._listeners[event] = [cb for cb in self._listeners[event] if cb != callback]
    
    def emit(self, event: str, *args, **kwargs) -> None:
        for cb in self._listeners.get(event, []):
            cb(*args, **kwargs)
    
    def once(self, event: str, callback: Callable) -> None:
        def wrapper(*args, **kwargs):
            callback(*args, **kwargs)
            self.off(event, wrapper)
        self.on(event, wrapper)
```

## 11.3 — Builder Pattern (Construção Fluida)
```python
class QueryBuilder:
    def __init__(self, table: str):
        self._table = table
        self._conditions: List[str] = []
        self._fields: List[str] = ['*']
        self._limit: int | None = None
        self._order: str | None = None
    
    def select(self, *fields: str) -> 'QueryBuilder':
        self._fields = list(fields)
        return self
    
    def where(self, condition: str) -> 'QueryBuilder':
        self._conditions.append(condition)
        return self
    
    def order_by(self, field: str, desc: bool = False) -> 'QueryBuilder':
        self._order = f"{field} {'DESC' if desc else 'ASC'}"
        return self
    
    def limit(self, n: int) -> 'QueryBuilder':
        self._limit = n
        return self
    
    def build(self) -> str:
        query = f"SELECT {', '.join(self._fields)} FROM {self._table}"
        if self._conditions:
            query += f" WHERE {' AND '.join(self._conditions)}"
        if self._order:
            query += f" ORDER BY {self._order}"
        if self._limit:
            query += f" LIMIT {self._limit}"
        return query

# uso:
# q = QueryBuilder('users').select('name','email').where('age > 18').limit(10).build()
```

## 11.4 — Repository Pattern (Camada de Dados)
```python
from typing import TypeVar, Generic, Optional, List
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    @abstractmethod
    def find_by_id(self, id: int) -> Optional[T]: ...
    
    @abstractmethod
    def find_all(self) -> List[T]: ...
    
    @abstractmethod
    def save(self, entity: T) -> T: ...
    
    @abstractmethod
    def delete(self, id: int) -> bool: ...

@dataclass
class User:
    id: int
    name: str
    email: str

class InMemoryUserRepository(Repository[User]):
    def __init__(self):
        self._store: dict[int, User] = {}
        self._next_id = 1
    
    def find_by_id(self, id: int) -> Optional[User]:
        return self._store.get(id)
    
    def find_all(self) -> List[User]:
        return list(self._store.values())
    
    def save(self, user: User) -> User:
        if user.id == 0:
            user = User(self._next_id, user.name, user.email)
            self._next_id += 1
        self._store[user.id] = user
        return user
    
    def delete(self, id: int) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
```

---

# PARTE 12: TRATAMENTO DE ERROS ROBUSTO

## 12.1 — Result Type (sem exceções)
```python
from typing import TypeVar, Generic, Union
from dataclasses import dataclass

T = TypeVar('T')
E = TypeVar('E')

@dataclass
class Ok(Generic[T]):
    value: T
    def is_ok(self) -> bool: return True
    def is_err(self) -> bool: return False
    def unwrap(self) -> T: return self.value
    def unwrap_or(self, default: T) -> T: return self.value

@dataclass  
class Err(Generic[E]):
    error: E
    def is_ok(self) -> bool: return False
    def is_err(self) -> bool: return True
    def unwrap(self): raise ValueError(f"Called unwrap on Err: {self.error}")
    def unwrap_or(self, default): return default

Result = Union[Ok[T], Err[E]]

# uso:
def divide(a: float, b: float) -> Result:
    if b == 0:
        return Err("Division by zero")
    return Ok(a / b)

result = divide(10, 0)
value = result.unwrap_or(0)  # seguro
```

## 12.2 — Retry com Backoff Exponencial
```python
import time
import random
from functools import wraps
from typing import Type, Tuple

def retry(
    max_attempts: int = 3,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    jitter: bool = True
):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        raise
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    if jitter:
                        delay *= (0.5 + random.random() * 0.5)
                    print(f"Attempt {attempt+1} failed: {e}. Retrying in {delay:.1f}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, exceptions=(ConnectionError, TimeoutError))
def fetch_data(url: str) -> dict:
    # ... código que pode falhar ...
    pass
```

## 12.3 — Circuit Breaker
```python
import time
from enum import Enum
from threading import Lock

class CircuitState(Enum):
    CLOSED = "closed"      # funcionando normalmente
    OPEN = "open"          # bloqueado após falhas
    HALF_OPEN = "half_open" # testando recuperação

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60, success_threshold=2):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self._lock = Lock()
    
    def call(self, func, *args, **kwargs):
        with self._lock:
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                else:
                    raise Exception("Circuit is OPEN — service unavailable")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        with self._lock:
            self.failure_count = 0
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
```

---

# PARTE 13: OTIMIZAÇÕES DE PERFORMANCE

## 13.1 — Memoização e Cache
```python
from functools import lru_cache
from typing import Any
import hashlib, json

# lru_cache — para funções puras com argumentos hashable
@lru_cache(maxsize=None)  # maxsize=None = ilimitado
def fibonacci(n: int) -> int:
    if n < 2: return n
    return fibonacci(n-1) + fibonacci(n-2)

# Cache manual para objetos não-hashable
class Cache:
    def __init__(self, max_size=1000):
        self._cache = {}
        self._max_size = max_size
        self._access_order = []
    
    def _make_key(self, args, kwargs) -> str:
        return hashlib.md5(json.dumps([args, kwargs], sort_keys=True).encode()).hexdigest()
    
    def get_or_compute(self, func, *args, **kwargs) -> Any:
        key = self._make_key(args, kwargs)
        if key not in self._cache:
            if len(self._cache) >= self._max_size:
                oldest = self._access_order.pop(0)
                del self._cache[oldest]
            self._cache[key] = func(*args, **kwargs)
            self._access_order.append(key)
        return self._cache[key]
```

## 13.2 — Processamento em Batch
```python
from typing import List, TypeVar, Iterator, Callable
import asyncio

T = TypeVar('T')
R = TypeVar('R')

def batch(items: List[T], size: int) -> Iterator[List[T]]:
    """Divide lista em lotes"""
    for i in range(0, len(items), size):
        yield items[i:i+size]

async def process_batch_async(
    items: List[T],
    processor: Callable,
    batch_size: int = 100,
    concurrency: int = 10
) -> List[R]:
    """Processa em lotes com controle de concorrência"""
    semaphore = asyncio.Semaphore(concurrency)
    results = []
    
    async def process_item(item):
        async with semaphore:
            return await processor(item)
    
    for batch_items in batch(items, batch_size):
        batch_results = await asyncio.gather(*[process_item(item) for item in batch_items])
        results.extend(batch_results)
    
    return results
```

## 13.3 — Pool de Objetos (Object Pool)
```python
from queue import Queue
from contextlib import contextmanager
from typing import Callable

class ObjectPool:
    def __init__(self, factory: Callable, max_size: int = 10):
        self._factory = factory
        self._pool = Queue(maxsize=max_size)
        for _ in range(max_size):
            self._pool.put(factory())
    
    @contextmanager
    def acquire(self):
        obj = self._pool.get()
        try:
            yield obj
        finally:
            self._pool.put(obj)  # sempre devolve ao pool

# uso:
# pool = ObjectPool(lambda: create_db_connection(), max_size=5)
# with pool.acquire() as conn:
#     conn.execute(query)
```

---

# PARTE 14: CONCORRÊNCIA E PARALELISMO

## 14.1 — Thread-Safe Queue Producer-Consumer
```python
import threading
from queue import Queue
from typing import Callable, Any

class WorkerPool:
    def __init__(self, num_workers: int, task_fn: Callable):
        self._queue = Queue()
        self._workers = []
        self._task_fn = task_fn
        self._results = []
        self._lock = threading.Lock()
        
        for _ in range(num_workers):
            t = threading.Thread(target=self._worker, daemon=True)
            t.start()
            self._workers.append(t)
    
    def _worker(self):
        while True:
            item = self._queue.get()
            if item is None: break  # sinal de parada
            result = self._task_fn(item)
            with self._lock:
                self._results.append(result)
            self._queue.task_done()
    
    def submit(self, item: Any):
        self._queue.put(item)
    
    def wait(self) -> list:
        self._queue.join()
        for _ in self._workers:
            self._queue.put(None)  # sinal de parada para cada worker
        for w in self._workers:
            w.join()
        return self._results
```

## 14.2 — Async/Await Robusto
```python
import asyncio
import aiohttp
from typing import List

async def fetch_with_timeout(session, url: str, timeout: float = 10.0) -> dict:
    try:
        async with asyncio.timeout(timeout):
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.json()
    except asyncio.TimeoutError:
        return {"error": "timeout", "url": url}
    except aiohttp.ClientError as e:
        return {"error": str(e), "url": url}

async def fetch_all(urls: List[str]) -> List[dict]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_with_timeout(session, url) for url in urls]
        return await asyncio.gather(*tasks, return_exceptions=False)

# uso: results = asyncio.run(fetch_all(urls))
```

---

# PARTE 15: VALIDAÇÃO E SANITIZAÇÃO

## 15.1 — Validação com Dataclasses e Pydantic-style
```python
from dataclasses import dataclass, field
from typing import Optional
import re

@dataclass
class UserInput:
    name: str
    email: str
    age: int
    phone: Optional[str] = None
    
    def __post_init__(self):
        errors = []
        
        # Validação de nome
        self.name = self.name.strip()
        if len(self.name) < 2:
            errors.append("Name must be at least 2 characters")
        if len(self.name) > 100:
            errors.append("Name must be at most 100 characters")
        
        # Validação de email
        email_pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, self.email):
            errors.append("Invalid email format")
        
        # Validação de idade
        if not (0 < self.age < 150):
            errors.append("Age must be between 1 and 149")
        
        # Validação de telefone
        if self.phone is not None:
            phone_clean = re.sub(r'[\s\-\(\)]', '', self.phone)
            if not re.match(r'^\+?[0-9]{8,15}$', phone_clean):
                errors.append("Invalid phone format")
            self.phone = phone_clean
        
        if errors:
            raise ValueError(f"Validation failed: {'; '.join(errors)}")
```

## 15.2 — Sanitização SQL (Prevenção de Injection)
```python
import sqlite3
from typing import Any, List, Tuple

class SafeDB:
    """NUNCA concatenar strings em SQL — usar parâmetros sempre"""
    
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
    
    def execute(self, query: str, params: Tuple[Any, ...] = ()) -> list:
        """Execute com parâmetros — imune a SQL injection"""
        cursor = self.conn.execute(query, params)  # params são escapados automaticamente
        self.conn.commit()
        return cursor.fetchall()
    
    # ❌ ERRADO — NUNCA faça isso:
    # query = f"SELECT * FROM users WHERE name = '{name}'"  # SQL INJECTION!
    
    # ✅ CORRETO — sempre use placeholders:
    # self.execute("SELECT * FROM users WHERE name = ?", (name,))
    
    def find_user(self, name: str) -> list:
        return self.execute(
            "SELECT * FROM users WHERE name = ? AND active = 1",
            (name,)
        )
```

---

# PARTE 16: TESTES

## 16.1 — Property-Based Testing
```python
# Teste por propriedades (como os competidores verificam suas soluções)
import random

def brute_force_lis(arr):
    """Solução O(n²) para validar a solução O(n log n)"""
    n = len(arr)
    dp = [1] * n
    for i in range(1, n):
        for j in range(i):
            if arr[j] < arr[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp) if dp else 0

def test_lis_random(n_tests=1000, max_n=20, max_val=50):
    for _ in range(n_tests):
        n = random.randint(1, max_n)
        arr = [random.randint(0, max_val) for _ in range(n)]
        expected = brute_force_lis(arr)
        actual = lis(arr)  # nossa solução O(n log n)
        if expected != actual:
            print(f"FAILED: arr={arr}, expected={expected}, got={actual}")
            return False
    print(f"PASSED: {n_tests} random tests")
    return True

# Teste de estresse — execução contínua até encontrar bug
def stress_test(solution, brute_force, generator, n_tests=10000):
    for i in range(n_tests):
        test_input = generator()
        expected = brute_force(test_input)
        actual = solution(test_input)
        if expected != actual:
            print(f"BUG FOUND at test {i}!")
            print(f"Input: {test_input}")
            print(f"Expected: {expected}")
            print(f"Got: {actual}")
            return test_input
    print(f"All {n_tests} tests passed!")
    return None
```

## 16.2 — Unit Tests Estruturados
```python
import unittest
from typing import Callable, Any

class AlgorithmTests(unittest.TestCase):
    
    def assert_equal_with_msg(self, func: Callable, args: Any, expected: Any, msg: str = ""):
        result = func(*args) if isinstance(args, tuple) else func(args)
        self.assertEqual(
            result, expected,
            f"\nInput:    {args}\nExpected: {expected}\nGot:      {result}\n{msg}"
        )
    
    def test_edge_cases(self):
        # Sempre teste: vazio, tamanho 1, todos iguais, já ordenado, reverso
        cases = [
            ([], 0),
            ([5], 1),
            ([1, 1, 1], 1),
            ([1, 2, 3], 3),
            ([3, 2, 1], 1),
        ]
        for arr, expected in cases:
            with self.subTest(arr=arr):
                self.assert_equal_with_msg(lis, (arr,), expected)
```

---

# PARTE 17: TEMPLATES JAVASCRIPT/TYPESCRIPT AVANÇADOS

## 17.1 — TypeScript Genérico e Seguro
```typescript
// Generic Result type — sem any
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
    return { ok: false, error };
}

// Função assíncrona com tratamento de erro seguro
async function safeFetch<T>(url: string): Promise<Result<T>> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return Err(new Error(`HTTP ${response.status}: ${response.statusText}`));
        }
        const data = await response.json() as T;
        return Ok(data);
    } catch (e) {
        return Err(e instanceof Error ? e : new Error(String(e)));
    }
}

// uso:
// const result = await safeFetch<User[]>('/api/users');
// if (result.ok) { console.log(result.value); }
// else { console.error(result.error); }
```

## 17.2 — State Machine Robusta
```typescript
type State = 'idle' | 'loading' | 'success' | 'error';
type Event = 
  | { type: 'FETCH'; url: string }
  | { type: 'SUCCESS'; data: unknown }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

interface Context {
    data: unknown | null;
    error: string | null;
    url: string | null;
}

class StateMachine {
    private state: State = 'idle';
    private context: Context = { data: null, error: null, url: null };
    private listeners: Set<(state: State, ctx: Context) => void> = new Set();
    
    // Tabela de transições válidas
    private transitions: Record<State, Partial<Record<Event['type'], State>>> = {
        idle:    { FETCH: 'loading' },
        loading: { SUCCESS: 'success', ERROR: 'error' },
        success: { FETCH: 'loading', RESET: 'idle' },
        error:   { FETCH: 'loading', RESET: 'idle' },
    };
    
    send(event: Event): void {
        const nextState = this.transitions[this.state]?.[event.type];
        if (!nextState) {
            console.warn(`Invalid transition: ${this.state} + ${event.type}`);
            return;
        }
        
        // Atualiza contexto
        if (event.type === 'FETCH') this.context.url = event.url;
        if (event.type === 'SUCCESS') { this.context.data = event.data; this.context.error = null; }
        if (event.type === 'ERROR') { this.context.error = event.message; this.context.data = null; }
        if (event.type === 'RESET') this.context = { data: null, error: null, url: null };
        
        this.state = nextState;
        this.listeners.forEach(l => l(this.state, this.context));
    }
    
    subscribe(listener: (state: State, ctx: Context) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    getState() { return { state: this.state, context: this.context }; }
}
```

---

# PARTE 18: PADRÕES JAVA AVANÇADOS

## 18.1 — Immutable Value Objects
```java
import java.util.Objects;

public final class Money {
    private final long cents;
    private final String currency;
    
    public Money(long cents, String currency) {
        if (cents < 0) throw new IllegalArgumentException("Cents cannot be negative");
        this.cents = cents;
        this.currency = Objects.requireNonNull(currency, "Currency cannot be null");
    }
    
    public Money add(Money other) {
        if (!this.currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
        return new Money(this.cents + other.cents, this.currency);
    }
    
    public Money subtract(Money other) {
        if (!this.currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
        if (this.cents < other.cents)
            throw new ArithmeticException("Insufficient funds");
        return new Money(this.cents - other.cents, this.currency);
    }
    
    public Money multiply(int factor) {
        return new Money(this.cents * factor, this.currency);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        Money money = (Money) o;
        return cents == money.cents && currency.equals(money.currency);
    }
    
    @Override
    public int hashCode() { return Objects.hash(cents, currency); }
    
    @Override
    public String toString() {
        return String.format("%s %.2f", currency, cents / 100.0);
    }
}
```

## 18.2 — Generics Avançados em Java
```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class GenericUtils {
    
    // Pair genérico imutável
    public record Pair<A, B>(A first, B second) {
        public static <A, B> Pair<A, B> of(A a, B b) { return new Pair<>(a, b); }
        public <C> Pair<C, B> mapFirst(Function<A, C> f) { return of(f.apply(first), second); }
        public <C> Pair<A, C> mapSecond(Function<B, C> f) { return of(first, f.apply(second)); }
    }
    
    // Group by com streams
    public static <T, K> Map<K, List<T>> groupBy(List<T> items, Function<T, K> keyFn) {
        return items.stream().collect(Collectors.groupingBy(keyFn));
    }
    
    // Flatten nested lists
    public static <T> List<T> flatten(List<List<T>> nested) {
        return nested.stream().flatMap(Collection::stream).collect(Collectors.toList());
    }
    
    // Sliding window
    public static <T> List<List<T>> sliding(List<T> list, int size) {
        return IntStream.rangeClosed(0, list.size() - size)
            .mapToObj(i -> list.subList(i, i + size))
            .collect(Collectors.toList());
    }
}
```

---

# PARTE 19: ANTI-PATTERNS — O QUE EVITAR

## 19.1 — Problemas Comuns em Competições
```python
# ❌ ERRADO: Usar list como defaultdict
graph = []  # IndexError garantido
# ✅ CORRETO:
from collections import defaultdict
graph = defaultdict(list)

# ❌ ERRADO: Modificar lista enquanto itera
for i, x in enumerate(arr):
    if x < 0: arr.remove(x)  # skips elements!
# ✅ CORRETO:
arr = [x for x in arr if x >= 0]

# ❌ ERRADO: Float para comparação exata
if 0.1 + 0.2 == 0.3:  # FALSO em ponto flutuante!
    pass
# ✅ CORRETO:
EPS = 1e-9
if abs(0.1 + 0.2 - 0.3) < EPS:
    pass

# ❌ ERRADO: Recursão sem limite em Python
def dfs(node): dfs(neighbor)  # RecursionError para grafos grandes
# ✅ CORRETO: DFS iterativo com pilha explícita

# ❌ ERRADO: O(n²) sem perceber
for i in range(n):
    if x in big_list:  # list membership é O(n)!
        pass
# ✅ CORRETO:
big_set = set(big_list)  # O(1) membership
if x in big_set: pass

# ❌ ERRADO: String concatenation em loop
result = ""
for s in strings: result += s  # O(n²) em strings imutáveis!
# ✅ CORRETO:
result = "".join(strings)  # O(n)
```

## 19.2 — C++ Armadilhas Clássicas
```cpp
// ❌ ERRADO: Integer overflow silencioso
int n = 1e5;
int ans = n * n;  // overflow! n*n > INT_MAX

// ✅ CORRETO:
long long ans = (long long)n * n;

// ❌ ERRADO: Comparar int com size_t (unsigned)
vector<int> v = {1, 2, 3};
for (int i = v.size() - 1; i >= 0; i--)  // BUGADO se v vazio! size()-1 underflow!

// ✅ CORRETO:
for (int i = (int)v.size() - 1; i >= 0; i--)

// ❌ ERRADO: Iterator invalidation
for (auto it = v.begin(); it != v.end(); it++) {
    v.push_back(*it);  // UNDEFINED BEHAVIOR
}

// ❌ ERRADO: Usar == com floats
double x = sqrt(2.0);
if (x * x == 2.0)  // pode ser falso!

// ✅ CORRETO:
if (abs(x * x - 2.0) < 1e-9)
```

## 19.3 — Java Armadilhas
```java
// ❌ ERRADO: equals() com ==
String a = "hello";
String b = new String("hello");
if (a == b)  // FALSO! Compara referências, não valor

// ✅ CORRETO:
if (a.equals(b))

// ❌ ERRADO: Integer cache trap
Integer x = 200;
Integer y = 200;
if (x == y)  // FALSO! (> 127 não é cached)
if (x.equals(y))  // VERDADEIRO ✅

// ❌ ERRADO: ConcurrentModificationException
for (int item : list) {
    if (item < 0) list.remove(item);  // throws!
}
// ✅ CORRETO:
list.removeIf(item -> item < 0);

// ❌ ERRADO: NullPointerException
String s = null;
if (s.equals("test"))  // NPE!

// ✅ CORRETO:
if ("test".equals(s))  // null-safe
// ou:
if (Objects.equals(s, "test"))
```

---

# PARTE 20: PROMPTS PARA GEMINI/CLAUDE NO ANTIGRAVITY

## 20.1 — Templates de Prompt para Geração de Código Robusto

```
# Prompt: Implementar Algoritmo
Implemente [ALGORITMO] em [LINGUAGEM] com as seguintes garantias:
- Complexidade de tempo: O(?)
- Complexidade de espaço: O(?)
- Tratamento de edge cases: array vazio, elemento único, todos iguais, overflow
- Inclua docstring com exemplo de uso
- Adicione assertions para validação de input
- Use type hints (Python) ou tipos fortes (C++/Java/TS)
```

```
# Prompt: Code Review
Faça code review do código abaixo considerando:
1. Correctness: há bugs lógicos ou edge cases não tratados?
2. Performance: há complexidade evitável? (loops aninhados desnecessários, uso errado de estrutura de dados)
3. Robustez: tratamento de null/None, overflow, divisão por zero?
4. Legibilidade: nomes descritivos, funções pequenas?
5. Segurança: SQL injection, inputs não sanitizados?
Código: [CÓDIGO]
```

```
# Prompt: Otimização
O código abaixo tem complexidade O(?). 
Objetivo: reduzir para O(?) mantendo corretude.
Restrições: [LIMITES DO PROBLEMA]
Hints disponíveis: [LISTAR SE HOUVER]
Código atual: [CÓDIGO]
```

```
# Prompt: Debug
O código abaixo produz output errado para o seguinte caso de teste:
Input: [INPUT]
Output esperado: [ESPERADO]
Output obtido: [OBTIDO]
Encontre e corrija o bug. Explique a causa raiz.
Código: [CÓDIGO]
```

---

# REFERÊNCIA FINAL: COMPLEXIDADES POR ALGORITMO

| Algoritmo | Melhor | Médio | Pior | Espaço |
|-----------|--------|-------|------|--------|
| QuickSort | O(n log n) | O(n log n) | O(n²) | O(log n) |
| MergeSort | O(n log n) | O(n log n) | O(n log n) | O(n) |
| HeapSort | O(n log n) | O(n log n) | O(n log n) | O(1) |
| BinarySearch | O(1) | O(log n) | O(log n) | O(1) |
| BFS/DFS | O(V+E) | O(V+E) | O(V+E) | O(V) |
| Dijkstra | O((V+E)logV) | O((V+E)logV) | O((V+E)logV) | O(V) |
| Bellman-Ford | O(VE) | O(VE) | O(VE) | O(V) |
| Floyd-Warshall | O(V³) | O(V³) | O(V³) | O(V²) |
| Kruskal MST | O(E log E) | O(E log E) | O(E log E) | O(V) |
| KMP | O(n+m) | O(n+m) | O(n+m) | O(m) |
| DP Knapsack 0/1 | O(nW) | O(nW) | O(nW) | O(W) |
| LIS (otimizado) | O(n log n) | O(n log n) | O(n log n) | O(n) |
| FFT | O(n log n) | O(n log n) | O(n log n) | O(n) |

---
*Parte 2 do Skill Pack para Google Antigravity IDE*
*Cobre: Design Patterns · Robustez · Concorrência · Validação · Anti-patterns · Prompts*
