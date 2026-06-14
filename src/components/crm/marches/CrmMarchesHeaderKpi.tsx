import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarCheck, Users, Leaf, Sparkles, Building2 } from 'lucide-react';

interface Kpi {
  marches_past: number;
  marches_upcoming: number;
  participants: number;
  species_unique: number;
  pratiques: number;
  companies: number;
}

export const CrmMarchesHeaderKpi: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['crm-marches-kpi'],
    queryFn: async (): Promise<Kpi> => {
      const now = new Date().toISOString();
      const [pastRes, upRes, partRes, pratRes, compRes, spRes] = await Promise.all([
        supabase.from('marche_events').select('id', { count: 'exact', head: true }).lt('date_marche', now),
        supabase.from('marche_events').select('id', { count: 'exact', head: true }).gte('date_marche', now),
        supabase.from('marche_participations').select('id', { count: 'exact', head: true }),
        supabase.from('exploration_curations').select('id', { count: 'exact', head: true }).eq('sense', 'main'),
        supabase.from('crm_company_events' as any).select('company_id', { count: 'exact', head: true }),
        supabase.rpc('get_top_species_observed', { p_limit: 5000 }),
      ]);
      return {
        marches_past: pastRes.count || 0,
        marches_upcoming: upRes.count || 0,
        participants: partRes.count || 0,
        species_unique: Array.isArray(spRes.data) ? spRes.data.length : 0,
        pratiques: pratRes.count || 0,
        companies: compRes.count || 0,
      };
    },
    staleTime: 60_000,
  });

  const items = [
    { icon: CalendarCheck, label: 'Marches passées', value: data?.marches_past, accent: '#0d6b58' },
    { icon: CalendarCheck, label: 'À venir', value: data?.marches_upcoming, accent: '#06b6d4' },
    { icon: Users, label: 'Participations', value: data?.participants, accent: '#a855f7' },
    { icon: Leaf, label: 'Espèces uniques', value: data?.species_unique, accent: '#16a34a' },
    { icon: Sparkles, label: 'Pratiques', value: data?.pratiques, accent: '#f59e0b' },
    { icon: Building2, label: 'Entreprises liées', value: data?.companies, accent: '#dc2626' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={i} className="rounded-xl crm-surface border border-[hsl(var(--crm-border))] p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: it.accent + '22', color: it.accent }}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-[hsl(var(--crm-text))] crm-num leading-tight">{it.value ?? '—'}</div>
              <div className="text-[10px] uppercase tracking-wider crm-muted truncate">{it.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CrmMarchesHeaderKpi;
