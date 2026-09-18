import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ParcoursUnivers = 'session' | 'marches' | 'jardin' | 'contribution' | 'assistant';

export interface ParcoursEvent {
  at: string;
  univers: ParcoursUnivers | string;
  kind: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  exploration_id: string | null;
  exploration_nom: string | null;
  marche_event_id: string | null;
  event_nom: string | null;
  propriete_id: string | null;
  propriete_nom: string | null;
}

export interface ParcoursProfile {
  id: string;
  user_id: string;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  slug: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ParcoursPayload {
  profile: ParcoursProfile | null;
  events: ParcoursEvent[];
  range: { from: string; to: string };
  generated_at: string;
}

function messageErreur(error: { message?: string; details?: string | null }) {
  const raw = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  if (raw.includes('not_admin')) return 'Accès réservé aux administrateurs.';
  if (raw.includes('jwt') || raw.includes('not_authenticated')) return 'Session expirée : reconnectez-vous.';
  return 'Impossible de charger le parcours de ce marcheur pour le moment.';
}

export function useMarcheurParcours(userId: string | null, days: number) {
  return useQuery({
    queryKey: ['marcheur-parcours', userId, days],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<ParcoursPayload> => {
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase.rpc('get_marcheur_parcours' as never, {
        _user_id: userId,
        _from: from.toISOString(),
        _to: to.toISOString(),
      } as never);
      if (error) throw new Error(messageErreur(error));
      const payload = (data ?? {}) as Partial<ParcoursPayload>;
      return {
        profile: payload.profile ?? null,
        events: payload.events ?? [],
        range: payload.range ?? { from: from.toISOString(), to: to.toISOString() },
        generated_at: payload.generated_at ?? new Date().toISOString(),
      };
    },
  });
}

export default useMarcheurParcours;
