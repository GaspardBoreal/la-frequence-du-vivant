/**
 * Réduit un nom scientifique à son binôme genre + espèce.
 *
 * Les rangs infra-spécifiques (`subsp.`, `var.`, `cv.`, `f.`) et les mentions
 * horticoles font échouer la résolution de vignette côté iNaturalist / GBIF :
 * « Vitis vinifera subsp. vinifera » ne renvoie aucune photo, « Vitis vinifera »
 * oui. On garde le nom complet pour l'affichage et les liens, et on n'utilise
 * cette forme réduite que pour aller chercher l'image.
 */
export function speciesLatinBase(latin: string | null | undefined): string {
  const raw = (latin || '').trim();
  if (!raw) return '';
  const cleaned = raw
    .replace(/\s*['"].*$/, '') // cultivar entre guillemets
    .replace(/\s+(subsp\.|ssp\.|var\.|cv\.|f\.|forma|nothosubsp\.)\s+.*$/i, '')
    .replace(/\s+×\s+/g, ' × ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return cleaned;
  // Genre × espèce (hybride) → on conserve les trois jetons
  if (parts[1] === '×' || parts[1] === 'x') return parts.slice(0, 3).join(' ');
  return parts.slice(0, 2).join(' ');
}
