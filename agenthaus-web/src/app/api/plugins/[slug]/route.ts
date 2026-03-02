import { sql } from "@/lib/db";
import { isValidSlug } from "@/lib/validation";
import { searchLimiter, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Rate limiting to prevent DoS via repeated lookups
  const rateCheck = searchLimiter.check(getIp(request));
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetTime, 60);
  }

  const { slug } = await params;

  // Security: Validate input before database connection checks
  // to allow isolated validation testing
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    // Fetch plugin details, capabilities, and env vars in a single query
    // This reduces DB round trips from 3 to 1, significantly improving API response latency
    const rows = await sql`
      SELECT
        p.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'type', pc.type,
              'name', pc.name,
              'description', pc.description
            ))
            FROM plugin_capabilities pc
            WHERE pc.plugin_id = p.id
          ),
          '[]'::json
        ) as capabilities,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'var_name', pev.var_name,
              'description', pev.description,
              'required', pev.required
            ))
            FROM plugin_env_vars pev
            WHERE pev.plugin_id = p.id
          ),
          '[]'::json
        ) as env_vars
      FROM plugins p
      WHERE p.slug = ${slug}
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    // Security: Log internally but do not leak error stack trace to the client
    console.error("Database error fetching plugin:", { slug, error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
