/**
 * Anything uploaded to the private Blob store has to be proxied through
 * /app/api/blob so that auth is enforced and the read-write token stays
 * server-side. External URLs (YouTube, regular web pages) pass through
 * untouched.
 */
export function toDisplayUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (isBlobUrl(url)) {
    return `/app/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function isBlobUrl(url: string): boolean {
  return /\.(public\.|private\.)?blob\.vercel-storage\.com/.test(url);
}
