import { sql } from "@/lib/db";
import { isValidSlug } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  // Bolt ⚡ Optimization: Fetch plugin details, capabilities, and env vars in a single query
  // This reduces DB round trips from 3 to 1, significantly improving API response latency.
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

  if (rows.length === 0) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const plugin = rows[0];

  return NextResponse.json(plugin);
}
