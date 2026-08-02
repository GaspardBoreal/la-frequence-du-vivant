import {
  DEFAULT_VIVANT_FILTER,
  FAMILY_FILTER_LABEL,
  TYPE_META,
  type VivantFilterState,
  type VivantSource,
  type VivantType,
} from './LivingLayer';
import type { PlantFamily } from '@/lib/plantIndicatorKb';

/**
 * Traduction lisible de l'état de filtrage du vivant.
 *
 * Chaque puce annonce une raison pour laquelle la liste est ce qu'elle est.
 * `next` (quand il est défini) donne l'état du filtre après retrait de la
 * puce : l'utilisateur comprend *et* corrige d'un seul geste.
 */
export interface VivantChip {
  key: string;
  label: string;
  tone: 'scope' | 'period' | 'filter';
  /** État du filtre après retrait — absent = puce non retirable ici. */
  next?: VivantFilterState;
}

interface Extra {
  /** Libellé de portée (« Cadastre » / « Tous ») — non retirable depuis l'herbier. */
  scopeLabel?: string | null;
  /** Libellé de période (« Aujourd'hui », « 30 derniers jours »…). */
  periodLabel?: string | null;
  /** Libellés lisibles des tags actifs, indexés par clé normalisée. */
  tagLabels?: Map<string, string>;
}

const TAG_MODE_PREFIX: Record<VivantFilterState['tags']['mode'], string> = {
  or: 'Tag',
  and: 'Tag (tous)',
  not: 'Sans tag',
};

export function describeVivantFilters(f: VivantFilterState, extra: Extra = {}): VivantChip[] {
  const chips: VivantChip[] = [];

  if (extra.scopeLabel) {
    chips.push({ key: 'scope', label: extra.scopeLabel, tone: 'scope' });
  }
  if (extra.periodLabel) {
    chips.push({ key: 'period', label: extra.periodLabel, tone: 'period' });
  }

  if (f.types.length !== 4) {
    f.types.forEach((t: VivantType) =>
      chips.push({
        key: `type-${t}`,
        label: `${TYPE_META[t].glyph} ${TYPE_META[t].label}`,
        tone: 'filter',
        next: { ...f, types: f.types.filter((x) => x !== t) },
      }),
    );
  }

  f.familles.forEach((fam: PlantFamily) =>
    chips.push({
      key: `fam-${fam}`,
      label: FAMILY_FILTER_LABEL[fam],
      tone: 'filter',
      next: { ...f, familles: f.familles.filter((x) => x !== fam) },
    }),
  );

  if (f.sources.length !== 2) {
    f.sources.forEach((s: VivantSource) =>
      chips.push({
        key: `src-${s}`,
        label: s === 'marcheur' ? 'Marcheurs' : 'iNaturalist',
        tone: 'filter',
        next: { ...f, sources: f.sources.filter((x) => x !== s) },
      }),
    );
  }

  if (f.bioOnly) {
    chips.push({
      key: 'bio',
      label: 'Bio-indicatrices',
      tone: 'filter',
      next: { ...f, bioOnly: false },
    });
  }

  (f.tags?.labels ?? []).forEach((k) =>
    chips.push({
      key: `tag-${k}`,
      label: `${TAG_MODE_PREFIX[f.tags.mode]} · ${extra.tagLabels?.get(k) ?? k}`,
      tone: 'filter',
      next: { ...f, tags: { ...f.tags, labels: f.tags.labels.filter((x) => x !== k) } },
    }),
  );

  if (f.query.trim()) {
    chips.push({
      key: 'query',
      label: `« ${f.query.trim()} »`,
      tone: 'filter',
      next: { ...f, query: '' },
    });
  }

  return chips;
}

export const resetVivantFilter = (): VivantFilterState => ({ ...DEFAULT_VIVANT_FILTER });
