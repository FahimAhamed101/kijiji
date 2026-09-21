/** Turn any string into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Slug plus a short random suffix, used when a slug must be unique. */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || 'item'
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}
