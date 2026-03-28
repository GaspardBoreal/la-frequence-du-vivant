import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ───
export interface MarcheurMedia {
  id: string;
  user_id: string;
  marche_event_id: string;
  type_media: 'photo' | 'video';
  url_fichier: string | null;
  external_url: string | null;
  titre: string | null;
  description: string | null;
  is_public: boolean;
  ordre: number | null;
  taille_octets: number | null;
  duree_secondes: number | null;
  created_at: string;
  updated_at: string;
}

export interface MarcheurAudio {
  id: string;
  user_id: string;
  marche_event_id: string;
  url_fichier: string;
  titre: string | null;
  description: string | null;
  is_public: boolean;
  ordre: number | null;
  taille_octets: number | null;
  duree_secondes: number | null;
  created_at: string;
  updated_at: string;
}

export interface MarcheurTexte {
  id: string;
  user_id: string;
  marche_event_id: string;
  type_texte: string;
  titre: string | null;
  contenu: string;
  is_public: boolean;
  ordre: number | null;
  created_at: string;
  updated_at: string;
}

type SortOrder = 'desc' | 'asc';

// ─── Upload helper ───
async function uploadFile(userId: string, file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  
  const { error } = await supabase.storage
    .from('marcheur-uploads')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('marcheur-uploads')
    .getPublicUrl(path);
  
  return publicUrl;
}

