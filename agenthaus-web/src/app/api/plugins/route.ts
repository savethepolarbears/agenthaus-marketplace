import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (category) {
    conditions.push(`p.category = $${paramIdx++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(
      `(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`
    );
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (tag) {
    conditions.push(`$${paramIdx++} = ANY(p.tags)`);
    params.push(tag);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

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
