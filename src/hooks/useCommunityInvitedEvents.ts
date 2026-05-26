import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvitedEventRow {
  invitation_row_id: string;
  event_id: string;
  invitation_id: string | null;
  added_by_user_id: string | null;
  promoted_to_participant_at: string | null;
  invited_by_prenom: string | null;
  invite_source: 'invitation' | 'manuel' | 'auto_new_signup';
  event: {
    id: string;
    title: string;
    description: string | null;
    date_marche: string;
    lieu: string | null;
    event_type: string | null;
    exploration_id: string | null;
    explorations: { name: string } | null;
  };
}


export const useCommunityInvitedEvents = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['community-invited-events', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<InvitedEventRow[]> => {
      if (!userId) return [];

      const { data: invs, error } = await supabase
        .from('event_invited_readers')
        .select(`
          id,
          event_id,
          invitation_id,
          added_by_user_id,
          promoted_to_participant_at,
          invite_source,
          marche_events!inner (
            id, title, description, date_marche, lieu, event_type,
            exploration_id, explorations(name)
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('useCommunityInvitedEvents error', error);
        return [];
      }

      const rows = (invs ?? []) as any[];
      if (rows.length === 0) return [];

      // Resolve inviter prénoms
      const invitationIds = rows.map(r => r.invitation_id).filter(Boolean) as string[];
      const inviterMap = new Map<string, string | null>();
      if (invitationIds.length > 0) {
        const { data: invRows } = await supabase
          .from('event_invitations')
          .select('id, invited_by_user_id')
          .in('id', invitationIds);
        (invRows ?? []).forEach((r: any) => inviterMap.set(r.id, r.invited_by_user_id ?? null));
      }

      const inviterIds = Array.from(new Set([
        ...rows.map(r => r.added_by_user_id).filter(Boolean) as string[],
        ...(Array.from(inviterMap.values()).filter(Boolean) as string[]),
      ]));
      const prenomMap = new Map<string, string | null>();
      if (inviterIds.length > 0) {
        const { data: profs } = await supabase
          .from('community_profiles')
          .select('user_id, prenom')
          .in('user_id', inviterIds);
        (profs ?? []).forEach((p: any) => prenomMap.set(p.user_id, p.prenom ?? null));
      }

      return rows.map(r => {
        const inviterId = r.invitation_id
          ? inviterMap.get(r.invitation_id) ?? null
          : (r.added_by_user_id ?? null);
        return {
          invitation_row_id: r.id,
          event_id: r.event_id,
          invitation_id: r.invitation_id ?? null,
          added_by_user_id: r.added_by_user_id ?? null,
          promoted_to_participant_at: r.promoted_to_participant_at ?? null,
          invited_by_prenom: inviterId ? prenomMap.get(inviterId) ?? null : null,
          invite_source: (r.invite_source as any) ?? (r.invitation_id ? 'invitation' : 'manuel'),
          event: r.marche_events,
        } as InvitedEventRow;
      });
    },
  });
};
