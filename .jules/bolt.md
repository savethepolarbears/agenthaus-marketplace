## 2025-03-20 - [Performance] Stable JSON Stringification Optimization
**Learning:** For stable JSON stringification, using `Object.entries().sort(([a], [b]) => a.localeCompare(b))` followed by `Object.fromEntries()` is significantly slower due to O(N) tuple array allocations per object, and `localeCompare` which is ~1.5x-2x slower than standard V8 UTF-16 code unit sorts (and potentially non-deterministic across environments).
**Action:** When implementing stable object key sorting, sort `Object.keys(value).sort()` using the default UTF-16 sort and manually construct the resulting object using a standard `for` loop to avoid intermediate array allocation overhead.

## 2025-03-20 - [Performance] Database Array Filtering Optimization
**Learning:** Filtering arrays in PostgreSQL using `$N = ANY(array_column)` bypasses GIN indexes, resulting in full table scans.
**Action:** Always use explicit GIN indexing combined with the `@>` (contains) operator (e.g., `array_column @> ARRAY[$N]::text[]`) for O(1) lookups instead of `= ANY()`.

## 2025-03-20 - [Performance] Shell Script JSON Parsing Optimization
**Learning:** Using `python3 -c "import json; ..."` inside loops in shell scripts for JSON parsing introduces massive overhead (~0.25s per call) due to repetitive Python interpreter startup times, creating significant bottlenecks (e.g., 2+ minutes to validate dozens of plugins).
**Action:** Replace inline Python scripts with `jq` for parsing JSON in bash scripts, which executes nearly instantaneously (~0.005s per call) and can result in 20x-30x overall script speedups.
