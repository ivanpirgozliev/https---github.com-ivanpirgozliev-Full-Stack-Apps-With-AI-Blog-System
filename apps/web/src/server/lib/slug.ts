const SLUG_MAX_LENGTH = 200;
const RANDOM_SUFFIX_LENGTH = 6;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * Append a short random suffix so collisions are vanishingly unlikely.
 * Callers should still verify uniqueness against the DB and retry if needed.
 */
export function slugifyWithSuffix(input: string): string {
  const base = slugify(input);
  const suffix = Math.random().toString(36).slice(2, 2 + RANDOM_SUFFIX_LENGTH);
  return base ? `${base}-${suffix}` : suffix;
}
