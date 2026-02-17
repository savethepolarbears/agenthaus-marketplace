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

  const plugins = await sql`SELECT * FROM plugins WHERE slug = ${slug}`;
  if (plugins.length === 0) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const plugin = plugins[0];

  const capabilities = await sql`
    SELECT type, name, description
    FROM plugin_capabilities
    WHERE plugin_id = ${plugin.id}
  `;

  const envVars = await sql`
    SELECT var_name, description, required
    FROM plugin_env_vars
    WHERE plugin_id = ${plugin.id}
  `;

  return NextResponse.json({
    ...plugin,
    capabilities,
    env_vars: envVars,
  });
}
