import type { PaletteStrate } from '@/lib/plantPaletteKb';
import type { ScoredSpecies, StrateRecommendation } from '@/lib/paletteEngine';

export interface ZoneSignature {
  /** Nombre d'espèces retenues dans l'emplacement. */
  total: number;
  /** Nombre total d'espèces proposées (toutes strates). */
  proposedTotal: number;
  /** Répartition des espèces retenues par strate. */
  byStrate: Array<{ strate: PaletteStrate; count: number }>;
  /** Part d'indigènes parmi les espèces retenues (0-100, null si aucune). */
  indigenePct: number | null;
  /** Nombre d'espèces labellisées « Végétal local ». */
  vegetalLocal: number;
  /** Services écologiques les plus représentés (max 3). */
  topServices: Array<{ label: string; count: number }>;
  /** Score moyen des espèces retenues (null si aucune). */
  avgScore: number | null;
}

/**
 * Agrège la sélection d'un emplacement en indicateurs lisibles d'un coup d'œil.
 * Purement dérivé : aucune requête, aucun effet de bord.
 */
export function zoneSignature(
  recommendations: StrateRecommendation[],
  selectedIds: string[],
): ZoneSignature {
  const selected = new Set(selectedIds);
  const byStrate: Array<{ strate: PaletteStrate; count: number }> = [];
  const kept: ScoredSpecies[] = [];
  let proposedTotal = 0;

  for (const rec of recommendations) {
    proposedTotal += rec.species.length;
    const hits = rec.species.filter((s) => selected.has(s.species.id));
    kept.push(...hits);
    if (hits.length > 0) byStrate.push({ strate: rec.strate, count: hits.length });
  }

  const total = kept.length;
  const indigenes = kept.filter((s) => s.species.origin === 'indigene').length;
  const vegetalLocal = kept.filter((s) => s.species.vegetalLocal).length;

  const serviceCounts = new Map<string, number>();
  for (const s of kept) {
    for (const svc of s.species.services ?? []) {
      serviceCounts.set(svc, (serviceCounts.get(svc) ?? 0) + 1);
    }
  }
  const topServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));

  return {
    total,
    proposedTotal,
    byStrate,
    indigenePct: total > 0 ? Math.round((indigenes / total) * 100) : null,
    vegetalLocal,
    topServices,
    avgScore: total > 0 ? Math.round(kept.reduce((a, s) => a + s.score, 0) / total) : null,
  };
}
