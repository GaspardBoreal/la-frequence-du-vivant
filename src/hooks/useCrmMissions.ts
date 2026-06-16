import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type {
  CrmMission,
  CrmMissionAssignee,
  CrmMissionComment,
  CrmMissionActivity,
  CrmMissionStatus,
  CrmMissionPriority,
} from '@/types/crmMissions';

export interface MissionsFilters {
  assignee?: string | null;
  priorite?: CrmMissionPriority | null;
  search?: string;
  mine?: boolean;
}

export function useCrmMissions(filters: MissionsFilters = {}) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['crm-missions'],
    queryFn: async (): Promise<CrmMission[]> => {
      const { data: missions, error } = await (supabase as any)
        .from('crm_missions')
        .select('*')
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (missions ?? []).map((m: any) => m.id);
      let assignees: CrmMissionAssignee[] = [];
      if (ids.length) {
        const { data: aData } = await (supabase as any)
          .from('crm_mission_assignees')
          .select('*')
          .in('mission_id', ids);
        assignees = aData ?? [];
      }
      const byMission = new Map<string, CrmMissionAssignee[]>();
      for (const a of assignees) {
        const arr = byMission.get(a.mission_id) ?? [];
        arr.push(a);
        byMission.set(a.mission_id, arr);
      }
      return (missions ?? []).map((m: any) => ({ ...m, assignees: byMission.get(m.id) ?? [] }));
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel('crm-missions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_missions' }, () => {
        qc.invalidateQueries({ queryKey: ['crm-missions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_mission_assignees' }, () => {
        qc.invalidateQueries({ queryKey: ['crm-missions'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const filtered = (query.data ?? []).filter((m) => {
    if (filters.priorite && m.priorite !== filters.priorite) return false;
    if (filters.assignee && !(m.assignees ?? []).some(a => a.user_id === filters.assignee)) return false;
    if (filters.mine && user?.id && !(m.assignees ?? []).some(a => a.user_id === user.id)) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!m.titre.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const createMission = useMutation({
    mutationFn: async (payload: Partial<CrmMission> & { titre: string; assigneeIds?: string[] }) => {
      const { assigneeIds, ...rest } = payload;
      const insertRow: any = {
        titre: rest.titre,
        description_rich: rest.description_rich ?? null,
        statut: rest.statut ?? 'a_faire',
        priorite: rest.priorite ?? 'normale',
        due_at: rest.due_at ?? null,
        opportunity_id: rest.opportunity_id ?? null,
        company_id: rest.company_id ?? null,
        contact_id: rest.contact_id ?? null,
        marche_event_id: rest.marche_event_id ?? null,
        tags: rest.tags ?? [],
        created_by: user?.id ?? null,
      };
      const { data, error } = await (supabase as any).from('crm_missions').insert(insertRow).select('*').single();
      if (error) throw error;
      if (assigneeIds && assigneeIds.length) {
        await (supabase as any).from('crm_mission_assignees').insert(
          assigneeIds.map((uid, i) => ({ mission_id: data.id, user_id: uid, role: i === 0 ? 'owner' : 'collab' })),
        );
      }
      return data as CrmMission;
    },
    onSuccess: () => {
      toast.success('Mission créée');
      qc.invalidateQueries({ queryKey: ['crm-missions'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur création mission'),
  });

  const updateMission = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CrmMission> & { id: string }) => {
      const { error } = await (supabase as any).from('crm_missions').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-missions'] }),
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: CrmMissionStatus }) => {
      const { error } = await (supabase as any).from('crm_missions').update({ statut }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-missions'] }),
    onError: (e: any) => toast.error(e?.message || 'Erreur statut'),
  });

  const deleteMission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('crm_missions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mission supprimée');
      qc.invalidateQueries({ queryKey: ['crm-missions'] });
    },
  });

  const setAssignees = useMutation({
    mutationFn: async ({ missionId, userIds }: { missionId: string; userIds: string[] }) => {
      await (supabase as any).from('crm_mission_assignees').delete().eq('mission_id', missionId);
      if (userIds.length) {
        await (supabase as any).from('crm_mission_assignees').insert(
          userIds.map((uid, i) => ({ mission_id: missionId, user_id: uid, role: i === 0 ? 'owner' : 'collab' })),
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-missions'] }),
  });

  return {
    missions: filtered,
    allMissions: query.data ?? [],
    isLoading: query.isLoading,
    createMission,
    updateMission,
    updateStatus,
    deleteMission,
    setAssignees,
  };
}

export function useCrmMissionDetail(missionId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const comments = useQuery({
    queryKey: ['crm-mission-comments', missionId],
    enabled: !!missionId,
    queryFn: async (): Promise<CrmMissionComment[]> => {
      const { data, error } = await (supabase as any)
        .from('crm_mission_comments')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activity = useQuery({
    queryKey: ['crm-mission-activity', missionId],
    enabled: !!missionId,
    queryFn: async (): Promise<CrmMissionActivity[]> => {
      const { data, error } = await (supabase as any)
        .from('crm_mission_activity')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!missionId) return;
    const ch = supabase
      .channel(`crm-mission-${missionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_mission_comments', filter: `mission_id=eq.${missionId}` }, () => {
        qc.invalidateQueries({ queryKey: ['crm-mission-comments', missionId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_mission_activity', filter: `mission_id=eq.${missionId}` }, () => {
        qc.invalidateQueries({ queryKey: ['crm-mission-activity', missionId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [missionId, qc]);

  const addComment = useMutation({
    mutationFn: async (body_rich: any) => {
      if (!missionId || !user?.id) throw new Error('Non authentifié');
      const { error } = await (supabase as any)
        .from('crm_mission_comments')
        .insert({ mission_id: missionId, author_id: user.id, body_rich });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-mission-comments', missionId] }),
    onError: (e: any) => toast.error(e?.message || 'Erreur commentaire'),
  });

  return { comments: comments.data ?? [], activity: activity.data ?? [], addComment };
}
