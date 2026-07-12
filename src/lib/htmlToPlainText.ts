/**
 * Convert a rich-text/HTML string to a plain-text summary.
 * Used for list previews, tooltips, meta descriptions, etc.
 */
export function htmlToPlainText(input: string | null | undefined): string {
  if (!input) return '';
  let text = input;

  // Prefer DOMParser when available (browser).
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(input, 'text/html');
      text = doc.body?.textContent ?? '';
    } catch {
      // fall through to regex fallback
    }
  }

  // Fallback / safety net: strip any remaining tags + decode common entities.
  text = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}
