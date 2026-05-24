import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeAlias } from '@/hooks/useMarcheurAliases';
import { buildCitizenIdentityResolver } from '@/utils/citizenIdentity';
import type { BiodiversitySpecies, BiodiversityObservation } from '@/types/biodiversity';

interface Params {
  /** crew id (exploration_marcheurs.id) si éditorial */
  crewId: string | null;
  /** user_id résolu (auth.users) si rattaché */
  resolvedUserId: string | null;
  /** alias normalisés du marcheur (NFD lowercase) */
  aliases: string[];
  /** ids des marches incluses dans l'exploration */
  explorationMarcheIds: string[];
  /** id exploration (pour clé de cache) */
  explorationId?: string;
}

export interface MarcheurAttributedSpeciesResult {
  /** Espèces attribuées à ce marcheur, format consommable par <SpeciesExplorer/> */
  species: BiodiversitySpecies[];
  /** Noms scientifiques (lowercase trim) pour lesquels ce marcheur a uploadé une photo perso (Supabase storage) */
  ownUploadedSciNames: Set<string>;
}

// Une URL est "vraie photo perso" UNIQUEMENT si hébergée sur le storage Supabase.
const isOwnPhotoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes('inaturalist.org') || u.includes('inaturalist-open-data')) return false;
  if (u.includes('.supabase.co/storage/') || u.includes('.supabase.in/storage/')) return true;
  if (u.includes('/storage/v1/object/')) return true;
  return false;
};

const keyOf = (sci: string) => sci.trim().toLowerCase();

const normalizeKingdom = (k: string | null | undefined): BiodiversitySpecies['kingdom'] => {
  if (k === 'Plantae' || k === 'Animalia' || k === 'Fungi') return k;
  return 'Other';
};

/**
 * Retourne les espèces attribuées à un marcheur (observations directes +
 * attributions iNat via alias) au format BiodiversitySpecies[], + le set des
 * espèces pour lesquelles CE marcheur a uploadé une photo perso.
 *
 * Volontairement pas de logique « primaryPhoto » ici : le rendu des photos
 * passe par SpeciesPhotoModeContext (toggle global Photos marcheurs ↔ iNat).
 */
