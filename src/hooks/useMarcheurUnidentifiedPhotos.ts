import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Candidate photo for an iNaturalist upload : photo perso d'un marcheur
 * qui n'est PAS encore rattachée à une espèce identifiée.
 *
 * Sources :
 *  - marcheur_medias (type_media = 'photo', is_public)
 *      → uploadées par le marcheur (user_id) OU ré-attribuées à sa carte
 *        éditoriale (attributed_marcheur_id).
 *  - marcheur_observations (photo_url) sans species_scientific_name
 *
 * Filtrage : on exclut les URLs présentes dans le pool d'espèces
 * « déjà identifiées » du marcheur (passé en input), pour ne garder que
 * les vraies candidates à identifier sur iNaturalist.
 *
 * GPS / date : lus depuis le JSONB `metadata` (schema mediaMetadata) si
 * présent, sinon fallback côté UI sur les coordonnées + date_marche de
 * la marche d'origine.
 */

export interface UnidentifiedPhotoCandidate {
  id: string;
  source: 'media' | 'observation';
  url: string;
  marcheEventId: string;
  createdAt: string;
  /** GPS extrait du metadata EXIF du media (null si absent) */
  gps: { latitude: number; longitude: number; source?: string } | null;
  /** Date de prise de vue (EXIF), ISO UTC, null si absent */
  dateTaken: string | null;
  /** Nom de fichier original (depuis metadata.file.original_name) */
  originalName: string | null;
}

interface Params {
  /** crew id (exploration_marcheurs.id) si éditorial */
  crewId: string | null;
  /** user_id résolu (auth.users) si rattaché */
  resolvedUserId: string | null;
  /** ids des marches (table legacy `marches`) incluses dans l'exploration —
   *  utilisés pour `marcheur_observations.marche_id`. */
  explorationMarcheIds: string[];
  /** ids des `marche_events` de l'exploration — utilisés pour
   *  `marcheur_medias.marche_event_id` (référentiel distinct des marches). */
  explorationEventIds: string[];
  /** Set d'URLs déjà identifiées (à exclure) — typiquement reconstruit
   *  depuis useMarcheurAttributedSpecies (toutes les `photos[]` du pool). */
  identifiedPhotoUrls: Set<string>;
  /** id exploration (pour clé de cache) */
  explorationId?: string;
  /** Activer le fetch */
  enabled?: boolean;
}

const isOwnPhotoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes('inaturalist.org') || u.includes('inaturalist-open-data')) return false;
  return true; // Storage Supabase OU autre upload perso (jamais iNat)
};

export function useMarcheurUnidentifiedPhotos({
  crewId,
  resolvedUserId,
  explorationMarcheIds,
  explorationEventIds,
  identifiedPhotoUrls,
  explorationId,
  enabled = true,
}: Params) {
  const identifiedKey = Array.from(identifiedPhotoUrls).sort().join('|').slice(0, 200);
  const marcheIdsKey = explorationMarcheIds.slice().sort().join(',');
  const eventIdsKey = explorationEventIds.slice().sort().join(',');

  return useQuery({
    queryKey: [
      'marcheur-unidentified-photos',
      explorationId,
      crewId,
      resolvedUserId,
      marcheIdsKey,
      eventIdsKey,
      identifiedKey,
    ],
    enabled:
      enabled &&
      !!explorationId &&
      (explorationMarcheIds.length > 0 || explorationEventIds.length > 0) &&
      (!!crewId || !!resolvedUserId),
    staleTime: 30_000,
    queryFn: async (): Promise<UnidentifiedPhotoCandidate[]> => {
      const out: UnidentifiedPhotoCandidate[] = [];
      const seenUrls = new Set<string>(identifiedPhotoUrls);

      // 1) marcheur_medias photos perso — filtrées sur marche_events.id
      const orParts: string[] = [];
      if (resolvedUserId) orParts.push(`user_id.eq.${resolvedUserId}`);
      if (crewId) orParts.push(`attributed_marcheur_id.eq.${crewId}`);

      if (orParts.length > 0 && explorationEventIds.length > 0) {
        const { data: medias, error } = await supabase
          .from('marcheur_medias')
          .select('id, url_fichier, external_url, marche_event_id, marche_id, created_at, metadata')
          .eq('type_media', 'photo')
          .eq('is_public', true)
          .in('marche_event_id', explorationEventIds)
          .or(orParts.join(','));

        if (error) throw error;

        (medias || []).forEach((m: any) => {
          const url = m.url_fichier || m.external_url;
          if (!url || !isOwnPhotoUrl(url)) return;
          if (seenUrls.has(url)) return;
          seenUrls.add(url);
          const meta = (m.metadata && typeof m.metadata === 'object') ? m.metadata : null;
          const gps = meta?.gps && typeof meta.gps.latitude === 'number' && typeof meta.gps.longitude === 'number'
            ? { latitude: meta.gps.latitude, longitude: meta.gps.longitude, source: meta.gps.source }
            : null;
          out.push({
            id: `media-${m.id}`,
            source: 'media',
            url,
            marcheEventId: m.marche_event_id,
            createdAt: m.created_at,
            gps,
            dateTaken: meta?.date_taken || null,
            originalName: meta?.file?.original_name || null,
          });
        });
      }

      // 2) marcheur_observations sans espèce identifiée
      if (crewId) {
        const { data: obs } = await supabase
          .from('marcheur_observations')
          .select('id, photo_url, marche_id, observation_date, species_scientific_name')
          .eq('marcheur_id', crewId)
          .in('marche_id', explorationMarcheIds);

        (obs || []).forEach((o: any) => {
          const url = o.photo_url;
          if (!url || !isOwnPhotoUrl(url)) return;
          if (seenUrls.has(url)) return;
          if (o.species_scientific_name && o.species_scientific_name.trim() !== '') return;
          seenUrls.add(url);
          out.push({
            id: `obs-${o.id}`,
            source: 'observation',
            url,
            marcheEventId: o.marche_id,
            createdAt: o.observation_date || new Date().toISOString(),
            gps: null,
            dateTaken: o.observation_date || null,
            originalName: null,
          });
        });
      }

      return out;
    },
  });
}
