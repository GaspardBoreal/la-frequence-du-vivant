/**
 * Variantes d'images allégées pour l'impression.
 *
 * Supabase Storage sait rendre une image redimensionnée via l'endpoint
 * `/storage/v1/render/image/...` (ou via les paramètres `width`/`quality` sur
 * une URL signée). On bascule dessus pour éviter de télécharger des originaux
 * de plusieurs Mo pour des vignettes de 2 cm.
 *
 * Toute URL non reconnue est renvoyée telle quelle (fallback transparent).
 */
export type PrintImageSize = 'thumb' | 'plate' | 'hero';

const WIDTHS: Record<PrintImageSize, number> = {
  thumb: 240,
  plate: 1200,
  hero: 1400,
};

const QUALITY: Record<PrintImageSize, number> = {
  thumb: 60,
  plate: 78,
  hero: 82,
};

export function printImageUrl(url: string | null | undefined, size: PrintImageSize): string {
  if (!url) return '';
  // data:/blob: → inchangé
  if (/^(data|blob):/i.test(url)) return url;

  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    const isSupabaseStorage = u.pathname.includes('/storage/v1/');
    if (!isSupabaseStorage) return url;

    // object/public|sign → render/image/public|sign (transformation à la volée)
    if (u.pathname.includes('/storage/v1/object/')) {
      u.pathname = u.pathname.replace('/storage/v1/object/', '/storage/v1/render/image/');
    }
    u.searchParams.set('width', String(WIDTHS[size]));
    u.searchParams.set('quality', String(QUALITY[size]));
    u.searchParams.set('resize', 'contain');
    return u.toString();
  } catch {
    return url;
  }
}

/** Liste dédupliquée des URLs à précharger pour une impression. */
export function dedupeUrls(urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const u of urls) {
    if (u && !seen.has(u)) seen.add(u);
  }
  return Array.from(seen);
}

/**
 * Repli : renvoie l'URL d'origine (non transformée, pleine résolution) d'une
 * image passée par le rendu Supabase. Sert de dernier recours à l'impression
 * lorsque la variante redimensionnée échoue.
 */
export function originalUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(data|blob):/i.test(url)) return url;
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    if (u.pathname.includes('/storage/v1/render/image/')) {
      u.pathname = u.pathname.replace('/storage/v1/render/image/', '/storage/v1/object/');
    }
    u.searchParams.delete('width');
    u.searchParams.delete('height');
    u.searchParams.delete('quality');
    u.searchParams.delete('resize');
    u.searchParams.delete('_r');
    return u.toString();
  } catch {
    return url;
  }
}
