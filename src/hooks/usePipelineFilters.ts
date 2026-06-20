import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { KANBAN_COLUMNS, type CrmOpportunity, type OpportunityStatus } from '@/types/crm';
import { isValidActionCode, type OpportunityActionCode } from '@/lib/crmOpportunityActions';

const ALL_STAGES: OpportunityStatus[] = KANBAN_COLUMNS.map((c) => c.id);

export interface UsePipelineFiltersResult {
  // Jalons (actions réalisées)
  actionsFilter: OpportunityActionCode[];
  setActionsFilter: (next: OpportunityActionCode[]) => void;
  actionsMode: 'and' | 'or';
  setActionsMode: (m: 'and' | 'or') => void;

  // Étapes (statut pipeline)
  stagesFilter: OpportunityStatus[];
  setStagesFilter: (next: OpportunityStatus[]) => void;
  /** true tant que toutes les étapes sont actives (état par défaut, pas de filtre) */
  allStagesActive: boolean;

  /** Prédicat unique combinant tous les filtres. À utiliser dans toutes les vues. */
  matchesAll: (opp: CrmOpportunity) => boolean;
}

/**
 * État + URL + prédicat unifiés pour les filtres du Pipeline CRM.
 * URL params : `actions`, `actions_mode`, `stages`.
 * Partagé par les vues Kanban / Liste / Carte.
 */
export function usePipelineFilters(): UsePipelineFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Jalons ---
  const actionsFilter = React.useMemo<OpportunityActionCode[]>(() => {
    return (searchParams.get('actions') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(isValidActionCode);
  }, [searchParams]);

  const actionsMode: 'and' | 'or' =
    searchParams.get('actions_mode') === 'or' ? 'or' : 'and';

  const setActionsFilter = React.useCallback(
    (next: OpportunityActionCode[]) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next.length === 0) p.delete('actions');
          else p.set('actions', next.join(','));
          if (next.length < 2) p.delete('actions_mode');
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setActionsMode = React.useCallback(
    (m: 'and' | 'or') => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (m === 'or') p.set('actions_mode', 'or');
          else p.delete('actions_mode');
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // --- Étapes ---
  // Sémantique : `stages` absent => toutes (défaut) ; `stages=` vide => aucune ; sinon liste.
  const stagesFilter = React.useMemo<OpportunityStatus[]>(() => {
    const raw = searchParams.get('stages');
    if (raw === null) return ALL_STAGES;
    if (raw === '') return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is OpportunityStatus =>
        ALL_STAGES.includes(s as OpportunityStatus),
      );
  }, [searchParams]);

  const setStagesFilter = React.useCallback(
    (next: OpportunityStatus[]) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next.length === ALL_STAGES.length) p.delete('stages');
          else p.set('stages', next.join(','));
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const allStagesActive = stagesFilter.length === ALL_STAGES.length;

  // --- Prédicat unifié ---
  const matchesAll = React.useCallback(
    (opp: CrmOpportunity) => {
      // Jalons
      if (actionsFilter.length > 0) {
        const set = new Set(opp.actions_realisees ?? []);
        const ok =
          actionsMode === 'and'
            ? actionsFilter.every((c) => set.has(c))
            : actionsFilter.some((c) => set.has(c));
        if (!ok) return false;
      }
      // Étapes
      if (!allStagesActive && !stagesFilter.includes(opp.statut)) return false;
      return true;
    },
    [actionsFilter, actionsMode, stagesFilter, allStagesActive],
  );

  return {
    actionsFilter,
    setActionsFilter,
    actionsMode,
    setActionsMode,
    stagesFilter,
    setStagesFilter,
    allStagesActive,
    matchesAll,
  };
}

export { ALL_STAGES };
