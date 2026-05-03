import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExplorationMarcheur } from './useExplorationMarcheurs';

export interface AttributionCandidate extends ExplorationMarcheur {
  /** Real auth user id when source='participant' (used by reattribute_media RPC). */
  userId?: string;
  source: 'editorial' | 'participant';
}

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

/**
 * Unified picker source: editorial marcheurs + every validated participant of
 * any marche of the exploration. Used by MediaAttributionSheet so curators can
 * credit a photo to anyone who actually walked, even if they don't yet have an
 * editorial card.
 */
export function useReattributionPicker(explorationId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['reattribution-picker', explorationId],
    enabled: !!explorationId && enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<AttributionCandidate[]> => {
      if (!explorationId) return [];

      const { data: editorial } = await supabase
        .from('exploration_marcheurs')
        .select('*')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: true });

      const { data: events } = await supabase
        .from('marche_events')
        .select('id')
        .eq('exploration_id', explorationId);
      const eventIds = (events || []).map(e => e.id);

      let participantsRows: { user_id: string }[] = [];
      if (eventIds.length > 0) {
        const { data: parts } = await supabase
          .from('marche_participations')
          .select('user_id')
          .in('marche_event_id', eventIds)
          .not('validated_at', 'is', null);
        participantsRows = parts || [];
      }
      const participantIds = Array.from(new Set(participantsRows.map(p => p.user_id)));

      let profiles: { user_id: string; prenom: string; nom: string; avatar_url: string | null }[] = [];
      if (participantIds.length > 0) {
        const { data } = await supabase
          .from('community_profiles')
          .select('user_id, prenom, nom, avatar_url')
          .in('user_id', participantIds);
        profiles = data || [];
      }
      const profileByUser = new Map(profiles.map(p => [p.user_id, p]));

      const editorialUserIds = new Set<string>(
        (editorial || []).map((e: any) => e.user_id).filter(Boolean),
      );

      const editorialMapped: AttributionCandidate[] = (editorial || []).map((m: any) => {
        const fullName = `${m.prenom} ${m.nom}`.trim();
        return {
          id: m.id,
          userId: m.user_id ?? undefined,
          nom: m.nom,
          prenom: m.prenom,
          fullName,
          role: (m.role || 'marcheur') as ExplorationMarcheur['role'],
          bioCoute: m.bio_courte || undefined,
          avatarUrl: m.avatar_url || undefined,
          couleur: m.couleur || colorFromName(fullName),
          isPrincipal: m.is_principal || false,
          ordre: m.ordre || 1,
          observationsCount: 0,
          speciesObserved: [],
          source: 'editorial',
        };
      });

      const participantMapped: AttributionCandidate[] = participantIds
        .filter(uid => !editorialUserIds.has(uid))
        .map(uid => {
          const p = profileByUser.get(uid);
          const prenom = p?.prenom || '';
          const nom = p?.nom || '';
          const fullName = `${prenom} ${nom}`.trim() || 'Marcheur·euse';
          return {
            id: `user:${uid}`,
            userId: uid,
            nom,
            prenom,
            fullName,
            role: 'marcheur',
            avatarUrl: p?.avatar_url || undefined,
            couleur: colorFromName(fullName),
            isPrincipal: false,
            ordre: 999,
            observationsCount: 0,
            speciesObserved: [],
            source: 'participant',
          } satisfies AttributionCandidate;
        });

      return [...editorialMapped, ...participantMapped];
    },
  });
}
