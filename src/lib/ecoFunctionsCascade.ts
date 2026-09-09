import { classifyFunctions } from '@/lib/ecologicalFunctionsClassification';
import type { EcoFunction } from '@/lib/ecologicalFunctions';
import { resolveStrate } from '@/lib/plantStrate';

/**
 * Cascade de confiance des étiquettes écologiques — règle métier unique,
 * partagée par la vue exploration (`useEcologicalFunctions`) et par les
 * indicateurs de biodiversité d'un jardin.
 *
 * Priorité : curation locale > base de connaissances partagée (confiance
 * ≥ 0,75) > classification automatique.
 */

export interface EcoCascadeInput {
  scientificName: string | null;
  /** Règne ou taxon iconique tel que renvoyé par la RPC. */
  group: string | null;
  family?: string | null;
  /** Nombre d'observations — sert au seuil « à valider ». */
  count?: number;
}

export interface EcoCascadeResult {
  functions: EcoFunction[];
  autoFunctions: EcoFunction[];
  isCurated: boolean;
  isFromKb: boolean;
  needsReview: boolean;
}

const NON_PLANT_GROUPS = [
  'animalia', 'mammalia', 'aves', 'insecta', 'arachnida',
  'reptilia', 'amphibia', 'mollusca',
];

/** Classification automatique (référentiel + strate) d'une espèce. */
export function autoClassifyFunctions(sp: EcoCascadeInput): EcoFunction[] {
  const fns = new Set<EcoFunction>(
    classifyFunctions({
      scientificName: sp.scientificName,
      kingdom: sp.group,
      iconicTaxon: sp.group,
      family: sp.family ?? null,
    }),
  );
  const groupLc = (sp.group || '').toLowerCase();
  const isNonPlant = !!groupLc && NON_PLANT_GROUPS.includes(groupLc);
  if (sp.scientificName && !isNonPlant) {
    const strate = resolveStrate({ scientificName: sp.scientificName });
    if (strate === 'arbre') fns.add('arbre');
    if (strate === 'arbuste') fns.add('haie_bocage');
  }
  return Array.from(fns);
}

export function resolveEcoFunctions(
  sp: EcoCascadeInput,
  opts: {
    override?: EcoFunction[] | null;
    kb?: { tags: EcoFunction[]; confidence: number } | null;
  } = {},
): EcoCascadeResult {
  const autoFunctions = autoClassifyFunctions(sp);
  const hasOverride = Array.isArray(opts.override);
  const kb = opts.kb;

  let functions: EcoFunction[];
  let isFromKb = false;
  if (hasOverride) {
    functions = opts.override || [];
  } else if (kb && kb.confidence >= 0.75 && kb.tags.length > 0) {
    functions = kb.tags;
    isFromKb = true;
  } else {
    functions = autoFunctions;
  }

  const needsReview =
    !hasOverride && !isFromKb && autoFunctions.length === 0 && (sp.count ?? 0) >= 2;

  return { functions, autoFunctions, isCurated: hasOverride, isFromKb, needsReview };
}
