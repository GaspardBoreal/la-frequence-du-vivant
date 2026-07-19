import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getMergedGenusFor } from '@/utils/taxonomyMerge';
import { normalizeAliasKey } from './useTaxonomyAliases';

export type ObserverSource = 'inaturalist' | 'gbif' | 'ebird' | 'other';

export interface SpeciesObserver {
  /** Identifiant stable pour le rendu (source + url ou index) */
  id: string;
  /** Nom de l'observateur tel que publié par la source citoyenne */
  observerName: string;
  /** Institution / plateforme citoyenne (iNaturalist Community, eBird/Cornell Lab, GBIF…) */
  observerInstitution?: string;
  source: ObserverSource;
  /** Lien direct vers l'observation publique source */
  originalUrl?: string;
  observationDate?: string;
  locationName?: string;
  /** Marche de l'exploration sur laquelle l'attribution a été agrégée */
  marcheId?: string;
  marcheName?: string;
  ville?: string;
  /** Méthode renseignée par la source (Observation, Observation validée…) */
  method?: string;
}

const detectSource = (raw?: string): ObserverSource => {
  const s = (raw || '').toLowerCase();
  if (s.includes('inat')) return 'inaturalist';
  if (s.includes('ebird')) return 'ebird';
  if (s.includes('gbif')) return 'gbif';
  return 'other';
};

/**
 * Liste des **observateurs citoyens** ayant rapporté une espèce dans le périmètre
 * d'une exploration. Source : `biodiversity_snapshots.species_data[].attributions[]`
 * (iNaturalist, eBird, GBIF). Ce ne sont **pas** les marcheurs de la communauté —
 * ce sont les contributeurs des plateformes naturalistes citoyennes dont les
 * observations alimentent la curation scientifique de la vue Apprendre → L'Œil.
 *
 * Sécurité : aucune donnée PII utilisateur n'est exposée — uniquement les noms
 * publics rendus publics par les contributeurs sur leur plateforme respective.
 */
export function useSpeciesObservers(
  scientificName: string | undefined,
  explorationId: string | undefined,
) {
  return useQuery({
    queryKey: ['species-observers-citizen', scientificName, explorationId],
    queryFn: async (): Promise<SpeciesObserver[]> => {
      if (!scientificName || !explorationId) return [];

      // 1. Marches de l'exploration
      const { data: em } = await supabase
        .from('exploration_marches')
        .select('marche_id, marches (id, nom_marche, ville)')
        .eq('exploration_id', explorationId);
      const marcheIds = (em || []).map((x: any) => x.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const marcheInfoMap = new Map<string, { name: string; ville: string }>();
      (em || []).forEach((row: any) => {
        if (row.marches) {
          marcheInfoMap.set(row.marche_id, {
            name: row.marches.nom_marche || row.marches.ville || '',
            ville: row.marches.ville || '',
          });
        }
      });

      // 2. Snapshots biodiversité associés
      const { data: snaps } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data')
        .in('marche_id', marcheIds);
      if (!snaps || snaps.length === 0) return [];

      // Pool de tous les scientificName de l'exploration → utilisé pour décider
      // si on peut absorber les attributions au rang « genre seul » dans la fiche.
      const poolSci = new Set<string>();
      snaps.forEach((snap: any) => {
        const arr: any[] = Array.isArray(snap.species_data) ? snap.species_data : [];
        arr.forEach((sp) => {
          const s = (sp.scientificName || sp.scientific_name || '').toString().trim();
          if (s) poolSci.add(s);
        });
      });
      const mergedGenus = getMergedGenusFor(scientificName, Array.from(poolSci));
      const target = scientificName.toLowerCase().trim();
      const targetGenus = mergedGenus ? mergedGenus.toLowerCase().trim() : null;
      const out: SpeciesObserver[] = [];
      const seen = new Set<string>();

      snaps.forEach((snap: any) => {
        const arr: any[] = Array.isArray(snap.species_data) ? snap.species_data : [];
        arr.forEach((sp) => {
          const sci = (sp.scientificName || sp.scientific_name || '').toString().toLowerCase().trim();
          if (sci !== target && sci !== targetGenus) return;
          const attribs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
          const mi = marcheInfoMap.get(snap.marche_id);
          attribs.forEach((a, idx) => {
            const observerName = (a.observerName || '').toString().trim();
            if (!observerName) return;
            const source = detectSource(a.source);
            // Déduplication : même observateur + même URL d'observation
            const dedupKey = `${observerName}|${a.originalUrl || `${snap.marche_id}-${idx}`}`;
            if (seen.has(dedupKey)) return;
            seen.add(dedupKey);
            out.push({
              id: dedupKey,
              observerName,
              observerInstitution: a.observerInstitution || undefined,
              source,
              originalUrl: a.originalUrl || undefined,
              observationDate: a.date || undefined,
              locationName: a.locationName || undefined,
              method: a.observationMethod || undefined,
              marcheId: snap.marche_id,
              marcheName: mi?.name,
              ville: mi?.ville,
            });
          });
        });
      });

      // Tri : date desc, puis nom
      out.sort((a, b) => {
        const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        if (db !== da) return db - da;
        return a.observerName.localeCompare(b.observerName);
      });
      return out;
    },
    enabled: !!scientificName && !!explorationId,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
