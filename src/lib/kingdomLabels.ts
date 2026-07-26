/**
 * Vocabulaire français unique des règnes du vivant.
 *
 * Aligné sur les catégories affichées dans Mon espace › Biodiversité ›
 * Taxons observés (`SpeciesExplorer`) : Flore · Faune · Champignons · Autres.
 */

export type KingdomKey = 'plantae' | 'animalia' | 'fungi' | 'others';

export const KINGDOM_ORDER: KingdomKey[] = ['plantae', 'animalia', 'fungi', 'others'];

export const KINGDOM_LABELS_FR: Record<KingdomKey, string> = {
  plantae: 'Flore',
  animalia: 'Faune',
  fungi: 'Champignons',
  others: 'Autres / indéterminés',
};

/** Libellé court (utile pour les puces de filtre). */
export const KINGDOM_LABELS_FR_SHORT: Record<KingdomKey, string> = {
  plantae: 'Flore',
  animalia: 'Faune',
  fungi: 'Champignons',
  others: 'Autres',
};

/**
 * Normalise n'importe quelle valeur de règne (Plantae, plants, Aves, Insecta,
 * Unknown, Other, null…) vers l'une des 4 catégories affichables.
 */
export const normalizeKingdom = (raw?: string | null): KingdomKey => {
  const s = (raw || '').toLowerCase();
  if (!s) return 'others';
  if (s.includes('plant') || s.includes('flore') || s.includes('flora')) return 'plantae';
  if (s.includes('fungi') || s.includes('champignon') || s.includes('mycet')) return 'fungi';
  if (
    s.includes('animal') ||
    s.includes('aves') ||
    s.includes('bird') ||
    s.includes('insect') ||
    s.includes('mamm') ||
    s.includes('arachn') ||
    s.includes('mollus') ||
    s.includes('amphib') ||
    s.includes('reptil') ||
    s.includes('actinopterygii') ||
    s.includes('faune')
  ) {
    return 'animalia';
  }
  return 'others';
};

/** Libellé français d'une valeur brute de règne. */
export const kingdomLabelFr = (raw?: string | null, short = false): string =>
  (short ? KINGDOM_LABELS_FR_SHORT : KINGDOM_LABELS_FR)[normalizeKingdom(raw)];

/**
 * Agrège un dictionnaire de règnes bruts ({ Plantae: 101, Unknown: 23, … })
 * vers les 4 catégories normalisées.
 */
export const aggregateKingdoms = (
  raw?: Record<string, number> | null,
): Record<KingdomKey, number> => {
  const out: Record<KingdomKey, number> = { plantae: 0, animalia: 0, fungi: 0, others: 0 };
  Object.entries(raw ?? {}).forEach(([k, v]) => {
    out[normalizeKingdom(k)] += Number(v) || 0;
  });
  return out;
};
