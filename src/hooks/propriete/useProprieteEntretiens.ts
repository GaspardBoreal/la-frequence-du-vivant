import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * L'Entretien fondateur : dépôt, récolte IA en cinq registres, validation
 * carte par carte, puis **validation de l'entretien lui-même**.
 *
 * Un entretien validé est verrouillé en base : ses cartes deviennent la base de
 * connaissance du jardin (IA de Jardin, Tour de jardin, trois premiers gestes).
 * Toute correction passe par une révision tracée ; toute annulation par une
 * réouverture explicite.
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
  validated_at: string | null;
  validated_by: string | null;
  validated_with: string | null;
  reopened_at: string | null;
  reopened_by: string | null;
}

/** Un point officiellement acquis : issu d'un entretien validé, accepté carte par carte. */
export interface ConnaissanceItem {
  id: string;
  entretien_id: string;
  entretien_titre: string;
  registre: Registre;
  titre: string;
  detail: string | null;
  verbatim: string | null;
  minutage: string | null;
  validated_at: string | null;
  validated_with: string | null;
  ordre: number;
}

export interface ExtraitVersion {
  id: string;
  extrait_id: string;
  titre: string;
  detail: string | null;
  verbatim: string | null;
  statut: string;
  motif: string | null;
  revised_by: string | null;
  created_at: string;
}

export const isEntretienVerrouille = (e: Pick<Entretien, 'statut'>) => e.statut === 'valide';

const db = supabase as unknown as {
  from: (t: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

/** Traduit les erreurs remontées par les garde-fous de la base. */
const humanError = (message: string): string => {
  if (message.includes('ENTRETIEN_VALIDE')) {
    return "Cet entretien est validé et verrouillé. Utilisez « Corriger » pour une révision tracée, ou rouvrez-le.";
  }
  if (message.includes('NON_AUTORISE')) {
    return "Seuls la propriétaire du jardin et l'équipe Fréquence du Vivant peuvent valider un entretien.";
  }
  if (message.includes('CARTES_EN_ATTENTE')) {
    const n = message.split('CARTES_EN_ATTENTE:')[1]?.replace(/\D/g, '');
    return `Il reste ${n || 'des'} carte(s) à accepter ou à écarter avant de valider.`;
  }
  if (message.includes('AUCUNE_CARTE_ACCEPTEE')) return 'Aucune carte acceptée : rien à faire entrer dans le jardin.';
  if (message.includes('DEJA_VALIDE')) return 'Cet entretien est déjà validé.';
  if (message.includes('MOTIF_REQUIS')) return 'Indiquez le motif de la correction.';
  if (message.includes('TITRE_REQUIS')) return 'Le titre de la carte ne peut pas être vide.';
  return message;
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

/* ── Base de connaissance du jardin : source unique ──────────────────────── */

/**
 * Ne renvoie que les cartes acceptées d'entretiens **validés**. C'est la seule
 * porte d'entrée de l'entretien vers l'IA de Jardin, le Tour de jardin et les
 * trois premiers gestes : rien d'encore en relecture ne peut fuiter.
 */
export const useProprieteConnaissance = (proprieteId?: string) =>
  useQuery({
    queryKey: ['propriete-connaissance', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<ConnaissanceItem[]> => {
      const { data, error } = await db.rpc('get_propriete_connaissance', {
        _propriete_id: proprieteId,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as ConnaissanceItem[];
    },
  });

/** Lignes rouges validées — garde-fou système. */
export const useProprieteLignesRouges = (proprieteId?: string) => {
  const q = useProprieteConnaissance(proprieteId);
  return {
    ...q,
    data: (q.data ?? []).filter((c) => c.registre === 'ligne_rouge'),
  };
};

/** Tout l'acquis validé — matière de l'IA de Jardin et des gestes. */
export const useProprieteEntretienAcquis = (proprieteId?: string) => useProprieteConnaissance(proprieteId);

/* ── Dépôt, récolte, décisions carte par carte ───────────────────────────── */

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
      if (error) throw new Error(humanError(error.message));
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
      if (error) throw new Error(humanError(error.message));
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
      if (payload.error && !payload.cartes) throw new Error(humanError(payload.error));
      return payload.cartes ?? 0;
    },
    onSuccess: (_n, { entretienId }) => {
      qc.invalidateQueries({ queryKey: ['entretien-extraits', entretienId] });
      qc.invalidateQueries({ queryKey: ['propriete-entretiens', proprieteId] });
      qc.invalidateQueries({ queryKey: ['propriete-connaissance', proprieteId] });
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
      if (error) throw new Error(humanError(error.message));
    },
    onSuccess: (_v, { entretienId }) => {
      qc.invalidateQueries({ queryKey: ['entretien-extraits', entretienId] });
      qc.invalidateQueries({ queryKey: ['propriete-connaissance', proprieteId] });
    },
  });
};

/* ── Validation, révision tracée, réouverture ────────────────────────────── */

const invalidateAll = (qc: ReturnType<typeof useQueryClient>, proprieteId?: string, entretienId?: string) => {
  qc.invalidateQueries({ queryKey: ['propriete-entretiens', proprieteId] });
  qc.invalidateQueries({ queryKey: ['propriete-connaissance', proprieteId] });
  qc.invalidateQueries({ queryKey: ['propriete-intention', proprieteId] });
  if (entretienId) qc.invalidateQueries({ queryKey: ['entretien-extraits', entretienId] });
};

export const useValiderEntretien = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<number, Error, { entretienId: string; validatedWith?: string; tenuLe?: string | null }>({
    mutationFn: async ({ entretienId, validatedWith, tenuLe }) => {
      const { data, error } = await db.rpc('valider_entretien', {
        _entretien_id: entretienId,
        _validated_with: validatedWith?.trim() || null,
        _tenu_le: tenuLe || null,
      });
      if (error) throw new Error(humanError(error.message));
      return Number((data as { cartes?: number } | null)?.cartes ?? 0);
    },
    onSuccess: (_n, { entretienId }) => invalidateAll(qc, proprieteId, entretienId),
  });
};

export const useRouvrirEntretien = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, { entretienId: string; motif?: string }>({
    mutationFn: async ({ entretienId, motif }) => {
      const { error } = await db.rpc('rouvrir_entretien', {
        _entretien_id: entretienId,
        _motif: motif?.trim() || null,
      });
      if (error) throw new Error(humanError(error.message));
    },
    onSuccess: (_v, { entretienId }) => invalidateAll(qc, proprieteId, entretienId),
  });
};

export const useReviserExtrait = (proprieteId?: string) => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; entretienId: string; titre: string; detail: string; motif: string }>({
    mutationFn: async ({ id, titre, detail, motif }) => {
      const { error } = await db.rpc('reviser_extrait', {
        _extrait_id: id,
        _titre: titre,
        _detail: detail,
        _motif: motif,
      });
      if (error) throw new Error(humanError(error.message));
    },
    onSuccess: (_v, { id, entretienId }) => {
      invalidateAll(qc, proprieteId, entretienId);
      qc.invalidateQueries({ queryKey: ['extrait-versions', id] });
    },
  });
};

export const useExtraitVersions = (extraitId?: string, enabled = true) =>
  useQuery({
    queryKey: ['extrait-versions', extraitId],
    enabled: !!extraitId && enabled,
    queryFn: async (): Promise<ExtraitVersion[]> => {
      const { data, error } = await db
        .from('propriete_entretien_extrait_versions')
        .select('*')
        .eq('extrait_id', extraitId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ExtraitVersion[];
    },
  });
