import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import heic2any from 'heic2any';

// ─── Types ───
export interface MarcheurMedia {
  id: string;
  user_id: string;
  marche_event_id: string;
  marche_id: string | null;
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
  marche_id: string | null;
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
  marche_id: string | null;
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
  let processedFile = file;

  // Convert HEIF/HEIC to JPEG for browser compatibility
  if (file.name.match(/\.(heif|heic)$/i) || file.type === 'image/heif' || file.type === 'image/heic') {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
    processedFile = new File(
      [jpegBlob],
      file.name.replace(/\.(heif|heic)$/i, '.jpeg'),
      { type: 'image/jpeg' }
    );
  }

  const ext = processedFile.name.split('.').pop() || 'bin';
  const path = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  
  const { error } = await supabase.storage
    .from('marcheur-uploads')
    .upload(path, processedFile, { cacheControl: '3600', upsert: false });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('marcheur-uploads')
    .getPublicUrl(path);
  
  return publicUrl;
}

// ─── Medias (photos + vidéos) ───
export function useMarcheurMedias(marcheEventId: string, userId: string, sort: SortOrder = 'desc', marcheId?: string) {
  return useQuery({
    queryKey: ['marcheur-medias', marcheEventId, userId, sort, marcheId],
    queryFn: async () => {
      let query = supabase
        .from('marcheur_medias')
        .select('*')
        .order('created_at', { ascending: sort === 'asc' });
      
      if (marcheId) {
        query = query.eq('marche_id', marcheId);
      } else {
        query = query.eq('marche_event_id', marcheEventId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarcheurMedia[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useUploadMedias(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, marcheEventId, isPublic, typeMedia, marcheId }: {
      files: File[];
      marcheEventId: string;
      isPublic: boolean;
      typeMedia: 'photo' | 'video';
      marcheId?: string;
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
            ...(marcheId ? { marche_id: marcheId } : {}),
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
    mutationFn: async ({ marcheEventId, externalUrl, titre, isPublic, marcheId }: {
      marcheEventId: string;
      externalUrl: string;
      titre: string;
      isPublic: boolean;
      marcheId?: string;
    }) => {
      const { data, error } = await supabase
        .from('marcheur_medias')
        .insert({
          user_id: userId,
          marche_event_id: marcheEventId,
          type_media: 'video' as const,
          external_url: externalUrl,
          titre,
          is_public: isPublic,
          ...(marcheId ? { marche_id: marcheId } : {}),
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
export function useMarcheurAudio(marcheEventId: string, userId: string, sort: SortOrder = 'desc', marcheId?: string) {
  return useQuery({
    queryKey: ['marcheur-audio', marcheEventId, userId, sort, marcheId],
    queryFn: async () => {
      let query = supabase
        .from('marcheur_audio')
        .select('*')
        .order('created_at', { ascending: sort === 'asc' });
      
      if (marcheId) {
        query = query.eq('marche_id', marcheId);
      } else {
        query = query.eq('marche_event_id', marcheEventId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarcheurAudio[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useUploadAudio(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, marcheEventId, isPublic, marcheId }: {
      files: File[];
      marcheEventId: string;
      isPublic: boolean;
      marcheId?: string;
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
            ...(marcheId ? { marche_id: marcheId } : {}),
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
export function useMarcheurTextes(marcheEventId: string, userId: string, sort: SortOrder = 'desc', marcheId?: string) {
  return useQuery({
    queryKey: ['marcheur-textes', marcheEventId, userId, sort, marcheId],
    queryFn: async () => {
      let query = supabase
        .from('marcheur_textes')
        .select('*')
        .order('created_at', { ascending: sort === 'asc' });
      
      if (marcheId) {
        query = query.eq('marche_id', marcheId);
      } else {
        query = query.eq('marche_event_id', marcheEventId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarcheurTexte[];
    },
    enabled: !!marcheEventId && !!userId,
  });
}

export function useCreateTexte(userId: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ marcheEventId, titre, contenu, typeTexte, isPublic, marcheId }: {
      marcheEventId: string;
      titre: string;
      contenu: string;
      typeTexte: string;
      isPublic: boolean;
      marcheId?: string;
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
          ...(marcheId ? { marche_id: marcheId } : {}),
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
export function useMarcheurStats(marcheEventId: string, userId: string, marcheId?: string) {
  return useQuery({
    queryKey: ['marcheur-stats', marcheEventId, userId, marcheId],
    queryFn: async () => {
      const filterCol = marcheId ? 'marche_id' : 'marche_event_id';
      const filterVal = marcheId || marcheEventId;
      
      const [myMedias, myAudio, myTextes, totalMedias, totalAudio, totalTextes] = await Promise.all([
        supabase.from('marcheur_medias').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).eq('user_id', userId),
        supabase.from('marcheur_audio').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).eq('user_id', userId),
        supabase.from('marcheur_textes').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).eq('user_id', userId),
        supabase.from('marcheur_medias').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).or(`user_id.eq.${userId},is_public.eq.true`),
        supabase.from('marcheur_audio').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).or(`user_id.eq.${userId},is_public.eq.true`),
        supabase.from('marcheur_textes').select('id', { count: 'exact', head: true }).eq(filterCol, filterVal).or(`user_id.eq.${userId},is_public.eq.true`),
      ]);
      return {
        medias: myMedias.count || 0,
        audio: myAudio.count || 0,
        textes: myTextes.count || 0,
        totalMedias: totalMedias.count || 0,
        totalAudio: totalAudio.count || 0,
        totalTextes: totalTextes.count || 0,
      };
    },
    enabled: !!marcheEventId && !!userId,
  });
}
