import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Avant-première — tout ce qu'un marcheur peut regarder avant sa marche.
 *
 * Deux besoins :
 *  1. connaître son statut d'inscription (inscrit ? présence validée ?) ;
 *  2. remplir les écrans qui seraient vides (galerie d'anticipation).
 *
 * Aucune écriture : lecture seule, les RLS restent la garantie réelle.
 */

export interface ParticipationStatus {
  isRegistered: boolean;
  isValidated: boolean;
}

export const useParticipationStatus = (
  marcheEventId?: string | null,
  userId?: string | null,
) =>
  useQuery<ParticipationStatus>({
    queryKey: ['avant-premiere-participation', marcheEventId, userId],
    enabled: !!marcheEventId && !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_participations')
        .select('validated_at')
        .eq('marche_event_id', marcheEventId!)
        .eq('user_id', userId!)
        .maybeSingle();
      return {
        isRegistered: !!data,
        isValidated: !!data?.validated_at,
      };
    },
  });

export interface AnticipationPhoto {
  id: string;
  url: string;
  titre: string | null;
}

/**
 * Photos d'autres marches du même type — « Ailleurs, une marche du vivant ».
 * Sert uniquement quand la marche à venir n'a encore aucune image.
 */
export const useAnticipationPhotos = (
  eventType?: string | null,
  excludeExplorationId?: string | null,
  enabled = true,
) =>
  useQuery<AnticipationPhoto[]>({
    queryKey: ['avant-premiere-photos', eventType, excludeExplorationId],
    enabled: enabled && !!eventType,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: events } = await supabase
        .from('marche_events')
        .select('exploration_id')
        .eq('event_type', eventType as any)
        .not('exploration_id', 'is', null)
        .limit(30);

      const explorationIds = Array.from(
        new Set(
          (events ?? [])
            .map((e: any) => e.exploration_id as string)
            .filter((id) => id && id !== excludeExplorationId),
        ),
      ).slice(0, 10);
      if (!explorationIds.length) return [];

      const { data: links } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .in('exploration_id', explorationIds)
        .limit(60);

      const marcheIds = Array.from(
        new Set((links ?? []).map((l: any) => l.marche_id as string).filter(Boolean)),
      ).slice(0, 40);
      if (!marcheIds.length) return [];

      const { data: photos } = await supabase
        .from('marche_photos')
        .select('id, url_supabase, titre')
        .in('marche_id', marcheIds)
        .not('url_supabase', 'is', null)
        .order('created_at', { ascending: false })
        .limit(24);

      const seen = new Set<string>();
      const out: AnticipationPhoto[] = [];
      for (const p of (photos ?? []) as any[]) {
        if (!p.url_supabase || seen.has(p.url_supabase)) continue;
        seen.add(p.url_supabase);
        out.push({ id: p.id, url: p.url_supabase, titre: p.titre ?? null });
        if (out.length >= 6) break;
      }
      return out;
    },
  });
