import { sql } from "@/lib/db";
import { isValidSlug } from "@/lib/validation";
import { rateLimiter, getIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limiting to prevent abuse
  const ip = getIp(request);
  if (!rateLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const rows = await sql`
      UPDATE plugins
      SET share_count = share_count + 1
      WHERE slug = ${slug}
      RETURNING share_count
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }

    return NextResponse.json({ count: rows[0].share_count });
  } catch (error) {
    console.error("Error incrementing share count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
