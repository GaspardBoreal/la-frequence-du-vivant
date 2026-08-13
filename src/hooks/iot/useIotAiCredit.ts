import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface IotAiCredit {
  enabled: boolean;
  /** -1 = illimité. */
  quota: number;
  used: number;
  /** -1 = illimité. */
  remaining: number;
  admin: boolean;
}

const EMPTY: IotAiCredit = { enabled: false, quota: 0, used: 0, remaining: 0, admin: false };

/**
 * Crédits d'IA de Jardin du compte connecté pour un fabricant de sondes.
 * Les administrateurs sont illimités ; un partenaire consomme un message par
 * réponse, dans la limite du quota mensuel accordé depuis sa fiche marcheur.
 */
export function useIotAiCredit(fournisseurId?: string | null) {
  return useQuery<IotAiCredit>({
    queryKey: ['iot-ai-credit', fournisseurId ?? 'none'],
    staleTime: 10_000,
    // La jauge suit la consommation sans dépendre d'un signal du chat.
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!fournisseurId) return EMPTY;
      const { data, error } = await db.rpc('get_iot_ai_credit', { _fournisseur_id: fournisseurId });
      if (error) throw error;
      return { ...EMPTY, ...(data ?? {}) } as IotAiCredit;
    },
  });
}

/** Rafraîchit la jauge après une réponse de l'IA. */
export function useRefreshIotAiCredit() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['iot-ai-credit'] });
}
