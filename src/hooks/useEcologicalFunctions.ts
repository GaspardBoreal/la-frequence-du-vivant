import { useMemo } from 'react';
import { useExplorationSpeciesPool, type ExplorationSpecies } from './useExplorationSpeciesPool';
import { useExplorationCurations } from './useExplorationCurations';
import { useSpeciesEcoTagsKb } from './useSpeciesEcoTagsKb';
import { classifyFunctions } from '@/lib/ecologicalFunctionsClassification';
import { ECO_FUNCTIONS, type EcoFunction, computeFertilityScore } from '@/lib/ecologicalFunctions';
import { resolveStrate, type PlantStrate } from '@/lib/plantStrate';

export interface SpeciesWithFunctions extends ExplorationSpecies {
  functions: EcoFunction[];
  /** Tags issus de l'auto-classification (avant override curateur). */
  autoFunctions: EcoFunction[];
  /** True si un curateur local a explicitement édité les tags. */
  isCurated: boolean;
  /** True si tags issus de la KB globale (validés sur autre marche). */
  isFromKb: boolean;
  /** True si l'auto-classification est faible / vide ⇒ à valider. */
  needsReview: boolean;
}


export interface EcoFunctionsResult {
  buckets: Record<EcoFunction, SpeciesWithFunctions[]>;
  counts: Record<EcoFunction, number>;
  mellifereByStrate: Record<PlantStrate, SpeciesWithFunctions[]>;
  fertilityScore: number;
  totalSpecies: number;
  /** Liste de toutes les espèces (taguées + sans tag), pour l'UI de curation. */
  allSpecies: SpeciesWithFunctions[];
  /** Compte d'espèces à valider (besoin curation). */
  needsReviewCount: number;
  isLoading: boolean;
}

const NON_PLANT_GROUPS = ['animalia', 'mammalia', 'aves', 'insecta', 'arachnida', 'reptilia', 'amphibia', 'mollusca'];

function autoClassify(sp: ExplorationSpecies): EcoFunction[] {
  const fns = new Set<EcoFunction>(
    classifyFunctions({
      scientificName: sp.scientificName,
      kingdom: sp.group,
      iconicTaxon: sp.group,
      family: (sp as any).family ?? null,
    }),
  );
  const groupLc = (sp.group || '').toLowerCase();
  const isNonPlant = groupLc && NON_PLANT_GROUPS.includes(groupLc);
  if (sp.scientificName && !isNonPlant) {
    const strate = resolveStrate({ scientificName: sp.scientificName });
    if (strate === 'arbre') fns.add('arbre');
    if (strate === 'arbuste') fns.add('haie_bocage');
  }
  return Array.from(fns);
}

/**
 * Calcule en mémoire les fonctions écologiques de chaque espèce du pool +
 * applique les overrides curateur (table `exploration_curations`, colonne
 * `functions text[]` quand entity_type='species').
 */
export function useEcologicalFunctions(
  explorationId: string | null | undefined,
): EcoFunctionsResult {
  const { data: pool, isLoading } = useExplorationSpeciesPool(explorationId);
  const { data: curations } = useExplorationCurations(explorationId, 'oeil');

  // KB globale cross-marches
  const allNames = useMemo(
    () => (pool || []).map(s => s.scientificName).filter((x): x is string => !!x),
    [pool],
  );
  const { data: kbMap } = useSpeciesEcoTagsKb(allNames);

  return useMemo(() => {
    // Map scientificName -> curation override
    const overrideByName = new Map<string, { functions: EcoFunction[] | null; curationId: string }>();
    (curations || []).forEach((c: any) => {
      if (c.entity_type !== 'species' || !c.entity_id) return;
      if (!Array.isArray(c.functions)) return;
      overrideByName.set(String(c.entity_id).trim(), {
        functions: c.functions as EcoFunction[],
        curationId: c.id,
      });
    });

    const buckets = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = [] as SpeciesWithFunctions[];
      return acc;
    }, {} as Record<EcoFunction, SpeciesWithFunctions[]>);

    const allSpecies: SpeciesWithFunctions[] = [];
    let needsReviewCount = 0;

    (pool || []).forEach(sp => {
      const autoFns = autoClassify(sp);
      const name = sp.scientificName?.trim() || '';
      const override = name ? overrideByName.get(name) : undefined;
      const kbEntry = name ? kbMap?.get(name) : undefined;

      // Priorité : curation locale > KB globale (confidence >= 0.75) > auto-classif
      let finalFns: EcoFunction[];
      let isFromKb = false;
      if (override) {
        finalFns = override.functions || [];
      } else if (kbEntry && kbEntry.confidence >= 0.75 && kbEntry.tags.length > 0) {
        finalFns = kbEntry.tags;
        isFromKb = true;
      } else {
        finalFns = autoFns;
      }

      const isCurated = !!override;
      // À valider : aucune source (ni curation, ni KB fiable, ni auto) ET espèce fréquente
      const needsReview = !isCurated && !isFromKb && autoFns.length === 0 && sp.count >= 2;
      if (needsReview) needsReviewCount += 1;

      const enriched: SpeciesWithFunctions = {
        ...sp,
        functions: finalFns,
        autoFunctions: autoFns,
        isCurated,
        isFromKb,
        needsReview,
      };
      allSpecies.push(enriched);
      finalFns.forEach(f => buckets[f].push(enriched));
    });


    const counts = ECO_FUNCTIONS.reduce((acc, f) => {
      acc[f.value] = buckets[f.value].length;
      return acc;
    }, {} as Record<EcoFunction, number>);

    const mellifereByStrate: Record<PlantStrate, SpeciesWithFunctions[]> = {
      arbre: [],
      arbuste: [],
      herbacee: [],
    };
    buckets.mellifere.forEach(sp => {
      const strate = resolveStrate({ scientificName: sp.scientificName });
      mellifereByStrate[strate].push(sp);
    });

    return {
      buckets,
      counts,
      mellifereByStrate,
      fertilityScore: computeFertilityScore(buckets),
      totalSpecies: pool?.length || 0,
      allSpecies,
      needsReviewCount,
      isLoading,
    };
  }, [pool, curations, kbMap, isLoading]);
}
