import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLaunchAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ template_id, scope_label }: { template_id: string; scope_label: string }) => {
      const { data, error } = await supabase.functions.invoke('run-frugal-audit', {
        body: { template_id, scope_label },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: true; slug: string; id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-runs'] });
      toast.success('Audit terminé');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Échec de l\'audit');
    },
  });
};
