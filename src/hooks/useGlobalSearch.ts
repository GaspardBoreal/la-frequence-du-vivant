import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export type SearchKind = 'species' | 'practice' | 'text' | 'testimony' | 'marcheur' | 'event';

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string | null;
  context: string | null;
  score: number;
  route: string;
  meta: Record<string, any> | null;
}

export function useGlobalSearch(query: string, eventId?: string | null) {
  const debounced = useDebounce(query.trim(), 250);
  const enabled = debounced.length >= 2;

  return useQuery({
    queryKey: ['global-search', debounced, eventId ?? null],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc('search_global' as any, {
        p_query: debounced,
        p_event_id: eventId ?? null,
        p_limit: 8,
      });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
  });
}

export async function logSearch(params: {
  query: string;
  eventId?: string | null;
  marcheId?: string | null;
  scope?: 'global' | 'event' | 'admin';
  resultsCount?: number;
  clickedKind?: string | null;
  clickedId?: string | null;
  route?: string | null;
}) {
  try {
    await supabase.rpc('log_search' as any, {
      p_query: params.query,
      p_event_id: params.eventId ?? null,
      p_marche_id: params.marcheId ?? null,
      p_scope: params.scope ?? 'global',
      p_results_count: params.resultsCount ?? 0,
      p_clicked_kind: params.clickedKind ?? null,
      p_clicked_id: params.clickedId ?? null,
      p_route: params.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (e) {
    // silent
  }
}

const HISTORY_KEY = 'global-search-history-v1';

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(q: string) {
  if (!q || q.length < 2) return;
  try {
    const cur = getRecentSearches().filter(x => x.toLowerCase() !== q.toLowerCase());
    const next = [q, ...cur].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}
