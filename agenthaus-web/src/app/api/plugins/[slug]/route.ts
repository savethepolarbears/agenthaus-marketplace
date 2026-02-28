import { sql } from "@/lib/db";
import { isValidSlug } from "@/lib/validation";
import { searchLimiter, getIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limiting to prevent DoS via repeated lookups
  if (!searchLimiter.check(getIp(request))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
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
      { status: 503 }
    );
  }

  const plugins = await sql`SELECT * FROM plugins WHERE slug = ${slug}`;
  if (plugins.length === 0) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const plugin = rows[0];

  return NextResponse.json(plugin);
}
