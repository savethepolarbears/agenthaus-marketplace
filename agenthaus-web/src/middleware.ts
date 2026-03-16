import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Bolt ⚡ Optimization: Compute CSP header once at module load time
// This prevents unnecessary regex operations on every request
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
const contentSecurityPolicyHeaderValue = cspHeader
  .replace(/\s{2,}/g, " ")
  .trim();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  // Note: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and
  // Strict-Transport-Security are already set centrally in next.config.mjs.
  // We only set the dynamic or route-specific ones here.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
