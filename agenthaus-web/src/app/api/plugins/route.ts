import { sql } from "@/lib/db";
import { isValidSlug, sanitizeQuery, escapeLikeString, MAX_INPUT_LENGTH } from "@/lib/validation";
import { searchLimiter, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Rate limiting to prevent DoS
  const rateCheck = searchLimiter.check(getIp(request));
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetTime, 60);
  }

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  // Input validation: prevent DoS via excessively long inputs
  if (
    (category && category.length > MAX_INPUT_LENGTH) ||
    (search && search.length > MAX_INPUT_LENGTH) ||
    (tag && tag.length > MAX_INPUT_LENGTH)
  ) {
    return NextResponse.json(
      { error: "Input parameters too long" },
      { status: 400 },
    );
  }

  // Validate category and tag format to prevent injection or malformed queries
  // We use isValidSlug because categories and tags follow slug format (lowercase, alphanumeric, hyphens)
  if (category && !isValidSlug(category)) {
    return NextResponse.json(
      { error: "Invalid category format" },
      { status: 400 },
    );
  }

  if (tag && !isValidSlug(tag)) {
    return NextResponse.json({ error: "Invalid tag format" }, { status: 400 });
  }

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
