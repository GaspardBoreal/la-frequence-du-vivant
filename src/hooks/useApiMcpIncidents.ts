import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApiMcpIncident {
  id: string;
  slug: string;
  status_at_action: string;
  action: string;
  outcome: 'success' | 'error' | string;
  detail: string | null;
  freshness_before: string | null;
  triggered_by: string | null;
  created_at: string;
}

export const useApiMcpIncidents = (slug?: string, limit = 50) =>
  useQuery({
    queryKey: ['api-mcp-incidents', slug ?? 'all', limit],
    queryFn: async (): Promise<ApiMcpIncident[]> => {
      let q = supabase
        .from('api_mcp_incidents' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (slug) q = q.eq('slug', slug);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
    staleTime: 60 * 1000,
  });
