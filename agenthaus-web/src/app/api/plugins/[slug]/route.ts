import { sql } from "@/lib/db";
import { isValidSlug } from "@/lib/validation";
import { searchLimiter, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// Bolt ⚡ Optimization: Cache the expensive database query to improve API latency
// and reduce database compute costs.
const getCachedPlugin = async (slug: string) => {
  const fetcher = unstable_cache(
    async () => {
      if (!sql) return null;
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
      return rows;
    },
    ["api-plugin-detail", slug],
    { revalidate: 3600, tags: ["plugin", `plugin-${slug}`] }
  );
  return fetcher();
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Rate limiting to prevent DoS via repeated lookups
  const ip = getIp(request);
  const rateCheck = searchLimiter.check(ip);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetTime, 60, ip);
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
    const rows = await getCachedPlugin(slug);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Plugin not found" },
        { status: 404 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }

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
