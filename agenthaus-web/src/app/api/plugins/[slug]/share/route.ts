import { sql } from "@/lib/db";
import { slugSchema } from "@/lib/validation";
import { rateLimiter, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Security: Basic CSRF protection via Origin/Referer header validation
  // Ensures state-changing requests come from our own domain
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const originHost = new URL(origin).host;
    const requestHost = request.headers.get("host") ?? request.nextUrl.host;
    if (originHost !== requestHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limiting to prevent abuse
  const ip = getIp(request);
  const rateCheck = rateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetTime, 10, ip);
  }

  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (!sql) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
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
      { status: 500 },
    );
  }
}
