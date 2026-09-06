import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

export interface CarnetRecipient {
  community_profile_id: string;
  nom: string | null;
  prenom: string | null;
  role: string | null;
  has_email: boolean;
}

export interface CarnetEnvoi {
  id: string;
  tour_id: string;
  sent_by_name: string | null;
  subject: string;
  recipients: { name: string; email_masked: string; ok: boolean }[];
  recipient_count: number;
  status: 'sent' | 'partial' | 'failed';
  created_at: string;
}

/** Marcheurs du jardin + participants des marches associées (jamais leurs emails). */
export function useCarnetRecipients(proprieteId: string | undefined, enabled: boolean) {
  return useQuery<CarnetRecipient[]>({
    queryKey: ['carnet-recipients', proprieteId],
    enabled: !!proprieteId && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_propriete_carnet_recipients', {
        p_propriete_id: proprieteId,
      });
      if (error) throw error;
      return (data ?? []) as CarnetRecipient[];
    },
  });
}

export function useCarnetEnvois(tourId: string | undefined) {
  return useQuery<CarnetEnvoi[]>({
    queryKey: ['carnet-envois', tourId],
    enabled: !!tourId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('propriete_carnet_envois')
        .select('id, tour_id, sent_by_name, subject, recipients, recipient_count, status, created_at')
        .eq('tour_id', tourId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CarnetEnvoi[];
    },
  });
}

async function messageErreurEnvoi(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return String(body.error);
    } catch {
      /* corps illisible */
    }
    const status = (error.context as Response)?.status;
    if (status === 401 || status === 403) return "Vous n'avez pas accès à ce jardin.";
    if (status === 502) return "L'envoi a échoué du côté du service d'emails. Réessayez dans un instant.";
    return "L'envoi n'a pas abouti.";
  }
  if (error instanceof FunctionsFetchError) {
    return "Le service d'envoi n'a pas répondu. Vérifiez votre connexion et réessayez.";
  }
  return error instanceof Error ? error.message : "L'envoi n'a pas abouti.";
}

export interface SendCarnetInput {
  tourId: string;
  proprieteId: string;
  subject: string;
  body: string;
  profileIds: string[];
  emails: string[];
  pdfBase64: string;
  pdfFilename: string;
  proprieteNom: string;
  tourTitre: string;
  dateTour: string;
  dureeMin?: number | null;
  saison?: string | null;
  gestes: string[];
}

export interface SendCarnetResult {
  status: 'sent' | 'partial';
  sent: number;
  failed: number;
  sansEmail: string[];
}

export function useSendCarnet() {
  const qc = useQueryClient();
  return useMutation<SendCarnetResult, Error, SendCarnetInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke('send-carnet-terrain', { body: input });
      if (error) throw new Error(await messageErreurEnvoi(error));
      return data as SendCarnetResult;
    },
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['carnet-envois', input.tourId] });
    },
  });
}
