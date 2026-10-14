import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { SpeciesRow } from '@/lib/ouvrageScope';

const normalizedScientificName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** The property inventory is authoritative; map points are only for spatial focus. */
export function propertyChatSpeciesRows(species: BiodiversitySpecies[]): SpeciesRow[] {
  const rows = new Map<string, SpeciesRow>();
  for (const sp of species) {
    const n = sp.scientificName.trim();
    if (!n) continue;
    const key = normalizedScientificName(n);
    const common = sp.commonName.trim();
    const c = common && normalizedScientificName(common) !== key ? common : null;
    const vu = sp.lastObserved || null;
    const existing = rows.get(key);
    if (existing) {
      existing.obs += sp.observations;
      if (!existing.c && c) existing.c = c;
      if (vu && (!existing.vu || vu > existing.vu)) existing.vu = vu;
    } else {
      rows.set(key, { n, c, k: sp.kingdom, obs: sp.observations, vu });
    }
  }
  return [...rows.values()].sort((a, b) => b.obs - a.obs || a.n.localeCompare(b.n));
}

/** No row cap: reduce formatting, never taxonomic coverage. */
export function completeSpeciesContext(rows: SpeciesRow[], portee: string) {
  return { portee, exhaustif: true, tronque: false, total: rows.length, especes: rows };
}