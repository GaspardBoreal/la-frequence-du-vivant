// Lightweight classification of scientific names into ecological categories.
// Source: src/data/species-knowledge-base.json (curated, INPN-grounded).
// Editorial curations from `exploration_curations` (sense='oeil') override the KB
// when provided — they reflect the canonical category shown in L'œil.
import speciesKB from '@/data/species-knowledge-base.json';

export type SpeciesCategory = 'bioindicatrice' | 'auxiliaire' | 'eee' | 'patrimoniale' | 'ravageur' | 'indigene';

interface KBEntry {
  primary: SpeciesCategory;
  secondary?: SpeciesCategory[];
  notes?: string;
}

const KB = (speciesKB as { species: Record<string, KBEntry> }).species || {};

/** Returns the single primary ecological category of a scientific name (KB-only). */
export function classifySpeciesPrimary(scientificName: string): SpeciesCategory | null {
  if (!scientificName) return null;
  const direct = KB[scientificName];
  if (direct) return direct.primary;
  const genus = scientificName.split(' ')[0];
  const genusEntry = KB[genus];
  if (genusEntry) return genusEntry.primary;
  return null;
}

/** Returns the ordered, deduplicated list of categories proposable for a species
 *  based on the KB (primary first, then secondaries). Used by the attribution
 *  dialog to force the curator to pick a single identification when multiple
 *  classifications coexist (e.g. Iris pseudacorus = indigene + bioindicatrice). */
export function getSpeciesCategoryOptions(scientificName: string): SpeciesCategory[] {
  if (!scientificName) return [];
  const direct = KB[scientificName] || KB[scientificName.split(' ')[0]];
  if (!direct) return [];
  const ordered: SpeciesCategory[] = [direct.primary, ...(direct.secondary || [])];
  return Array.from(new Set(ordered));
}

/** Legacy: returns primary + secondary categories for a scientific name (KB only).
 *  Prefer `classifySpeciesPrimary` for any counting/bucketing logic. */
export function classifySpecies(scientificName: string): SpeciesCategory[] {
  if (!scientificName) return [];
  const direct = KB[scientificName];
  if (direct) return [direct.primary, ...(direct.secondary || [])];
  const genus = scientificName.split(' ')[0];
  const genusEntry = KB[genus];
  if (genusEntry) return [genusEntry.primary, ...(genusEntry.secondary || [])];
  return [];
}

export interface SensibleBuckets {
  bioIndicateurs: string[]; // scientific names
  auxiliaires: string[];
  eee: string[];
  patrimoniales: string[];
}

/**
 * Buckets scientific names by their **single primary** category.
 * - `curationByName` (optional) is the authoritative editorial map (L'œil) :
 *   `scientificName → category`. When present, it overrides the KB.
 * - Falls back to the KB primary when no curation exists for that name.
 * - A species never lands in more than one bucket.
 */
export function bucketSensibleSpecies(
  scientificNames: string[],
  curationByName?: Map<string, SpeciesCategory | string | null>,
): SensibleBuckets {
  const out: SensibleBuckets = { bioIndicateurs: [], auxiliaires: [], eee: [], patrimoniales: [] };
  const seen = new Set<string>();
  scientificNames.forEach(name => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    const curated = curationByName?.get(name);
    const cat = (curated as SpeciesCategory) || classifySpeciesPrimary(name);
    if (!cat) return;
    if (cat === 'bioindicatrice') out.bioIndicateurs.push(name);
    else if (cat === 'auxiliaire') out.auxiliaires.push(name);
    else if (cat === 'eee') out.eee.push(name);
    else if (cat === 'patrimoniale') out.patrimoniales.push(name);
  });
  return out;
}
