import { sql } from "@/lib/db";
import { pluginSearchSchema, sanitizeQuery, escapeLikeString } from "@/lib/validation";
import { searchLimiter, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Rate limiting to prevent DoS
  const ip = getIp(request);
  const rateCheck = searchLimiter.check(ip);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetTime, 60, ip);
  }

  const { searchParams } = request.nextUrl;

  const rawParams = {
    category: searchParams.get("category"),
    search: searchParams.get("search"),
    tag: searchParams.get("tag"),
  };

  const parsed = pluginSearchSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const { category, search, tag } = parsed.data;

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (category) {
    conditions.push(`p.category = $${paramIdx++}`);
    params.push(category);
  }
  if (search) {
    // Sanitize search input: remove control chars, trim, and escape wildcards
    // This prevents null byte injection errors and ReDoS/expensive wildcard queries
    const cleanSearch = sanitizeQuery(search);
    const sanitizedSearch = escapeLikeString(cleanSearch);

    conditions.push(
      `(p.name ILIKE $${paramIdx} ESCAPE '!' OR p.description ILIKE $${paramIdx} ESCAPE '!')`,
    );
    params.push(`%${sanitizedSearch}%`);
    paramIdx++;
  }
  if (tag) {
    // Bolt ⚡ Optimization: Use @> instead of ANY() to allow PostgreSQL to use the GIN index
    conditions.push(`p.tags @> ARRAY[$${paramIdx++}]::text[]`);
    params.push(tag);
  }

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

  // Bolt ⚡ Optimization: Replaced LEFT JOIN + GROUP BY with a correlated subquery.
  // The original Cartesian product caused O(N*M) rows to be processed in memory and required expensive grouping.
  // The subquery efficiently leverages the idx_plugin_capabilities_plugin_id index.
  const query = `
    SELECT p.*,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('type', pc.type, 'name', pc.name, 'description', pc.description)
          )
          FROM plugin_capabilities pc
          WHERE pc.plugin_id = p.id
        ),
        '[]'::json
      ) as capabilities
    FROM plugins p
    ${where}
    ORDER BY p.install_count DESC, p.name
  `;

  try {
    const plugins = await sql(query, params);
    return NextResponse.json(plugins);
  } catch (error) {
    // Security: Log internally but do not leak error stack trace to the client
    console.error("Database error in /api/plugins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
