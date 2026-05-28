import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditPromptTemplate {
  id: string;
  name: string;
  version: number;
  referential: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAuditPromptTemplates = () => {
  return useQuery({
    queryKey: ['audit-prompt-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_prompt_templates')
        .select('*')
        .order('name', { ascending: true })
        .order('version', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AuditPromptTemplate[];
    },
  });
};
