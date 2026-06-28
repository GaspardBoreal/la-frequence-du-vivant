/**
 * Bride la source d'une photo pour le zoom plein écran : évite les crashes
 * navigateur/GPU lorsqu'on zoome × 4 sur une image iNaturalist « original »
 * (souvent 3000-5000 px de large → texture 15000+ px = OOM).
 *
 * - iNaturalist : `/original.` → `/large.` (≤ 1024 px), `/large.` reste tel quel
 * - Supabase Storage : ajoute `?width=1600&quality=80` si pas déjà transformé
 * - Sinon : URL inchangée (photos terrain déjà raisonnables)
 *
 * Texture cible ≤ 1600 px ; à 4× zoom = 6400 px, bien sous la limite Safari
 * iPad (≈ 4096-16384 px) et compatible Chrome Android low-end.
 */
export function safeZoomSrc(url?: string): string | undefined {
  if (!url) return url;
  try {
    // 1) iNaturalist : remplacer `/original.` par `/large.`
    if (/static\.inaturalist\.org|inaturalist-open-data/.test(url)) {
      return url.replace(/\/original\./, '/large.');
    }
    // 2) Supabase Storage : injecter une transformation si absente
    if (url.includes('/storage/v1/') && !url.includes('width=') && !url.includes('/render/image/')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}width=1600&quality=80`;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Calcule un maxScale sûr : un humble garde-fou pour les images qui restent
 * grandes après safeZoomSrc (ex. CDN tiers). Retourne 4 par défaut.
 */
export function computeSafeMaxScale(naturalWidth: number | undefined): number {
  if (!naturalWidth || naturalWidth <= 0) return 4;
  // Limite la texture finale à ≈ 12 000 px (sûr sur Safari iPad et low-end Android)
  const safe = Math.floor(12000 / naturalWidth);
  return Math.max(2, Math.min(4, safe));
}