export function useMarcheurAttributedSpecies({
  crewId,
  resolvedUserId,
  aliases,
  explorationMarcheIds,
  explorationId,
}: Params) {
  const aliasesKey = aliases.slice().sort().join('|');
  const marcheIdsKey = explorationMarcheIds.slice().sort().join(',');

  return useQuery({
    queryKey: [
      'marcheur-attributed-species',
      explorationId,
      crewId,
      resolvedUserId,
      aliasesKey,
      marcheIdsKey,
    ],
    enabled: !!explorationId && explorationMarcheIds.length > 0 && (!!crewId || aliases.length > 0),
    staleTime: 60_000,
    queryFn: async (): Promise<MarcheurAttributedSpeciesResult> => {
      const byKey = new Map<string, BiodiversitySpecies>();
      const ownUploadedSciNames = new Set<string>();

      // 0) Pool URLs perso uploadées par le marcheur (pour détecter ownUploaded par espèce)
      const ownMediaUrls = new Set<string>();
      if (crewId || resolvedUserId) {
        const orParts: string[] = [];
        if (resolvedUserId) orParts.push(`user_id.eq.${resolvedUserId}`);
        if (crewId) orParts.push(`attributed_marcheur_id.eq.${crewId}`);
        const { data: medias } = await supabase
          .from('marcheur_medias')
          .select('url_fichier, external_url')
          .eq('is_public', true)
          .eq('type_media', 'photo')
          .or(orParts.join(','));
        (medias || []).forEach((m: any) => {
          if (m.url_fichier && isOwnPhotoUrl(m.url_fichier)) ownMediaUrls.add(m.url_fichier);
          if (m.external_url && isOwnPhotoUrl(m.external_url)) ownMediaUrls.add(m.external_url);
        });
      }

      const upsert = (
        sci: string,
        patch: Partial<BiodiversitySpecies>,
        attribution?: BiodiversityObservation,
      ) => {
        const key = keyOf(sci);
        if (!key) return;
        const existing = byKey.get(key);
        if (existing) {
          if (!existing.commonName && patch.commonName) existing.commonName = patch.commonName;
          if (!existing.family && patch.family) existing.family = patch.family;
          if (patch.kingdom && (existing.kingdom === 'Other' || !existing.kingdom)) {
            existing.kingdom = patch.kingdom;
          }
          if (!existing.iconicTaxon && patch.iconicTaxon) existing.iconicTaxon = patch.iconicTaxon;
          if (!existing.photoData && patch.photoData) existing.photoData = patch.photoData;
          if (patch.photos?.length) {
            const merged = new Set([...(existing.photos || []), ...patch.photos]);
            existing.photos = Array.from(merged);
          }
          if (patch.lastSeen && (!existing.lastSeen || new Date(patch.lastSeen) > new Date(existing.lastSeen))) {
            existing.lastSeen = patch.lastSeen;
          }
          existing.observations += patch.observations || 0;
          if (attribution) existing.attributions.push(attribution);
        } else {
          byKey.set(key, {
            id: key,
            scientificName: sci.trim(),
            commonName: patch.commonName || '',
            family: patch.family || '',
            kingdom: patch.kingdom || 'Other',
            iconicTaxon: patch.iconicTaxon,
            observations: patch.observations || 1,
            lastSeen: patch.lastSeen || '',
            photos: patch.photos || [],
            photoData: patch.photoData,
            source: patch.source || 'inaturalist',
            attributions: attribution ? [attribution] : [],
          });
        }
      };

      // 1) marcheur_observations directes
      if (crewId) {
        const { data: ownObs } = await supabase
          .from('marcheur_observations')
          .select('species_scientific_name, species_common_name, kingdom, photo_url, observation_date')
          .eq('marcheur_id', crewId)
          .in('marche_id', explorationMarcheIds);

        (ownObs || []).forEach((o: any) => {
          const sci = (o.species_scientific_name || '').trim();
          if (!sci) return;
          const isOwn = isOwnPhotoUrl(o.photo_url);
          if (isOwn) ownUploadedSciNames.add(keyOf(sci));
          upsert(
            sci,
            {
              commonName: o.species_common_name || '',
              kingdom: normalizeKingdom(o.kingdom),
              lastSeen: o.observation_date || '',
              source: 'inaturalist',
              observations: 1,
              photos: o.photo_url ? [o.photo_url] : [],
              photoData: o.photo_url
                ? { url: o.photo_url, source: isOwn ? 'inaturalist' : 'inaturalist' }
                : undefined,
            },
            {
              date: o.observation_date || '',
              source: 'inaturalist',
            },
          );
        });
      }

      // 2) Snapshots iNat : attributions dont l'observerName ∈ alias
      if (aliases.length > 0) {
        const aliasSet = new Set(aliases);
        const { data: snaps } = await supabase
          .from('biodiversity_snapshots')
          .select('species_data')
          .in('marche_id', explorationMarcheIds);

        (snaps || []).forEach((snap: any) => {
          const list = snap.species_data as any[];
          if (!Array.isArray(list)) return;
          list.forEach((sp: any) => {
            const sci = (sp.scientificName || '').trim();
            if (!sci) return;
            const attrs: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
            const photosArr: string[] = Array.isArray(sp.photos) ? sp.photos : [];

            // Détecter une éventuelle photo perso liée dans le snapshot
            const matchedOwn = photosArr.find((u) => u && ownMediaUrls.has(u)) || null;
            if (matchedOwn) ownUploadedSciNames.add(keyOf(sci));

            attrs.forEach((attr: any) => {
              const observerNorm = normalizeAlias(attr.observerName || '');
              if (!aliasSet.has(observerNorm)) return;

              const inatPhoto = sp.photoData?.url || photosArr[0] || null;

              upsert(
                sci,
                {
                  commonName: sp.commonName || '',
                  family: sp.family || '',
                  kingdom: normalizeKingdom(sp.kingdom),
                  iconicTaxon: sp.iconicTaxon || sp.iconic_taxon_name,
                  lastSeen: attr.date || '',
                  source: (attr.source as any) || 'inaturalist',
                  observations: 1,
                  photos: inatPhoto ? [inatPhoto] : [],
                  photoData: inatPhoto
                    ? { url: inatPhoto, source: 'inaturalist' }
                    : undefined,
                },
                {
                  observerName: attr.observerName,
                  observerLogin: attr.observerLogin,
                  observerId: attr.observerId,
                  observerProfileUrl: attr.observerProfileUrl,
                  originalUrl: attr.originalUrl,
                  locationName: attr.locationName,
                  date: attr.date || '',
                  source: (attr.source as any) || 'inaturalist',
                },
              );
            });
          });
        });
      }

      return {
        species: Array.from(byKey.values()),
        ownUploadedSciNames,
      };
    },
  });
}
