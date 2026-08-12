import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  RoadmapEntry,
  RoadmapMedia,
  RoadmapSocialPost,
  RoadmapWeek,
} from '@/lib/roadmap/types';

const anyDb = supabase as any;

/* ------------------------------------------------------------------ lecture */

/** Semaines publiées (public) ou toutes (admin, `includeDrafts`). */
export function useRoadmapWeeks(includeDrafts = false) {
  return useQuery({
    queryKey: ['roadmap-weeks', includeDrafts],
    queryFn: async (): Promise<RoadmapWeek[]> => {
      let q = anyDb
        .from('roadmap_weeks')
        .select('*')
        .order('iso_year', { ascending: false })
        .order('iso_week', { ascending: false });
      if (!includeDrafts) q = q.eq('status', 'published');
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RoadmapWeek[];
    },
    staleTime: 60_000,
  });
}

/** Toutes les nouveautés visibles, avec leurs images, groupées par semaine. */
export function useRoadmapEntries(weekIds: string[]) {
  const key = [...weekIds].sort().join(',');
  return useQuery({
    queryKey: ['roadmap-entries', key],
    enabled: weekIds.length > 0,
    queryFn: async (): Promise<RoadmapEntry[]> => {
      const { data, error } = await anyDb
        .from('roadmap_entries')
        .select('*, roadmap_entry_media(position, roadmap_media(*))')
        .in('week_id', weekIds)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        audiences: row.audiences ?? [],
        medias: (row.roadmap_entry_media ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((l: any) => l.roadmap_media)
          .filter(Boolean) as RoadmapMedia[],
      })) as RoadmapEntry[];
    },
    staleTime: 60_000,
  });
}

/** Médiathèque roadmap. */
export function useRoadmapMedia() {
  return useQuery({
    queryKey: ['roadmap-media'],
    queryFn: async (): Promise<RoadmapMedia[]> => {
      const { data, error } = await anyDb
        .from('roadmap_media')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RoadmapMedia[];
    },
    staleTime: 30_000,
  });
}

export function useRoadmapSocialPosts(weekId?: string) {
  return useQuery({
    queryKey: ['roadmap-social', weekId],
    enabled: Boolean(weekId),
    queryFn: async (): Promise<RoadmapSocialPost[]> => {
      const { data, error } = await anyDb
        .from('roadmap_social_posts')
        .select('*')
        .eq('week_id', weekId!)
        .order('scheduled_for', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RoadmapSocialPost[];
    },
  });
}

/* ------------------------------------------------------------------ écriture */

export function useRoadmapAdmin() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roadmap-weeks'] });
    qc.invalidateQueries({ queryKey: ['roadmap-entries'] });
    qc.invalidateQueries({ queryKey: ['roadmap-media'] });
    qc.invalidateQueries({ queryKey: ['roadmap-social'] });
  };

  const upsertWeek = useMutation({
    mutationFn: async (week: Partial<RoadmapWeek>) => {
      const { data, error } = await anyDb
        .from('roadmap_weeks')
        .upsert(week, { onConflict: 'iso_year,iso_week' })
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapWeek;
    },
    onSuccess: invalidate,
  });

  const deleteWeek = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await anyDb.from('roadmap_weeks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveEntry = useMutation({
    mutationFn: async (entry: Partial<RoadmapEntry> & { week_id: string }) => {
      const { medias, ...payload } = entry as any;
      const { data, error } = await anyDb
        .from('roadmap_entries')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapEntry;
    },
    onSuccess: invalidate,
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await anyDb.from('roadmap_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Remplace la liste d'images liées à une nouveauté. */
  const setEntryMedia = useMutation({
    mutationFn: async (v: { entryId: string; mediaIds: string[] }) => {
      const { error: delErr } = await anyDb
        .from('roadmap_entry_media')
        .delete()
        .eq('entry_id', v.entryId);
      if (delErr) throw delErr;
      if (v.mediaIds.length === 0) return;
      const { error } = await anyDb.from('roadmap_entry_media').insert(
        v.mediaIds.map((media_id, i) => ({ entry_id: v.entryId, media_id, position: i })),
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Dépose un fichier dans le bucket public et enregistre la fiche média. */
  const uploadMedia = useMutation({
    mutationFn: async (v: { file: File | Blob; caption?: string; kind?: string; sourceRoute?: string }) => {
      const ext = (v.file as File).name?.split('.').pop() ?? 'png';
      const path = `roadmap/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('public-exports')
        .upload(path, v.file, { upsert: false, contentType: (v.file as File).type || 'image/png' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('public-exports').getPublicUrl(path);
      const { data, error } = await anyDb
        .from('roadmap_media')
        .insert({
          storage_path: path,
          public_url: pub.publicUrl,
          caption: v.caption ?? null,
          kind: v.kind ?? 'capture',
          source_route: v.sourceRoute ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RoadmapMedia;
    },
    onSuccess: invalidate,
  });

  const deleteMedia = useMutation({
    mutationFn: async (media: RoadmapMedia) => {
      await supabase.storage.from('public-exports').remove([media.storage_path]);
      const { error } = await anyDb.from('roadmap_media').delete().eq('id', media.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const saveSocialPosts = useMutation({
    mutationFn: async (v: { weekId: string; posts: Partial<RoadmapSocialPost>[] }) => {
      const { error: delErr } = await anyDb
        .from('roadmap_social_posts')
        .delete()
        .eq('week_id', v.weekId);
      if (delErr) throw delErr;
      if (v.posts.length === 0) return;
      const { error } = await anyDb
        .from('roadmap_social_posts')
        .insert(v.posts.map((p) => ({ ...p, week_id: v.weekId })));
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    upsertWeek,
    deleteWeek,
    saveEntry,
    deleteEntry,
    setEntryMedia,
    uploadMedia,
    deleteMedia,
    saveSocialPosts,
    invalidate,
  };
}
