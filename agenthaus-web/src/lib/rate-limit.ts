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
      // For simplicity, we can clear the whole map if it exceeds a threshold (e.g., 10k entries)
      // to prevent memory leak in long-running processes.
      if (this.ipMap.size > 10000) {
        this.ipMap.clear();
        this.ipMap.set(ip, {
          count: 1,
          resetTime: now + this.windowMs,
        });
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

// Default instance: 10 requests per minute
export const rateLimiter = new RateLimiter(10, 60000);
