import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrustReport } from '@/lib/iot/trustReport';

/** Rapport de confiance BRAD recalculé en base depuis une date de départ. */
export function useTrustReport(since: Date) {
  const iso = since.toISOString();
  return useQuery({
    queryKey: ['trust-report', iso],
    queryFn: async (): Promise<TrustReport> => {
      const { data, error } = await supabase.rpc('get_iot_trust_report' as never, { p_since: iso } as never);
      if (error) throw error;
      return data as unknown as TrustReport;
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}
