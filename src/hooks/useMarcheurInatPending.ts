import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMarcheurInatProfile } from '@/hooks/useMarcheurInatProfile';

/**
 * « Le Seuil du Vivant » — lecture éphémère côté client des observations iNaturalist
 * d'un marcheur qui n'ont PAS encore franchi le seuil d'identification (Grade Recherche
 * avec nom scientifique) et qui ne sont donc pas ingérées dans `marcheur_observations`.
 *
 * IMPORTANT : ce hook NE modifie RIEN en base. Il ne fait que lire l'API publique iNat
 * et la table `marcheur_observations` (déjà filtrée par RLS) pour comparer. Aucune
 * persistance, aucun changement au pipeline de backfill.
 */

const INAT_PER_PAGE = 200;
const PENDING_RADIUS_M = 500;

export interface InatPendingObs {
  id: number;
  uri: string;
  photoUrl: string | null;
  observedOn: string | null;
  taxonName: string | null;
  taxonRank: string | null;
  commonName: string | null;
  qualityGrade: 'casual' | 'needs_id' | 'research' | string | null;
  /** Pourquoi cette obs n'a pas franchi le seuil (UX pédagogique) */
  status: 'no_taxon' | 'genus_or_higher' | 'needs_id' | 'casual';
  /** Lien direct vers l'écran « Identifier » d'iNat */
  identifyUrl: string;
  distanceM: number;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useMarcheurInatPending(params: {
  aliases: string[];
  explorationMarcheIds: string[];
  crewId: string | null;
  /** Compte iNat déjà rattaché manuellement (prioritaire sur la résolution par alias) */
  inatLoginOverride?: string | null;
}) {
  const { aliases, explorationMarcheIds, crewId, inatLoginOverride } = params;
  // Si un login iNat est déjà déclaré (table marcheurs_inat_accounts), on l'utilise directement.
  const { data: inatProfile, isLoading: profileLoading } = useMarcheurInatProfile(
    inatLoginOverride ? [] : aliases,
    inatLoginOverride ? [] : explorationMarcheIds,
  );
  const login = inatLoginOverride || inatProfile?.login || null;


  const query = useQuery({
    queryKey: [
      'marcheur-inat-pending',
      login,
      crewId,
      explorationMarcheIds.slice().sort().join('|'),
    ],
    enabled: !!login && explorationMarcheIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<{
      login: string;
      total: number;
      pending: InatPendingObs[];
      researchInRange: number;
    }> => {
      if (!login) return { login: '', total: 0, pending: [], researchInRange: 0 };

      // 1. Coords des marches de l'exploration
      const { data: marches } = await supabase
        .from('marches')
        .select('id, latitude, longitude')
        .in('id', explorationMarcheIds);

      const marcheCoords = (marches || [])
        .map((m: any) => ({
          lat: Number(m.latitude),
          lng: Number(m.longitude),
        }))
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

      if (marcheCoords.length === 0) {
        return { login, total: 0, pending: [], researchInRange: 0 };
      }

      // 2. IDs iNat déjà ingérés pour ce marcheur (à exclure)
      const ingestedIds = new Set<number>();
      if (crewId) {
        const { data: ingested } = await supabase
          .from('marcheur_observations')
          .select('inaturalist_observation_id')
          .eq('marcheur_id', crewId)
          .not('inaturalist_observation_id', 'is', null);
        for (const row of ingested || []) {
          const id = (row as any).inaturalist_observation_id;
          if (id != null) ingestedIds.add(Number(id));
        }
      }

      // 3. Fetch iNat — toutes obs du login (page 1, suffisant pour démarrer)
      const url = new URL('https://api.inaturalist.org/v1/observations');
      url.searchParams.set('user_login', login);
      url.searchParams.set('per_page', String(INAT_PER_PAGE));
      url.searchParams.set('order_by', 'observed_on');
      url.searchParams.set('order', 'desc');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`iNat API ${res.status}`);
      const json = await res.json();
      const results: any[] = Array.isArray(json?.results) ? json.results : [];

      let researchInRange = 0;
      const pending: InatPendingObs[] = [];

      for (const obs of results) {
        const lat = Number(obs?.geojson?.coordinates?.[1] ?? obs?.latitude);
        const lng = Number(obs?.geojson?.coordinates?.[0] ?? obs?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        // Filtre rayon : au moins une marche à <= 500m
        let minDist = Infinity;
        for (const c of marcheCoords) {
          const d = haversineM(lat, lng, c.lat, c.lng);
          if (d < minDist) minDist = d;
        }
        if (minDist > PENDING_RADIUS_M) continue;

        const qg = obs?.quality_grade as string | undefined;
        const taxon = obs?.taxon;
        const sciName: string | null = taxon?.name || null;
        const rank: string | null = taxon?.rank || null;
        const isResearchGradeSpecies =
          qg === 'research' && sciName && (rank === 'species' || rank === 'subspecies' || rank === 'variety');

        if (isResearchGradeSpecies) {
          researchInRange += 1;
          continue;
        }

        // Cette obs n'a pas franchi le seuil — on l'expose si pas déjà ingérée
        if (ingestedIds.has(Number(obs.id))) continue;

        let status: InatPendingObs['status'];
        if (!taxon) status = 'no_taxon';
        else if (qg === 'casual') status = 'casual';
        else if (rank && rank !== 'species' && rank !== 'subspecies' && rank !== 'variety') status = 'genus_or_higher';
        else status = 'needs_id';

        const photo =
          obs?.photos?.[0]?.url?.replace('square', 'small') ||
          obs?.observation_photos?.[0]?.photo?.url?.replace('square', 'small') ||
          null;

        pending.push({
          id: Number(obs.id),
          uri: `https://www.inaturalist.org/observations/${obs.id}`,
          identifyUrl: `https://www.inaturalist.org/observations/identify?reviewed=any&id=${obs.id}`,
          photoUrl: photo,
          observedOn: obs?.observed_on || obs?.time_observed_at || null,
          taxonName: sciName,
          taxonRank: rank,
          commonName: taxon?.preferred_common_name || null,
          qualityGrade: (qg as any) || null,
          status,
          distanceM: Math.round(minDist),
        });
      }

      return {
        login,
        total: results.length,
        pending,
        researchInRange,
      };
    },
  });

  return {
    ...query,
    hasInatLogin: !!login,
    inatLogin: login,
    inatProfileResolving: !inatLoginOverride && profileLoading,
  };
}

