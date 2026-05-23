import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ApiFamily } from '@/lib/apiMcpFamilies';

export interface ApiMcpEntry {
  id: string;
  slug: string;
  family: ApiFamily;
  name: string;
  tagline: string;
  simple_description: string;
  tech_description: string | null;
  hero_image_path: string | null;
  icon_name: string | null;
  flow_steps: Array<{ label: string; desc: string }>;
  metric_queries: {
    volume?: { table: string; label: string };
    freshness?: { table: string; column: string };
    impact?: { template: string };
  };
  live_screen_path: string | null;
  external_doc_url: string | null;
  is_critical: boolean;
  display_order: number;
}

export const useApiMcpRegistry = () =>
  useQuery({
    queryKey: ['api-mcp-registry'],
    queryFn: async (): Promise<ApiMcpEntry[]> => {
      const { data, error } = await supabase
        .from('api_mcp_registry' as any)
        .select('*')
        .order('display_order');
      if (error) throw error;
      return (data as any) ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });
