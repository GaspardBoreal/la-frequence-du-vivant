import { useMemo } from 'react';
import {
  classifyTrophic,
  type TrophicAssignment,
  type TrophicGroup,
  TROPHIC_LEVELS,
} from '@/lib/trophicClassification';

export interface TrophicSpeciesInput {
  scientificName?: string | null;
  commonName?: string | null;
  family?: string | null;
  kingdom?: string | null;
  observations?: number | null;
  photos?: string[] | null;
  photoData?: { url?: string } | null;
}

export interface TrophicStar {
  scientificName: string;
  commonName: string | null;
  group: TrophicGroup;
  source: TrophicAssignment['source'];
  rationale?: string;
  abundance: number;
  photoUrl?: string;
}

export interface TrophicChainResult {
  stars: TrophicStar[];
  /** Group → stars (sorted desc by abundance) */
  byGroup: Record<TrophicGroup, TrophicStar[]>;
  counts: Record<TrophicGroup, number>;
  unclassified: TrophicStar[];
  /** "Pyramide solide" | "Chaîne incomplète" | "Anomalie" */
  balance: {
    label: string;
    tone: 'solid' | 'partial' | 'inverted';
    missingLevels: TrophicGroup[];
    /** Lindeman-like ratio L5/L1 */
    apexRatio: number | null;
  };
  total: number;
  curatedRatio: number;
}

const EMPTY_BY_GROUP = (): Record<TrophicGroup, TrophicStar[]> => ({
  L1: [], L2: [], L3: [], L4: [], L5: [], DECOMPOSER: [], UNCLASSIFIED: [],
});

export function useTrophicChain(species: TrophicSpeciesInput[]): TrophicChainResult {
  return useMemo(() => {
    const byGroup = EMPTY_BY_GROUP();
    const stars: TrophicStar[] = [];
    let kbCount = 0;

    species.forEach((sp) => {
      const sn = (sp.scientificName || '').trim();
      if (!sn) return;
      const a = classifyTrophic(sp);
      if (a.source === 'kb') kbCount += 1;
      const star: TrophicStar = {
        scientificName: sn,
        commonName: sp.commonName ?? null,
        group: a.group,
        source: a.source,
        rationale: a.rationale,
        abundance: Math.max(1, sp.observations ?? 1),
        photoUrl: sp.photoData?.url || sp.photos?.[0],
      };
      stars.push(star);
      byGroup[a.group].push(star);
    });

    (Object.keys(byGroup) as TrophicGroup[]).forEach((k) => {
      byGroup[k].sort((a, b) => b.abundance - a.abundance);
    });

    const counts = (Object.fromEntries(
      (Object.keys(byGroup) as TrophicGroup[]).map((k) => [k, byGroup[k].length])
    ) as Record<TrophicGroup, number>);

    const missingLevels = TROPHIC_LEVELS.filter((l) => counts[l.group] === 0).map((l) => l.group);
    const apexRatio = counts.L1 > 0 ? counts.L5 / counts.L1 : null;
    let tone: 'solid' | 'partial' | 'inverted' = 'solid';
    let label = 'Pyramide trophique solide';
    if (counts.L1 > 0 && counts.L5 === 0) {
      tone = 'partial';
      label = 'Chaîne incomplète — prédateurs absents';
    }
    if (missingLevels.length >= 2) {
      tone = 'partial';
      label = 'Plusieurs maillons manquants';
    }
    if (counts.L5 > counts.L1 && counts.L1 > 0) {
      tone = 'inverted';
      label = 'Forme inversée — biais d’observation probable';
    }
    if (counts.L1 + counts.L2 + counts.L3 + counts.L4 + counts.L5 === 0) {
      tone = 'partial';
      label = 'Pas encore de chaîne lisible';
    }

    return {
      stars,
      byGroup,
      counts,
      unclassified: byGroup.UNCLASSIFIED,
      balance: { label, tone, missingLevels, apexRatio },
      total: stars.length,
      curatedRatio: stars.length ? kbCount / stars.length : 0,
    };
  }, [species]);
}
