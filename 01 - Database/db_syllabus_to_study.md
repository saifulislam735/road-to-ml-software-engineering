db_syllabus_to_study 
# Database Study Plan — 14 Days

> **Goal:** SQL mastery + NoSQL proficiency + System Design fundamentals  
> **Daily commitment:** 2–3 hours — concept study, hands-on coding, system design reading  
> **No overlap. No fluff. Ship code every day.**

---

## Daily Structure

Every day follows the same 3-block rhythm:

| Block | Time | What you do |
|-------|------|-------------|
| Concept | 40–50 min | Read, take notes, draw diagrams |
| Code | 70–85 min | Write real queries / scripts — no skipping |
| SysDesign | 30–40 min | Read assigned Bangla chapter(s) |

---

## Week 1 — SQL Mastery

### Day 1 — JOIN types: INNER, LEFT, RIGHT

**Focus:** Core JOIN syntax until it's automatic

**Concept (45 min)**
- INNER JOIN — only rows matching in both tables
- LEFT JOIN — all rows from left + matched right (NULL if no match)
- RIGHT JOIN — all rows from right + matched left (NULL if no match)
- NULL behavior — understand what shows up when there's no match
- Write each type on paper before touching the keyboard

**Code (75 min)**
```sql
-- Tables to create and use all week
-- employees(id, name, dept_id, salary, manager_id)
-- departments(id, name, location)
-- orders(id, customer_id, product_id, amount, created_at)
-- products(id, name, category, price)
-- customers(id, name, email, country)

-- INNER JOIN: employees with their department
SELECT e.name, d.name AS dept
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;

-- LEFT JOIN: all employees, even without a department
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;

-- RIGHT JOIN: all departments, even with no employees
SELECT e.name, d.name AS dept
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.id;

-- Practice task: find customers who have NEVER placed an order
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
```

