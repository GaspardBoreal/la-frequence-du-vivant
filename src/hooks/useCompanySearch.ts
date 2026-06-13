import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CompanySearchFilters, CompanySearchResult } from '@/types/crmCompany';

export interface CompanySearchResponse {
  results: CompanySearchResult[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export function useCompanySearch(filters: CompanySearchFilters, enabled = true) {
  return useQuery<CompanySearchResponse>({
    queryKey: ['company-search', filters],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('search-french-companies', { body: filters });
      if (error) {
        console.error('[useCompanySearch] edge function error:', error);
        throw new Error(error.message || 'Erreur appel API entreprises');
      }
      if ((data as any)?.error) {
        console.error('[useCompanySearch] API error:', data);
        throw new Error((data as any).error + ((data as any).detail ? ` — ${(data as any).detail}` : ''));
      }
      return data as CompanySearchResponse;
    },
    enabled,
    staleTime: 60_000,
    retry: false,
    placeholderData: (prev) => prev,
  });
}
