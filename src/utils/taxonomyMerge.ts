/**
 * Fusion taxonomique : absorbe les observations au rang « genre seul »
 * (ex. `Symphytum`) dans une espèce du même genre (ex. `Symphytum × uplandicum`)
 * lorsqu'une **seule** espèce de ce genre est présente dans le pool.
 *
 * Évite le doublon visuel « Consoude » + « Consoude de Russie » alors qu'il s'agit
 * en pratique de deux observations iNaturalist du même taxon, l'une laissée
 * volontairement au rang genre par l'observateur.
 *
 * Règle :
 *  - 1 espèce du genre dans le pool → fusion (l'entrée espèce gagne, count cumulé)
 *  - 0 espèce du genre → on garde l'entrée genre
 *  - 2+ espèces du genre → ambigu, on n'absorbe pas
 */

export interface TaxonomyMergeable {
  scientificName: string | null;
  count: number;
  imageUrl?: string | null;
  // toute autre clé est conservée telle quelle (Object spread)
  [k: string]: any;
}

/** Vrai si le scientificName représente un rang « genre seul »
 *  (un seul mot capitalisé, ou suffixé `sp.` / `spp.`). */
export const isGenusOnly = (sci: string | null | undefined): boolean => {
  if (!sci) return false;
  const s = sci.trim();
  if (!s) return false;
  // suffixes "sp.", "spp.", "sp", "spp"
  const cleaned = s.replace(/\s+(sp\.?|spp\.?)$/i, '').trim();
  // un seul mot = genre
  return !cleaned.includes(' ');
};

/** Premier mot = genre. Conserve la casse. */
export const getGenus = (sci: string | null | undefined): string | null => {
  if (!sci) return null;
  const cleaned = sci.trim().replace(/\s+(sp\.?|spp\.?)$/i, '').trim();
  if (!cleaned) return null;
  return cleaned.split(/\s+/)[0];
};

/**
 * Pour une espèce binomiale donnée (ex. `Symphytum × uplandicum`), retourne
 * le scientificName du « genre seul » correspondant **si et seulement si**
 * cette fusion est sûre dans le contexte du pool fourni (1 seule espèce du genre).
 * Renvoie null sinon.
 *
 * Utilisé côté `useSpeciesObservers` pour rattacher les attributions du rang genre
 * à la fiche espèce, en miroir de la fusion du pool.
 */
export const getMergedGenusFor = (
  scientificName: string | null | undefined,
  poolScientificNames: (string | null | undefined)[],
): string | null => {
  if (!scientificName) return null;
  if (isGenusOnly(scientificName)) return null; // déjà un genre
  const genus = getGenus(scientificName);
  if (!genus) return null;
  const genusLower = genus.toLowerCase();

  // Compte les espèces (binomiales) du même genre dans le pool
  const speciesOfGenus = poolScientificNames.filter(s => {
    if (!s || isGenusOnly(s)) return false;
    return getGenus(s)?.toLowerCase() === genusLower;
  });
  if (speciesOfGenus.length !== 1) return null;

  // Trouve une entrée « genre seul » dans le pool
  const genusEntry = poolScientificNames.find(
    s => isGenusOnly(s) && getGenus(s)?.toLowerCase() === genusLower,
  );
  return genusEntry || null;
};

export function mergeGenusIntoSpecies<T extends TaxonomyMergeable>(items: T[]): T[] {
  if (!items || items.length === 0) return items;

  // Index par genre → { genusEntries, speciesEntries }
  const byGenus = new Map<string, { genusIdx: number[]; speciesIdx: number[] }>();
  items.forEach((it, idx) => {
    const sci = it.scientificName;
    if (!sci) return;
    const genus = getGenus(sci);
    if (!genus) return;
    const key = genus.toLowerCase();
    if (!byGenus.has(key)) byGenus.set(key, { genusIdx: [], speciesIdx: [] });
    const bucket = byGenus.get(key)!;
    if (isGenusOnly(sci)) bucket.genusIdx.push(idx);
    else bucket.speciesIdx.push(idx);
  });

  const droppedIdx = new Set<number>();
  const result = items.map(x => ({ ...x }));

  byGenus.forEach(({ genusIdx, speciesIdx }) => {
    if (genusIdx.length === 0) return;
    if (speciesIdx.length !== 1) return; // 0 ou 2+ → on ne fusionne pas
    const targetIdx = speciesIdx[0];
    const target = result[targetIdx];
    genusIdx.forEach(gi => {
      const g = result[gi];
      target.count = (target.count || 0) + (g.count || 0);
      if (!target.imageUrl && g.imageUrl) target.imageUrl = g.imageUrl;
      droppedIdx.add(gi);
    });
  });

  return result.filter((_, i) => !droppedIdx.has(i));
}
