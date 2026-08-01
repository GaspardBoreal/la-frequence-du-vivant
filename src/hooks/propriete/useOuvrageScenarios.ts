import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Strate } from '@/lib/plantSpread';

/** Une espèce posée sur le plan de l'ouvrage. */
export interface Planting {
  id: string;
  scientificName: string;
  commonNameFr?: string | null;
  lat: number;
  lng: number;
  /** Envergure adulte retenue (diamètre, m) — modifiable au cas par cas. */
  spreadM: number;
  strate: Strate;
  /** Provenance : déjà observée sur place, proposée par l'IA, ou ajoutée à la main. */
  origin: 'place' | 'proposee' | 'libre';
  photoUrl?: string | null;
  functions?: string[];
  note?: string | null;
}

export interface OuvrageScenario {
  id: string;
  propriete_id: string;
  objet_id: string;
  nom: string;
  notes: string | null;
  plantings: Planting[];
  retenu: boolean;
  created_at: string;
  updated_at: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Scénarios d'aménagement d'un ouvrage : plusieurs compositions concurrentes
 * (A / B / C…), dont une seule peut être « retenue » pour le rapport client.
 */
export function useOuvrageScenarios(proprieteId?: string | null, objetId?: string | null) {
  const [scenarios, setScenarios] = useState<OuvrageScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!proprieteId || !objetId) {
      setScenarios([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('propriete_ouvrage_scenarios')
      .select('*')
      .eq('propriete_id', proprieteId)
      .eq('objet_id', objetId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) {
      toast.error('Scénarios illisibles', { description: error.message });
      return;
    }
    const rows = (data || []).map((r: any) => ({
      ...r,
      plantings: Array.isArray(r.plantings) ? (r.plantings as Planting[]) : [],
    })) as OuvrageScenario[];
    setScenarios(rows);
    setActiveId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows.find((r) => r.retenu)?.id ?? rows[0]?.id ?? null));
  }, [proprieteId, objetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => scenarios.find((s) => s.id === activeId) ?? null,
    [scenarios, activeId],
  );

  const create = useCallback(
    async (plantings: Planting[] = [], nom?: string) => {
      if (!proprieteId || !objetId) return null;
      const label = nom || `Scénario ${LETTERS[scenarios.length] ?? scenarios.length + 1}`;
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .insert({
          propriete_id: proprieteId,
          objet_id: objetId,
          nom: label,
          plantings: plantings as any,
          created_by: auth?.user?.id ?? null,
        })
        .select('*')
        .single();
      if (error) {
        toast.error('Création impossible', { description: error.message });
        return null;
      }
      const row = { ...(data as any), plantings: (data as any).plantings ?? [] } as OuvrageScenario;
      setScenarios((p) => [...p, row]);
      setActiveId(row.id);
      return row;
    },
    [proprieteId, objetId, scenarios.length],
  );

  const patch = useCallback(
    async (id: string, patchValue: Partial<Pick<OuvrageScenario, 'nom' | 'notes' | 'plantings'>>) => {
      setScenarios((p) => p.map((s) => (s.id === id ? { ...s, ...(patchValue as any) } : s)));
      const { error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ ...(patchValue as any), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) toast.error('Enregistrement échoué', { description: error.message });
    },
    [],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('propriete_ouvrage_scenarios').delete().eq('id', id);
      if (error) {
        toast.error('Suppression impossible', { description: error.message });
        return;
      }
      setScenarios((p) => {
        const next = p.filter((s) => s.id !== id);
        setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
        return next;
      });
    },
    [],
  );

  /** Un seul scénario retenu par ouvrage (index unique côté base). */
  const setRetenu = useCallback(
    async (id: string) => {
      if (!objetId) return;
      await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ retenu: false })
        .eq('objet_id', objetId)
        .neq('id', id);
      const { error } = await supabase
        .from('propriete_ouvrage_scenarios')
        .update({ retenu: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error('Impossible de retenir ce scénario', { description: error.message });
        return;
      }
      setScenarios((p) => p.map((s) => ({ ...s, retenu: s.id === id })));
      toast.success('Scénario retenu pour le rapport');
    },
    [objetId],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const src = scenarios.find((s) => s.id === id);
      if (!src) return;
      await create(src.plantings, `${src.nom} (copie)`);
    },
    [scenarios, create],
  );

  return { scenarios, active, activeId, setActiveId, loading, create, patch, remove, setRetenu, duplicate, reload: load };
}