// ─── Medias (photos + vidéos) ───
export function useMarcheurMedias(marcheEventId: string, userId: string, sort: SortOrder = 'desc') {
  return useQuery({
    queryKey: ['marcheur-medias', marcheEventId, userId, sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_medias')
        .select('*')
        .eq('marche_event_id', marcheEventId)
        .order('created_at', { ascending: sort === 'asc' });
      if (error) throw error;
      return (data || []) as MarcheurMedia[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useUploadMedias(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, marcheEventId, isPublic, typeMedia }: {
      files: File[];
      marcheEventId: string;
      isPublic: boolean;
      typeMedia: 'photo' | 'video';
    }) => {
      const results: MarcheurMedia[] = [];
      for (const file of files) {
        const folder = typeMedia === 'photo' ? 'photos' : 'videos';
        const url = await uploadFile(userId, file, folder);
        
        const { data, error } = await supabase
          .from('marcheur_medias')
          .insert({
            user_id: userId,
            marche_event_id: marcheEventId,
            type_media: typeMedia,
            url_fichier: url,
            titre: file.name.replace(/\.[^.]+$/, ''),
            is_public: isPublic,
            taille_octets: file.size,
          })
          .select()
          .single();
        
        if (error) throw error;
        results.push(data as MarcheurMedia);
      }
      return results;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['marcheur-medias', vars.marcheEventId] });
      toast.success(`${vars.files.length} fichier(s) ajouté(s)`);
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

export function useAddExternalVideo(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ marcheEventId, externalUrl, titre, isPublic }: {
      marcheEventId: string;
      externalUrl: string;
      titre: string;
      isPublic: boolean;
    }) => {
      const { data, error } = await supabase
        .from('marcheur_medias')
        .insert({
          user_id: userId,
          marche_event_id: marcheEventId,
          type_media: 'video',
          external_url: externalUrl,
          titre,
          is_public: isPublic,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MarcheurMedia;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['marcheur-medias', vars.marcheEventId] });
      toast.success('Vidéo ajoutée');
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

// ─── Audio ───
export function useMarcheurAudio(marcheEventId: string, userId: string, sort: SortOrder = 'desc') {
  return useQuery({
    queryKey: ['marcheur-audio', marcheEventId, userId, sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_audio')
        .select('*')
        .eq('marche_event_id', marcheEventId)
        .order('created_at', { ascending: sort === 'asc' });
      if (error) throw error;
      return (data || []) as MarcheurAudio[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useUploadAudio(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, marcheEventId, isPublic }: {
      files: File[];
      marcheEventId: string;
      isPublic: boolean;
    }) => {
      const results: MarcheurAudio[] = [];
      for (const file of files) {
        const url = await uploadFile(userId, file, 'audio');
        
        const { data, error } = await supabase
          .from('marcheur_audio')
          .insert({
            user_id: userId,
            marche_event_id: marcheEventId,
            url_fichier: url,
            titre: file.name.replace(/\.[^.]+$/, ''),
            is_public: isPublic,
            taille_octets: file.size,
          })
          .select()
          .single();
        
        if (error) throw error;
        results.push(data as MarcheurAudio);
      }
      return results;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['marcheur-audio', vars.marcheEventId] });
      toast.success(`${vars.files.length} son(s) ajouté(s)`);
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

// ─── Textes ───
export function useMarcheurTextes(marcheEventId: string, userId: string, sort: SortOrder = 'desc') {
  return useQuery({
    queryKey: ['marcheur-textes', marcheEventId, userId, sort],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_textes')
        .select('*')
        .eq('marche_event_id', marcheEventId)
        .order('created_at', { ascending: sort === 'asc' });
      if (error) throw error;
      return (data || []) as MarcheurTexte[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useCreateTexte(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ marcheEventId, titre, contenu, typeTexte, isPublic }: {
      marcheEventId: string;
      titre: string;
      contenu: string;
      typeTexte: string;
      isPublic: boolean;
    }) => {
      const { data, error } = await supabase
        .from('marcheur_textes')
        .insert({
          user_id: userId,
          marche_event_id: marcheEventId,
          titre,
          contenu,
          type_texte: typeTexte,
          is_public: isPublic,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MarcheurTexte;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['marcheur-textes', vars.marcheEventId] });
      toast.success('Texte ajouté');
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

// ─── Generic update / delete ───
export function useUpdateContribution() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ table, id, updates }: {
      table: 'marcheur_medias' | 'marcheur_audio' | 'marcheur_textes';
      id: string;
      updates: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcheur-medias'] });
      qc.invalidateQueries({ queryKey: ['marcheur-audio'] });
      qc.invalidateQueries({ queryKey: ['marcheur-textes'] });
      toast.success('Mis à jour');
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

export function useDeleteContribution() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ table, id, storageUrl }: {
      table: 'marcheur_medias' | 'marcheur_audio' | 'marcheur_textes';
      id: string;
      storageUrl?: string;
    }) => {
      // Delete file from storage if needed
      if (storageUrl && storageUrl.includes('marcheur-uploads')) {
        const path = storageUrl.split('/marcheur-uploads/')[1];
        if (path) {
          await supabase.storage.from('marcheur-uploads').remove([decodeURIComponent(path)]);
        }
      }
      
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcheur-medias'] });
      qc.invalidateQueries({ queryKey: ['marcheur-audio'] });
      qc.invalidateQueries({ queryKey: ['marcheur-textes'] });
      toast.success('Supprimé');
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });
}

// ─── Stats ───
export function useMarcheurStats(marcheEventId: string, userId: string) {
  return useQuery({
    queryKey: ['marcheur-stats', marcheEventId, userId],
    queryFn: async () => {
      const [medias, audio, textes] = await Promise.all([
        supabase.from('marcheur_medias').select('id', { count: 'exact', head: true }).eq('marche_event_id', marcheEventId).eq('user_id', userId),
        supabase.from('marcheur_audio').select('id', { count: 'exact', head: true }).eq('marche_event_id', marcheEventId).eq('user_id', userId),
        supabase.from('marcheur_textes').select('id', { count: 'exact', head: true }).eq('marche_event_id', marcheEventId).eq('user_id', userId),
      ]);
      return {
        medias: medias.count || 0,
        audio: audio.count || 0,
        textes: textes.count || 0,
      };
    },
    enabled: !!marcheEventId && !!userId,
  });
}
