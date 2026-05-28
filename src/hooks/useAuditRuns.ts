import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditRunSummary {
  id: string;
  slug: string;
  template_name: string | null;
  template_version: number | null;
  scope_label: string;
  model_used: string | null;
  launched_by_email: string | null;
  launched_at: string;
  status: string;
  global_score: number | null;
  maturity_level: string | null;
  domain_scores: any;
  is_public: boolean;
  error_message: string | null;
}

export interface AuditRunFull extends AuditRunSummary {
  prompt_snapshot: string;
  scope_context_json: any;
  report_json: any;
  report_markdown: string | null;
}

export const useAuditRuns = () => {
  return useQuery({
    queryKey: ['audit-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_runs')
        .select('id,slug,template_name,template_version,scope_label,model_used,launched_by_email,launched_at,status,global_score,maturity_level,domain_scores,is_public,error_message')
        .order('launched_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AuditRunSummary[];
    },
  });
};

export const useAuditRunBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['audit-run', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_runs')
        .select('*')
        .eq('slug', slug as string)
        .maybeSingle();
      if (error) throw error;
      return data as AuditRunFull | null;
    },
  });
};
