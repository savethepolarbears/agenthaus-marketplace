import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter using a fixed-window counter per IP.
 *
 * TODO: PRODUCTION MIGRATION — This in-memory Map is acceptable for development
 * and low-traffic single-instance deployments, but it will NOT work correctly in
 * serverless or edge environments because:
 *   1. Each cold start resets all counters
 *   2. Distributed nodes maintain separate Maps (no shared state)
 *   3. Under sustained attack the Map can grow unbounded between cleanup cycles
 *
 * For production, migrate to:
 *   - Upstash Redis (`@upstash/ratelimit`) — edge-compatible, sliding window
 *   - Vercel KV — if deployed on Vercel
 *   - Or apply rate limiting at the middleware/CDN layer instead
 */
export class RateLimiter {
  private ipMap: Map<string, { count: number; resetTime: number }>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.ipMap = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check whether the given IP is within the rate limit.
   * Returns an object with `allowed`, `remaining` count, and `resetTime` (epoch ms).
   */
  check(ip: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.ipMap.get(ip);

    // If no entry or window expired, reset
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.ipMap.set(ip, {
        count: 1,
        resetTime,
      });

      // Cleanup old entries when map gets too large to prevent memory exhaustion
      if (this.ipMap.size > 10000) {
        // First pass: remove all expired entries
        for (const [key, value] of this.ipMap.entries()) {
          if (now > value.resetTime) {
            this.ipMap.delete(key);
          }
        }

        // Second pass: if still too large, force-evict oldest entries (FIFO via Map insertion order)
        if (this.ipMap.size > 10000) {
          let evicted = 0;
          for (const key of this.ipMap.keys()) {
            if (key !== ip) {
              this.ipMap.delete(key);
              evicted++;
            }
            if (evicted >= 1000) break;
          }
        }
      }

      return { allowed: true, remaining: this.limit - 1, resetTime };
    }

    if (entry.count >= this.limit) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Default instance: 10 requests per minute (strict actions like sharing)
export const rateLimiter = new RateLimiter(10, 60000);

// Search limiter: 60 requests per minute (browsing/searching)
export const searchLimiter = new RateLimiter(60, 60000);

// Helper to extract client IP from request, handling x-forwarded-for proxy chain
export function getIp(req: NextRequest): string {
  // Use platform-provided IP if available (e.g. Vercel, Edge Runtime)
  // This is safer than parsing x-forwarded-for manually as it prevents spoofing
  // @ts-ignore - NextRequest.ip is available in Next.js 13+ but sometimes missing from types
  if (req.ip) {
    // @ts-ignore
    return req.ip;
  }

  // Security: Prevent IP spoofing via X-Forwarded-For header manipulation.
  // Attackers can prepend fake IPs to X-Forwarded-For. Proxies append the real client IP.
  // Therefore, the most reliable IP in the chain (assuming a single trusted proxy layer)
  // is the rightmost IP, not the leftmost.
  // Better yet, prefer X-Real-IP if set by a trusted reverse proxy.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}

/**
 * Creates a standardized 429 Too Many Requests response with proper headers.
 * Includes Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset.
 */
export function rateLimitResponse(
  resetTime: number,
  limit: number,
  ip: string,
): NextResponse {
  const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

  // Security: Audit logging for rate limiting to detect and monitor abuse
  console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip} (Limit: ${limit})`);

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(retryAfterSeconds, 1)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
      },
    },
  );
}
