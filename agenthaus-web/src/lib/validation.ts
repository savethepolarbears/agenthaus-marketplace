/**
 * Security constants and validation functions.
 */

// Limit slug length to prevent database abuse or DoS
export const MAX_SLUG_LENGTH = 100;

// Validates that a slug contains only lowercase letters, numbers, and hyphens,
// and does not exceed the maximum length.
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return false;
  }

  // Regex: Allow only lowercase alphanumeric characters and hyphens.
  // This prevents SQL injection chars (though parameterized queries handle that)
  // and other potentially dangerous characters.
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}