**System Design (30 min)**
- [Ch.01 — ডেটাবেস ও DBMS](https://www.systemdesignbangla.com/chapters/database.html)
- [Ch.02 — SQL ডেটাবেস](https://www.systemdesignbangla.com/chapters/sql.html)

---

### Day 2 — JOIN types: FULL OUTER, SELF, CROSS + GROUP BY / HAVING

**Focus:** Less common JOINs + aggregation syntax

**Concept (40 min)**
- FULL OUTER JOIN — all rows from both sides, NULLs where no match
- SELF JOIN — joining a table to itself (hierarchies, comparisons)
- CROSS JOIN — cartesian product (every row × every row)
- GROUP BY — collapse rows into groups
- HAVING — filter after grouping (WHERE filters before)

**Code (80 min)**
```sql
-- FULL OUTER JOIN: everyone, matched or not
SELECT e.name, d.name AS dept
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.id;

-- SELF JOIN: manager name for each employee
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- CROSS JOIN: every possible employee–product pairing
SELECT e.name, p.name AS product
FROM employees e
CROSS JOIN products p;

-- GROUP BY + HAVING: departments with avg salary > 60000
SELECT d.name, AVG(e.salary) AS avg_salary, COUNT(*) AS headcount
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.name
HAVING AVG(e.salary) > 60000
ORDER BY avg_salary DESC;

-- Practice task: sales per product category, only categories > $10,000 total
SELECT p.category, SUM(o.amount) AS total_sales
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY p.category
HAVING SUM(o.amount) > 10000;
```

**System Design (30 min)**
- [Ch.06 — ইনডেক্সেস](https://www.systemdesignbangla.com/chapters/indexes.html) — first read, deep dive comes Day 6

---

### Day 3 — Subqueries: correlated, nested, EXISTS vs IN

**Focus:** Know exactly when each form is appropriate

**Concept (45 min)**
- Non-correlated subquery — runs once, result reused by outer query
- Correlated subquery — runs once per row of outer query (slower)
- Subquery in WHERE — filter using a derived value
- Subquery in FROM — treat a query result as a table (derived table)
- Subquery in SELECT — compute a per-row value inline
- EXISTS — returns true/false, stops at first match (fast for "does it exist")
- IN — loads entire result set into memory, then checks membership

**When to use EXISTS vs IN:**
- Use EXISTS when the subquery table is large — it short-circuits
- Use IN when the subquery result is small and values are simple
- EXISTS handles NULLs more safely

**Code (75 min)**
```sql
-- Non-correlated: employees earning above overall average
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Correlated: employees earning above their OWN dept average
SELECT name, salary, dept_id
FROM employees e
WHERE salary > (
  SELECT AVG(salary)
  FROM employees
  WHERE dept_id = e.dept_id
);

-- Subquery in FROM (derived table)
SELECT dept_id, avg_sal
FROM (
  SELECT dept_id, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY dept_id
) dept_avgs
WHERE avg_sal > 55000;

-- Subquery in SELECT (scalar)
SELECT name,
  salary,
  (SELECT AVG(salary) FROM employees) AS company_avg,
  salary - (SELECT AVG(salary) FROM employees) AS diff
FROM employees;

-- EXISTS: customers who have placed at least one order
SELECT name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- IN equivalent (compare performance with EXPLAIN)
SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders);

-- Practice task: rewrite the EXISTS query as a JOIN, compare query plans
```

**System Design (30 min)**
- [Ch.07 — নর্মালাইজেশন ও ডিনর্মালাইজেশন](https://www.systemdesignbangla.com/chapters/normalization.html) — first read

---

### Day 4 — CTEs + Database Design & Normalization

**Focus:** CTEs for readable queries; design skills that show up in system design interviews

**Concept (40 min)**
- WITH clause — names a temporary result set, readable top-down
- Non-recursive CTE — multi-step data prep without nested subqueries
- Recursive CTE — self-referencing, for trees and hierarchies
- 1NF — atomic values, no repeating groups
- 2NF — no partial dependency on a composite key
- 3NF — no transitive dependency (non-key → non-key)
- BCNF — every determinant is a candidate key
- ERD basics — entities, attributes, cardinality (1:1, 1:N, M:N)
- Foreign keys, ON DELETE CASCADE, ON UPDATE CASCADE, constraints

**Code (80 min)**
```sql
-- Non-recursive CTE: top earners per department
WITH dept_avg AS (
  SELECT dept_id, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY dept_id
),
top_earners AS (
  SELECT e.name, e.salary, e.dept_id
  FROM employees e
  JOIN dept_avg da ON e.dept_id = da.dept_id
  WHERE e.salary > da.avg_sal * 1.2
)
SELECT te.name, te.salary, d.name AS dept
FROM top_earners te
JOIN departments d ON te.dept_id = d.id;

-- Recursive CTE: full org chart (manager hierarchy)
WITH RECURSIVE org AS (
  -- anchor: top-level employees (no manager)
  SELECT id, name, manager_id, 0 AS depth, name::text AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- recursive step
  SELECT e.id, e.name, e.manager_id, o.depth + 1, o.path || ' > ' || e.name
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT depth, path FROM org ORDER BY path;

-- Practice task: normalize this flat table to 3NF
-- orders_flat(order_id, customer_name, customer_email, product_name, category, price, qty)
-- Step 1: identify dependencies
-- Step 2: split into customers, products, orders, order_items
-- Step 3: add foreign keys
```

**Normalization cheat sheet:**

| Form | Rule | Violation example |
|------|------|-------------------|
| 1NF | Atomic values, no arrays | `tags = "sql,python"` in one column |
| 2NF | No partial dependency | `order_id + product_id → product_name` (product_name depends only on product_id) |
| 3NF | No transitive dependency | `employee → dept_id → dept_location` (location doesn't depend on employee) |
| BCNF | Every determinant is a candidate key | Rare edge case, but know the definition |

**System Design (30 min)**
- [Ch.07 — নর্মালাইজেশন](https://www.systemdesignbangla.com/chapters/normalization.html) — finish or re-read

---

### Day 5 — Window Functions: ranking & navigation

**Focus:** The most interview-tested SQL feature — master the syntax

**Concept (45 min)**
- Window functions operate on a set of rows related to current row
- They do NOT collapse rows like GROUP BY does
- `OVER (PARTITION BY ... ORDER BY ...)` — defines the window
- ROW_NUMBER() — unique sequential number, no ties
- RANK() — ties get same number, next rank skips (1, 2, 2, 4)
- DENSE_RANK() — ties get same number, no skip (1, 2, 2, 3)
- LEAD(col, n) — value n rows ahead
- LAG(col, n) — value n rows behind

**Code (75 min)**
```sql
-- ROW_NUMBER: unique rank per department by salary
SELECT name, dept_id, salary,
  ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
FROM employees;

-- Top 1 per department using ROW_NUMBER in CTE
WITH ranked AS (
  SELECT name, dept_id, salary,
    ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
  FROM employees
)
SELECT name, dept_id, salary FROM ranked WHERE rn = 1;

-- RANK vs DENSE_RANK: observe the gap difference
SELECT name, salary,
  RANK()       OVER (ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;

-- LAG: month-over-month revenue change
SELECT month, revenue,
  LAG(revenue, 1) OVER (ORDER BY month) AS prev_month,
  revenue - LAG(revenue, 1) OVER (ORDER BY month) AS change
FROM monthly_revenue;

-- LEAD: days until next order per customer
SELECT customer_id, created_at,
  LEAD(created_at, 1) OVER (PARTITION BY customer_id ORDER BY created_at) AS next_order,
  LEAD(created_at, 1) OVER (PARTITION BY customer_id ORDER BY created_at) - created_at AS days_to_next
FROM orders;

-- Practice task: find the 2nd highest salary in each department (no LIMIT)
```

**System Design (30 min)**
- [Ch.11 — ট্রানজেকশন](https://www.systemdesignbangla.com/chapters/transactions.html)

---

### Day 6 — Window Functions: aggregate + Indexing deep dive

**Focus:** Aggregate windows + understanding indexes at the mechanical level

**Concept (35 min)**
- SUM/AVG/COUNT OVER — running totals, moving averages
- NTILE(n) — divide rows into n equal buckets
- FIRST_VALUE / LAST_VALUE — first/last value in the window frame
- B-Tree index — sorted tree, good for range queries and equality
- Hash index — exact equality only, O(1) lookup, no range support
- Composite index — column order matters; leading column must match query
- Covering index — includes all columns a query needs (no heap lookup)
- EXPLAIN / EXPLAIN ANALYZE — read Seq Scan vs Index Scan vs Index Only Scan

**Code (85 min)**
```sql
-- Running total of sales by date
SELECT created_at, amount,
  SUM(amount) OVER (ORDER BY created_at) AS running_total
FROM orders;

-- Moving average (last 7 days)
SELECT created_at, amount,
  AVG(amount) OVER (ORDER BY created_at ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
FROM orders;

-- NTILE: divide customers into 4 revenue quartiles
SELECT customer_id, total_spent,
  NTILE(4) OVER (ORDER BY total_spent DESC) AS quartile
FROM customer_totals;

-- FIRST_VALUE: show each employee's dept highest salary alongside theirs
SELECT name, salary,
  FIRST_VALUE(salary) OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_max
FROM employees;

-- Index exercises
-- Create and compare:
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_composite ON orders(customer_id, created_at);
CREATE INDEX idx_covering ON orders(customer_id, created_at) INCLUDE (amount);

-- Read query plans
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 5;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 5 AND created_at > '2024-01-01';

-- Composite index rule: this USES the index (leading column matches)
SELECT * FROM orders WHERE customer_id = 5;

-- This does NOT use the composite index efficiently
SELECT * FROM orders WHERE created_at > '2024-01-01';
```

**When NOT to use an index:**
- Tables with very few rows (full scan is faster)
- Columns with very low cardinality (e.g., boolean, gender)
- Columns rarely used in WHERE / JOIN / ORDER BY
- Heavy write tables where index maintenance cost exceeds read benefit

**System Design (30 min)**
- [Ch.06 — ইনডেক্সেস](https://www.systemdesignbangla.com/chapters/indexes.html) — deep re-read with the index knowledge you now have

---

### Day 7 — Transactions, ACID, Query Optimization

**Focus:** Everything needed to talk about database reliability in interviews

**Concept (45 min)**
- **Atomicity** — all operations succeed or none do (no partial writes)
- **Consistency** — transaction takes DB from one valid state to another
- **Isolation** — concurrent transactions don't see each other's intermediate state
- **Durability** — committed data survives crashes (written to disk/WAL)

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
|-----------------|-----------|--------------------|--------------| 
| READ UNCOMMITTED | ✓ possible | ✓ possible | ✓ possible |
| READ COMMITTED | ✗ prevented | ✓ possible | ✓ possible |
| REPEATABLE READ | ✗ prevented | ✗ prevented | ✓ possible |
| SERIALIZABLE | ✗ prevented | ✗ prevented | ✗ prevented |

- Deadlock — two transactions each waiting for the other's lock
- Prevent with: consistent lock ordering, timeouts, optimistic locking

**Code (75 min)**
```sql
-- Basic transaction
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;

-- Rollback on error
BEGIN;
  UPDATE inventory SET qty = qty - 1 WHERE product_id = 10;
  -- if qty goes negative, rollback
  DO $$
  BEGIN
    IF (SELECT qty FROM inventory WHERE product_id = 10) < 0 THEN
      RAISE EXCEPTION 'out of stock';
    END IF;
  END $$;
COMMIT;

-- Savepoint (partial rollback)
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  SAVEPOINT after_order;
  INSERT INTO payments (...) VALUES (...);
  -- if payment fails, roll back only to savepoint
  ROLLBACK TO after_order;
COMMIT;

-- Deadlock simulation (run in two sessions)
-- Session A: BEGIN; UPDATE t SET x=1 WHERE id=1; UPDATE t SET x=2 WHERE id=2;
-- Session B: BEGIN; UPDATE t SET x=3 WHERE id=2; UPDATE t SET x=4 WHERE id=1;
-- One session will be killed as the deadlock victim

-- Slow query optimization workflow
EXPLAIN ANALYZE SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2024-06-01'
ORDER BY o.amount DESC;
-- Look for: Seq Scan on large table → add index
-- Look for: Hash Join vs Nested Loop → is the right table small?
-- Look for: Sort → is ORDER BY column indexed?
```

**System Design (30 min)**
- [Ch.08 — ACID ও BASE কনসিসটেন্সি](https://www.systemdesignbangla.com/chapters/acid-base.html)

---

## Week 2 — NoSQL + Distributed Systems

### Day 8 — MongoDB: CRUD + document model

**Focus:** Think in documents, not tables

**Concept (40 min)**
- Document model — data stored as JSON-like BSON documents
- No fixed schema — different documents in same collection can differ
- Embedding — related data lives inside the document (fast reads, single query)
- Referencing — store ID and look up separately (like a foreign key)
- Trade-off: relational = normalized + joins; MongoDB = denormalized + fast reads
- When MongoDB wins: flexible schema, nested/hierarchical data, rapid iteration

**Code (80 min)**
```javascript
// Insert
db.products.insertOne({ name: "Laptop", price: 999, tags: ["electronics", "computers"] })
db.products.insertMany([
  { name: "Mouse", price: 29, category: "accessories" },
  { name: "Keyboard", price: 79, category: "accessories" }
])

// Find
db.products.find({ category: "accessories" })
db.products.find({ price: { $gt: 50, $lt: 200 } })
db.products.find({ tags: { $in: ["electronics"] } })
db.products.find({ $and: [{ price: { $gt: 50 } }, { category: "accessories" }] })

// Projection, sort, limit
db.products.find({}, { name: 1, price: 1, _id: 0 }).sort({ price: -1 }).limit(5)

// Update
db.products.updateOne({ name: "Mouse" }, { $set: { price: 34 } })
db.products.updateMany({ category: "accessories" }, { $inc: { price: 5 } })
db.products.updateOne({ name: "Mouse" }, { $push: { tags: "peripheral" } })

// Delete
db.products.deleteOne({ name: "Keyboard" })
db.products.deleteMany({ price: { $lt: 20 } })
```

**System Design (30 min)**
- [Ch.03 — NoSQL ডেটাবেস](https://www.systemdesignbangla.com/chapters/nosql.html)
- [Ch.04 — SQL বনাম NoSQL](https://www.systemdesignbangla.com/chapters/sql-vs-nosql.html)

---

### Day 9 — MongoDB: Aggregation Pipeline

**Focus:** The most important MongoDB skill — equivalent to SQL's GROUP BY + JOINs

**Concept (40 min)**
- Pipeline — stages execute sequentially, output of one feeds next
- `$match` — filter documents (put early to reduce data volume)
- `$group` — group by field + apply accumulators ($sum, $avg, $count, $push)
- `$sort` — order results
- `$project` — reshape documents (include/exclude/rename/compute fields)
- `$lookup` — left outer join to another collection
- `$unwind` — flatten an array field into separate documents

**Code (80 min)**
```javascript
// Sales report: total and count per category
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: {
    _id: "$category",
    total: { $sum: "$amount" },
    count: { $sum: 1 },
    avg_order: { $avg: "$amount" }
  }},
  { $sort: { total: -1 } }
])

// $project: reshape + compute new fields
db.orders.aggregate([
  { $project: {
    customer_id: 1,
    amount: 1,
    year: { $year: "$created_at" },
    is_large: { $gte: ["$amount", 500] }
  }}
])

// $lookup: join orders with customer details
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customer_id",
    foreignField: "_id",
    as: "customer"
  }},
  { $unwind: "$customer" },
  { $project: { amount: 1, "customer.name": 1, "customer.email": 1 }}
])

// $unwind: flatten product tags, count per tag
db.products.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } }},
  { $sort: { count: -1 }}
])

// Practice task: monthly revenue trend (group by year+month, sort chronologically)
```

**System Design (30 min)**
- [Ch.05 — ডেটাবেস রেপ্লিকেশন](https://www.systemdesignbangla.com/chapters/replication.html)

---

### Day 10 — MongoDB: Indexes + Schema Design

**Focus:** When to embed vs reference — the central MongoDB design decision

**Concept (40 min)**
- Single field index — `createIndex({ field: 1 })`
- Compound index — `createIndex({ a: 1, b: -1 })` — order matters (same rule as SQL)
- Text index — full text search on string fields
- `explain("executionStats")` — like EXPLAIN ANALYZE in SQL
- **Embedding rule** — embed when data is accessed together, 1:few relationship, child data doesn't grow unboundedly
- **Referencing rule** — reference when 1:many is large, data is shared/updated independently, child can stand alone
- Many-to-many in MongoDB — typically array of IDs with referencing

**Code (80 min)**
```javascript
// Create indexes
db.orders.createIndex({ customer_id: 1 })
db.orders.createIndex({ customer_id: 1, created_at: -1 })
db.products.createIndex({ name: "text", description: "text" })

// Use explain to check index usage
db.orders.find({ customer_id: ObjectId("...") }).explain("executionStats")
// Look for: IXSCAN (index used) vs COLLSCAN (full scan)

// Text search
db.products.find({ $text: { $search: "wireless keyboard" } })

// Schema design example — Blog system

// EMBED: post with comments (few comments per post, always loaded together)
{
  _id: ObjectId("..."),
  title: "My Post",
  body: "...",
  author_id: ObjectId("..."),
  comments: [
    { user: "Alice", text: "Great post!", date: ISODate("...") },
    { user: "Bob", text: "Thanks!", date: ISODate("...") }
  ]
}

// REFERENCE: user's orders (potentially thousands, updated independently)
// orders collection
{ _id: ObjectId("..."), customer_id: ObjectId("..."), amount: 99.99 }
// customers collection — does NOT embed all orders
{ _id: ObjectId("..."), name: "Alice", email: "alice@example.com" }

// Many-to-many: users enrolled in courses
// users: { _id, name, course_ids: [ObjectId, ObjectId] }
// courses: { _id, title, student_ids: [ObjectId, ...] }  (or just query by course_ids in users)
```

**System Design (30 min)**
- [Ch.13 — শার্ডিং](https://www.systemdesignbangla.com/chapters/sharding.html)

---

### Day 11 — Redis: Data Structures + Commands

**Focus:** Know which structure to reach for and why

**Concept (40 min)**
- String — simple key-value, counters, cached JSON
- Hash — object with fields (like a row in a table)
- List — ordered collection, queue/stack, recent items
- Set — unordered unique values, membership checks, unions
- Sorted Set — unique values each with a score, leaderboards, range queries
- EXPIRE / TTL — automatic cache expiry
- Redis is in-memory — extremely fast, but data must fit in RAM

| Structure | Best for | Key commands |
|-----------|----------|-------------|
| String | Cache, counters | SET, GET, INCR, EXPIRE |
| Hash | Session, user profile | HSET, HGET, HGETALL, HDEL |
| List | Queue, activity feed | LPUSH, RPUSH, LRANGE, BRPOP |
| Set | Tags, unique visitors | SADD, SMEMBERS, SISMEMBER, SUNION |
| Sorted Set | Leaderboard, ranking | ZADD, ZRANGE, ZRANK, ZSCORE |

**Code (80 min)**
```bash
# String — cache a JSON response (expire in 5 min)
SET user:42 '{"name":"Alice","email":"alice@example.com"}' EX 300
GET user:42
TTL user:42

# Counter — page views
INCR page:views:home
INCRBY page:views:home 5
GET page:views:home

# Hash — session store
HSET session:abc123 user_id 42 role admin last_seen 1700000000
HGET session:abc123 role
HGETALL session:abc123
EXPIRE session:abc123 3600

# List — task queue (producer pushes, consumer pops)
LPUSH jobs:email '{"to":"alice@x.com","subject":"Welcome"}'
LPUSH jobs:email '{"to":"bob@x.com","subject":"Reset"}'
RPOP jobs:email        # process oldest first (FIFO)
BRPOP jobs:email 30    # blocking pop, wait up to 30s

# Set — unique visitors today
SADD visitors:2024-01-15 user:1 user:2 user:3
SADD visitors:2024-01-15 user:2   # ignored, already present
SCARD visitors:2024-01-15         # count unique visitors

# Sorted Set — leaderboard
ZADD leaderboard 1500 alice
ZADD leaderboard 2300 bob
ZADD leaderboard 1800 carol
ZRANGE leaderboard 0 -1 WITHSCORES REV   # top scores descending
ZRANK leaderboard alice                    # alice's rank (0-indexed)
ZINCRBY leaderboard 200 alice              # alice scores 200 more
```

**System Design (30 min)**
- [Ch.14 — কনসিস্টেন্ট হ্যাশিং](https://www.systemdesignbangla.com/chapters/consistent-hashing.html)

---

### Day 12 — Redis: Caching Patterns + Rate Limiting

**Focus:** Design patterns that appear in every system design interview

**Concept (40 min)**

**Cache-aside (Lazy loading)**
1. App checks cache — if hit, return data
2. If miss — app fetches from DB, writes to cache, returns data
- Pro: only caches data that's actually requested
- Con: first request always slow (cold start)

**Write-through**
1. App writes to cache and DB simultaneously
- Pro: cache always up to date
- Con: writes are slower; cache fills with data that may never be read

**Write-back (Write-behind)**
1. App writes to cache only
2. Cache asynchronously flushes to DB in batches
- Pro: very fast writes
- Con: risk of data loss if cache crashes before flush

**Pub/Sub** — Redis channels for real-time messaging (fire and forget, no persistence)

**Code (80 min)**
```python
# Cache-aside pattern (Python pseudocode)
def get_user(user_id):
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)       # cache hit

    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    redis.setex(f"user:{user_id}", 300, json.dumps(user))  # cache 5 min
    return user

def update_user(user_id, data):
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)
    redis.delete(f"user:{user_id}")     # invalidate cache
```

```bash
# Rate limiter: max 100 requests per user per minute
# Key: ratelimit:{user_id}:{minute_bucket}

SET ratelimit:42:$(date +%s -d "1 minute ago") 0 EX 60 NX   # init if not exists
INCR ratelimit:42:202401151430                                  # increment
# If result > 100, reject request

# Cleaner sliding window rate limiter with Sorted Set
ZADD requests:42 <timestamp> <request_id>
ZREMRANGEBYSCORE requests:42 0 <timestamp_minus_60s>   # remove old
ZCARD requests:42                                        # count in window
```

```bash
# Pub/Sub
# Publisher
PUBLISH notifications '{"type":"order_shipped","order_id":123}'

# Subscriber (in another terminal / process)
SUBSCRIBE notifications
# Receives messages in real-time
```

**System Design (30 min)**
- [Ch.09 — CAP থিওরেম](https://www.systemdesignbangla.com/chapters/cap-theorem.html)

---

### Day 13 — CAP, PACELC, Distributed Transactions

**Focus:** Theory that anchors every "which database would you use?" conversation

**Concept (50 min)**

**CAP Theorem** — a distributed system can guarantee at most 2 of 3:
- **Consistency** — every read sees the most recent write
- **Availability** — every request gets a response (not guaranteed to be latest)
- **Partition Tolerance** — system works even if network splits into two halves

Network partitions always happen — so real systems choose CP or AP:

| Choice | Behavior during partition | Examples |
|--------|--------------------------|---------|
| CP | Refuse requests to stay consistent | HBase, Zookeeper, etcd |
| AP | Serve possibly stale data to stay available | Cassandra, CouchDB, DynamoDB |

**PACELC** — extends CAP: even without a partition, there's a latency vs consistency trade-off
- During Partition: choose Availability or Consistency (same as CAP)
- Else (normal operation): choose Latency or Consistency

**Distributed Transactions:**
- 2PC (Two-Phase Commit) — coordinator asks all nodes to prepare, then commits if all say yes. Blocking if coordinator crashes.
- Saga Pattern — break transaction into local transactions, each with a compensating rollback action if something fails

**Code (60 min)**
```javascript
// Saga pattern: order service
// Step 1: Reserve inventory
// Step 2: Charge payment
// Step 3: Confirm order
// If step 2 fails → compensate step 1 (release inventory)
// If step 3 fails → compensate step 2 (refund) + step 1 (release)

// Diagram the flow — draw the happy path and all failure paths
// This is a design exercise, not just coding

// Map real databases to CAP positions:
// PostgreSQL   → CA (single node), CP (with replication)
// MongoDB      → CP (default) or AP (with eventual consistency)
// Cassandra    → AP
// Redis        → CP (single), AP (cluster with async replication)
// DynamoDB     → AP (eventually consistent) or CP (strongly consistent reads, 2x cost)
```

**System Design (40 min)**
- [Ch.10 — PACELC থিওরেম](https://www.systemdesignbangla.com/chapters/pacelc.html)
- [Ch.12 — ডিস্ট্রিবিউটেড ট্রানজেকশন](https://www.systemdesignbangla.com/chapters/distributed-transactions.html)
- [Ch.15 — ডেটাবেস ফেডারেশন](https://www.systemdesignbangla.com/chapters/database-federation.html)

---

### Day 14 — Review + Mock Design Session

**Focus:** Synthesis. No new material — only recall and application.

**Review (45 min)**
- Write down from memory: all JOIN types + when to use each
- Explain ACID to an imaginary interviewer, out loud
- Draw the aggregation pipeline for a sales report without looking
- Describe Cache-aside vs Write-through in your own words
- Explain CAP and give a real DB example for CP and AP

**Mock Design Session (75 min)**

Design a simplified Twitter-like system:
1. What tables / collections do you need?
2. Where do you use SQL vs MongoDB vs Redis?
3. What do you index and why?
4. How do you handle the "hot user" with 10M followers?
5. Write 3 non-trivial queries on your schema

Design a rate-limited API system:
1. Where does Redis fit?
2. What pattern (sliding window vs fixed window)?
3. What happens when Redis goes down?

**System Design (30 min)**
- Re-read your weakest chapter from either week
- List any gaps to carry into next sprint

---

## When to Use Which Database — Quick Reference

| Database | Use when | Avoid when |
|----------|----------|------------|
| PostgreSQL / MySQL | Structured data, complex queries, ACID transactions, reporting | Schema changes are very frequent, massive write throughput needed |
| MongoDB | Flexible/evolving schema, hierarchical data, rapid iteration, document-centric reads | Complex multi-collection transactions, strong consistency critical |
| Redis | Caching, sessions, leaderboards, rate limiting, pub/sub, real-time counters | Primary data store for critical data, data larger than RAM |

**Real-world scenarios:**
- E-commerce: PostgreSQL for orders/inventory (ACID), Redis for cart sessions + rate limiting, MongoDB for product catalog (flexible attributes)
- Social feed: MongoDB for posts (flexible, hierarchical), Redis for feed cache + like counts, PostgreSQL for user accounts + billing
- Analytics: PostgreSQL or dedicated OLAP (ClickHouse, BigQuery) for aggregations, Redis for real-time dashboards

---

## System Design Bangla — All 15 Chapters (Coverage Map)

| Chapter | Topic | Study day |
|---------|-------|-----------|
| 01 | ডেটাবেস ও DBMS | Day 1 |
| 02 | SQL ডেটাবেস | Day 1 |
| 03 | NoSQL ডেটাবেস | Day 8 |
| 04 | SQL বনাম NoSQL | Day 8 |
| 05 | ডেটাবেস রেপ্লিকেশন | Day 9 |
| 06 | ইনডেক্সেস | Day 2 (intro) + Day 6 (deep) |
| 07 | নর্মালাইজেশন ও ডিনর্মালাইজেশন | Day 3 (intro) + Day 4 (deep) |
| 08 | ACID ও BASE কনসিসটেন্সি | Day 7 |
| 09 | CAP থিওরেম | Day 12 |
| 10 | PACELC থিওরেম | Day 13 |
| 11 | ট্রানজেকশন | Day 5 |
| 12 | ডিস্ট্রিবিউটেড ট্রানজেকশন | Day 13 |
| 13 | শার্ডিং | Day 10 |
| 14 | কনসিস্টেন্ট হ্যাশিং | Day 11 |
| 15 | ডেটাবেস ফেডারেশন | Day 13 |

---

*Plan ends. Next sprint: replication deep dive, query planner internals, distributed SQL (CockroachDB / Spanner).*