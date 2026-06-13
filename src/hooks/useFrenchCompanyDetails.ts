import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CompanyFullDetails } from '@/types/crmCompany';

export function useFrenchCompanyDetails(siren: string | null) {
  return useQuery<CompanyFullDetails>({
    queryKey: ['french-company-details', siren],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-french-company', {
        body: { siren },
      });
      if (error) throw new Error(error.message || 'Erreur API entreprise');
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as CompanyFullDetails;
    },
    enabled: !!siren && /^\d{9}$/.test(siren ?? ''),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
