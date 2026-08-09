import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SoilGuardTrigger {
  name: string;
  enabled: boolean;
  function: string;
}
export interface SoilGuardFunction {
  name: string;
  security_definer: boolean;
  granted_to_authenticated: boolean;
}
export interface SoilGuardPolicy {
  table: string;
  name: string;
  cmd: string;
  roles: string;
  covers_attached_walkers: boolean;
}
export interface SoilGuardAudit {
  checked_at: string;
  triggers: SoilGuardTrigger[];
  functions: SoilGuardFunction[];
  policies: SoilGuardPolicy[];
  history_table_exists: boolean;
  rls_enabled: boolean;
  history_count: number;
  registers_count: number;
}

export interface SoilHistoryPulseRow {
  id: string;
  propriete_id: string;
  propriete_nom: string | null;
  changed_at: string;
  samples_count: number | null;
  previous_count: number | null;
}

export function useSoilGuardAudit() {
  const audit = useQuery<SoilGuardAudit>({
    queryKey: ['soil-guard-audit'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('audit_propriete_soil_guards' as any);
      if (error) throw error;
      return data as unknown as SoilGuardAudit;
    },
    staleTime: 30_000,
  });

  const history = useQuery<SoilHistoryPulseRow[]>({
    queryKey: ['soil-guard-history'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('audit_propriete_soil_history' as any, {
        p_limit: 40,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SoilHistoryPulseRow[];
    },
    staleTime: 30_000,
  });

  return { audit, history };
}

export default useSoilGuardAudit;
