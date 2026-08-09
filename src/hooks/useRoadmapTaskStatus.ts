import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkStatus } from '@/lib/partnerRoadmaps';

export type RoadmapStatusMap = Record<string, WorkStatus>;

const keyOf = (priorityCode: string, task: string) => `${priorityCode}::${task}`;

/**
 * État manuel (À faire / En cours / Fait) des chantiers d'une feuille de route.
 * Persisté en base : partagé entre la page publique et le panneau CRM.
 */
export function useRoadmapTaskStatus(slug?: string, date?: string) {
  const qc = useQueryClient();
  const queryKey = ['partner-roadmap-task-status', slug, date];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: Boolean(slug && date),
    queryFn: async (): Promise<RoadmapStatusMap> => {
      const { data, error } = await supabase
        .from('partner_roadmap_task_status')
        .select('priority_code, task_key, status')
        .eq('roadmap_slug', slug!)
        .eq('roadmap_date', date!);
      if (error) throw error;
      const map: RoadmapStatusMap = {};
      (data ?? []).forEach((r) => {
        map[keyOf(r.priority_code, r.task_key)] = r.status as WorkStatus;
      });
      return map;
    },
    staleTime: 30_000,
  });

  const statuses = useMemo(() => data ?? {}, [data]);

  const mutation = useMutation({
    mutationFn: async (v: { priorityCode: string; taskKey: string; status: WorkStatus }) => {
      const { error } = await supabase.from('partner_roadmap_task_status').upsert(
        {
          roadmap_slug: slug!,
          roadmap_date: date!,
          priority_code: v.priorityCode,
          task_key: v.taskKey,
          status: v.status,
        },
        { onConflict: 'roadmap_slug,roadmap_date,priority_code,task_key' },
      );
      if (error) throw error;
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<RoadmapStatusMap>(queryKey);
      qc.setQueryData<RoadmapStatusMap>(queryKey, {
        ...(prev ?? {}),
        [keyOf(v.priorityCode, v.taskKey)]: v.status,
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  /** Statut effectif : valeur en base sinon valeur d'origine du fichier de route. */
  const resolve = useCallback(
    (priorityCode: string, taskTitleKey: string, fallback: WorkStatus): WorkStatus =>
      statuses[keyOf(priorityCode, taskTitleKey)] ?? fallback,
    [statuses],
  );

  const setStatus = useCallback(
    (priorityCode: string, taskKey: string, status: WorkStatus) => {
      if (!slug || !date) return;
      mutation.mutate({ priorityCode, taskKey, status });
    },
    [mutation, slug, date],
  );

  return { statuses, resolve, setStatus, isLoading, isSaving: mutation.isPending, error: mutation.error };
}

export default useRoadmapTaskStatus;
