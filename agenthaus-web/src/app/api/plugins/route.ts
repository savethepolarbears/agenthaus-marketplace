import { sql } from "@/lib/db";
import { isValidSlug, sanitizeQuery } from "@/lib/validation";
import { searchLimiter, getIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// Security limit for input parameters
const MAX_INPUT_LENGTH = 100;

export async function GET(request: NextRequest) {
  // Rate limiting to prevent DoS
  if (!searchLimiter.check(getIp(request))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
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
      { status: 400 }
    );
  }

  // Validate category and tag format to prevent injection or malformed queries
  // We use isValidSlug because categories and tags follow slug format (lowercase, alphanumeric, hyphens)
  if (category && !isValidSlug(category)) {
    return NextResponse.json(
      { error: "Invalid category format" },
      { status: 400 }
    );
  }

  if (tag && !isValidSlug(tag)) {
    return NextResponse.json({ error: "Invalid tag format" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
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
    const sanitizedSearch = cleanSearch.replace(/[%_]/g, "\\$&");

    conditions.push(
      `(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`
    );
    params.push(`%${sanitizedSearch}%`);
    paramIdx++;
  }
  if (tag) {
    conditions.push(`$${paramIdx++} = ANY(p.tags)`);
    params.push(tag);
  }

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object('type', pc.type, 'name', pc.name, 'description', pc.description)
        ) FILTER (WHERE pc.id IS NOT NULL),
        '[]'
      ) as capabilities
    FROM plugins p
    LEFT JOIN plugin_capabilities pc ON p.id = pc.plugin_id
    ${where}
    GROUP BY p.id
    ORDER BY p.install_count DESC, p.name
  `;

  const plugins = await sql(query, params);
  return NextResponse.json(plugins);
}
