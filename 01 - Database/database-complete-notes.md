# Complete Database Notes

### SQL · NoSQL · System Design Concepts

> Every topic: concept → syntax → example → solved problem → problems to solve → resources
>
> Tables used throughout: `employees`, `departments`, `orders`, `products`, `customers`

```sql
-- Setup: run once, use everywhere
CREATE TABLE departments (
  id SERIAL PRIMARY KEY, name TEXT, location TEXT
);
CREATE TABLE employees (
  id SERIAL PRIMARY KEY, name TEXT, dept_id INT REFERENCES departments(id),
  salary NUMERIC, manager_id INT REFERENCES employees(id), joined_at DATE
);
CREATE TABLE customers (
  id SERIAL PRIMARY KEY, name TEXT, email TEXT, country TEXT
);
CREATE TABLE products (
  id SERIAL PRIMARY KEY, name TEXT, category TEXT, price NUMERIC
);
CREATE TABLE orders (
  id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id),
  product_id INT REFERENCES products(id), amount NUMERIC, created_at TIMESTAMP
);
```

---

## CONTENTS

**Part 1 — SQL**

1. INNER JOIN · 2. LEFT JOIN · 3. RIGHT JOIN · 4. FULL OUTER JOIN · 5. SELF JOIN · 6. CROSS JOIN
2. GROUP BY & HAVING · 8. Subqueries (correlated vs non-correlated) · 9. EXISTS vs IN
3. CTEs — non-recursive · 11. CTEs — recursive · 12. ROW_NUMBER()
4. RANK() & DENSE_RANK() · 14. LEAD() & LAG() · 15. Aggregate Window Functions
5. NTILE · FIRST_VALUE · LAST_VALUE · 17. B-Tree Index · 18. Hash Index
6. Composite Index · 20. Covering Index · 21. EXPLAIN / EXPLAIN ANALYZE
7. When NOT to index · 23. ACID · 24. Isolation Levels · 25. Deadlock
8. BEGIN / COMMIT / ROLLBACK · 27. Normalization 1NF–BCNF · 28. Denormalization
9. ERD · 30. Foreign Keys, Cascades, Constraints

**Part 2 — MongoDB**
31. Document Model · 32. CRUD · 33. Aggregation Pipeline

34. Indexes · 35. Schema Design — Embedding vs Referencing

**Part 3 — Redis**
36. Data Structures · 37. Core Commands · 38. Caching Patterns

39. Pub/Sub · 40. Rate Limiting

**Part 4 — System Design**
41. DB Replication · 42. ACID vs BASE · 43. CAP Theorem

44. PACELC Theorem · 45. Distributed Transactions · 46. Sharding
45. Consistent Hashing · 48. DB Federation · 49. When to Use Which DB

---

# PART 1 — SQL

---

## Topic 1 — INNER JOIN

### Concept

Returns only rows where the join condition matches in **both** tables. Non-matching rows from either side are excluded entirely.

### Syntax

```sql
SELECT columns
FROM table_a a
INNER JOIN table_b b ON a.key = b.key;
-- INNER keyword is optional: JOIN alone defaults to INNER JOIN
```

### Example

```sql
-- Every employee with their department name
SELECT e.name AS employee, d.name AS department, d.location
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;
```

Result: only employees **who have** a dept_id that exists in departments. Employees with NULL dept_id disappear.

### Solved Problem

**Problem:** Find all orders along with the product name and customer name. Only show orders where product and customer both exist.

```sql
SELECT o.id AS order_id,
       c.name AS customer,
       p.name AS product,
       o.amount
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
INNER JOIN products p ON o.product_id = p.id
ORDER BY o.created_at DESC;
```

**Why INNER here?** Orders with orphaned customer_id or product_id (data integrity issue) would silently vanish — which is the desired behavior when you only want valid, complete records.

### Problems to Solve

1. List all employees together with their manager's name. Exclude employees with no manager.
2. Find all products that have at least one order. Show product name, category, and total orders count.
3. Show each order with the customer's country. Filter only orders from customers in 'USA'.
4. Find departments that have at least one employee. Show department name and employee count.
5. Get the top 3 customers by total spending using INNER JOIN + GROUP BY.

### Resources

* https://www.postgresql.org/docs/current/queries-table-expressions.html
* https://use-the-index-luke.com/sql/join

---

## Topic 2 — LEFT JOIN (LEFT OUTER JOIN)

### Concept

Returns **all rows from the left table** plus matching rows from the right table. Where no match exists, right-side columns are NULL. Essential for finding "missing" relationships.

### Syntax

```sql
SELECT columns
FROM left_table l
LEFT JOIN right_table r ON l.key = r.key;
-- NULL appears in r.* columns where no match
```

### Example

```sql
-- All employees, with dept name if they have one
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;
-- employees with no dept_id get NULL in dept column
```

### Solved Problem

**Problem:** Find all customers who have **never** placed an order.

```sql
SELECT c.id, c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
-- o.id IS NULL means no matching order was found
```

**Key pattern:** `LEFT JOIN ... WHERE right_table.key IS NULL` = "rows with no match" — one of the most common real-world query patterns.

### Another Example

```sql
-- All products, whether or not they've been ordered, with order count
SELECT p.name, p.category, COUNT(o.id) AS total_orders
FROM products p
LEFT JOIN orders o ON p.id = o.product_id
GROUP BY p.id, p.name, p.category
ORDER BY total_orders DESC;
-- Products never ordered get COUNT = 0
```

### Problems to Solve

