import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─────────────────────────── Types ─────────────────────────── */

export type TourStatut = 'recommande' | 'planifie' | 'en_cours' | 'fait' | 'non_retenu';
export type TourVolet = 'observer' | 'biodiversite' | 'resilience';

export interface ProprieteTour {
  id: string;
  propriete_id: string;
  created_by: string | null;
  titre: string;
  intention: string | null;
  date_tour: string;
  statut: TourStatut;
  duree_min: number | null;
  saison: string | null;
  points_forts: string[];
  potentiels: string[];
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TourAction {
  id: string;
  tour_id: string;
  titre: string;
  volet: TourVolet;
  detail: string | null;
  schema_key: string | null;
  moment: string | null;
  difficulte: number;
  done: boolean;
  done_at: string | null;
  order_index: number;
  source: string;
  created_at: string;
}

export const TOUR_STATUTS: { value: TourStatut; label: string }[] = [
  { value: 'recommande', label: 'Recommandé' },
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'fait', label: 'Fait' },
  { value: 'non_retenu', label: 'Non retenu' },
];

export const TOUR_VOLETS: { value: TourVolet; label: string }[] = [
  { value: 'observer', label: 'Observer' },
  { value: 'biodiversite', label: 'Développer la biodiversité' },
  { value: 'resilience', label: 'Renforcer la résilience' },
];

const toStringList = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : String(x?.label ?? x ?? ''))).filter(Boolean);
  return [];
};

const mapTour = (r: any): ProprieteTour => ({
  ...r,
  points_forts: toStringList(r.points_forts),
  potentiels: toStringList(r.potentiels),
});

const LIST_KEY = (id?: string) => ['propriete-tours', id];
const ACTIONS_KEY = (id?: string | null) => ['propriete-tour-actions', id];

/* ─────────────────────────── Liste ─────────────────────────── */

export function useProprieteTours(proprieteId?: string) {
  const qc = useQueryClient();

  const query = useQuery<ProprieteTour[]>({
    queryKey: LIST_KEY(proprieteId),
    enabled: !!proprieteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_tours')
        .select('*')
        .eq('propriete_id', proprieteId)
        .order('date_tour', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map(mapTour);
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: LIST_KEY(proprieteId) }),
    [qc, proprieteId],
  );

  const create = useCallback(
    async (input: {
      titre: string;
      date_tour: string;
      intention?: string | null;
      statut?: TourStatut;
      duree_min?: number | null;
      saison?: string | null;
    }) => {
      if (!proprieteId) return null;
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('propriete_tours')
        .insert({
          propriete_id: proprieteId,
          created_by: auth?.user?.id ?? null,
          titre: input.titre,
          date_tour: input.date_tour,
          intention: input.intention ?? null,
          statut: input.statut ?? 'planifie',
          duree_min: input.duree_min ?? null,
          saison: input.saison ?? null,
          source: 'manuel',
        })
        .select('*')
        .single();
      if (error) {
        toast.error("Impossible de créer ce tour de jardin");
        throw error;
      }
      await invalidate();
      toast.success('Tour de jardin créé');
      return mapTour(data);
    },
    [proprieteId, invalidate],
  );

  const update = useCallback(
    async (id: string, patch: Partial<ProprieteTour>) => {
      const { error } = await (supabase as any).from('propriete_tours').update(patch).eq('id', id);
      if (error) {
        toast.error('Modification impossible');
        throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from('propriete_tours').delete().eq('id', id);
      if (error) {
        toast.error('Suppression impossible');
        throw error;
      }
      await invalidate();
      toast.success('Tour supprimé');
    },
    [invalidate],
  );

  return { tours: query.data ?? [], isLoading: query.isLoading, create, update, remove, invalidate };
}

/* ─────────────────────────── Actions d'un tour ─────────────────────────── */

export function useTourActions(tourId?: string | null) {
  const qc = useQueryClient();

  const query = useQuery<TourAction[]>({
    queryKey: ACTIONS_KEY(tourId),
    enabled: !!tourId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_tour_actions')
        .select('*')
        .eq('tour_id', tourId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TourAction[];
    },
  });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ACTIONS_KEY(tourId) }),
    [qc, tourId],
  );

  const addAction = useCallback(
    async (input: Partial<TourAction> & { titre: string }) => {
      if (!tourId) return;
      const nextIndex = (query.data ?? []).reduce((m, a) => Math.max(m, a.order_index), -1) + 1;
      const { error } = await (supabase as any).from('propriete_tour_actions').insert({
        tour_id: tourId,
        titre: input.titre,
        volet: input.volet ?? 'observer',
        detail: input.detail ?? null,
        schema_key: input.schema_key ?? null,
        moment: input.moment ?? null,
        difficulte: input.difficulte ?? 1,
        order_index: nextIndex,
        source: 'manuel',
      });
      if (error) {
        toast.error("Impossible d'ajouter cette action");
        throw error;
      }
      await invalidate();
    },
    [tourId, query.data, invalidate],
  );

  const updateAction = useCallback(
    async (id: string, patch: Partial<TourAction>) => {
      const { error } = await (supabase as any).from('propriete_tour_actions').update(patch).eq('id', id);
      if (error) {
        toast.error('Modification impossible');
        throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const removeAction = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from('propriete_tour_actions').delete().eq('id', id);
      if (error) {
        toast.error('Suppression impossible');
        throw error;
      }
      await invalidate();
    },
    [invalidate],
  );

  const reorder = useCallback(
    async (ordered: TourAction[]) => {
      qc.setQueryData(ACTIONS_KEY(tourId), ordered);
      await Promise.all(
        ordered.map((a, i) =>
          (supabase as any).from('propriete_tour_actions').update({ order_index: i }).eq('id', a.id),
        ),
      );
      await invalidate();
    },
    [qc, tourId, invalidate],
  );

  return {
    actions: query.data ?? [],
    isLoading: query.isLoading,
    addAction,
    updateAction,
    removeAction,
    reorder,
    invalidate,
  };
}

