import { NextRequest } from "next/server";

export class RateLimiter {
  private ipMap: Map<string, { count: number; resetTime: number }>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.ipMap = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.ipMap.get(ip);

    // If no entry or window expired, reset
    if (!entry || now > entry.resetTime) {
      this.ipMap.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      // Cleanup old entries (simple mechanism: if map gets too large)
      // Bolt ⚡ Optimization: Avoid O(N) iteration of entire map.
      // 1. Iterate up to 1000 entries to remove expired ones.
      // 2. If still full, evict oldest 1000 entries (FIFO via Map iterator order) instead of clearing all.
      // This prevents latency spikes and preserves most active rate limits.
      if (this.ipMap.size > 10000) {
        let checked = 0;
        for (const [key, value] of this.ipMap.entries()) {
          if (now > value.resetTime) {
            this.ipMap.delete(key);
          }
          checked++;
          if (checked >= 1000) break;
        }

        if (this.ipMap.size > 10000) {
          let evicted = 0;
          for (const key of this.ipMap.keys()) {
            // Don't delete the current user's entry we just added/updated
            if (key === ip) continue;
            this.ipMap.delete(key);
            evicted++;
            if (evicted >= 1000) break;
          }
        }
      }

      return true;
    }

    if (entry.count >= this.limit) {
      return false;
    }

    entry.count += 1;
    return true;
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

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