1. List all departments with their employee count. Include departments with zero employees.
2. Find all employees who have never been a manager (manager_id in another employee's row).
3. Show all products and their total revenue. Show 0 for products with no orders.
4. Find customers who placed orders in 2023 but NOT in 2024.
5. List every employee and the number of people who report to them (0 if no one does).

### Resources

* https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-left-join/

---

## Topic 3 — RIGHT JOIN (RIGHT OUTER JOIN)

### Concept

Mirror of LEFT JOIN. Returns **all rows from the right table** plus matching rows from the left. In practice, RIGHT JOIN is rarely used — you can always rewrite it as a LEFT JOIN by swapping table positions.

### Syntax

```sql
SELECT columns
FROM left_table l
RIGHT JOIN right_table r ON l.key = r.key;
```

### Example

```sql
-- All departments, with employee names if any
SELECT d.name AS dept, e.name AS employee
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.id;
-- departments with no employees get NULL in employee column
-- Equivalent to: SELECT d.name, e.name FROM departments d LEFT JOIN employees e ON ...
```

### Solved Problem

**Problem:** Show all products and any orders they are part of. Include products with no orders.

```sql
-- Using RIGHT JOIN
SELECT o.id AS order_id, o.amount, p.name AS product, p.category
FROM orders o
RIGHT JOIN products p ON o.product_id = p.id;

-- Equivalent LEFT JOIN (preferred style):
SELECT o.id AS order_id, o.amount, p.name AS product, p.category
FROM products p
LEFT JOIN orders o ON p.id = o.product_id;
```

### Problems to Solve

1. Rewrite this RIGHT JOIN as a LEFT JOIN: `FROM orders o RIGHT JOIN customers c ON o.customer_id = c.id`
2. Find all product categories that have no orders using RIGHT JOIN.
3. Show all managers and their direct reports. Include managers with no reports.
4. When would you actually prefer RIGHT JOIN over LEFT JOIN? Give a reason.

### Resources

* https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-right-join/

---

## Topic 4 — FULL OUTER JOIN

### Concept

Returns  **all rows from both tables** . Where no match exists on either side, the missing columns are NULL. Combines LEFT + RIGHT JOIN results with duplicates removed.

### Syntax

```sql
SELECT columns
FROM table_a a
FULL OUTER JOIN table_b b ON a.key = b.key;
```

### Example

```sql
-- All employees AND all departments, matched where possible
SELECT e.name AS employee, d.name AS department
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.id;
-- Employees with no dept → dept column is NULL
-- Departments with no employees → employee column is NULL
```

### Solved Problem

**Problem:** Audit query — find any employees without a department AND any departments without employees in one result.

```sql
SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  d.id AS dept_id,
  d.name AS dept_name,
  CASE
    WHEN d.id IS NULL THEN 'Employee has no department'
    WHEN e.id IS NULL THEN 'Department has no employees'
    ELSE 'Matched'
  END AS status
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.id
WHERE e.id IS NULL OR d.id IS NULL;  -- only unmatched rows
```

### Problems to Solve

1. Show all customers and all orders. Flag rows where a customer has no orders, and rows where an order has no customer.
2. Compare two monthly sales tables (jan_sales, feb_sales) — find products that sold in January but not February and vice versa.
3. FULL OUTER JOIN is expensive on large tables. What index would help?
4. Simulate FULL OUTER JOIN using UNION of a LEFT JOIN and a RIGHT JOIN.

### Resources

* https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-full-outer-join/

---

## Topic 5 — SELF JOIN

### Concept

A table joined to  **itself** . Requires aliasing the table twice. Used for hierarchical data (employees and their managers), comparing rows within the same table, or finding pairs.

### Syntax

```sql
SELECT a.col, b.col
FROM table a
JOIN table b ON a.foreign_key = b.primary_key;
-- Two aliases for the same physical table
```

### Example

```sql
-- Each employee with their manager's name
SELECT e.name AS employee,
       e.salary,
       m.name AS manager,
       d.name AS department
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN departments d ON e.dept_id = d.id
ORDER BY m.name NULLS LAST;
-- LEFT JOIN so top-level employees (no manager) still appear
```

### Solved Problem

**Problem:** Find pairs of employees in the same department who earn within $5,000 of each other (without duplicating the pair).

```sql
SELECT a.name AS employee_1,
       b.name AS employee_2,
       a.salary AS sal_1,
       b.salary AS sal_2,
       ABS(a.salary - b.salary) AS salary_diff
FROM employees a
JOIN employees b
  ON a.dept_id = b.dept_id
  AND a.id < b.id                          -- prevents (Alice,Bob) AND (Bob,Alice)
  AND ABS(a.salary - b.salary) <= 5000
ORDER BY salary_diff;
```

### Problems to Solve

1. Find all employees who earn more than their manager.
2. List employees hired on the same date as another employee.
3. Find employees who are in the same department as the highest-paid employee in the company.
4. Build a full org chart showing 3 levels: employee → manager → manager's manager.
5. Find all pairs of products in the same category with a price difference less than $10.

### Resources

* https://www.sqlservertutorial.net/sql-server-basics/sql-server-self-join/

---

## Topic 6 — CROSS JOIN

### Concept

Produces the **cartesian product** — every row from the left paired with every row from the right. N rows × M rows = N×M result rows. No ON clause. Useful for generating combinations or test data.

### Syntax

```sql
SELECT a.col, b.col
FROM table_a a
CROSS JOIN table_b b;
-- No join condition
```

### Example

```sql
-- Every possible employee–product combination (for a recommendation engine seed)
SELECT e.name AS employee, p.name AS product, p.price
FROM employees e
CROSS JOIN products p
ORDER BY e.name, p.price;

-- If employees has 50 rows and products has 200 rows → 10,000 result rows
```

### Solved Problem

**Problem:** Generate a date × region grid for a sales planning table where every combination needs a row even if no sales occurred.

```sql
WITH dates AS (
  SELECT generate_series('2024-01-01'::date, '2024-12-31'::date, '1 month') AS month
),
regions AS (
  SELECT unnest(ARRAY['North', 'South', 'East', 'West']) AS region
)
SELECT d.month, r.region, COALESCE(s.revenue, 0) AS revenue
FROM dates d
CROSS JOIN regions r
LEFT JOIN sales s ON s.month = d.month AND s.region = r.region
ORDER BY d.month, r.region;
```

### Problems to Solve

1. Generate all size × color combinations for a clothing product (sizes: S,M,L,XL; colors: Red, Blue, Green).
2. A chess board has 8 ranks × 8 files. Use CROSS JOIN to generate all 64 squares.
3. CROSS JOIN 3 tables: employees (10 rows) × shifts (3 rows) × locations (4 rows). How many rows?
4. When would a CROSS JOIN with a filter on the result be equivalent to an INNER JOIN?

### Resources

* https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-cross-join/

---

## Topic 7 — GROUP BY & HAVING

### Concept

* `GROUP BY` collapses rows sharing the same value into a single group. SELECT can only reference grouped columns or aggregate functions.
* `HAVING` filters **after** grouping (like WHERE but on aggregated results).
* Execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY

### Syntax

```sql
SELECT col, AGG_FUNC(col2)
FROM table
WHERE condition          -- filters rows BEFORE grouping
GROUP BY col
HAVING AGG_FUNC(col2) > value   -- filters groups AFTER aggregation
ORDER BY AGG_FUNC(col2) DESC;
```

### Example

```sql
-- Departments with more than 3 employees and avg salary above 60k
SELECT d.name,
       COUNT(e.id) AS headcount,
       ROUND(AVG(e.salary), 2) AS avg_salary,
       MAX(e.salary) AS top_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.id, d.name
HAVING COUNT(e.id) > 3 AND AVG(e.salary) > 60000
ORDER BY avg_salary DESC;
```

### Solved Problem

**Problem:** For each product category, find the month with the highest sales. Show category, month, and total sales.

```sql
WITH monthly AS (
  SELECT p.category,
         DATE_TRUNC('month', o.created_at) AS month,
         SUM(o.amount) AS total
  FROM orders o
  JOIN products p ON o.product_id = p.id
  GROUP BY p.category, DATE_TRUNC('month', o.created_at)
),
ranked AS (
  SELECT *, RANK() OVER (PARTITION BY category ORDER BY total DESC) AS rk
  FROM monthly
)
SELECT category, month, total
FROM ranked
WHERE rk = 1;
```

### Problems to Solve

1. Find customers who have placed more than 5 orders with an average order value above $100.
2. List product categories where total revenue exceeds $50,000 but no single order was above $500.
3. Find the hour of day (0–23) with the most orders overall.
4. Show each country with the number of customers, only for countries with at least 10 customers.
5. Find months where total sales dropped compared to the previous month (use a subquery or CTE).

### Resources

* https://www.postgresql.org/docs/current/sql-select.html#SQL-GROUPBY

---

## Topic 8 — Subqueries: Correlated vs Non-correlated

### Concept

**Non-correlated subquery:** executes once. Result is independent of the outer query. Can be replaced with a JOIN or CTE.

**Correlated subquery:** references a column from the outer query. Re-executes for **every row** of the outer query. Slower but sometimes the clearest way to express row-level logic.

### Syntax

```sql
-- Non-correlated: inner runs once
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Correlated: inner references e.dept_id from outer
SELECT * FROM employees e
WHERE salary > (
  SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id
);
```

### Example

```sql
-- Subquery in WHERE (non-correlated)
SELECT name, salary
FROM employees
WHERE dept_id = (SELECT id FROM departments WHERE name = 'Engineering');

-- Subquery in SELECT (correlated — runs once per employee row)
SELECT name,
       salary,
       (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id) AS dept_avg,
       salary - (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id) AS diff_from_avg
FROM employees e;

-- Subquery in FROM (derived table — non-correlated, runs once)
SELECT dept_id, avg_sal
FROM (
  SELECT dept_id, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY dept_id
) dept_avgs
WHERE avg_sal > 60000;
```

### Solved Problem

**Problem:** Find the 3 customers who spent the most in 2024, along with their total spend and number of orders.

```sql
-- Non-correlated subquery approach
SELECT c.name,
       c.email,
       (SELECT SUM(amount) FROM orders WHERE customer_id = c.id
        AND EXTRACT(YEAR FROM created_at) = 2024) AS total_2024,
       (SELECT COUNT(*) FROM orders WHERE customer_id = c.id
        AND EXTRACT(YEAR FROM created_at) = 2024) AS order_count
FROM customers c
WHERE (SELECT COUNT(*) FROM orders WHERE customer_id = c.id
       AND EXTRACT(YEAR FROM created_at) = 2024) > 0
ORDER BY total_2024 DESC
LIMIT 3;

-- Better: rewrite with JOIN + GROUP BY (more performant)
SELECT c.name, c.email,
       SUM(o.amount) AS total_2024,
       COUNT(o.id) AS order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE EXTRACT(YEAR FROM o.created_at) = 2024
GROUP BY c.id, c.name, c.email
ORDER BY total_2024 DESC
LIMIT 3;
```

### Problems to Solve

1. Find employees whose salary is above the average salary of ALL departments combined.
2. Find all products whose price is higher than the average price in their category.
3. Find customers whose last order was more than 90 days ago.
4. Find the department with the highest total payroll using a subquery in WHERE.
5. Rewrite problem 2 as a JOIN + GROUP BY and compare readability.

### Resources

* https://www.postgresql.org/docs/current/functions-subquery.html
* https://use-the-index-luke.com/sql/explain-plan/postgresql/correlated-subqueries

---

## Topic 9 — EXISTS vs IN

### Concept

|               | `IN`                                                    | `EXISTS`                                                |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| How it works  | Loads full subquery result into memory, checks membership | Stops at first matching row (short-circuit)               |
| NULL handling | NULL in the list causes unexpected behavior               | Handles NULLs correctly                                   |
| Performance   | Fast when subquery result is small                        | Fast when outer table is small or subquery table is large |
| Returns       | Values to match against                                   | TRUE / FALSE                                              |
| Best use      | Small, known value lists                                  | "Does a related row exist?"                               |

### Syntax

```sql
-- EXISTS
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- IN
SELECT * FROM customers
WHERE id IN (SELECT customer_id FROM orders);
```

### Example

```sql
-- EXISTS: customers with at least one order > $500
SELECT c.name
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id AND o.amount > 500
);

-- NOT EXISTS: customers with NO orders
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- IN with values (not subquery) — simple and fast
SELECT * FROM products WHERE category IN ('Electronics', 'Furniture', 'Books');

-- IN NULL trap (avoid)
SELECT * FROM employees
WHERE manager_id NOT IN (SELECT id FROM employees WHERE name = 'Departed');
-- If ANY id is NULL, NOT IN returns no rows at all!
-- Use NOT EXISTS to avoid this trap
```

### Solved Problem

**Problem:** Find all categories that have at least one product priced over $1,000 AND at least one order placed in the last 30 days.

```sql
SELECT DISTINCT p.category
FROM products p
WHERE EXISTS (
  SELECT 1 FROM products p2
  WHERE p2.category = p.category AND p2.price > 1000
)
AND EXISTS (
  SELECT 1 FROM orders o
  JOIN products p3 ON o.product_id = p3.id
  WHERE p3.category = p.category
    AND o.created_at > NOW() - INTERVAL '30 days'
);
```

### Problems to Solve

1. Find employees who are also managers (their id appears in another employee's manager_id).
2. Find customers who have ordered EVERY product in the 'Electronics' category.
3. Rewrite `WHERE id IN (SELECT customer_id FROM orders WHERE amount > 100)` using EXISTS.
4. Why does `WHERE x NOT IN (1, 2, NULL)` return no rows? Demonstrate with a test query.
5. Find products that have never been ordered. Use NOT EXISTS and NOT IN, compare results when product_id in orders can be NULL.

### Resources

* https://www.postgresql.org/docs/current/functions-subquery.html#FUNCTIONS-SUBQUERY-EXISTS

---

## Topic 10 — CTEs: Non-recursive (WITH clause)

### Concept

A CTE (Common Table Expression) is a named temporary result set defined before the main query. It makes complex queries readable by breaking them into named steps. Unlike subqueries, a CTE can be referenced multiple times in the same query.

### Syntax

```sql
WITH cte_name AS (
  SELECT ...
),
second_cte AS (
  SELECT ... FROM cte_name ...
)
SELECT * FROM second_cte;
```

### Example

```sql
-- Multi-step analysis: top customers per country
WITH customer_totals AS (
  SELECT customer_id, SUM(amount) AS total_spent, COUNT(*) AS order_count
  FROM orders
  GROUP BY customer_id
),
ranked AS (
  SELECT c.name, c.country, ct.total_spent, ct.order_count,
         RANK() OVER (PARTITION BY c.country ORDER BY ct.total_spent DESC) AS country_rank
  FROM customers c
  JOIN customer_totals ct ON c.id = ct.customer_id
)
SELECT name, country, total_spent, order_count
FROM ranked
WHERE country_rank = 1;
```

### Solved Problem

**Problem:** Find products where the last month's revenue exceeded the 3-month moving average by more than 20%.

```sql
WITH monthly_revenue AS (
  SELECT p.id AS product_id,
         p.name,
         DATE_TRUNC('month', o.created_at) AS month,
         SUM(o.amount) AS revenue
  FROM orders o
  JOIN products p ON o.product_id = p.id
  GROUP BY p.id, p.name, DATE_TRUNC('month', o.created_at)
),
with_moving_avg AS (
  SELECT *,
    AVG(revenue) OVER (
      PARTITION BY product_id
      ORDER BY month
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3m
  FROM monthly_revenue
),
latest AS (
  SELECT * FROM with_moving_avg
  WHERE month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT name, revenue, ROUND(moving_avg_3m, 2) AS moving_avg,
       ROUND((revenue - moving_avg_3m) / moving_avg_3m * 100, 1) AS pct_above_avg
FROM latest
WHERE revenue > moving_avg_3m * 1.2
ORDER BY pct_above_avg DESC;
```

### Problems to Solve

1. Using a CTE, find the second-highest salary in each department.
2. Write a CTE that first gets active customers (ordered in last 60 days), then calculates their average order value.
3. Rewrite this nested subquery as a CTE:
   `SELECT * FROM (SELECT dept_id, AVG(salary) avg FROM employees GROUP BY dept_id) t WHERE avg > 55000`
4. Use multiple CTEs to: (a) get total orders per product, (b) get avg price per category, (c) join them to find above-average products by order count.
5. Can you reference a CTE before it's defined? What order must CTEs be listed in?

### Resources

* https://www.postgresql.org/docs/current/queries-with.html

---

## Topic 11 — CTEs: Recursive (WITH RECURSIVE)

### Concept

A recursive CTE calls itself, enabling traversal of hierarchical or graph-like data (org charts, categories, file trees, paths). It has two parts:

* **Anchor member** — non-recursive starting point
* **Recursive member** — references the CTE itself, adds rows each iteration
* Stops when the recursive member returns no new rows

### Syntax

```sql
WITH RECURSIVE cte_name AS (
  -- Anchor: starting rows
  SELECT ... FROM table WHERE condition

  UNION ALL

  -- Recursive: join CTE to table to go one level deeper
  SELECT t.* FROM table t
  JOIN cte_name c ON t.parent_id = c.id
)
SELECT * FROM cte_name;
```

### Example

```sql
-- Full org chart with depth and path
WITH RECURSIVE org_tree AS (
  -- Anchor: top-level employees (no manager)
  SELECT id, name, manager_id, 0 AS depth, ARRAY[name] AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: one level deeper
  SELECT e.id, e.name, e.manager_id, ot.depth + 1, ot.path || e.name
  FROM employees e
  JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT depth, array_to_string(path, ' → ') AS hierarchy, name
FROM org_tree
ORDER BY path;
```

### Solved Problem

**Problem:** Given a categories table with parent_id, find all subcategories (at any depth) under 'Electronics'.

```sql
-- categories(id, name, parent_id)
WITH RECURSIVE subcategories AS (
  -- Anchor: the root category
  SELECT id, name, parent_id, 0 AS level
  FROM categories
  WHERE name = 'Electronics'

  UNION ALL

  -- Recursive: all children
  SELECT c.id, c.name, c.parent_id, sc.level + 1
  FROM categories c
  JOIN subcategories sc ON c.parent_id = sc.id
)
SELECT level, name
FROM subcategories
ORDER BY level, name;
```

**Cycle protection** (if data might have cycles):

```sql
WITH RECURSIVE safe_tree AS (
  SELECT id, name, parent_id, ARRAY[id] AS visited
  FROM categories WHERE parent_id IS NULL

  UNION ALL

  SELECT c.id, c.name, c.parent_id, st.visited || c.id
  FROM categories c
  JOIN safe_tree st ON c.parent_id = st.id
  WHERE NOT c.id = ANY(st.visited)  -- stop if we've seen this node
)
SELECT * FROM safe_tree;
```

### Problems to Solve

1. Find the total number of subordinates (at any depth) for each manager.
2. Generate a Fibonacci sequence up to 20 terms using a recursive CTE.
3. Find the shortest path between two nodes in a simple graph table `edges(from_id, to_id)`.
4. List all ancestor categories for a given leaf category (bottom-up traversal).
5. Why use `UNION ALL` instead of `UNION` in recursive CTEs? What would happen with `UNION`?

### Resources

* https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-RECURSIVE

---

## Topic 12 — ROW_NUMBER()

### Concept

Assigns a **unique sequential integer** to each row within a partition, ordered by the specified column. No ties — every row gets a distinct number. Most used for: top-N per group, deduplication, pagination.

### Syntax

```sql
ROW_NUMBER() OVER (
  [PARTITION BY partition_col]
  ORDER BY sort_col [ASC|DESC]
)
```

### Example

```sql
-- Rank employees by salary within each department
SELECT name, dept_id, salary,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
FROM employees;

-- Top 2 earners per department
WITH ranked AS (
  SELECT name, dept_id, salary,
         ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
  FROM employees
)
SELECT name, dept_id, salary FROM ranked WHERE rn <= 2;
```

### Solved Problem

**Problem:** Deduplicate a customers table that has duplicate emails — keep only the most recently inserted row for each email.

```sql
WITH deduped AS (
  SELECT id, name, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY id DESC) AS rn
  FROM customers
)
DELETE FROM customers
WHERE id IN (
  SELECT id FROM deduped WHERE rn > 1
);
-- rn = 1 = most recent (highest id), keep those; delete rn > 1
```

### Problems to Solve

1. Implement keyset pagination: get orders 101–120 sorted by created_at using ROW_NUMBER.
2. Find the first (earliest) order placed by each customer.
3. Remove duplicate orders — same customer_id, product_id, and amount within 5 minutes (keep the first).
4. Using ROW_NUMBER, find all products where the 2nd most expensive item is priced above $200.
5. Assign sequential order numbers per customer per year (so each customer starts at 1 each year).

### Resources

* https://www.postgresql.org/docs/current/functions-window.html

---

## Topic 13 — RANK() & DENSE_RANK()

### Concept

| Function     | Ties behavior      | Gap after tie                  |
| ------------ | ------------------ | ------------------------------ |
| RANK()       | Same rank for ties | Yes — skips numbers           |
| DENSE_RANK() | Same rank for ties | No — next rank is consecutive |
| ROW_NUMBER() | No ties            | N/A — always unique           |

Example with scores 100, 100, 90: RANK gives 1,1,3 · DENSE_RANK gives 1,1,2 · ROW_NUMBER gives 1,2,3

### Syntax

```sql
RANK()       OVER (PARTITION BY col ORDER BY col2 DESC)
DENSE_RANK() OVER (PARTITION BY col ORDER BY col2 DESC)
```

### Example

```sql
SELECT name, dept_id, salary,
       RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dense_rnk,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS row_n
FROM employees;
-- When two people share rank 1, RANK gives next person 3, DENSE_RANK gives 2
```

### Solved Problem

**Problem:** A competition table `scores(player, game, points)`. Find all players who achieved rank 1 in at least one game. Multiple players can share rank 1 (tied top scores count).

```sql
WITH game_ranks AS (
  SELECT player, game, points,
         DENSE_RANK() OVER (PARTITION BY game ORDER BY points DESC) AS game_rank
  FROM scores
)
SELECT DISTINCT player
FROM game_ranks
WHERE game_rank = 1
ORDER BY player;
-- Use DENSE_RANK so tied 1st place players both qualify
```

**When to use which:**

* RANK → sports standings (tied 1st means no 2nd place)
* DENSE_RANK → tiered pricing, grade buckets (no gaps in tier numbers)
* ROW_NUMBER → pagination, deduplication (must be unique)

### Problems to Solve

1. Find all products ranked in the top 3 by revenue within their category (include ties at position 3).
2. A sales table has monthly targets and actual sales. Rank months by how much they exceeded target. Handle months with equal surplus using RANK.
3. Show employees ranked by salary company-wide using all three: ROW_NUMBER, RANK, DENSE_RANK. Observe the difference with tied salaries.
4. Find all employees who are NOT in the top 5 earners in their department using DENSE_RANK.

### Resources

* https://www.postgresql.org/docs/current/functions-window.html

---

## Topic 14 — LEAD() & LAG()

### Concept

Access a value from **another row** relative to the current row, within the same window, without a self-join.

* `LAG(col, n, default)` — value from n rows **before** current row
* `LEAD(col, n, default)` — value from n rows **after** current row
* Default n = 1; default fallback = NULL if no row exists

### Syntax

```sql
LAG(column, offset, default_value)  OVER (PARTITION BY col ORDER BY col2)
LEAD(column, offset, default_value) OVER (PARTITION BY col ORDER BY col2)
```

### Example

```sql
-- Monthly revenue with month-over-month comparison
SELECT
  month,
  revenue,
  LAG(revenue, 1, 0) OVER (ORDER BY month) AS prev_month_rev,
  revenue - LAG(revenue, 1, 0) OVER (ORDER BY month) AS mom_change,
  ROUND(
    (revenue - LAG(revenue, 1) OVER (ORDER BY month))
    / LAG(revenue, 1) OVER (ORDER BY month) * 100, 1
  ) AS mom_pct_change
FROM monthly_revenue
ORDER BY month;
```

### Solved Problem

**Problem:** For each customer, find orders where the gap to the next order was more than 30 days (potential churn signal).

```sql
WITH order_gaps AS (
  SELECT customer_id, created_at,
         LEAD(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) AS next_order,
         LEAD(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) - created_at AS gap
  FROM orders
)
SELECT customer_id, created_at, next_order, gap
FROM order_gaps
WHERE gap > INTERVAL '30 days'
   OR next_order IS NULL  -- no next order (last order ever)
ORDER BY customer_id, created_at;
```

### Problems to Solve

1. Calculate a 3-session rolling user activity report: for each user session, show current session duration, previous session duration, and change.
2. Find products where price increased vs the previous recorded price (price_history table: product_id, price, recorded_at).
3. Build a "streak" counter — for each day in a sales table, show how many consecutive days sales were above $1,000.
4. Using LAG with offset 7, calculate week-over-week change for daily_visits table.
5. Find all employees who got a salary raise vs their previous salary record.

### Resources

* https://www.postgresql.org/docs/current/functions-window.html

---

## Topic 15 — Aggregate Window Functions (SUM / AVG / COUNT OVER)

### Concept

Unlike GROUP BY aggregates, window aggregates compute a value for each row using a **frame** of related rows, without collapsing the result. The row itself is preserved.

Key frame options:

* `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — running total from start
* `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` — rolling 3-row window
* `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` — full partition value (same for all rows)

### Syntax

```sql
SUM(col) OVER (
  PARTITION BY group_col
  ORDER BY sort_col
  ROWS BETWEEN start AND end
)
```

### Example

```sql
-- Running total and rolling 7-day average
SELECT created_at::date AS day,
       SUM(amount) AS daily_revenue,
       SUM(SUM(amount)) OVER (ORDER BY created_at::date) AS running_total,
       AVG(SUM(amount)) OVER (
         ORDER BY created_at::date
         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ) AS rolling_7d_avg
FROM orders
GROUP BY created_at::date
ORDER BY day;
```

### Solved Problem

**Problem:** For each order, show what percentage of that customer's total spending that order represents.

```sql
SELECT o.id,
       o.customer_id,
       o.amount,
       SUM(o.amount) OVER (PARTITION BY o.customer_id) AS customer_total,
       ROUND(
         o.amount / SUM(o.amount) OVER (PARTITION BY o.customer_id) * 100, 1
       ) AS pct_of_customer_total
FROM orders o
ORDER BY o.customer_id, o.created_at;
```

### Problems to Solve

1. Show each employee's salary as a percentage of their department's total payroll.
2. Compute a cumulative revenue report by category, ordered by month.
3. For daily order counts, compute a 5-day centered moving average (2 before, current, 2 after).
4. Show each product's contribution to overall company revenue (no partitioning — whole table total).
5. Find months where the running total first crossed $100,000 in a year.

### Resources

* https://www.postgresql.org/docs/current/tutorial-window.html

---

## Topic 16 — NTILE · FIRST_VALUE · LAST_VALUE

### Concept

* `NTILE(n)` — divides rows into n equal buckets (1 = top bucket). Used for quartiles, deciles, percentile bands.
* `FIRST_VALUE(col)` — value of col from the **first row** in the window frame.
* `LAST_VALUE(col)` — value of col from the **last row** in the window frame. Requires explicit frame `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` or results are misleading.

### Syntax

```sql
NTILE(4)        OVER (PARTITION BY col ORDER BY col2)
FIRST_VALUE(col) OVER (PARTITION BY col ORDER BY col2)
LAST_VALUE(col)  OVER (PARTITION BY col ORDER BY col2
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
```

### Example

```sql
-- Divide customers into 4 revenue quartiles
SELECT customer_id, total_spent,
       NTILE(4) OVER (ORDER BY total_spent DESC) AS quartile
       -- quartile 1 = top 25% spenders
FROM customer_totals;

-- Show each employee alongside their department's highest and lowest salary
SELECT name, dept_id, salary,
       FIRST_VALUE(salary) OVER (PARTITION BY dept_id ORDER BY salary DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS dept_max,
       LAST_VALUE(salary)  OVER (PARTITION BY dept_id ORDER BY salary DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS dept_min
FROM employees;
```

### Solved Problem

**Problem:** Segment products into 3 tiers (premium, mid, budget) by price within category. Label the tier and show the range for that tier.

```sql
WITH tiered AS (
  SELECT id, name, category, price,
         NTILE(3) OVER (PARTITION BY category ORDER BY price DESC) AS tier
  FROM products
)
SELECT name, category, price,
       CASE tier WHEN 1 THEN 'Premium' WHEN 2 THEN 'Mid' ELSE 'Budget' END AS tier_label,
       MIN(price) OVER (PARTITION BY category, tier) AS tier_min,
       MAX(price) OVER (PARTITION BY category, tier) AS tier_max
FROM tiered
ORDER BY category, tier, price DESC;
```

### Problems to Solve

1. Assign customers into 10 deciles based on lifetime value.
2. For each sales rep, show their best month and worst month side by side using FIRST_VALUE and LAST_VALUE.
3. Why does LAST_VALUE behave unexpectedly without specifying the frame clause explicitly?
4. Build a performance review grouping: top 10% employees get 'Exceeds', next 30% get 'Meets', rest get 'Needs improvement'.

### Resources

* https://www.postgresql.org/docs/current/functions-window.html

---

## Topic 17 — B-Tree Index

### Concept

The default index type in PostgreSQL. A balanced tree where data is sorted. Supports equality (`=`), range (`<`, `>`, `BETWEEN`), sorting (`ORDER BY`), and prefix matching (`LIKE 'abc%'`). Height is O(log n) — very fast even on millions of rows.

**Internally:** leaf nodes contain the indexed value + pointer (ctid) to the actual heap row. Branch nodes guide navigation. All leaf nodes are linked for range scans.

### Syntax

```sql
CREATE INDEX idx_name ON table(column);           -- B-Tree by default
CREATE INDEX idx_name ON table(col ASC NULLS LAST); -- with direction
DROP INDEX idx_name;
\d table_name  -- in psql: shows indexes
```

### Example

```sql
-- Slow: full table scan
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
-- Seq Scan → reads every row

-- Add B-Tree index
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Fast: index scan
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
-- Index Scan using idx_orders_customer
```

### When B-Tree Works Well

* High-cardinality columns (user_id, email, timestamp)
* Equality and range queries
* ORDER BY on indexed column
* JOIN keys (foreign key columns are excellent candidates)

### Solved Problem

**Problem:** Queries filtering orders by `created_at` range are slow. Add and verify an index.

```sql
-- Before index
EXPLAIN ANALYZE
SELECT id, amount FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Result: Seq Scan, actual time ~50ms on large table

CREATE INDEX idx_orders_created ON orders(created_at);

-- After index
EXPLAIN ANALYZE
SELECT id, amount FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Result: Index Scan, actual time ~1ms
```

### Problems to Solve

1. Which columns in the employees table would benefit most from a B-Tree index? Justify each.
2. A query `SELECT * FROM products WHERE name LIKE '%phone%'` does NOT use a B-Tree index. Why not? What would?
3. What is an index on a column in an ORDER BY clause good for?
4. Add indexes to optimize: `SELECT * FROM orders WHERE customer_id = 5 ORDER BY created_at DESC LIMIT 10`
5. B-Tree takes up disk space. Estimate: if each row in orders is 100 bytes and index entry is 20 bytes, how much space does an index on 1M rows add?

### Resources

* https://www.postgresql.org/docs/current/indexes-types.html
* https://use-the-index-luke.com/sql/anatomy/the-tree

---

## Topic 18 — Hash Index

### Concept

Uses a hash function on the indexed column. Only supports **equality** comparisons (`=`). Does NOT support range queries, LIKE, or ORDER BY. Can be faster than B-Tree for pure equality on large tables since it's O(1) lookup vs O(log n).

PostgreSQL Hash indexes are crash-safe since Postgres 10.

### Syntax

```sql
CREATE INDEX idx_hash ON table USING HASH (column);
```

### Example

```sql
-- Hash index: perfect for exact session token lookup
CREATE INDEX idx_sessions_token USING HASH ON sessions(token);

-- This query uses the hash index efficiently
SELECT * FROM sessions WHERE token = 'abc123xyz';

-- This does NOT use a hash index (range query)
SELECT * FROM sessions WHERE created_at > '2024-01-01';
```

### When to Use Hash vs B-Tree

| Scenario                              | Use                    |
| ------------------------------------- | ---------------------- |
| Exact equality, no sorting            | Hash (slightly faster) |
| Range, ORDER BY, LIKE                 | B-Tree only            |
| Unsure                                | B-Tree (safe default)  |
| UUID primary keys with equality joins | Hash can help          |

### Problems to Solve

1. You have a `tokens(id, token, user_id, expires_at)` table. Which columns get B-Tree vs Hash?
2. Can a HASH index on `status` (values: active, inactive, pending) improve a query? Why not?
3. `SELECT * FROM users WHERE email = 'alice@example.com'` — would Hash or B-Tree be faster? Does it matter at small scale?

### Resources

* https://www.postgresql.org/docs/current/indexes-types.html#INDEXES-TYPES-HASH

---

## Topic 19 — Composite Index

### Concept

An index on  **multiple columns** . The order of columns is critical — the index can only be used if the query filters on the  **leading column(s)** . Think of it as a phone book sorted by last name, then first name.

### Syntax

```sql
CREATE INDEX idx_composite ON table(col_a, col_b, col_c);
-- Effective for queries on: col_a | col_a + col_b | col_a + col_b + col_c
-- NOT effective for: col_b alone | col_c alone
```

### Example

```sql
CREATE INDEX idx_orders_cust_date ON orders(customer_id, created_at);

-- Uses index (leading column matches)
SELECT * FROM orders WHERE customer_id = 5;
SELECT * FROM orders WHERE customer_id = 5 AND created_at > '2024-01-01';

-- Does NOT efficiently use this index (skips leading column)
SELECT * FROM orders WHERE created_at > '2024-01-01';
-- PostgreSQL may do a full scan or a partial index scan — not efficient

-- ORDER rule for composite index columns:
-- 1. Equality conditions first (=)
-- 2. Range conditions last (<, >, BETWEEN)
-- Example: (customer_id, status, created_at) for:
-- WHERE customer_id = 5 AND status = 'active' AND created_at > '2024-01-01'
```

### Solved Problem

**Problem:** Optimize this slow query:

```sql
SELECT * FROM orders WHERE customer_id = 42 AND status = 'completed' ORDER BY created_at DESC;
```

```sql
-- Ideal composite index: equality cols first, range/sort col last
CREATE INDEX idx_orders_cust_status_date ON orders(customer_id, status, created_at DESC);

EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42 AND status = 'completed' ORDER BY created_at DESC;
-- Should show: Index Scan (not Seq Scan), no separate Sort step
```

### Problems to Solve

1. Given query: `WHERE dept_id = 3 AND salary > 50000 ORDER BY salary`, design the optimal index.
2. Does `(a, b)` index help `WHERE b = 1 AND a = 5`? Does column order in WHERE matter?
3. You have index `(a, b, c)`. Which of these queries use it? a) WHERE a=1 b) WHERE b=2 c) WHERE a=1 AND c=3 d) WHERE a=1 AND b=2 AND c=3
4. When does a composite index cause more harm than good?

### Resources

* https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys

---

## Topic 20 — Covering Index

### Concept

An index that contains **all columns needed by a query** so PostgreSQL never needs to go back to the heap (actual table). The query is answered entirely from the index — called an "Index Only Scan". Fastest possible indexed query.

### Syntax

```sql
-- Include all needed columns (PostgreSQL 11+)
CREATE INDEX idx_covering ON orders(customer_id) INCLUDE (amount, created_at);
-- Or put them all in the index key:
CREATE INDEX idx_covering ON orders(customer_id, amount, created_at);
```

### Example

```sql
CREATE INDEX idx_orders_cover ON orders(customer_id) INCLUDE (amount, created_at);

-- This query needs customer_id (filter), amount, created_at (select)
EXPLAIN ANALYZE
SELECT amount, created_at FROM orders WHERE customer_id = 5;
-- Result: Index Only Scan — zero heap accesses
```

### Solved Problem

**Problem:** A reporting query runs every 5 minutes: `SELECT product_id, SUM(amount) FROM orders WHERE created_at >= NOW() - INTERVAL '24h' GROUP BY product_id`. Optimize it with a covering index.

```sql
-- created_at is the filter, product_id and amount are needed
CREATE INDEX idx_orders_recent_cover
ON orders(created_at) INCLUDE (product_id, amount);

EXPLAIN ANALYZE
SELECT product_id, SUM(amount)
FROM orders
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY product_id;
-- Index Only Scan: reads only the index, no table access
```

### Problems to Solve

1. Design a covering index for: `SELECT name, email FROM customers WHERE country = 'Bangladesh'`
2. What is the downside of putting too many columns in a covering index?
3. How does a covering index differ from a composite index?
4. Can you have a covering index for `SELECT *`? What would happen?

### Resources

* https://www.postgresql.org/docs/current/indexes-index-only-scans.html

---

## Topic 21 — EXPLAIN & EXPLAIN ANALYZE

### Concept

* `EXPLAIN` — shows the query plan (what the planner intends to do) without executing.
* `EXPLAIN ANALYZE` — executes the query and shows actual vs estimated row counts and timing.
* `EXPLAIN (ANALYZE, BUFFERS)` — also shows cache hit statistics.

### Key Plan Nodes

| Node              | Meaning                                                  |
| ----------------- | -------------------------------------------------------- |
| Seq Scan          | Full table scan — no index used                         |
| Index Scan        | Uses index, then fetches heap rows                       |
| Index Only Scan   | Query satisfied entirely by index                        |
| Bitmap Index Scan | Collects row pointers first, then fetches in order       |
| Hash Join         | Builds hash table on smaller relation                    |
| Nested Loop       | For each outer row, scans inner — good for small tables |
| Merge Join        | Requires sorted inputs — good for large sorted sets     |
| Sort              | Explicit sort (index might eliminate this)               |

### Syntax

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 5;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 5;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
```

### Example

```sql
EXPLAIN ANALYZE
SELECT c.name, COUNT(o.id) AS orders, SUM(o.amount) AS total
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.country = 'USA'
GROUP BY c.id, c.name;

-- Read the output:
-- "Seq Scan on customers (cost=0.00..12.50 rows=3 width=40) (actual rows=5 loops=1)"
-- cost: startup..total estimated cost (arbitrary units)
-- rows: estimated row count
-- actual rows: real row count after execution
-- loops: how many times this node ran
-- Large gap between rows estimate and actual → stale statistics → run ANALYZE table_name
```

### Solved Problem

**Problem:** Identify why this query is slow and fix it.

```sql
-- Slow query
EXPLAIN ANALYZE
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.email = 'alice@example.com'
ORDER BY o.created_at DESC
LIMIT 10;

-- Findings from plan:
-- Seq Scan on customers (rows=50000) — email has no index
-- Sort on orders.created_at — no index for this sort

-- Fix:
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Re-run EXPLAIN ANALYZE:
-- Index Scan on customers using idx_customers_email
-- Index Scan on orders using idx_orders_created
-- Much lower cost and actual time
```

### Problems to Solve

1. Run EXPLAIN on a query with a subquery. Identify which subquery node runs first.
2. What does "rows=1000 actual rows=50000" mean? What should you do?
3. When is a Seq Scan actually better than an Index Scan?
4. What does "Buffers: shared hit=100 read=5000" tell you about cache performance?
5. How do you force PostgreSQL to use (or not use) an index for testing?

### Resources

* https://www.postgresql.org/docs/current/sql-explain.html
* https://explain.dalibo.com/ (visual EXPLAIN plan tool)
* https://use-the-index-luke.com/sql/explain-plan/postgresql

---

## Topic 22 — When NOT to Use an Index

### Concept

Indexes cost: they take disk space, slow down INSERT/UPDATE/DELETE (index must be updated), and can actually make reads slower in some cases. The query planner may ignore your index.

### Do NOT index when:

1. **Low cardinality** — column has few distinct values (boolean, status with 2-3 values, gender). Scanning a boolean index is often slower than a full scan.
2. **Small tables** — full table scan on 1,000 rows is nearly instant. Index overhead isn't worth it.
3. **Very frequent writes, infrequent reads** — logging tables, event streams. Every write updates all indexes.
4. **Column rarely used in WHERE / JOIN** — unused index wastes space and slows writes.
5. **High NULL percentage** — B-Tree stores NULLs but many queries use `IS NOT NULL`, which can't index-skip well.
6. **Queries that return most of the table** — if a query returns 50%+ of rows, Seq Scan is faster (sequential I/O is fast).

### Example

```sql
-- Bad index: status has only 3 values (low cardinality)
CREATE INDEX idx_orders_status ON orders(status);
-- Planner may skip this index if 40% of rows have status='completed'

-- Better: partial index on a rare value
CREATE INDEX idx_orders_pending ON orders(customer_id)
WHERE status = 'pending';
-- Only indexes pending orders — small, fast, high cardinality

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0;  -- indexes that have NEVER been used
-- Drop unused indexes
```

### Problems to Solve

1. You have an `is_deleted` boolean column. Is an index useful? What partial index would be better?
2. An `orders` table has 100 rows. Should you index `customer_id`? What about when it grows to 10M rows?
3. Find all unused indexes in your database and write a script to drop them.
4. A write-heavy logs table (10,000 inserts/sec) has 6 indexes. What would you do?
5. Design a query that would be faster with a partial index than a full B-Tree index.

### Resources

* https://www.postgresql.org/docs/current/indexes-partial.html
* https://use-the-index-luke.com/sql/where-clause/partial-and-filtered-indexes

---

## Topic 23 — ACID Properties

### Concept

ACID guarantees that database transactions are processed reliably even in the face of errors, crashes, or concurrent access.

### Atomicity

All operations in a transaction succeed together or fail together. No partial writes.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;  -- debit
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;  -- credit
  -- If second UPDATE fails → both are rolled back → no money lost
COMMIT;
```

### Consistency

A transaction brings the database from one valid state to another. All constraints, rules, and triggers must be satisfied before a commit succeeds.

```sql
-- Consistency enforced by CHECK constraint
ALTER TABLE accounts ADD CONSTRAINT positive_balance CHECK (balance >= 0);

BEGIN;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
  -- If balance is 500 → balance would be -500 → CHECK violation → rollback
COMMIT;
```

### Isolation

Concurrent transactions do not see each other's intermediate state. Each transaction runs as if it were the only one (at SERIALIZABLE level).

```sql
-- Two users reading and updating the same row concurrently
-- Without isolation → dirty reads, lost updates, phantom reads
-- With isolation → each sees a consistent snapshot
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- reads 1000
  -- Another session commits balance = 800 here
  SELECT balance FROM accounts WHERE id = 1;  -- still reads 1000 (repeatable read)
COMMIT;
```

### Durability

Once committed, data survives crashes. PostgreSQL achieves this via WAL (Write-Ahead Log) — changes are written to WAL before they're applied to data files. On restart, WAL is replayed.

### Solved Problem

**Problem:** Transfer $200 from account A to B. Handle the case where A has insufficient funds.

```sql
DO $$
DECLARE
  v_balance NUMERIC;
BEGIN
  BEGIN  -- inner block for exception handling
    SELECT balance INTO v_balance FROM accounts WHERE id = 1 FOR UPDATE;

    IF v_balance < 200 THEN
      RAISE EXCEPTION 'Insufficient funds: balance is %', v_balance;
    END IF;

    UPDATE accounts SET balance = balance - 200 WHERE id = 1;
    UPDATE accounts SET balance = balance + 200 WHERE id = 2;

    RAISE NOTICE 'Transfer successful';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Transfer failed: %', SQLERRM;
      -- transaction is automatically rolled back on exception in PL/pgSQL
  END;
END $$;
```

### Problems to Solve

1. Which ACID property prevents the scenario: 500 items deducted from inventory but payment never recorded?
2. Write a transaction that inserts an order, decrements product stock, and creates a payment record. Rollback if any step fails.
3. How does PostgreSQL implement Durability? What is WAL?
4. Can a database be ACID-compliant without supporting transactions? Explain.
5. What is the difference between Consistency in ACID and Consistency in CAP theorem?

### Resources

* https://www.postgresql.org/docs/current/tutorial-transactions.html
* https://www.postgresql.org/docs/current/wal-intro.html

---

## Topic 24 — Isolation Levels & Transaction Anomalies

### Concept

| Anomaly             | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| Dirty Read          | Reading uncommitted changes from another transaction                           |
| Non-repeatable Read | Same row read twice gives different values (other txn committed between reads) |
| Phantom Read        | Same query returns different set of rows (other txn inserted/deleted)          |
| Lost Update         | Two transactions read then write same row, one overwrites the other            |

| Isolation Level             | Dirty Read | Non-repeatable | Phantom   |
| --------------------------- | ---------- | -------------- | --------- |
| READ UNCOMMITTED            | Possible   | Possible       | Possible  |
| READ COMMITTED (PG default) | Prevented  | Possible       | Possible  |
| REPEATABLE READ             | Prevented  | Prevented      | Possible  |
| SERIALIZABLE                | Prevented  | Prevented      | Prevented |

### Syntax

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;  -- session
BEGIN ISOLATION LEVEL SERIALIZABLE;              -- transaction level
```

### Example

```sql
-- Demonstrate non-repeatable read (at READ COMMITTED)
-- Session A:
BEGIN;
SELECT salary FROM employees WHERE id = 1;  -- returns 50000

-- Session B (while A is running):
BEGIN;
UPDATE employees SET salary = 60000 WHERE id = 1;
COMMIT;

-- Session A (still in its transaction):
SELECT salary FROM employees WHERE id = 1;  -- returns 60000 (different!) → non-repeatable read
COMMIT;

-- At REPEATABLE READ, Session A would see 50000 both times
```

### Solved Problem

**Problem:** An e-commerce checkout process reads available stock then writes an order. Two users checkout the last item simultaneously. What isolation level + locking prevents overselling?

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;

-- Read current stock (with lock to prevent concurrent modification)
SELECT qty FROM inventory WHERE product_id = 10 FOR UPDATE;
-- FOR UPDATE acquires a row-level lock — other sessions must wait

IF qty > 0 THEN
  UPDATE inventory SET qty = qty - 1 WHERE product_id = 10;
  INSERT INTO orders (...) VALUES (...);
  COMMIT;
ELSE
  ROLLBACK;
  -- return "Out of stock" to user
END IF;
```

### Problems to Solve

1. At READ UNCOMMITTED, Session A reads a balance of $1,000. Session B is in the middle of a transfer that temporarily shows $0. What anomaly is this?
2. Two sessions both run: `SELECT count FROM tickets WHERE event_id = 5; UPDATE tickets SET count = count - 1`. What problem occurs at READ COMMITTED? How do you fix it?
3. When would you choose READ COMMITTED over SERIALIZABLE? What are the trade-offs?
4. What does `SELECT ... FOR UPDATE SKIP LOCKED` do? When is it useful?
5. Research: how does PostgreSQL implement MVCC (Multi-Version Concurrency Control)?

### Resources

* https://www.postgresql.org/docs/current/transaction-iso.html
* https://www.postgresql.org/docs/current/mvcc.html

---

## Topic 25 — Deadlock

### Concept

A deadlock occurs when two or more transactions are each waiting for the other to release a lock, and neither can proceed. PostgreSQL detects deadlocks automatically and kills the youngest transaction (rolling it back) to resolve.

**Classic deadlock:**

* Session A locks row 1, waits for row 2
* Session B locks row 2, waits for row 1
* Neither can proceed → deadlock

### How to Prevent

1. **Consistent lock ordering** — always lock resources in the same order (row 1 before row 2, alphabetical by table)
2. **Keep transactions short** — shorter transactions hold locks less time
3. **Use `NOWAIT` or `SKIP LOCKED`** — fail immediately if lock not available
4. **Use `FOR UPDATE` on SELECT** — acquire locks early rather than at UPDATE time

### Example

```sql
-- Deadlock scenario (run Session A then Session B quickly)

-- Session A:
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- locks row 1
-- (pause)
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- waits for row 2

-- Session B (starts before Session A finishes):
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 2;  -- locks row 2
UPDATE accounts SET balance = balance + 100 WHERE id = 1;  -- waits for row 1 → DEADLOCK

-- PostgreSQL will kill one session with:
-- ERROR: deadlock detected
-- DETAIL: Process 123 waits for ShareLock on transaction 456
```

**Prevention by consistent ordering:**

```sql
-- Both sessions always lock lower ID first
BEGIN;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Acquires both locks in order — no deadlock possible
```

### Problems to Solve

1. Write a two-session scenario that causes a deadlock on the orders and customers tables.
2. How would you detect deadlocks in a production PostgreSQL log? What log setting enables this?
3. Application retry logic: write pseudocode to retry a transaction when a deadlock error is caught.
4. Does indexing help prevent deadlocks? Explain.
5. Research: what is `lock_timeout` and `deadlock_timeout` in PostgreSQL?

### Resources

* https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS

---

## Topic 26 — BEGIN · COMMIT · ROLLBACK · SAVEPOINT

### Syntax

```sql
BEGIN;                      -- start transaction (also: START TRANSACTION)
  SQL statements...
SAVEPOINT savepoint_name;   -- mark a partial rollback point
  More SQL...
ROLLBACK TO savepoint_name; -- undo back to savepoint, keep prior work
RELEASE SAVEPOINT savepoint_name;
COMMIT;                     -- make all changes permanent

ROLLBACK;                   -- undo entire transaction
```

### Example

```sql
BEGIN;

INSERT INTO orders (customer_id, product_id, amount) VALUES (1, 5, 299.99);
SAVEPOINT order_placed;

INSERT INTO payments (order_id, amount, method) VALUES (LASTVAL(), 299.99, 'card');
SAVEPOINT payment_recorded;

UPDATE inventory SET qty = qty - 1 WHERE product_id = 5;

-- Oh no, inventory went negative:
-- ROLLBACK TO payment_recorded;  -- undo inventory update, keep order + payment

COMMIT;
```

### Solved Problem

**Problem:** Process a batch of 1,000 salary updates. If any update fails, roll back only the failed row, not the entire batch.

```sql
DO $$
DECLARE
  r RECORD;
  fail_count INT := 0;
BEGIN
  FOR r IN SELECT id, new_salary FROM salary_updates LOOP
    BEGIN
      SAVEPOINT per_row;
      UPDATE employees SET salary = r.new_salary WHERE id = r.id;
      RELEASE SAVEPOINT per_row;
    EXCEPTION WHEN OTHERS THEN
      ROLLBACK TO per_row;
      fail_count := fail_count + 1;
      RAISE NOTICE 'Failed for employee %: %', r.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Done. % failures.', fail_count;
END $$;
```

### Problems to Solve

1. What is autocommit? How does it affect bare SQL statements outside a BEGIN block?
2. Can you COMMIT after a ROLLBACK TO SAVEPOINT? What state is the transaction in?
3. Write a transaction that creates an order and atomically sends a notification (insert to a notifications table), but if the notification insert fails, only rollback the notification (not the order).

### Resources

* https://www.postgresql.org/docs/current/sql-begin.html

---

## Topic 27 — Normalization: 1NF → 2NF → 3NF → BCNF

### First Normal Form (1NF)

**Rule:** Atomic values only. No repeating groups. No arrays in a cell. Each row uniquely identifiable (primary key exists).

**Violation:**

```
order_id | products
---------|------------------
1        | "pen, notebook"    ← multiple values in one cell
```

**Fix:**

```
order_id | product
---------|--------
1        | pen
1        | notebook
```

### Second Normal Form (2NF)

**Rule:** Must be 1NF. No **partial dependency** — every non-key column must depend on the **whole** primary key, not just part of it. Only applies to composite primary keys.

**Violation:**

```
order_id | product_id | product_name | quantity
-- product_name depends only on product_id, not on (order_id, product_id)
```

**Fix:** split into `order_items(order_id, product_id, quantity)` and `products(product_id, product_name)`

### Third Normal Form (3NF)

**Rule:** Must be 2NF. No **transitive dependency** — non-key column must not depend on another non-key column.

**Violation:**

```
employee_id | dept_id | dept_location
-- dept_location depends on dept_id, not directly on employee_id
```

**Fix:** split into `employees(employee_id, dept_id)` and `departments(dept_id, dept_location)`

### Boyce-Codd Normal Form (BCNF)

**Rule:** Stricter than 3NF. Every determinant must be a  **candidate key** . Eliminates edge cases where 3NF still allows anomalies.

**BCNF violation example:** `course_enrollment(student, course, teacher)` where each course has one teacher, but a student can take a course with different teachers. The determinant `teacher → course` but teacher is not a candidate key.

### Solved Problem

**Problem:** Normalize this flat table to 3NF:

```
flat_orders(order_id, order_date, customer_id, customer_name, customer_city,
            product_id, product_name, category, category_manager, qty, unit_price)
```

**Step 1 — 1NF:** Already atomic. Primary key = order_id + product_id. ✓

**Step 2 — 2NF:** Remove partial dependencies (things depending only on customer_id or product_id):

```sql
-- customers(customer_id PK, customer_name, customer_city)
-- products(product_id PK, product_name, category)
-- order_items(order_id, product_id, qty, unit_price)  -- composite PK
-- orders(order_id PK, order_date, customer_id FK)
```

**Step 3 — 3NF:** Remove transitive dependencies (category_manager depends on category, not product):

```sql
-- categories(category PK, category_manager)
-- products(product_id PK, product_name, category FK)
```

**Final schema:** customers, orders, order_items, products, categories

### Problems to Solve

1. Is this in 2NF? `student_courses(student_id, course_id, student_name, grade)` — student_name depends only on student_id.
2. Normalize: `library(book_id, title, author_id, author_name, author_nationality, genre_id, genre_name, borrower_id, borrow_date)`
3. Give an example of a table that's in 3NF but NOT in BCNF.
4. What is denormalization and when is it appropriate?
5. Draw the ERD for the final schema from the solved problem above.

### Resources

* https://www.guru99.com/database-normalization.html
* https://www.studytonight.com/dbms/database-normalization.php

---

## Topic 28 — Denormalization

### Concept

Intentionally introducing redundancy to improve read performance. Trade-off: faster reads, more complex writes, risk of data inconsistency.

### When to Denormalize

* Read-heavy workloads where JOIN cost is prohibitive
* Reporting and analytics (pre-aggregated totals)
* The table is rarely updated (so redundancy risk is low)
* Response time matters more than storage cost

### Techniques

```sql
-- 1. Storing derived data (pre-computed aggregates)
ALTER TABLE customers ADD COLUMN total_orders INT DEFAULT 0;
-- Update with a trigger when orders are inserted/deleted

-- 2. Duplicating a column to avoid a JOIN
ALTER TABLE orders ADD COLUMN customer_name TEXT;
-- Now: SELECT id, amount, customer_name FROM orders — no JOIN needed

-- 3. Flattened table for reporting
CREATE MATERIALIZED VIEW order_summary AS
SELECT o.id, o.amount, o.created_at,
       c.name AS customer, c.country,
       p.name AS product, p.category
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id;

REFRESH MATERIALIZED VIEW order_summary;  -- run periodically
```

### Problems to Solve

1. An orders dashboard queries customer name, product name, and amount millions of times per hour. Should you denormalize? How?
2. What is a Materialized View and how does it differ from a regular view?
3. You denormalize customer_city into orders. A customer moves cities. What's the problem and how do you handle it?
4. Compare OLTP (normalized) vs OLAP (denormalized) schema approaches.

### Resources

* https://www.postgresql.org/docs/current/sql-creatematerializedview.html

---

## Topic 29 — ERD (Entity Relationship Diagram)

### Concept

A visual diagram showing entities (tables), their attributes, and relationships. Crow's foot notation is most common.

### Relationship Types

* **1:1** — one row relates to exactly one row in another table (user → user_profile)
* **1:N** — one row relates to many rows (customer → orders)
* **M:N** — many rows relate to many rows, requires a junction table (students ↔ courses → enrollments)

### Example ERD (text representation)

```
customers (1) ──────< orders (N)
   id PK              id PK
   name               customer_id FK
   email              product_id FK
   country            amount
                      created_at

products (1) ───────< orders (N)
   id PK
   name
   category
   price

employees (N) >────< projects (M)
via junction: employee_projects(employee_id FK, project_id FK, role, joined_at)
```

### Constraints Syntax

```sql
-- Primary key
id SERIAL PRIMARY KEY

-- Foreign key with cascade options
customer_id INT REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE
-- ON DELETE CASCADE: delete orders when customer is deleted
-- ON DELETE SET NULL: set to NULL when parent deleted
-- ON DELETE RESTRICT: prevent parent deletion if child rows exist (default)

-- Unique constraint
email TEXT UNIQUE
-- or: CONSTRAINT uq_customer_email UNIQUE (email)

-- Check constraint
price NUMERIC CHECK (price > 0)
salary NUMERIC CHECK (salary BETWEEN 20000 AND 500000)

-- Not null
name TEXT NOT NULL

-- Default
status TEXT DEFAULT 'active'
```

### Solved Problem

**Problem:** Design the schema for a school management system.

Entities: Students, Teachers, Courses, Enrollments, Grades

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  enrolled_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
  max_students INT CHECK (max_students > 0) DEFAULT 30
);

CREATE TABLE enrollments (
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  course_id  INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);

CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  enrollment_student_id INT,
  enrollment_course_id INT,
  grade NUMERIC CHECK (grade BETWEEN 0 AND 100),
  FOREIGN KEY (enrollment_student_id, enrollment_course_id)
    REFERENCES enrollments(student_id, course_id)
);
```

### Problems to Solve

1. Draw the ERD (on paper or in text) for an Airbnb-like system: users can be hosts and guests; properties have bookings; bookings have reviews.
2. When would you use ON DELETE CASCADE vs ON DELETE RESTRICT?
3. Design the junction table for a tagging system: articles can have many tags, tags can belong to many articles.
4. What is a composite primary key? Give a real use case.
5. What constraints would you add to enforce "a booking's check-out must be after check-in"?

### Resources

* https://www.lucidchart.com/pages/er-diagrams
* https://drawsql.app/ (free ERD tool)

---

# PART 2 — MongoDB

---

## Topic 31 — Document Model vs Relational Model

### Concept

|               | Relational (SQL)            | Document (MongoDB)                               |
| ------------- | --------------------------- | ------------------------------------------------ |
| Structure     | Tables with fixed columns   | Collections of flexible JSON documents           |
| Schema        | Enforced, predefined        | Flexible, per-document                           |
| Relationships | Joins between tables        | Embedding or referencing                         |
| Scaling       | Vertical (scale up)         | Horizontal (scale out, sharding)                 |
| Transactions  | ACID across tables          | ACID within a document; multi-doc txns since 4.0 |
| Best for      | Structured, relational data | Hierarchical, nested, evolving data              |

### Example

```javascript
// Relational: 3 tables to store one order
// orders + order_items + shipping_address

// MongoDB: one document (natural representation)
{
  _id: ObjectId("..."),
  order_date: ISODate("2024-01-15"),
  customer: { name: "Alice", email: "alice@example.com" },
  shipping: { street: "123 Main St", city: "Dhaka", country: "BD" },
  items: [
    { product: "Laptop", qty: 1, price: 999 },
    { product: "Mouse", qty: 2, price: 29 }
  ],
  total: 1057,
  status: "shipped"
}
// One read = complete order. No JOINs needed.
```

### Problems to Solve

1. When would you choose MongoDB over PostgreSQL for a product catalog?
2. A chat app stores messages. Each message has sender, timestamp, text, reactions (array). Model this in both SQL and MongoDB. Which is more natural?
3. What is "schema-on-read" vs "schema-on-write"?

### Resources

* https://www.mongodb.com/docs/manual/core/document/

---

## Topic 32 — MongoDB CRUD

### Syntax & Example

```javascript
// ── INSERT ──
db.products.insertOne({
  name: "Mechanical Keyboard", category: "accessories",
  price: 149, tags: ["gaming", "productivity"], in_stock: true
})

db.products.insertMany([
  { name: "USB-C Hub", category: "accessories", price: 49 },
  { name: "4K Monitor", category: "displays", price: 599 }
])

// ── READ ──
db.products.find()                         // all documents
db.products.find({ category: "accessories" })  // equality filter
db.products.findOne({ name: "USB-C Hub" })

// Comparison operators
db.products.find({ price: { $gt: 100 } })          // price > 100
db.products.find({ price: { $gte: 50, $lte: 200 } })
db.products.find({ category: { $in: ["accessories", "displays"] } })
db.products.find({ tags: { $all: ["gaming", "productivity"] } })

// Logical operators
db.products.find({ $and: [{ price: { $gt: 100 } }, { in_stock: true }] })
db.products.find({ $or: [{ category: "displays" }, { price: { $lt: 30 } }] })

// Projection, sort, limit, skip
db.products.find({}, { name: 1, price: 1, _id: 0 })  // include name, price; exclude _id
  .sort({ price: -1 })   // -1 = descending
  .skip(10).limit(5)     // pagination

// ── UPDATE ──
db.products.updateOne({ name: "USB-C Hub" }, { $set: { price: 45 } })
db.products.updateMany({ category: "accessories" }, { $inc: { price: 5 } })
db.products.updateOne({ name: "Laptop" }, { $push: { tags: "computer" } })
db.products.updateOne({ name: "Laptop" }, { $addToSet: { tags: "gaming" } })  // no duplicates
db.products.updateOne({ name: "Gone" }, { $set: { price: 10 } }, { upsert: true })  // insert if missing

// ── DELETE ──
db.products.deleteOne({ name: "USB-C Hub" })
db.products.deleteMany({ in_stock: false })
db.products.deleteMany({})   // delete all (careful!)
```

### Solved Problem

**Problem:** You have a `users` collection. Update all users who haven't logged in for 90 days — set their `status` to `"inactive"` and record `deactivated_at`.

```javascript
const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

db.users.updateMany(
  { last_login: { $lt: cutoff }, status: { $ne: "inactive" } },
  {
    $set: {
      status: "inactive",
      deactivated_at: new Date()
    }
  }
)
// Returns: { matchedCount: 243, modifiedCount: 243 }
```

### Problems to Solve

1. Find all products with no tags field or an empty tags array.
2. Insert a document only if it doesn't exist (use upsert). What operator do you use?
3. In a `blog_posts` collection, add a new tag "featured" to all posts with more than 100 likes.
4. Delete all orders older than 2 years from an `orders` collection.
5. What is the difference between `$set` and `$replace`? Show an example.

### Resources

* https://www.mongodb.com/docs/manual/crud/

---

## Topic 33 — MongoDB Aggregation Pipeline

### Stages Reference

```javascript
{ $match: { field: condition } }         // filter documents (like WHERE)
{ $group: { _id: "$field", total: { $sum: "$amount" } } }  // aggregate
{ $sort: { field: 1 } }                  // 1 = asc, -1 = desc
{ $project: { field: 1, newField: "$otherField" } }  // shape output
{ $limit: N }                            // take first N
{ $skip: N }                             // skip N
{ $unwind: "$arrayField" }               // flatten array → one doc per element
{ $lookup: { from, localField, foreignField, as } }  // join
{ $addFields: { newField: expression } } // add computed fields
{ $count: "total" }                      // count documents
```

### Example

```javascript
// Monthly revenue by category with running total
db.orders.aggregate([
  // Stage 1: only completed orders
  { $match: { status: "completed" } },

  // Stage 2: join with products
  { $lookup: {
    from: "products",
    localField: "product_id",
    foreignField: "_id",
    as: "product"
  }},
  { $unwind: "$product" },

  // Stage 3: group by month and category
  { $group: {
    _id: {
      month: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
      category: "$product.category"
    },
    revenue: { $sum: "$amount" },
    order_count: { $sum: 1 },
    avg_order: { $avg: "$amount" }
  }},

  // Stage 4: sort
  { $sort: { "_id.month": 1, revenue: -1 } },

  // Stage 5: reshape output
  { $project: {
    _id: 0,
    month: "$_id.month",
    category: "$_id.category",
    revenue: { $round: ["$revenue", 2] },
    order_count: 1,
    avg_order: { $round: ["$avg_order", 2] }
  }}
])
```

### Solved Problem

**Problem:** Find the top 5 customers by total spend in 2024, including their order count and average order value.

```javascript
db.orders.aggregate([
  { $match: {
    created_at: {
      $gte: ISODate("2024-01-01"),
      $lt: ISODate("2025-01-01")
    }
  }},
  { $group: {
    _id: "$customer_id",
    total_spent: { $sum: "$amount" },
    order_count: { $sum: 1 },
    avg_order: { $avg: "$amount" }
  }},
  { $sort: { total_spent: -1 } },
  { $limit: 5 },
  { $lookup: {
    from: "customers",
    localField: "_id",
    foreignField: "_id",
    as: "customer"
  }},
  { $unwind: "$customer" },
  { $project: {
    _id: 0,
    name: "$customer.name",
    email: "$customer.email",
    total_spent: { $round: ["$total_spent", 2] },
    order_count: 1,
    avg_order: { $round: ["$avg_order", 2] }
  }}
])
```

### Problems to Solve

1. Count how many products are in each category. Sort by count descending.
2. Find all users who placed more than 3 orders in the last 30 days.
3. For a blog: find the 3 most-used tags across all posts (posts have a `tags` array).
4. Calculate the 7-day rolling average of daily signups.
5. Find categories where average product price increased month-over-month in 2024.

### Resources

* https://www.mongodb.com/docs/manual/aggregation/
* https://www.mongodb.com/docs/manual/reference/operator/aggregation/

---

## Topic 34 — MongoDB Indexes

### Types

```javascript
// Single field
db.users.createIndex({ email: 1 })         // 1 = ascending
db.users.createIndex({ created_at: -1 })   // -1 = descending

// Compound
db.orders.createIndex({ customer_id: 1, created_at: -1 })

// Text (full-text search)
db.products.createIndex({ name: "text", description: "text" })
db.products.find({ $text: { $search: "mechanical keyboard" } })

// Unique
db.users.createIndex({ email: 1 }, { unique: true })

// Sparse (only index documents that have the field)
db.users.createIndex({ phone: 1 }, { sparse: true })

// TTL (auto-delete after N seconds)
db.sessions.createIndex({ created_at: 1 }, { expireAfterSeconds: 3600 })

// List indexes
db.collection.getIndexes()

// Drop index
db.collection.dropIndex("index_name")
```

### Using Explain

```javascript
db.orders.find({ customer_id: ObjectId("...") }).explain("executionStats")
// Look for:
// "IXSCAN" (index scan) = good
// "COLLSCAN" (collection scan) = no index used
// "nReturned" vs "totalDocsExamined" — should be close
// "executionTimeMillis" — actual query time
```

### Solved Problem

**Problem:** A query `db.orders.find({ customer_id: x, status: "pending" }).sort({ created_at: -1 })` is slow. Fix it.

```javascript
// Compound index: equality fields first, sort field last, sort direction matches
db.orders.createIndex({
  customer_id: 1,
  status: 1,
  created_at: -1    // matches sort direction
})

// Verify
db.orders.find({ customer_id: ObjectId("..."), status: "pending" })
  .sort({ created_at: -1 })
  .explain("executionStats")
// Should now show IXSCAN
```

### Problems to Solve

1. Design indexes for a Twitter-like app: queries are "all tweets by user X sorted by date" and "all tweets containing #mongodb".
2. What happens when you insert a duplicate value into a unique index?
3. Why should you avoid indexing every field? What is the cost?
4. A TTL index isn't deleting documents on time. What could cause this?
5. When is a text index better than a regex query?

### Resources

* https://www.mongodb.com/docs/manual/indexes/

---

## Topic 35 — MongoDB Schema Design: Embedding vs Referencing

### Decision Framework

| Factor                  | Embed                     | Reference                         |
| ----------------------- | ------------------------- | --------------------------------- |
| Access pattern          | Data accessed together    | Data accessed independently       |
| Relationship size       | 1:few (< ~15 children)    | 1:many (potentially thousands)    |
| Data update frequency   | Child rarely changes      | Child changes independently       |
| Document growth         | Bounded                   | Unbounded — avoid embedding      |
| Duplication acceptable? | Yes, for read performance | No — keep single source of truth |

**MongoDB document size limit: 16MB.** Embedding unbounded arrays will hit this.

### Embedding Pattern

```javascript
// Good embed: user profile (accessed with user, rarely huge)
{
  _id: ObjectId("..."),
  name: "Alice",
  email: "alice@example.com",
  address: {             // embedded subdocument
    street: "123 Main",
    city: "Dhaka",
    country: "BD"
  },
  preferences: {         // embedded subdocument
    theme: "dark",
    notifications: true
  }
}
```

### Referencing Pattern

```javascript
// Good reference: orders (a customer can have thousands)
// customers collection:
{ _id: ObjectId("c1"), name: "Alice", email: "alice@example.com" }

// orders collection:
{ _id: ObjectId("o1"), customer_id: ObjectId("c1"), amount: 299, ... }
// Query: db.orders.find({ customer_id: ObjectId("c1") })
```

### Hybrid Pattern

```javascript
// Blog post: embed a FEW recent comments, reference the rest
{
  _id: ObjectId("..."),
  title: "My Post",
  recent_comments: [          // embed last 3 for fast preview
    { user: "Alice", text: "Great!", date: ISODate("...") },
    { user: "Bob", text: "Thanks!", date: ISODate("...") }
  ],
  comment_count: 47            // denormalized counter
  // full comments in separate collection
}
```

### Solved Problem

**Problem:** Design a schema for a course platform: courses have many lessons, users enroll in courses, users complete individual lessons.

```javascript
// courses collection (embed lessons — bounded, accessed together)
{
  _id: ObjectId("course1"),
  title: "SQL Mastery",
  instructor_id: ObjectId("teacher1"),  // reference
  lessons: [
    { _id: ObjectId("l1"), title: "INNER JOIN", duration_min: 15, order: 1 },
    { _id: ObjectId("l2"), title: "LEFT JOIN",  duration_min: 12, order: 2 }
  ]
}

// enrollments collection (separate — M:N relationship, updated independently)
{
  _id: ObjectId("..."),
  user_id: ObjectId("user1"),
  course_id: ObjectId("course1"),
  enrolled_at: ISODate("..."),
  progress: {
    completed_lessons: [ObjectId("l1")],    // array of lesson _ids
    last_activity: ISODate("..."),
    pct_complete: 50
  }
}

// users collection
{ _id: ObjectId("user1"), name: "Alice", email: "alice@example.com" }
```

### Problems to Solve

1. A social app has posts, and each post has likes (potentially millions). How do you model likes without embedding them all?
2. Model a product with variants (size, color combinations). Should variants be embedded or a separate collection?
3. When does the "Extended Reference Pattern" (embedding a few fields from a referenced document) make sense?
4. Design schema for a messaging app: users can have many conversations, conversations have many messages.

### Resources

* https://www.mongodb.com/docs/manual/data-modeling/
* https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design

---

# PART 3 — Redis

---

## Topic 36 — Redis Data Structures

### Overview

Redis is an in-memory data structure store. Each data type is optimized for specific use cases.

| Type       | Internal structure         | Best for                              |
| ---------- | -------------------------- | ------------------------------------- |
| String     | Simple value               | Cache, counters, feature flags        |
| Hash       | Hash table of fields       | Objects, sessions, user profiles      |
| List       | Doubly linked list         | Queues, activity feeds, recent items  |
| Set        | Hash table (unique values) | Tags, unique visitors, intersection   |
| Sorted Set | Skip list + hash           | Leaderboards, rankings, range queries |

### String

```bash
SET user:42:name "Alice"
GET user:42:name             # "Alice"
SET counter:page:home 0
INCR counter:page:home       # 1 (atomic increment)
INCRBY counter:page:home 5   # 6
SET cache:product:5 '{"id":5,"name":"Laptop","price":999}' EX 300
TTL cache:product:5          # 298 (seconds remaining)
```

### Hash

```bash
HSET session:abc user_id 42 role admin country BD
HGET session:abc role           # "admin"
HGETALL session:abc             # all field-value pairs
HMGET session:abc user_id role  # multiple fields
HDEL session:abc country
HEXISTS session:abc role        # 1 (true)
HLEN session:abc                # number of fields
EXPIRE session:abc 3600         # expire in 1 hour
```

### List

```bash
LPUSH queue:emails '{"to":"alice@x.com","subject":"Welcome"}'  # push to left
RPUSH queue:emails '{"to":"bob@x.com","subject":"Reset"}'      # push to right
LRANGE queue:emails 0 -1    # all items
LLEN queue:emails           # count
RPOP queue:emails           # pop from right (FIFO with LPUSH)
BRPOP queue:emails 30       # blocking pop, wait up to 30s
LINDEX queue:emails 0       # peek at index 0 without removing
```

### Set

```bash
SADD tags:post:1 sql nosql databases
SMEMBERS tags:post:1        # all members
SISMEMBER tags:post:1 sql   # 1 (true)
SCARD tags:post:1           # count: 3
SUNION tags:post:1 tags:post:2   # union of two sets
SINTER tags:post:1 tags:post:2   # intersection
SDIFF  tags:post:1 tags:post:2   # in set1 but not set2
```

### Sorted Set

```bash
ZADD leaderboard 1500 alice
ZADD leaderboard 2300 bob
ZADD leaderboard 1800 carol
ZRANGE leaderboard 0 -1 WITHSCORES        # all, low to high
ZRANGE leaderboard 0 2 REV WITHSCORES     # top 3 (high to low)
ZRANK leaderboard alice                    # rank (0-indexed, low score = 0)
ZREVRANK leaderboard alice                 # rank from highest
ZSCORE leaderboard alice                   # 1500
ZINCRBY leaderboard 200 alice             # alice now 1700
ZRANGEBYSCORE leaderboard 1500 2000       # members with score in range
```

### Solved Problem

**Problem:** Implement a "recently viewed products" feature — store last 10 viewed products per user.

```bash
# When user views product:
LPUSH recent:user:42 product:15    # add to front of list
LTRIM recent:user:42 0 9           # keep only last 10

# Fetch recently viewed:
LRANGE recent:user:42 0 -1         # returns up to 10 product IDs
# Then look up each product (MGET for batch)
```

### Problems to Solve

1. Implement a "trending topics" feature using a Sorted Set where score = number of mentions in the last hour.
2. Build a "friends who like this" feature using Set intersection.
3. Model a shopping cart using a Hash (product_id → quantity mapping).
4. Use a List to implement both a stack (LIFO) and a queue (FIFO). What commands differ?

### Resources

* https://redis.io/docs/data-types/

---

## Topic 37 — Caching Patterns

### Cache-aside (Lazy Loading)

App controls the cache. Data loaded into cache only on demand.

```python
def get_product(product_id):
    key = f"product:{product_id}"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)      # cache hit ✓

    product = db.query("SELECT * FROM products WHERE id = %s", product_id)
    if product:
        redis.setex(key, 300, json.dumps(product))  # cache for 5 min
    return product

def update_product(product_id, data):
    db.execute("UPDATE products SET ... WHERE id = %s", product_id)
    redis.delete(f"product:{product_id}")   # invalidate cache
```

**Pros:** Cache only holds what's requested. DB failure doesn't break reads (stale data served).

**Cons:** First request is always slow (cache miss). Cache stampede risk on expiry.

### Write-through

Every write goes to cache AND database simultaneously.

```python
def update_product(product_id, data):
    db.execute("UPDATE products SET price = %s WHERE id = %s", data['price'], product_id)
    redis.setex(f"product:{product_id}", 300, json.dumps(data))  # write to cache too
```

**Pros:** Cache always consistent with DB.

**Cons:** Writes are slower. Cache fills with data that may never be read.

### Write-back (Write-behind)

Write to cache immediately, flush to DB asynchronously.

```python
def update_product(product_id, data):
    redis.setex(f"product:{product_id}", 300, json.dumps(data))
    redis.lpush("write_queue", json.dumps({"id": product_id, "data": data}))
    # Background worker drains the queue and writes to DB

# Background worker:
while True:
    item = redis.brpop("write_queue", timeout=5)
    if item: db.execute("UPDATE products SET ...", ...)
```

**Pros:** Very fast writes.

**Cons:** Data loss risk if Redis crashes before flush. Complex consistency.

### Cache Stampede Prevention

```python
import time

def get_product_safe(product_id):
    key = f"product:{product_id}"
    lock_key = f"lock:{key}"

    cached = redis.get(key)
    if cached: return json.loads(cached)

    # Try to acquire lock
    locked = redis.set(lock_key, "1", nx=True, ex=5)  # nx=only if not exists
    if locked:
        product = db.query(...)
        redis.setex(key, 300, json.dumps(product))
        redis.delete(lock_key)
        return product
    else:
        time.sleep(0.1)
        return get_product_safe(product_id)  # retry
```

### Problems to Solve

1. When would write-back be dangerous? Give a concrete example.
2. Implement cache invalidation for a user profile that can be updated from multiple services.
3. What is "cache warming"? When and how do you do it?
4. A Redis cache for product prices expires at midnight. 10,000 users request the same product at the same time. What problem occurs and how do you fix it?
5. Compare cache-aside with query caching at the database level. When does each win?

### Resources

* https://redis.io/docs/manual/patterns/
* https://aws.amazon.com/caching/best-practices/

---

## Topic 38 — Redis Pub/Sub

### Concept

Redis Pub/Sub is a messaging pattern where publishers send messages to channels and subscribers receive them. Messages are not persisted — if a subscriber is offline, messages are lost. Fire-and-forget.

### Syntax

```bash
# Publisher (in Redis CLI or from application)
PUBLISH channel_name "message payload"

# Subscriber
SUBSCRIBE channel_name
PSUBSCRIBE channel_pattern*   # pattern subscription (e.g., order:*)

# Unsubscribe
UNSUBSCRIBE channel_name
```

### Example

```python
# Publisher (Python with redis-py)
import redis, json
r = redis.Redis()

def order_shipped(order_id, tracking_number):
    event = {"order_id": order_id, "tracking": tracking_number, "ts": time.time()}
    r.publish("order:shipped", json.dumps(event))

# Subscriber (runs in a separate process)
pubsub = r.pubsub()
pubsub.subscribe("order:shipped")

for message in pubsub.listen():
    if message['type'] == 'message':
        event = json.loads(message['data'])
        send_shipping_email(event['order_id'], event['tracking'])
```

### When Pub/Sub vs What else

| Use Pub/Sub             | Use Streams / Queue      |
| ----------------------- | ------------------------ |
| Real-time notifications | Guaranteed delivery      |
| Chat messages           | At-least-once processing |
| Live dashboard updates  | Replay of past messages  |
| Log fanout              | Consumer groups          |

For durability, use **Redis Streams** (`XADD`, `XREAD`) instead of basic Pub/Sub.

### Problems to Solve

1. Build a real-time notification system for "user followed you" events using Pub/Sub.
2. What happens to messages published when no subscriber is connected?
3. How would you convert a Pub/Sub system to Redis Streams for guaranteed delivery?
4. Implement a simple chat room using Redis Pub/Sub.

### Resources

* https://redis.io/docs/manual/pubsub/

---

## Topic 39 — Redis Rate Limiting

### Fixed Window Counter

```python
def is_rate_limited(user_id, limit=100, window_seconds=60):
    import time
    window = int(time.time() / window_seconds)  # current window bucket
    key = f"ratelimit:{user_id}:{window}"

    current = redis.incr(key)         # atomic increment
    if current == 1:
        redis.expire(key, window_seconds)  # set TTL on first request

    return current > limit            # True = rate limited
```

**Problem:** requests at the boundary of two windows can exceed the limit (burst at second 59, then again at second 61 = 2× limit in 2 seconds).

### Sliding Window with Sorted Set

```python
def is_rate_limited_sliding(user_id, limit=100, window_ms=60000):
    import time
    now = int(time.time() * 1000)    # current time in ms
    key = f"ratelimit:sliding:{user_id}"

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_ms)   # remove old entries
    pipe.zadd(key, {str(now): now})                   # add current request
    pipe.zcard(key)                                    # count requests in window
    pipe.expire(key, window_ms // 1000 + 1)
    results = pipe.execute()

    count = results[2]
    return count > limit   # True = rate limited
```

**Sliding window is more accurate** but uses more memory (one entry per request).

### Solved Problem

**Problem:** Implement a per-IP rate limiter for an API: max 60 requests per minute.

```python
import redis, time
from functools import wraps
from flask import request, jsonify

r = redis.Redis()

def rate_limit(limit=60, window=60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.remote_addr
            key = f"rl:{ip}:{int(time.time() // window)}"

            count = r.incr(key)
            if count == 1:
                r.expire(key, window)

            if count > limit:
                remaining_ttl = r.ttl(key)
                return jsonify({
                    "error": "Rate limit exceeded",
                    "retry_after": remaining_ttl
                }), 429

            return f(*args, **kwargs)
        return wrapped
    return decorator

@app.route("/api/search")
@rate_limit(limit=60, window=60)
def search():
    ...
```

### Problems to Solve

1. Implement a token bucket rate limiter using Redis. (Hint: store tokens count and last refill time in a Hash.)
2. How would you implement different rate limits for free vs premium users?
3. A rate limiter is running on 3 Redis nodes without replication. A user hits different nodes per request. Is the limit accurate?
4. What Redis data type and commands would you use for a "requests per second" real-time gauge?

### Resources

* https://redis.io/glossary/rate-limiting/
* https://redis.com/redis-best-practices/basic-rate-limiting/

---

# PART 4 — System Design Concepts

---

## Topic 40 — Database Replication

### Concept

Replication = maintaining copies of data on multiple servers. Goals: high availability, read scalability, geographic distribution.

### Types

**Single-leader (Master-Replica):**

* All writes go to the leader
* Replicas receive changes via replication log (WAL in PostgreSQL)
* Replicas serve reads (read scaling)
* Failover: promote a replica to leader if primary fails

**Multi-leader:**

* Multiple nodes accept writes
* Useful for multi-datacenter setups
* Conflict resolution needed (last-write-wins, custom logic)

**Leaderless (Dynamo-style):**

* Any node accepts writes; writes sent to multiple nodes (quorum)
* Reads also check multiple nodes
* Used in Cassandra, DynamoDB

### Synchronous vs Asynchronous Replication

|                      | Synchronous                | Asynchronous                    |
| -------------------- | -------------------------- | ------------------------------- |
| Write completes when | All replicas confirm       | Primary confirms only           |
| Durability           | Strong                     | Potential data loss on failover |
| Latency              | Higher                     | Lower                           |
| Practical use        | 1 sync replica, rest async | Most replicas async             |

### Replication Lag

Asynchronous replicas may lag behind the leader. A user who just wrote data then reads from a replica may not see their write.

**Solutions:**

* Read-your-writes consistency: route user's reads to the leader after a write
* Monotonic reads: always route user to same replica
* Consistent prefix reads: ensure causally related writes are seen in order

### Problems to Solve

1. A web app has 1 primary PostgreSQL + 3 replicas. A user updates their profile. How do you ensure they see the update immediately?
2. What is a replication slot in PostgreSQL? Why does it matter for replica lag?
3. How does multi-leader replication handle a write conflict?
4. Design a read/write split architecture for a high-traffic e-commerce site.

### Resources

* https://www.postgresql.org/docs/current/high-availability.html
* Designing Data-Intensive Applications, Chapter 5 (Kleppmann)

---

## Topic 41 — ACID vs BASE

### ACID (Traditional RDBMS)

Already covered in Topics 23–25. Summary:

* Strong consistency guarantees
* Transaction-based
* Suitable for financial, inventory, and any system where correctness beats availability

### BASE (NoSQL / Distributed Systems)

* **Basically Available** — system guarantees availability (responses given, even if stale/partial)
* **Soft state** — state may change over time even without new input (due to eventual consistency)
* **Eventually Consistent** — system will become consistent over time, given no new updates

```
                    ACID                              BASE
              ─────────────────────────────────────────────────
Consistency   Strong (immediate)              Eventual
Availability  Can sacrifice for consistency   Prioritized
Complexity    Simpler to reason about         More complex app logic
Performance   Lower write throughput          Higher write throughput
Examples      PostgreSQL, MySQL, Oracle       Cassandra, DynamoDB, CouchDB
```

### Example: Shopping Cart (BASE is appropriate)

```
Two users add the same last item to cart simultaneously.
BASE approach: both carts show item available.
Conflict resolved at checkout — one gets the item, one gets "sold out".
The temporary inconsistency is acceptable for this use case.
```

### Problems to Solve

1. Give a scenario where BASE consistency is acceptable and one where it's NOT acceptable.
2. How does eventual consistency work in DynamoDB? What is "strong consistent read"?
3. Can a system be both ACID and eventually consistent? Under what conditions?

### Resources

* https://www.ibm.com/topics/acid-vs-base
* https://queue.acm.org/detail.cfm?id=1394128 (original BASE paper)

---

## Topic 42 — CAP Theorem

### Concept

A distributed system can guarantee at most **2 of 3** properties simultaneously:

* **C — Consistency:** Every read receives the most recent write (or an error)
* **A — Availability:** Every request receives a response (not guaranteed to be latest)
* **P — Partition Tolerance:** System continues operating despite network partitions (message loss/delay between nodes)

**Key insight:** Network partitions are inevitable in distributed systems. You must choose P, so the real choice is  **CP vs AP** .

```
        C ────────── A
         \          /
          \  You   /
           \ must /
            \ P  /
             \/
    (network partition is unavoidable)
```

### CP vs AP Systems

| Choice | During partition                   | After partition heals          | Examples                               |
| ------ | ---------------------------------- | ------------------------------ | -------------------------------------- |
| CP     | Reject requests to stay consistent | Resync and resume              | HBase, Zookeeper, etcd, Consul         |
| AP     | Return possibly stale data         | Reconcile conflicts eventually | Cassandra, CouchDB, DynamoDB (default) |

### Real-World Mapping

```
PostgreSQL (single node) → CA (no partition tolerance)
PostgreSQL (with replication) → CP (synchronous) or AP (async)
MongoDB → CP (default: primary reads, immediate consistency)
Cassandra → AP (tunable consistency with quorum reads/writes)
Redis (single) → CA
Redis Cluster → CP
Zookeeper → CP
DynamoDB → AP (eventually consistent reads) or CP (strongly consistent reads, 2× cost)
```

### Solved Problem

**Problem:** You're building a real-time inventory system for a flash sale. Should you choose CP or AP? Justify.

**Answer: CP.** In a flash sale, overselling is a critical business problem. If the network partitions:

* AP behavior: both nodes accept orders → inventory goes negative → oversell
* CP behavior: one partition refuses orders → some users can't buy → but no overselling

For financial accuracy (payments, inventory), CP is appropriate. Availability is sacrificed temporarily during partition.

### Problems to Solve

1. A social media "like" counter — CP or AP? Why?
2. A bank account balance — CP or AP? Why?
3. How does Cassandra allow you to "tune" between CP and AP?
4. CAP says you can only pick 2. In practice, does PostgreSQL sacrifice P? What does that mean?

### Resources

* https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/
* https://www.systemdesignbangla.com/chapters/cap-theorem.html

---

## Topic 43 — PACELC Theorem

### Concept

An extension of CAP that applies even when there is  **no partition** . Normal operation also involves a trade-off.

**PACELC:** If Partition → choose Availability or Consistency. Else (normal) → choose Latency or Consistency.

```
P → A or C  (CAP's partition trade-off)
E → L or C  (normal operation trade-off — Latency vs Consistency)
```

### System Classification

| System                        | During Partition | Normal operation | Label |
| ----------------------------- | ---------------- | ---------------- | ----- |
| DynamoDB                      | Availability     | Latency          | PA/EL |
| Cassandra                     | Availability     | Latency          | PA/EL |
| PostgreSQL (sync replication) | Consistency      | Consistency      | PC/EC |
| MongoDB                       | Consistency      | Consistency      | PC/EC |
| PNUTS (Yahoo)                 | Availability     | Consistency      | PA/EC |

### Why PACELC Matters

CAP only talks about partition scenarios (rare). PACELC explains everyday trade-offs. To write synchronously to a replica adds latency but guarantees consistency. To write async gives low latency but risks reading stale data.

### Problems to Solve

1. Where does Redis Cluster fall on the PACELC spectrum?
2. A global payments system has nodes in Dhaka and London. How does PACELC guide your replication strategy?
3. How does DynamoDB's "strongly consistent read" option affect its PACELC classification?

### Resources

* https://www.systemdesignbangla.com/chapters/pacelc.html
* https://dbmsmusings.blogspot.com/2010/04/problems-with-cap-and-yahoos-little.html

---

## Topic 44 — Distributed Transactions

### The Problem

In a distributed system, a single business operation may touch multiple services/databases. How do you ensure all-or-nothing atomicity across them?

### Two-Phase Commit (2PC)

```
Phase 1 — Prepare:
  Coordinator → all participants: "Can you commit?"
  Each participant: writes to local log, locks resources, replies "Yes" or "No"

Phase 2 — Commit or Abort:
  If all said "Yes" → Coordinator → "Commit"
  If any said "No" → Coordinator → "Abort"

Participants execute commit/abort and release locks.
```

**Problems with 2PC:**

* **Blocking:** If coordinator crashes after Phase 1, participants hold locks indefinitely
* **Single point of failure:** Coordinator crash = system stall
* **Latency:** Two round trips across the network

### Saga Pattern

Split a distributed transaction into a sequence of local transactions, each with a **compensating transaction** that undoes it if needed.

```
Order Saga:
  Step 1: Reserve inventory        ← compensate: release inventory
  Step 2: Charge payment           ← compensate: refund payment
  Step 3: Schedule delivery        ← compensate: cancel delivery
  Step 4: Confirm order            ← (final step, no compensation needed)

If Step 3 fails:
  Execute: cancel delivery (noop) → refund payment → release inventory
```

**Choreography (event-based):** Each service publishes events and reacts to others' events. Decoupled but hard to trace.

**Orchestration (central coordinator):** A saga orchestrator tells each service what to do. Easier to trace and debug.

### Example

```javascript
// Saga orchestrator pseudocode
async function placeOrderSaga(order) {
  try {
    await inventoryService.reserve(order.items);
    await paymentService.charge(order.customerId, order.total);
    await deliveryService.schedule(order);
    await orderService.confirm(order);
  } catch (error) {
    // Compensate in reverse order
    await deliveryService.cancel(order).catch(() => {});
    await paymentService.refund(order.customerId, order.total).catch(() => {});
    await inventoryService.release(order.items).catch(() => {});
    throw new Error('Order failed: ' + error.message);
  }
}
```

### Problems to Solve

1. 2PC requires all participants to be available. Saga doesn't. What is the trade-off?
2. In a Saga, if the compensation transaction also fails, what do you do?
3. Design a Saga for a hotel booking system: reserve room + charge card + send confirmation.
4. What is idempotency and why is it critical for Saga compensating transactions?

### Resources

* https://microservices.io/patterns/data/saga.html
* https://www.systemdesignbangla.com/chapters/distributed-transactions.html

---

## Topic 45 — Sharding

### Concept

Sharding = horizontally partitioning data across multiple database nodes. Each node (shard) holds a subset of the data. Enables handling more data and higher throughput than any single machine can handle.

### Sharding Strategies

**Range-based sharding:**

```
Shard 1: user_id 1–1,000,000
Shard 2: user_id 1,000,001–2,000,000
Shard 3: user_id 2,000,001+
```

Pro: range queries stay on one shard. Con: uneven distribution (hotspots).

**Hash-based sharding:**

```
shard = hash(user_id) % num_shards
shard = hash("alice@example.com") % 4 = 2 → goes to Shard 2
```

Pro: even distribution. Con: range queries hit all shards; resharding is painful.

**Directory-based sharding:**
A lookup table maps keys to shards. Flexible but the lookup table itself is a bottleneck.

### Problems with Sharding

* **Cross-shard queries** — JOINs across shards require scatter-gather (slow)
* **Resharding** — adding shards requires moving data
* **Hot shards** — uneven access patterns (all popular users on shard 1)
* **Distributed transactions** — ACID across shards is complex (need 2PC or Sagas)

### Example

```python
# Simple hash sharding router
class ShardRouter:
    def __init__(self, shard_connections):
        self.shards = shard_connections
        self.num_shards = len(shard_connections)

    def get_shard(self, key):
        shard_index = hash(str(key)) % self.num_shards
        return self.shards[shard_index]

    def get_user(self, user_id):
        shard = self.get_shard(user_id)
        return shard.execute("SELECT * FROM users WHERE id = %s", user_id)

    def get_all_users_named(self, name):
        # Must query ALL shards (scatter-gather)
        results = []
        for shard in self.shards:
            results.extend(shard.execute("SELECT * FROM users WHERE name = %s", name))
        return results
```

### Problems to Solve

1. You're sharding a `messages` table by `conversation_id`. What query becomes expensive?
2. A celebrity user generates 100× more load than average users (hot shard). How do you fix this?
3. Compare sharding vs vertical scaling (bigger machine). When does each approach make sense?
4. How does MongoDB handle sharding natively? What is a shard key?

### Resources

* https://www.systemdesignbangla.com/chapters/sharding.html
* https://www.mongodb.com/docs/manual/sharding/

---

## Topic 46 — Consistent Hashing

### Problem it Solves

Naive hash sharding: `shard = hash(key) % N`. When N changes (add/remove a node), almost all keys remap → massive data migration.

Consistent hashing: when N changes, only `1/N` fraction of keys need to move.

### How It Works

1. Map the hash space to a circle (ring) from 0 to 2^32
2. Place server nodes on the ring using their hash
3. For each key, hash it and move clockwise to find its node
4. To add a node: only keys between the new node and its predecessor move
5. To remove a node: only that node's keys move to its successor

```
Ring (0 to 2^32):
         Node A (hash=100)
        /
 key1 (hash=90) → assigned to Node A (next clockwise)
       \
        Node B (hash=200)
        |
 key2 (hash=180) → assigned to Node B
        |
        Node C (hash=350)
```

### Virtual Nodes

Without virtual nodes, node distribution is uneven. Each physical node maps to multiple points on the ring (virtual nodes), spreading load evenly.

```
Instead of: NodeA at 100, NodeB at 200, NodeC at 350
Use: NodeA at 100, 250, 400; NodeB at 50, 200, 300; NodeC at 150, 320, 450
→ Each node handles ~1/3 of the ring evenly
```

### Example Implementation

```python
import hashlib, bisect

class ConsistentHash:
    def __init__(self, nodes, virtual_nodes=150):
        self.ring = {}
        self.sorted_keys = []
        for node in nodes:
            for i in range(virtual_nodes):
                key = self._hash(f"{node}:{i}")
                self.ring[key] = node
                self.sorted_keys.append(key)
        self.sorted_keys.sort()

    def _hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def get_node(self, key):
        h = self._hash(key)
        idx = bisect.bisect_right(self.sorted_keys, h) % len(self.sorted_keys)
        return self.ring[self.sorted_keys[idx]]

ch = ConsistentHash(["redis1", "redis2", "redis3"])
print(ch.get_node("user:42"))    # → "redis2"
print(ch.get_node("user:100"))   # → "redis1"
```

### Problems to Solve

1. With 4 nodes in consistent hashing, you add a 5th. What fraction of keys move?
2. Without virtual nodes, Node A has hash=10 and Node B has hash=10,000 in a ring of 10,000. What fraction of keys does each node handle?
3. How does Redis Cluster use consistent hashing? (It uses hash slots, not pure consistent hashing — how does it differ?)
4. Design a distributed cache with 5 nodes using consistent hashing. What happens when one node fails?

### Resources

* https://www.systemdesignbangla.com/chapters/consistent-hashing.html
* https://en.wikipedia.org/wiki/Consistent_hashing

---

## Topic 47 — Database Federation

### Concept

Federation (also called functional partitioning) = split the database by **function/domain** rather than by rows. Instead of one monolithic database, each domain gets its own database.

```
Before (monolith):
  one_big_db: users, orders, products, inventory, payments, reviews, analytics

After (federated):
  user_db:      users, profiles, auth
  order_db:     orders, order_items
  product_db:   products, categories, inventory
  payment_db:   payments, refunds
  analytics_db: events, reports (read-only replica or data warehouse)
```

### Benefits

* Independent scaling per domain
* Different DB types per domain (PostgreSQL for orders, MongoDB for catalog, Redis for sessions)
* Smaller databases = faster queries, less lock contention
* Team ownership per database

### Drawbacks

* Joins across databases are not possible (must fetch from each, join in application)
* Distributed transactions required for cross-domain operations
* More infrastructure to manage
* Data consistency across databases is harder

### Example

```python
# Cross-database "join" done in application code
def get_order_details(order_id):
    # Fetch from order_db
    order = order_db.query("SELECT * FROM orders WHERE id = %s", order_id)

    # Fetch from user_db
    customer = user_db.query("SELECT name, email FROM users WHERE id = %s", order['customer_id'])

    # Fetch from product_db
    product = product_db.query("SELECT name, price FROM products WHERE id = %s", order['product_id'])

    return { **order, "customer": customer, "product": product }
```

### Problems to Solve

1. When should you start federating a monolithic database? What signals tell you it's time?
2. An order requires creating a record in both order_db and inventory_db atomically. How do you handle this?
3. How does federation relate to microservices architecture?
4. What is the difference between federation and sharding?

### Resources

* https://www.systemdesignbangla.com/chapters/database-federation.html

---

## Topic 48 — When to Use Which Database

### Decision Framework

```
Is data structured and relational?
  → YES, and requires ACID transactions → PostgreSQL / MySQL
  → YES, read-heavy analytics → ClickHouse / Redshift / BigQuery (OLAP)

Is schema frequently changing or data hierarchical?
  → YES → MongoDB

Is speed critical and data fits in memory?
  → YES, caching / sessions / leaderboards → Redis

Do you need full-text search?
  → YES → Elasticsearch / OpenSearch (or PostgreSQL with pg_trgm)

Is data time-series (metrics, sensor data)?
  → YES → InfluxDB / TimescaleDB

Do you need massive write scalability across datacenters?
  → YES → Cassandra / DynamoDB
```

### Real-world Scenarios

**E-commerce platform:**

* PostgreSQL: orders, payments, user accounts (ACID critical)
* MongoDB: product catalog (flexible attributes: electronics vs clothing have different fields)
* Redis: shopping cart, sessions, recently viewed, rate limiting
* Elasticsearch: product search ("red shoes under $50")

**Social media app:**

* PostgreSQL: user accounts, follows, payments
* Cassandra: posts feed (time-series, massive write volume)
* Redis: notification counts, trending topics, online status
* MongoDB: user-generated content with varying structure

**Real-time analytics dashboard:**

* ClickHouse / Redshift: historical aggregations (OLAP)
* Redis: live counters, real-time metrics
* PostgreSQL: user + account data

**Chat application:**

* MongoDB or Cassandra: messages (append-only, high volume)
* Redis: online presence, typing indicators, unread count
* PostgreSQL: user accounts, conversation metadata

### Trade-off Summary

| Database      | Strengths                                 | Weaknesses                     |
| ------------- | ----------------------------------------- | ------------------------------ |
| PostgreSQL    | ACID, complex queries, JSON support       | Horizontal scaling complexity  |
| MongoDB       | Flexible schema, horizontal scaling       | Complex multi-doc transactions |
| Redis         | Microsecond latency, rich data structures | Data must fit in RAM           |
| Cassandra     | Massive write throughput, multi-DC        | No joins, eventual consistency |
| Elasticsearch | Full-text search, complex queries         | Not a primary data store       |
| ClickHouse    | Analytical queries on billions of rows    | Not for OLTP                   |

### Problems to Solve

1. Design the database layer for a food delivery app (users, restaurants, menus, orders, real-time tracking).
2. A startup is using a single PostgreSQL instance. It's getting slow. Before sharding, what 5 optimizations should you try first?
3. Your company wants to store IoT sensor data from 10,000 devices, 1 reading per second per device. What database? Why?
4. Can you use Redis as your only database? Under what conditions is this reasonable?

### Resources

* https://www.systemdesignbangla.com/chapters/database.html
* https://db-engines.com/en/ranking (DB popularity rankings)
* https://use-the-index-luke.com (SQL performance)
* https://redis.io/docs/
* https://www.mongodb.com/docs/

---

## QUICK REFERENCE CHEAT SHEET

### SQL JOINs in One View

```sql
-- INNER: matching rows only
FROM a INNER JOIN b ON a.id = b.a_id

-- LEFT: all of a, matched b (NULL if no match)
FROM a LEFT JOIN b ON a.id = b.a_id

-- Find unmatched:
FROM a LEFT JOIN b ON ... WHERE b.id IS NULL

-- FULL OUTER: all rows both sides
FROM a FULL OUTER JOIN b ON a.id = b.a_id

-- SELF: table with itself (hierarchy)
FROM employees e JOIN employees m ON e.manager_id = m.id

-- CROSS: cartesian product
FROM a CROSS JOIN b
```

### Window Function Frame

```sql
FUNCTION() OVER (
  PARTITION BY col     -- reset per group
  ORDER BY col2        -- defines ordering
  ROWS BETWEEN         -- frame
    UNBOUNDED PRECEDING AND CURRENT ROW    -- running total
    2 PRECEDING AND CURRENT ROW            -- rolling 3-row
    UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING  -- whole partition
)
```

### Redis Data Structure → Use Case

```
String  → cache, counter, feature flag
Hash    → session, user object, config
List    → queue, stack, activity feed
Set     → unique values, tags, set operations
ZSet    → leaderboard, scheduled jobs, range queries
```

### When to Choose

```
Need ACID + complex queries?        → PostgreSQL
Flexible schema + documents?        → MongoDB
Speed + caching + real-time?        → Redis
Massive writes + multi-DC?          → Cassandra
Full-text search?                   → Elasticsearch
Analytical queries (OLAP)?          → ClickHouse / Redshift
```

---

*End of notes. Total topics covered: 48. All 15 system design Bangla chapters included.*
