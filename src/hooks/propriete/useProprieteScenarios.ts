import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { OuvrageScenario, Planting } from './useOuvrageScenarios';

/**
 * Toutes les scénographies d'une propriété, tous ouvrages confondus.
 * Sert la « bibliothèque » de l'Atelier : une seule requête, les mêmes
 * gestes que dans le registre (renommer / dupliquer / retenir / supprimer).
 */
export function useProprieteScenarios(proprieteId?: string | null) {
  const [scenarios, setScenarios] = useState<OuvrageScenario[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!proprieteId) {
      setScenarios([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('propriete_ouvrage_scenarios')
      .select('*')
      .eq('propriete_id', proprieteId)
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error('Scénographies illisibles', { description: error.message });
      return;
    }
    setScenarios(
      (data || []).map((r: any) => ({
        ...r,
        plantings: Array.isArray(r.plantings) ? (r.plantings as Planting[]) : [],
      })) as OuvrageScenario[],
    );
  }, [proprieteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (id: string, value: Partial<Pick<OuvrageScenario, 'nom' | 'notes' | 'plantings'>>) => {
      setScenarios((p) => p.map((s) => (s.id === id ? { ...s, ...(value as any) } : s)));
      const { error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ ...(value as any), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) toast.error('Enregistrement échoué', { description: error.message });
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('propriete_ouvrage_scenarios').delete().eq('id', id);
    if (error) {
      toast.error('Suppression impossible', { description: error.message });
      return;
    }
    setScenarios((p) => p.filter((s) => s.id !== id));
  }, []);

  const setRetenu = useCallback(
    async (id: string) => {
      const target = scenarios.find((s) => s.id === id);
      if (!target) return;
      await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ retenu: false })
        .eq('objet_id', target.objet_id)
        .neq('id', id);
      const { error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ retenu: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error('Impossible de retenir ce scénario', { description: error.message });
        return;
      }
      setScenarios((p) =>
        p.map((s) =>
          s.objet_id === target.objet_id ? { ...s, retenu: s.id === id } : s,
        ),
      );
      toast.success('Scénario retenu pour le rapport');
    },
    [scenarios],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const src = scenarios.find((s) => s.id === id);
      if (!src || !proprieteId) return;
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .insert({
          propriete_id: proprieteId,
          objet_id: src.objet_id,
          nom: `${src.nom} (copie)`,
          plantings: src.plantings as any,
          created_by: auth?.user?.id ?? null,
        })
        .select('*')
        .single();
      if (error) {
        toast.error('Duplication impossible', { description: error.message });
        return;
      }
      setScenarios((p) => [
        { ...(data as any), plantings: (data as any).plantings ?? [] } as OuvrageScenario,
        ...p,
      ]);
    },
    [scenarios, proprieteId],
  );

  return { scenarios, loading, patch, remove, setRetenu, duplicate, reload: load };
}
