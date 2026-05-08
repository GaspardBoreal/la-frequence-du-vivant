// Lightweight classification of scientific names into ecological categories.
// Source: src/data/species-knowledge-base.json (curated, INPN-grounded).
import speciesKB from '@/data/species-knowledge-base.json';

export type SpeciesCategory = 'bioindicatrice' | 'auxiliaire' | 'eee' | 'patrimoniale' | 'ravageur' | 'indigene';

interface KBEntry {
  primary: SpeciesCategory;
  secondary?: SpeciesCategory[];
  notes?: string;
}

const KB = (speciesKB as { species: Record<string, KBEntry> }).species || {};

/** Returns all ecological categories applying to a scientific name (primary + secondary). */
export function classifySpecies(scientificName: string): SpeciesCategory[] {
  if (!scientificName) return [];
  // Try exact, then genus-only fallback
  const direct = KB[scientificName];
  if (direct) {
    return [direct.primary, ...(direct.secondary || [])];
  }
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

export function bucketSensibleSpecies(scientificNames: string[]): SensibleBuckets {
  const out: SensibleBuckets = { bioIndicateurs: [], auxiliaires: [], eee: [], patrimoniales: [] };
  const seen = new Set<string>();
  scientificNames.forEach(name => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    const cats = classifySpecies(name);
    if (cats.includes('bioindicatrice')) out.bioIndicateurs.push(name);
    if (cats.includes('auxiliaire')) out.auxiliaires.push(name);
    if (cats.includes('eee')) out.eee.push(name);
    if (cats.includes('patrimoniale')) out.patrimoniales.push(name);
  });
  return out;
}
