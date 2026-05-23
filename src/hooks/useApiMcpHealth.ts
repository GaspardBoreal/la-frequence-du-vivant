import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApiMcpHealth {
  volume: number | null;
  freshness: string | null;
  status: 'green' | 'orange' | 'red' | 'unknown';
}

export const useApiMcpHealth = () =>
  useQuery({
    queryKey: ['api-mcp-health'],
    queryFn: async (): Promise<Record<string, ApiMcpHealth>> => {
      const { data, error } = await supabase.functions.invoke('get-api-mcp-health');
      if (error) throw error;
      return (data as any)?.health ?? {};
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const formatVolume = (n: number | null): string => {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')} k`;
  return String(n);
};

export const formatFreshness = (iso: string | null): string => {
  if (!iso) return 'jamais';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 36e5);
  if (h < 1) return 'à l\'instant';
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
};
