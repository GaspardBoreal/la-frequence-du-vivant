import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface AiSuggestion {
  rank: number;
  taxon_scientific_name: string;
  taxon_common_name_fr: string | null;
  kingdom: string | null;
  confidence: number;
  ai_provider: string;
}

export interface AiCurationMedia {
  id: string;
  url_fichier: string | null;
  external_url: string | null;
  ai_status: string;
  ai_kingdom_hint: string | null;
  marche_id: string | null;
  metadata: any;
  lat: number | null;
  lng: number | null;
  topConfidence: number | null;
  topName: string | null;
  suggestions: AiSuggestion[];
}

export function useAiCurationMedias(eventId: string) {
  const qc = useQueryClient();
  const key = ['ai-curation-medias', eventId];

  const query = useQuery<AiCurationMedia[]>({
    queryKey: key,
    queryFn: async () => {
      const { data: ms } = await supabase
        .from('marcheur_medias')
        .select('id, url_fichier, external_url, ai_status, ai_kingdom_hint, marche_id, metadata')
        .eq('marche_event_id', eventId)
        .eq('type_media', 'photo')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!ms || ms.length === 0) return [];
      const ids = ms.map((m) => m.id);
      const { data: sugg } = await supabase
        .from('marcheur_photo_ai_suggestions')
        .select('media_id, rank, taxon_scientific_name, taxon_common_name_fr, kingdom, confidence, ai_provider')
        .in('media_id', ids)
        .order('rank');
      const byMedia: Record<string, AiSuggestion[]> = {};
      (sugg || []).forEach((s: any) => { (byMedia[s.media_id] ||= []).push(s); });
      return ms.map((m: any) => {
        const gps = m.metadata?.gps || {};
        const list = byMedia[m.id] || [];
        const top = list[0];
        return {
          ...m,
          lat: typeof gps.latitude === 'number' ? gps.latitude : null,
          lng: typeof gps.longitude === 'number' ? gps.longitude : null,
          topConfidence: top?.confidence ?? null,
          topName: top?.taxon_common_name_fr || top?.taxon_scientific_name || null,
          suggestions: list,
        } as AiCurationMedia;
      });
    },
  });

  // Realtime: refresh on any change to event medias
  useEffect(() => {
    if (!eventId) return;
    const ch = supabase
      .channel(`ai-curation-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marcheur_medias',
        filter: `marche_event_id=eq.${eventId}`,
      }, () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, qc]);

  return query;
}
