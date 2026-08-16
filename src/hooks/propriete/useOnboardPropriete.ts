import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Onboarding d'un jardin — passe exclusivement par trois RPC SECURITY DEFINER
 * du projet central. Aucune écriture directe sur `proprietes` ou
 * `propriete_marcheurs` : les tables restent verrouillées par RLS.
 */

export interface OnboardProprieteResult {
  id: string;
  nom: string;
  slug: string;
}

export interface InvitationResult {
  code: string;
  role: string;
  expires_at: string;
}

export type InvitationRole = 'prestataire' | 'marcheur_historique';

export interface CreateProprieteInput {
  nom: string;
  ville?: string | null;
  codePostal?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const asResult = (data: unknown): OnboardProprieteResult => {
  const raw = (data ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    nom: String(raw.nom ?? ''),
    slug: String(raw.slug ?? ''),
  };
};

/** Crée un nouveau jardin dont l'utilisateur courant devient propriétaire. */
export const useCreatePropriete = () => {
  const qc = useQueryClient();
  return useMutation<OnboardProprieteResult, Error, CreateProprieteInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.rpc('onboard_create_propriete', {
        _nom: input.nom,
        _ville: input.ville ?? null,
        _code_postal: input.codePostal ?? null,
        _latitude: input.latitude ?? null,
        _longitude: input.longitude ?? null,
      });
      if (error) throw new Error(error.message);
      return asResult(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-apps-access'] });
    },
  });
};

/** Rejoint un jardin existant à l'aide d'un code d'invitation à 8 caractères. */
export const useJoinPropriete = () => {
  const qc = useQueryClient();
  return useMutation<OnboardProprieteResult, Error, string>({
    mutationFn: async (code) => {
      const { data, error } = await supabase.rpc('onboard_join_propriete', {
        _code: code.trim().toUpperCase(),
      });
      if (error) throw new Error(error.message);
      return asResult(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-apps-access'] });
    },
  });
};

/** Génère un code d'invitation — réservé au propriétaire du jardin (ou admin). */
export const useCreateInvitation = () => {
  return useMutation<InvitationResult, Error, { proprieteId: string; role: InvitationRole }>({
    mutationFn: async ({ proprieteId, role }) => {
      const { data, error } = await supabase.rpc('create_propriete_invitation', {
        _propriete_id: proprieteId,
        _role: role,
      });
      if (error) throw new Error(error.message);
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        code: String(raw.code ?? ''),
        role: String(raw.role ?? role),
        expires_at: String(raw.expires_at ?? ''),
      };
    },
  });
};
