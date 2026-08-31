import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * L'Entretien fondateur : dépôt, récolte IA en cinq registres, validation
 * carte par carte. Rien n'entre dans la propriété sans un clic de la
 * propriétaire — les cartes acceptées deviennent la matière du jardin.
 */

export const REGISTRES = ['fait', 'geste', 'ligne_rouge', 'portrait', 'cap'] as const;
export type Registre = (typeof REGISTRES)[number];

export const REGISTRE_LABELS: Record<Registre, string> = {
  fait: 'Faits du lieu',
  geste: 'Gestes et pratiques',
  ligne_rouge: 'Lignes rouges',
  portrait: 'Comment vous accompagner',
  cap: 'Cap et intentions',
};

export const REGISTRE_HINTS: Record<Registre, string> = {
  fait: 'Ce que nous avons compris du lieu, en faits datés et chiffrés.',
  geste: 'Ce que vous faites déjà, et qui nourrit la palette du jardin.',
  ligne_rouge: "Ce que nous ne proposerons jamais sur ce jardin.",
  portrait: 'Votre façon d’avancer, pour ajuster notre accompagnement.',
  cap: 'Ce que vous visez dans les prochains mois.',
};

export type ExtraitStatut = 'propose' | 'accepte' | 'ecarte';

export interface EntretienExtrait {
  id: string;
  entretien_id: string;
  registre: Registre;
  titre: string;
  detail: string | null;
  verbatim: string | null;
  minutage: string | null;
  cible: string | null;
  statut: ExtraitStatut;
  ordre: number;
}

export interface Entretien {
  id: string;
  propriete_id: string;
  titre: string;
  tenu_le: string | null;
  source: string;
  duree_minutes: number | null;
  transcript: string | null;
  statut: string;
  consentement: boolean;
  harvested_at: string | null;
  created_at: string;
}

const db = supabase as unknown as {
  from: (t: string) => any;
};

export const useProprieteEntretiens = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-entretiens', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<Entretien[]> => {
      const { data, error } = await db
        .from('propriete_entretiens')
        .select('*')
        .eq('propriete_id', proprieteId)
        .order('tenu_le', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Entretien[];
    },
  });

export const useEntretienExtraits = (entretienId?: string) =>
  useQuery({
    queryKey: ['entretien-extraits', entretienId],
    enabled: !!entretienId,
    queryFn: async (): Promise<EntretienExtrait[]> => {
      const { data, error } = await db
        .from('propriete_entretien_extraits')
        .select('*')
        .eq('entretien_id', entretienId)
        .order('registre', { ascending: true })
        .order('ordre', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as EntretienExtrait[];
    },
  });

/** Toutes les lignes rouges acceptées de la propriété — garde-fou système. */
export const useProprieteLignesRouges = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-lignes-rouges', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<EntretienExtrait[]> => {
      const { data: entretiens, error: e1 } = await db
        .from('propriete_entretiens')
        .select('id')
        .eq('propriete_id', proprieteId);
      if (e1) throw new Error(e1.message);
      const ids = (entretiens ?? []).map((e: { id: string }) => e.id);
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from('propriete_entretien_extraits')
        .select('*')
        .in('entretien_id', ids)
        .eq('registre', 'ligne_rouge')
        .eq('statut', 'accepte');
      if (error) throw new Error(error.message);
      return (data ?? []) as EntretienExtrait[];
    },
  });

export interface CreateEntretienInput {
  titre: string;
  tenu_le: string | null;
  source: string;
  transcript: string;
  duree_minutes?: number | null;
  consentement: boolean;
}

export const useCreateEntretien = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<Entretien, Error, CreateEntretienInput>({
    mutationFn: async (input) => {
      if (!proprieteId) throw new Error('Jardin inconnu');
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await db
        .from('propriete_entretiens')
        .insert({ ...input, propriete_id: proprieteId, created_by: userData.user?.id ?? null })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Entretien;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-entretiens', proprieteId] }),
  });
};

export const useDeleteEntretien = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await db.from('propriete_entretiens').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propriete-entretiens', proprieteId] }),
  });
};

/** Lance la récolte IA (cinq registres) puis recharge les cartes. */
export const useHarvestEntretien = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<number, Error, { entretienId: string; registres?: Registre[] }>({
    mutationFn: async ({ entretienId, registres }) => {
      const { data, error } = await supabase.functions.invoke('entretien-harvest', {
        body: { entretienId, registres },
      });
      if (error) throw new Error(error.message);
      const payload = (data ?? {}) as { cartes?: number; error?: string };
      if (payload.error && !payload.cartes) throw new Error(payload.error);
      return payload.cartes ?? 0;
    },
    onSuccess: (_n, { entretienId }) => {
      qc.invalidateQueries({ queryKey: ['entretien-extraits', entretienId] });
      qc.invalidateQueries({ queryKey: ['propriete-entretiens', proprieteId] });
      qc.invalidateQueries({ queryKey: ['propriete-lignes-rouges', proprieteId] });
    },
  });
};

export interface UpdateExtraitInput {
  id: string;
  entretienId: string;
  patch: Partial<Pick<EntretienExtrait, 'titre' | 'detail' | 'statut'>>;
}

export const useUpdateExtrait = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, UpdateExtraitInput>({
    mutationFn: async ({ id, patch }) => {
      const { error } = await db.from('propriete_entretien_extraits').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_v, { entretienId }) => {
      qc.invalidateQueries({ queryKey: ['entretien-extraits', entretienId] });
      qc.invalidateQueries({ queryKey: ['propriete-lignes-rouges', proprieteId] });
    },
  });
};

/** Toutes les cartes acceptées de la propriété — matière de l'IA de Jardin. */
export const useProprieteEntretienAcquis = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-entretien-acquis', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<EntretienExtrait[]> => {
      const { data: entretiens, error: e1 } = await db
        .from('propriete_entretiens')
        .select('id')
        .eq('propriete_id', proprieteId);
      if (e1) throw new Error(e1.message);
      const ids = (entretiens ?? []).map((e: { id: string }) => e.id);
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from('propriete_entretien_extraits')
        .select('*')
        .in('entretien_id', ids)
        .eq('statut', 'accepte')
        .order('registre', { ascending: true })
        .order('ordre', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as EntretienExtrait[];
    },
  });
