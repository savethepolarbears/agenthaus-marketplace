/**
 * Security constants and validation functions.
 */

// Security limit for input parameters to prevent database abuse or DoS
export const MAX_INPUT_LENGTH = 100;

// Validates that a slug contains only lowercase letters, numbers, and hyphens,
// and does not exceed the maximum length.
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  if (slug.length > MAX_INPUT_LENGTH) {
    return false;
  }

  // Regex: Allow only lowercase alphanumeric characters and hyphens.
  // This prevents SQL injection chars (though parameterized queries handle that)
  // and other potentially dangerous characters.
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

// Removes control characters (like null bytes) and trims whitespace
// to prevent injection attacks or database errors.
export function sanitizeQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }
  // Remove ASCII control characters (0-31) and DEL (127)
  return query.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

/**
 * Escapes special characters for SQL LIKE/ILIKE queries to prevent
 * wildcard injection and potential ReDoS.
 * Escapes '%', '_', and '!' for explicit ESCAPE clauses.
 */
export function escapeLikeString(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }
  return query.replace(/([!%_])/g, "!$1");
}
