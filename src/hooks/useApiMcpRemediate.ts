import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Slugs pour lesquels une relance serveur existe. */
export const REMEDIABLE_SLUGS = ['inaturalist', 'gbif', 'lovable-ai'] as const;

export const canRemediate = (slug: string) =>
  (REMEDIABLE_SLUGS as readonly string[]).includes(slug);

export const useApiMcpRemediate = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string): Promise<{ ok: boolean; detail: string }> => {
      const { data, error } = await supabase.functions.invoke('api-mcp-remediate', {
        body: { slug },
      });
      if (error) {
        const motif = (data as any)?.error || (data as any)?.detail || error.message;
        throw new Error(motif || 'La relance a échoué.');
      }
      const res = data as any;
      if (res?.ok === false) throw new Error(res?.detail || res?.error || 'La relance a échoué.');
      return { ok: true, detail: res?.detail ?? 'Relance effectuée.' };
    },
    onSuccess: (res) => {
      toast.success('Relance effectuée', { description: res.detail });
      qc.invalidateQueries({ queryKey: ['api-mcp-health'] });
      qc.invalidateQueries({ queryKey: ['api-mcp-incidents'] });
    },
    onError: (e: Error) => {
      toast.error('La relance a échoué', { description: e.message });
      qc.invalidateQueries({ queryKey: ['api-mcp-incidents'] });
    },
  });
};
