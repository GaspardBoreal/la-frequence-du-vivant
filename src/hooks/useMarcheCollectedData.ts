import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarcheCollectedSummary {
  marche_event_id: string;
  kigo_count: number;
  kigo_text: string | null;
  photos_count: number;
  audio_count: number;
  textes_count: number;
  species_count: number;
}

/**
 * Fetches aggregated collected data for a list of marche_event_ids.
 * Returns counts of kigos, photos, audio, texts, and species per event.
 */
export const useMarcheCollectedData = (userId: string, marcheEventIds: string[]) => {
  return useQuery({
    queryKey: ['marche-collected-data', userId, marcheEventIds],
    queryFn: async (): Promise<Record<string, MarcheCollectedSummary>> => {
      if (marcheEventIds.length === 0) return {};

      // Fetch kigo entries for this user's marche events
      const { data: kigos } = await supabase
        .from('kigo_entries')
        .select('marche_event_id, kigo')
        .eq('user_id', userId)
        .in('marche_event_id', marcheEventIds);

      // Build summary map
      const summaries: Record<string, MarcheCollectedSummary> = {};
      
      for (const id of marcheEventIds) {
        const eventKigos = kigos?.filter(k => k.marche_event_id === id) || [];
        summaries[id] = {
          marche_event_id: id,
          kigo_count: eventKigos.length,
          kigo_text: eventKigos[0]?.kigo || null,
          photos_count: 0, // Will be enriched when marche_events links to marches
          audio_count: 0,
          textes_count: 0,
          species_count: 0,
        };
      }

      // Fetch marche_events with coordinates to match biodiversity_snapshots
      const { data: events } = await supabase
        .from('marche_events')
        .select('id, latitude, longitude, exploration_id')
        .in('id', marcheEventIds);

      if (events) {
        // Group events by exploration_id for aggregated species count
        const explorationIds = [...new Set(events.filter(e => e.exploration_id).map(e => e.exploration_id!))];
        
        if (explorationIds.length > 0) {
          // Fetch all marche_ids for these explorations
          const { data: explorationMarches } = await supabase
            .from('exploration_marches')
            .select('exploration_id, marche_id')
            .in('exploration_id', explorationIds);

          if (explorationMarches && explorationMarches.length > 0) {
            const allMarcheIds = [...new Set(explorationMarches.map(em => em.marche_id))];
            
            // Fetch biodiversity snapshots with species_data for deduplication
            const { data: snapshots } = await supabase
              .from('biodiversity_snapshots')
              .select('marche_id, species_data')
              .in('marche_id', allMarcheIds);

            if (snapshots) {
              // Calculate deduplicated species count per exploration
              const explorationSpeciesCounts: Record<string, number> = {};
              
              for (const explorationId of explorationIds) {
                const relatedMarcheIds = explorationMarches
                  .filter(em => em.exploration_id === explorationId)
                  .map(em => em.marche_id);
                
                const uniqueSpecies = new Map<string, boolean>();
                for (const snapshot of snapshots) {
                  if (!relatedMarcheIds.includes(snapshot.marche_id)) continue;
                  const speciesData = snapshot.species_data as any[];
                  if (Array.isArray(speciesData)) {
                    for (const sp of speciesData) {
                      const name = sp.scientificName || sp.scientific_name;
                      if (name) uniqueSpecies.set(name, true);
                    }
                  }
                }
                explorationSpeciesCounts[explorationId] = uniqueSpecies.size;
              }

              // Assign exploration-level count to all events in that exploration
              for (const event of events) {
                if (event.exploration_id && explorationSpeciesCounts[event.exploration_id] !== undefined && summaries[event.id]) {
                  summaries[event.id].species_count = explorationSpeciesCounts[event.exploration_id];
                }
              }
            }
          }
        }

        // Fallback: for events WITHOUT exploration_id, use GPS proximity
        const eventsWithoutExploration = events.filter(e => !e.exploration_id && e.latitude && e.longitude);
        
        if (eventsWithoutExploration.length > 0) {
          const { data: snapshots } = await supabase
            .from('biodiversity_snapshots')
            .select('latitude, longitude, total_species, marche_id');

          if (snapshots) {
            for (const event of eventsWithoutExploration) {
              const match = snapshots.find(s => {
                const dlat = Math.abs(Number(s.latitude) - Number(event.latitude!));
                const dlng = Math.abs(Number(s.longitude) - Number(event.longitude!));
                return dlat < 0.01 && dlng < 0.01;
              });
              if (match && summaries[event.id]) {
                summaries[event.id].species_count = match.total_species;
              }
            }
          }
        }

        // For events with exploration_id, fetch media counts via exploration_marches → marches
        const explorationIds = [...new Set(events.filter(e => e.exploration_id).map(e => e.exploration_id!))];
        
        if (explorationIds.length > 0) {
          const { data: explorationMarches } = await supabase
            .from('exploration_marches')
            .select('exploration_id, marche_id')
            .in('exploration_id', explorationIds);

          if (explorationMarches && explorationMarches.length > 0) {
            const marcheIds = [...new Set(explorationMarches.map(em => em.marche_id))];
            
            // Fetch counts in parallel
            const [photosRes, audioRes, textesRes] = await Promise.all([
              supabase.from('marche_photos').select('marche_id').in('marche_id', marcheIds),
              supabase.from('marche_audio').select('marche_id').in('marche_id', marcheIds),
              supabase.from('marche_textes').select('marche_id').in('marche_id', marcheIds),
            ]);

            // Map marche counts back to events
            for (const event of events) {
              if (!event.exploration_id || !summaries[event.id]) continue;
              const relatedMarcheIds = explorationMarches
                .filter(em => em.exploration_id === event.exploration_id)
                .map(em => em.marche_id);

              summaries[event.id].photos_count = photosRes.data?.filter(p => relatedMarcheIds.includes(p.marche_id)).length || 0;
              summaries[event.id].audio_count = audioRes.data?.filter(a => relatedMarcheIds.includes(a.marche_id)).length || 0;
              summaries[event.id].textes_count = textesRes.data?.filter(t => relatedMarcheIds.includes(t.marche_id)).length || 0;
            }
          }
        }
      }

      return summaries;
    },
    staleTime: 1000 * 60 * 5,
    enabled: marcheEventIds.length > 0,
  });
};