/* ─────────────────────────── Génération IA ─────────────────────────── */

/**
 * Traduit une panne d'appel en phrase utile. Sans cela, toute erreur
 * s'affiche « Failed to send a request », qui ne dit rien à personne.
 */
async function messageErreurSuggestion(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status as number | undefined;
    let detail = '';
    try {
      const texte = await error.context.text();
      detail = JSON.parse(texte)?.error ?? '';
    } catch {
      /* corps illisible : on retombe sur le statut */
    }
    if (status === 404)
      return "L'IA de Jardin n'est pas encore en ligne sur ce serveur. Réessayez dans quelques minutes.";
    if (status === 401 || status === 403)
      return detail || "Vous n'avez pas accès à cette propriété.";
    if (status === 402) return detail || 'Crédits IA épuisés pour cet espace de travail.';
    if (status === 429)
      return detail || "L'IA de Jardin est très sollicitée. Réessayez dans un instant.";
    return detail || `L'IA de Jardin a répondu une erreur (${status ?? 'inconnue'}).`;
  }
  if (error instanceof FunctionsFetchError)
    return "Impossible de joindre l'IA de Jardin. Vérifiez votre connexion et réessayez.";
  return (error as Error)?.message || "L'IA de Jardin n'a pas pu répondre";
}

export function useSuggestTour(proprieteId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts?: { tourId?: string; mois?: number }) => {
      if (!proprieteId) throw new Error('Propriété inconnue');
      const { data, error } = await supabase.functions.invoke('propriete-tour-suggest', {
        body: { proprieteId, tourId: opts?.tourId ?? null, mois: opts?.mois ?? null },
      });
      if (error) throw new Error(await messageErreurSuggestion(error));

      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { tourId: string; actionsAdded: number };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: LIST_KEY(proprieteId) });
      qc.invalidateQueries({ queryKey: ACTIONS_KEY(res.tourId) });
      toast.success(`Proposition prête · ${res.actionsAdded} action(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
