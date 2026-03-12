## 2024-05-18 - Optimized Map entries deletion iteration
**Learning:** Avoid full Map iteration by utilizing size check limits combined with break conditions to avoid unnecesary operations while still clearing elements effectively
**Action:** Implemented a size check constraint for `ipMap` in `src/lib/rate-limit.ts` which helps preserve most active rate limits and prevents latency spikes.

## 2024-05-18 - Replaced Unnecessary Regex with Precomputed string
**Learning:** Precomputing a complex CSP string with multiple regex replacements during module load prevents redundant operations on every request, saving CPU cycles.
**Action:** Moved the CSP static string computation from inside the middleware function to the module scope in `src/middleware.ts`.

## 2024-05-18 - Reduced Hydration Payload Size
**Learning:** Omitting unused object fields when passing data from Server to Client Components significantly reduces hydration payload size, improving First Contentful Paint.
**Action:** Stripped unused `capabilities` and `env_vars` properties from plugins returned by `fetchPluginsFromDB` and `getStaticPlugins` in `src/app/page.tsx`.

## 2024-05-18 - Consolidated Database Queries
**Learning:** Executing a single comprehensive SQL query utilizing `json_agg` to retrieve related tables significantly reduces DB roundtrips and lowers TTFB compared to executing separate queries.
**Action:** Replaced sequential fetching with a single unified query in `src/app/plugins/[slug]/page.tsx` when retrieving plugin capabilities and environment variables.

## 2024-05-18 - Fixed bug where `rows` variable was undefined
**Learning:** While iterating and searching for opportunities, a variable `rows` that wasn't previously defined was discovered which could result in an unhandled exception or 500 error in `src/app/api/plugins/[slug]/route.ts`.
**Action:** Modified the line from `const plugin = rows[0];` to `const plugin = plugins[0];` to make it reference the previously fetched database rows.

## 2024-05-18 - Used useDeferredValue to Prevent UI Blocking
**Learning:** Updating state variables bound to an input directly during heavy operations causes UI freezing and poor typing experience. Deferring the state update keeps the UI responsive.
**Action:** Applied `useDeferredValue` to `searchQuery` in `src/components/plugin-grid.tsx` to ensure the input field remains responsive even when filtering a large list of plugins.

## 2025-03-01 - Defeated short-circuit evaluation in filter loop
**Learning:** Extracting expensive operations into boolean variables before a `return A && B` statement defeats JavaScript's short-circuit evaluation, forcing execution of the expensive operation (like string matching) even when `A` is false.
**Action:** Replaced pre-computed boolean variables with early returns in `src/components/plugin-grid.tsx`'s filter loop to restore short-circuit behavior and skip string searches for mismatched categories.

## 2025-03-02 - Cross-resource cache collisions with `unstable_cache`
**Learning:** Calling Next.js's `unstable_cache` at the module level for functions with dynamic arguments (like a `slug`), without injecting the argument into the `keyParts` array, causes all subsequent requests to return the cached result of the very first request.
**Action:** Wrapped `unstable_cache` inside the accessor functions (`getCachedPlugin` and `getCachedPluginFromDB`) and explicitly included the dynamic `slug` in the cache `keyParts` and `tags` arrays in `src/app/api/plugins/[slug]/route.ts` and `src/app/plugins/[slug]/page.tsx`.

## 2025-03-02 - Missing Foreign Key Index Causing Sequential Scans
**Learning:** In PostgreSQL, lacking an index on a foreign key column used in correlated subqueries (like `plugin_id` on `plugin_env_vars`) causes O(N) sequential scans, heavily degrading read performance as the table grows.
**Action:** Added `CREATE INDEX IF NOT EXISTS idx_plugin_env_vars_plugin_id ON plugin_env_vars(plugin_id);` in `src/lib/schema.sql` to align with the existing index on `plugin_capabilities` and improve lookup speeds.

## 2025-03-05 - Missing Early Return on Unfiltered State
**Learning:** In a list filtering component, omitting an early return when filters are empty forces an O(N) array iteration for the default (unfiltered) state, wasting CPU cycles on mount or when clearing search.
**Action:** Added an early return `if (normalizedQuery === "" && activeCategory === "all") return searchablePlugins;` inside the `useMemo` for filtering `src/components/plugin-grid.tsx` to instantly return the full array.

## 2025-03-07 - Inefficient LEFT JOIN + GROUP BY for JSON aggregation
**Learning:** In PostgreSQL, using `LEFT JOIN` and grouping on the parent table's primary key (`GROUP BY p.id`) just to aggregate a child table's rows via `json_agg` calculates a massive Cartesian product in memory. This degrades query performance on list endpoints as the dataset grows.
**Action:** Replaced the `LEFT JOIN` + `GROUP BY` with a correlated subquery in the `SELECT` clause in `src/app/api/plugins/route.ts` to independently query and aggregate the child rows utilizing the foreign key index.

## 2025-03-09 - Costly Prefetching of Dynamic Routes
**Learning:** Next.js `<Link>` components automatically prefetch route payloads in the background when they enter the viewport. If the target route is dynamically rendered (SSR), rendering a large grid of links (like 23 plugins on a homepage) triggers simultaneous, expensive server-side rendering passes, causing high CPU load and delaying page transitions.
**Action:** Exported `generateStaticParams` in `src/app/plugins/[slug]/page.tsx` to prerender these dynamic routes as Static Site Generation (SSG) at build time, eliminating the on-demand server compute cost triggered by link prefetching.

## 2025-03-11 - Missing GIN Index and Operator for Array Filtering
**Learning:** Filtering arrays in PostgreSQL using `$N = ANY(array_column)` requires a full table scan because GIN indexes do not natively support the `ANY` operator. To leverage an index for array containment queries, a GIN index must be explicitly created (`USING GIN (array_column)`) AND the query must use the `@>` (contains) operator (e.g., `array_column @> ARRAY[$N]::text[]`).
**Action:** Created `idx_plugins_tags` using GIN in `src/lib/schema.sql` and refactored the tag filter condition in `src/app/api/plugins/route.ts` to use `@> ARRAY[...]::text[]` for O(1) lookups.
