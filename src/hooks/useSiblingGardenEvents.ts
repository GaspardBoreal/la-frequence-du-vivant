import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useCarteMdVEvents,
  applyFilters,
  DEFAULT_FILTERS,
  type CarteMdVFilters,
  type CarteMdVEvent,
  type StatusFilter,
  type SeasonFilter,
  type ZoneFilter,
  type CarteMdVView,
} from '@/hooks/useCarteMdV';
import { getMarcheCategoryMeta } from '@/lib/marcheCategories';

interface SiblingResult {
  list: CarteMdVEvent[];
  index: number;
  total: number;
  prev: CarteMdVEvent | null;
  next: CarteMdVEvent | null;
  prevHref: string | null;
  nextHref: string | null;
  backHref: string;
  categoryLabel: string;
}

const CARTE_PATH = '/marches-du-vivant/carte-marches-du-vivant';

/**
 * Reconstruit la liste des jardins voisins à partir des filtres URL
 * (mêmes clés que `useCarteMdVFilters`), puis expose prev/next/back.
 */
export function useSiblingGardenEvents(currentEventId: string | undefined): SiblingResult {
  const [params] = useSearchParams();
  const { data: events = [] } = useCarteMdVEvents();

  const filters: CarteMdVFilters = useMemo(() => ({
    search: params.get('q') ?? '',
    types: params.get('type')?.split(',').filter(Boolean) ?? [],
    categories: params.get('cat')?.split(',').filter(Boolean) ?? [],
    status: (params.get('status') as StatusFilter) || DEFAULT_FILTERS.status,
    season: (params.get('season') as SeasonFilter) || DEFAULT_FILTERS.season,
    minSpecies: Number(params.get('minSpecies') ?? 0) || 0,
    zone: (params.get('zone') as ZoneFilter) || DEFAULT_FILTERS.zone,
    needAudio: params.get('audio') === '1',
    needPhotos: params.get('photos') === '1',
    solVivantEnabled: params.get('sv') === '1',
    solVivantCategories: params.get('svc')?.split(',').filter(Boolean) ?? [],
    view: (params.get('view') as CarteMdVView) || DEFAULT_FILTERS.view,
  }), [params]);

  // Catégorie active : on garde l'intersection avec `jardin` (fiche jardin = jardins uniquement).
  // Si l'utilisateur filtrait sur autre chose sans jardin, on force jardin quand même.
  const categoryLabel = useMemo(() => {
    if (filters.categories.length === 1) return getMarcheCategoryMeta(filters.categories[0]).label;
    return 'Jardin';
  }, [filters.categories]);

  const list = useMemo(() => {
    const filtered = applyFilters(events, filters).filter((e) => e.category === 'jardin');
    return filtered.sort(
      (a, b) => new Date(b.date_marche).getTime() - new Date(a.date_marche).getTime(),
    );
  }, [events, filters]);

  const index = useMemo(
    () => (currentEventId ? list.findIndex((e) => e.id === currentEventId) : -1),
    [list, currentEventId],
  );

  const returnParams = new URLSearchParams(params);
  returnParams.set('tab', 'carte');
  const suffix = `?${returnParams.toString()}`;

  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  const hrefFor = (e: CarteMdVEvent) => `/jardin/${e.public_slug ?? e.id}${suffix}`;

  return {
    list,
    index,
    total: list.length,
    prev,
    next,
    prevHref: prev ? hrefFor(prev) : null,
    nextHref: next ? hrefFor(next) : null,
    backHref: `${CARTE_PATH}${suffix}`,
    categoryLabel,
  };
}
