import { useCallback, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFrenchSpeciesNames } from '@/hooks/useFrenchSpeciesNames';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { MarcheurSpeciesPhoto } from '@/hooks/useSpeciesMarcheurPhotos';
import { normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';
import {
  useGpsOverrides,
  overrideKeyOf,
  inatIdOf,
  type GpsOverride,
  type GpsOverrideKind,
  type GpsOverrideStatus,
} from '@/hooks/propriete/useGpsOverrides';
import { useVivantScopeFor } from '@/contexts/ProprieteVivantScopeContext';
import { resolvePeriodRange } from '@/hooks/useBiodiversityEvolution';
import { isInsideGeofence } from '@/lib/geofence';


interface RpcSpecies {
  key: string;
  scientific_name: string | null;
  common_name: string | null;
  kingdom: string | null;
  family: string | null;
  iconic_taxon: string | null;
  observations: number;
  last_seen: string | null;
  photos: any;
  attributions: any;
  marcheur_attrs: any;
}

/** Synthèse des corrections GPS appliquées côté base par la RPC. */
interface RpcCuration {
  excluded_observations?: number;
  repositioned_observations?: number;
  validated_observations?: number;
  excluded_attributions?: number;
}

const toMediumInat = (url: string): string =>
  url ? url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg') : url;

export interface PropertyWaypoint {
  id: string;
  lat: number;
  lng: number;
  scientificName: string;
  commonName: string | null;
  kingdom: string | null;
  photoUrl: string | null;
  observationDate: string | null;
  marcheurId: string | null;
  marcheId: string | null;
  /** Provenance de la position : terrain marcheur ou base iNaturalist/eBird */
  source: 'marcheur' | 'inaturalist';
  observerName: string | null;
  /** Cible de curation GPS (surcouche éditoriale durable) */
  overrideKind?: GpsOverrideKind;
  overrideTargetKey?: string | null;
  overrideStatus?: GpsOverrideStatus | null;
  overrideReason?: string | null;
  originalLat?: number | null;
  originalLng?: number | null;
  /** Métadonnées de fiabilité iNaturalist */
  inatObservationId?: string | null;
  positionalAccuracy?: number | null;
  obscured?: boolean | null;
  gpsSource?: string | null;
  originalUrl?: string | null;
}


const normName = (s: string | null | undefined): string =>

  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolvePhotos = (sp: RpcSpecies): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u?: string | null) => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  // 1. Photos marcheurs (prioritaires), triées par date desc
  const mAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
  const sortedMarcheur = mAttrs
    .filter((a) => a?.photo_url)
    .sort((a, b) => (b.observation_date || '').localeCompare(a.observation_date || ''));
  for (const a of sortedMarcheur) push(a.photo_url);
  // 2. Fallback iNat
  const groups: any[] = Array.isArray(sp.photos) ? sp.photos : [];
  for (const g of groups) {
    if (Array.isArray(g)) for (const u of g) push(toMediumInat(u));
  }
  return out;
};

const mapKingdom = (k?: string | null): BiodiversitySpecies['kingdom'] => {
  const s = (k || '').toLowerCase();
  if (s.includes('plant')) return 'Plantae';
  if (s.includes('fungi')) return 'Fungi';
  if (s.includes('animal') || s.includes('aves') || s.includes('insect') || s.includes('mamm'))
    return 'Animalia';
  return 'Other';
};

/**
 * Agrège les espèces de toutes les Marches liées à une propriété via la même
 * RPC `get_exploration_species_pool` que l'app marcheurs. Fusion par nom
 * scientifique normalisé, cumul des counts, priorité photo marcheur.
 *
 * Retourne des `BiodiversitySpecies[]` prêts pour <SpeciesExplorer />.
 */
export function usePropertySpeciesPool(proprieteId: string | undefined) {
  // 0. Corrections GPS éditoriales (appliquées à la lecture sur les waypoints)
  const { overrides } = useGpsOverrides();

  // 1. exploration_ids liés à la propriété

  const idsQuery = useQuery({
    queryKey: ['propriete-exploration-ids', proprieteId],
    enabled: !!proprieteId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propriete_marche_events')
        .select('marche_events!inner(exploration_id)')
        .eq('propriete_id', proprieteId!);
      if (error) throw error;
      const ids = (data || [])
        .map((r: any) => r.marche_events?.exploration_id)
        .filter((v: any): v is string => !!v);
      return Array.from(new Set(ids));
    },
  });

  const explorationIds = idsQuery.data || [];

  // 2. Pool par exploration en parallèle
  //    La RPC applique désormais elle-même les corrections GPS éditoriales
  //    (repositionnement / exclusion) : la même vérité sert la propriété,
  //    les marches, les explorations, les événements et les exports.
  const pools = useQueries({
    queries: explorationIds.map((id) => ({
      queryKey: ['exploration-species-pool-rpc', id, 'v6-gps-overrides'],
      staleTime: 60 * 1000,
      queryFn: async (): Promise<{ species: RpcSpecies[]; curation: RpcCuration }> => {
        const { data, error } = await supabase.rpc('get_exploration_species_pool', {
          p_exploration_id: id,
        });
        if (error) throw error;
        return {
          species: ((data as any)?.species || []) as RpcSpecies[],
          curation: ((data as any)?.curation || {}) as RpcCuration,
        };
      },
    })),
  });

  const poolsLoading = pools.some((q) => q.isLoading);
  const rawRows = useMemo(() => pools.flatMap((q) => q.data?.species || []), [pools]);

  /**
   * Déduplication par IDENTITÉ (id iNaturalist), jamais par coordonnées.
   *
   * Une même observation réelle peut arriver par deux canaux : une ligne
   * `marcheur_observations` (avec `inaturalist_id`) et une attribution du
   * snapshot iNaturalist (`originalUrl`). Tant que les deux copies partagent la
   * même position elles se superposent ; dès qu'une correction GPS déplace
   * l'une des deux, un « jumeau fantôme » apparaît sur la carte.
   *
   * On supprime donc ici, en amont de tout le reste (comptages, cartes, listes,
   * impressions), les attributions snapshot dont l'id iNat est déjà porté par
   * une observation marcheur — la version marcheur reste prioritaire.
   */
  const unscopedRows = useMemo(() => {
    const out: RpcSpecies[] = [];
    let changed = false;

    for (const sp of rawRows) {
      const marcheurAttrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      const marcheurInat = new Set<string>();
      for (const a of marcheurAttrs) {
        const id = inatIdOf(a?.inaturalist_id ?? a?.inaturalist_observation_id);
        if (id) marcheurInat.add(id);
      }

      const seenInat = new Set<string>(marcheurInat);
      const groups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
      const nextGroups: any[] = [];
      let removed = 0;

      for (const g of groups) {
        const list: any[] = Array.isArray(g) ? g : [g];
        const kept = list.filter((a: any) => {
          const id = inatIdOf(a?.originalUrl || a?.original_url);
          if (!id) return true;
          if (seenInat.has(id)) {
            removed++;
            return false;
          }
          seenInat.add(id);
          return true;
        });
        if (kept.length > 0) nextGroups.push(Array.isArray(g) ? kept : kept[0]);
      }

      if (removed === 0) {
        out.push(sp);
        continue;
      }
      changed = true;
      out.push({
        ...sp,
        attributions: nextGroups,
        observations: Math.max(0, (sp.observations || 0) - removed),
      });
    }

    return changed ? out : rawRows;
  }, [rawRows]);

  /**
   * Index secondaire des corrections GPS, par identité iNaturalist.
   *
   * Une correction posée sur la ligne marcheur (`observation:<uuid>`) doit
   * s'appliquer à son jumeau snapshot (`snapshot_attr:<url iNat>`) et
   * réciproquement : les deux désignent la même observation de terrain.
   */
  const overridesByInat = useMemo(() => {
    const m = new Map<string, GpsOverride>();
    if (overrides.size === 0) return m;

    for (const sp of rawRows) {
      const attrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const a of attrs) {
        const inat = inatIdOf(a?.inaturalist_id ?? a?.inaturalist_observation_id);
        if (!inat || !a?.obs_id) continue;
        const ov = overrides.get(overrideKeyOf('observation', a.obs_id));
        if (ov && !m.has(inat)) m.set(inat, ov);
      }

      const groups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
      for (const g of groups) {
        const list: any[] = Array.isArray(g) ? g : [g];
        for (const a of list) {
          const url = a?.originalUrl || a?.original_url;
          const inat = inatIdOf(url);
          if (!inat || !url) continue;
          const ov = overrides.get(overrideKeyOf('snapshot_attr', url));
          if (ov && !m.has(inat)) m.set(inat, ov);
        }
      }
    }
    return m;
  }, [rawRows, overrides]);

  /** Résolution d'une correction : clé directe, puis identité iNaturalist. */
  const resolveOverride = useCallback(
    (
      kind: GpsOverrideKind,
      key: string | null | undefined,
      inatId: string | null,
    ): GpsOverride | undefined => {
      if (key) {
        const direct = overrides.get(overrideKeyOf(kind, key));
        if (direct) return direct;
      }
      return inatId ? overridesByInat.get(inatId) : undefined;
    },
    [overrides, overridesByInat],
  );



  /**
   * Portée « cadastre » (réglage global de la fiche propriété) : on ne conserve
   * que les observations strictement comprises dans le plan cadastral. Le
   * filtrage est appliqué EN AMONT, sur les lignes RPC, pour que les espèces,
   * les photos terrain, les waypoints, les contributeurs et tous les compteurs
   * dérivés racontent exactement la même histoire.
   */
  const { effectiveScope, fence, period, customRange } = useVivantScopeFor(proprieteId);

  /**
   * Fenêtre temporelle globale (mêmes options que « Taxons observés ») :
   * appliquée elle aussi en amont, avant le géofiltrage cadastral.
   */
  const { fromISO, toISO } = useMemo(
    () => resolvePeriodRange(period, customRange),
    [period, customRange?.from, customRange?.to],
  );

  const timeRows = useMemo(() => {
    if (!fromISO && !toISO) return unscopedRows;

    const inWindow = (raw: any): boolean => {
      if (!raw) return false;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return false;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      if (fromISO && iso < fromISO) return false;
      if (toISO && iso > toISO) return false;
      return true;
    };

    const out: RpcSpecies[] = [];
    for (const sp of unscopedRows) {
      const marcheurAttrs = (Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : []).filter(
        (a: any) => inWindow(a?.observation_date || a?.date || a?.observationDate),
      );

      const attributionGroups: any[] = [];
      let inatKept = 0;
      for (const g of Array.isArray(sp.attributions) ? sp.attributions : []) {
        const list: any[] = Array.isArray(g) ? g : [g];
        const kept = list.filter((a: any) =>
          inWindow(a?.observation_date || a?.date || a?.observationDate),
        );
        if (kept.length > 0) {
          attributionGroups.push(Array.isArray(g) ? kept : kept[0]);
          inatKept += kept.length;
        }
      }

      const kept = marcheurAttrs.length + inatKept;
      if (kept === 0) continue;

      out.push({
        ...sp,
        marcheur_attrs: marcheurAttrs,
        attributions: attributionGroups,
        observations: kept,
      });
    }
    return out;
  }, [unscopedRows, fromISO, toISO]);

  const allRows = useMemo(() => {
    if (effectiveScope !== 'cadastre' || fence.empty) return timeRows;



    const posOf = (
      kind: 'observation' | 'snapshot_attr',
      key: string | null,
      inatId: string | null,
      lat: number,
      lng: number,
    ): [number, number] => {
      const ov = resolveOverride(kind, key, inatId);
      if (ov?.status === 'repositioned' && ov.lat != null && ov.lon != null) {
        return [Number(ov.lat), Number(ov.lon)];
      }
      return [lat, lng];
    };

    const out: RpcSpecies[] = [];
    for (const sp of timeRows) {
      const sci = sp.scientific_name || sp.key || '';

      const marcheurAttrs = (Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : []).filter(
        (a: any) => {
          const lat = Number(a?.latitude);
          const lng = Number(a?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
          const [eLat, eLng] = posOf(
            'observation',
            a?.obs_id || null,
            inatIdOf(a?.inaturalist_id ?? a?.inaturalist_observation_id),
            lat,
            lng,
          );
          return isInsideGeofence(fence, eLat, eLng);
        },
      );

      const attributionGroups: any[] = [];
      let inatKept = 0;
      for (const g of Array.isArray(sp.attributions) ? sp.attributions : []) {
        const list: any[] = Array.isArray(g) ? g : [g];
        const kept = list.filter((a: any) => {
          const lat = Number(a?.exactLatitude);
          const lng = Number(a?.exactLongitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
          const fallbackKey = `${normName(sci)}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
          const [eLat, eLng] = posOf(
            'snapshot_attr',
            a?.originalUrl || fallbackKey,
            inatIdOf(a?.originalUrl || a?.original_url),
            lat,
            lng,
          );
          return isInsideGeofence(fence, eLat, eLng);
        });
        if (kept.length > 0) {
          attributionGroups.push(Array.isArray(g) ? kept : kept[0]);
          inatKept += kept.length;
        }
      }

      const kept = marcheurAttrs.length + inatKept;
      if (kept === 0) continue;

      out.push({
        ...sp,
        marcheur_attrs: marcheurAttrs,
        attributions: attributionGroups,
        observations: kept,
      });
    }
    return out;
  }, [timeRows, effectiveScope, fence, resolveOverride]);


  /** Synthèse de curation GPS, cumulée sur toutes les explorations liées. */
  const curation = useMemo(() => {
    const acc = { excluded: 0, repositioned: 0, validated: 0 };
    for (const q of pools) {
      const c = q.data?.curation;
      if (!c) continue;
      acc.excluded += (c.excluded_observations || 0) + (c.excluded_attributions || 0);
      acc.repositioned += c.repositioned_observations || 0;
      acc.validated += c.validated_observations || 0;
    }
    return acc;
  }, [pools]);

  // 3. Fusion multi-marches par clé scientifique normalisée
  const merged = useMemo(() => {
    const bucket = new Map<
      string,
      {
        scientific: string;
        common: string | null;
        kingdom: string | null;
        family: string | null;
        iconic: string | null;
        count: number;
        lastSeen: string | null;
        photos: string[];
        seen: Set<string>;
      }
    >();
    for (const sp of allRows) {
      const sci = sp.scientific_name || sp.common_name || sp.key || '';
      const key = normName(sci);
      if (!key) continue;
      const existing = bucket.get(key);
      const photos = resolvePhotos(sp);
      if (!existing) {
        const seen = new Set<string>(photos);
        bucket.set(key, {
          scientific: sci,
          common: sp.common_name,
          kingdom: sp.kingdom,
          family: sp.family,
          iconic: sp.iconic_taxon,
          count: sp.observations || 0,
          lastSeen: sp.last_seen,
          photos: [...photos],
          seen,
        });
      } else {
        existing.count += sp.observations || 0;
        if (!existing.common && sp.common_name) existing.common = sp.common_name;
        for (const p of photos) {
          if (!existing.seen.has(p)) {
            existing.seen.add(p);
            existing.photos.push(p);
          }
        }
        if (!existing.family && sp.family) existing.family = sp.family;
        if (!existing.iconic && sp.iconic_taxon) existing.iconic = sp.iconic_taxon;
        if (!existing.kingdom && sp.kingdom) existing.kingdom = sp.kingdom;
        if ((sp.last_seen || '') > (existing.lastSeen || '')) existing.lastSeen = sp.last_seen;
      }
    }
    return Array.from(bucket.values());
  }, [allRows]);

  // 4. Noms français (batch unique)
  const { data: frMap } = useFrenchSpeciesNames(
    merged.map((s) => ({ scientificName: s.scientific, commonName: s.common })),
  );

  // 5. Adapter BiodiversitySpecies
  const species = useMemo<BiodiversitySpecies[]>(() => {
    return merged
      .map((s): BiodiversitySpecies => {
        const fr = s.scientific ? frMap?.get(s.scientific) : undefined;
        const display = fr?.displayName || s.common || s.scientific;
        return {
          id: s.scientific,
          scientificName: s.scientific,
          commonName: display,
          family: s.family || '',
          kingdom: mapKingdom(s.kingdom || s.iconic),
          iconicTaxon: s.iconic || undefined,
          observations: s.count,
          lastSeen: s.lastSeen || '',
          photos: s.photos,
          source: 'inaturalist',
          attributions: [],
        };
      })
      .sort((a, b) => b.observations - a.observations);
  }, [merged, frMap]);

  const fieldPhotos = useMemo(() => {
    const byName = new Map<string, MarcheurSpeciesPhoto[]>();
    const seen = new Set<string>();

    const push = (scientificName: string, attr: any) => {
      const url = attr?.photo_url;
      if (!scientificName || !url) return;
      const key = normalizeSpeciesKey(scientificName);
      if (!key) return;
      const uniqueKey = `${key}:${url}`;
      if (seen.has(uniqueKey)) return;
      seen.add(uniqueKey);

      const arr = byName.get(key) || [];
      arr.push({
        id: `propriete-marcheur-${attr?.marche_id || 'marche'}-${arr.length}-${url.slice(-24)}`,
        url,
        source: 'marcheur',
        observerName: 'Marcheur',
        observationDate: attr?.observation_date || undefined,
        marcheId: attr?.marche_id || undefined,
        marcheurId: attr?.marcheur_id || undefined,
      });
      byName.set(key, arr);
    };

    for (const sp of allRows) {
      const scientificName = sp.scientific_name || sp.common_name || sp.key || '';
      const attrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const attr of attrs) push(scientificName, attr);
    }

    byName.forEach((arr) => {
      arr.sort((a, b) => {
        const da = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const db = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        return db - da;
      });
    });

    return byName;
  }, [allRows]);

  // 6. Waypoints géolocalisés — obs. marcheurs (lat/lng) **et** attributions
  //    iNaturalist / eBird des snapshots (exactLatitude / exactLongitude).
  //    Sans ce second bloc, la carte sous-comptait les espèces par rapport au
  //    bandeau « Empreinte biodiversité » (qui, lui, ne filtre pas sur le GPS).
  //    Les corrections éditoriales (`observation_gps_overrides`) sont appliquées
  //    ici, à la lecture : position corrigée + statut d'exclusion.
  const buildWaypoints = useCallback((rows: RpcSpecies[]) => {
    const out: PropertyWaypoint[] = [];
    const seen = new Set<string>();
    let n = 0;

    const dedupKey = (sci: string, lat: number, lng: number) =>
      `${normName(sci)}|${lat.toFixed(5)}|${lng.toFixed(5)}`;

    const applyOverride = (
      wp: PropertyWaypoint,
      kind: 'observation' | 'snapshot_attr',
      key: string | null,
    ): PropertyWaypoint => {
      if (!key) return wp;
      const ov = overrides.get(overrideKeyOf(kind, key));
      if (!ov) return wp;
      const next: PropertyWaypoint = {
        ...wp,
        overrideStatus: ov.status,
        overrideReason: ov.reason,
        originalLat: ov.original_lat ?? wp.lat,
        originalLng: ov.original_lon ?? wp.lng,
      };
      if (ov.status === 'repositioned' && ov.lat != null && ov.lon != null) {
        next.lat = Number(ov.lat);
        next.lng = Number(ov.lon);
      }
      return next;
    };

    // a) Observations marcheurs (prioritaires)
    for (const sp of rows) {
      const sci = sp.scientific_name || sp.key || '';
      const attrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      for (const a of attrs) {
        const lat = Number(a?.latitude);
        const lng = Number(a?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const k = dedupKey(sci, lat, lng);
        if (seen.has(k)) continue;
        seen.add(k);
        const obsId: string | null = a?.obs_id || null;
        out.push(
          applyOverride(
            {
              id: `wp-${n++}`,
              lat,
              lng,
              scientificName: sci,
              commonName: sp.common_name,
              kingdom: sp.kingdom,
              photoUrl: a?.photo_url || null,
              observationDate: a?.observation_date || null,
              marcheurId: a?.marcheur_id || null,
              marcheId: a?.marche_id || null,
              source: 'marcheur',
              observerName: null,
              overrideKind: 'observation',
              overrideTargetKey: obsId,
              inatObservationId: a?.inaturalist_id ? String(a.inaturalist_id) : null,
              positionalAccuracy:
                a?.positional_accuracy != null ? Number(a.positional_accuracy) : null,
              obscured: a?.obscured ?? null,
              gpsSource: a?.gps_source || null,
              overrideStatus: null,
              overrideReason: null,
              originalLat: null,
              originalLng: null,
            },
            'observation',
            obsId,
          ),
        );
      }
    }

    // b) Attributions des snapshots (tableau de tableaux côté RPC)
    for (const sp of rows) {
      const sci = sp.scientific_name || sp.key || '';
      const groups: any[] = Array.isArray(sp.attributions) ? sp.attributions : [];
      for (const g of groups) {
        const list: any[] = Array.isArray(g) ? g : [g];
        for (const a of list) {
          const lat = Number(a?.exactLatitude);
          const lng = Number(a?.exactLongitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          const k = dedupKey(sci, lat, lng);
          if (seen.has(k)) continue;
          seen.add(k);
          // Les attributions n'ont pas d'identifiant : on les cible par l'URL
          // iNaturalist d'origine, sinon par espèce + coordonnées d'origine.
          const attrKey: string = a?.originalUrl || k;
          out.push(
            applyOverride(
              {
                id: `wp-${n++}`,
                lat,
                lng,
                scientificName: sci,
                commonName: sp.common_name,
                kingdom: sp.kingdom,
                photoUrl: a?.photoUrl || a?.photo_url || null,
                observationDate: a?.date || a?.observationDate || null,
                marcheurId: null,
                marcheId: null,
                source: 'inaturalist',
                observerName: a?.observerName || null,
                overrideKind: 'snapshot_attr',
                overrideTargetKey: attrKey,
                inatObservationId: null,
                positionalAccuracy: null,
                obscured: null,
                gpsSource: null,
                overrideStatus: null,
                overrideReason: null,
                originalLat: null,
                originalLng: null,
                originalUrl: a?.originalUrl || null,
              },
              'snapshot_attr',
              attrKey,
            ),
          );
        }
      }
    }

    return out;
  }, [overrides]);

  /** Observations de la portée active (cadastre par défaut). */
  const waypoints = useMemo(() => buildWaypoints(allRows), [buildWaypoints, allRows]);

  /**
   * Toutes les observations, hors portée ET hors fenêtre temporelle : réservé
   * au Contrôle GPS, qui doit pouvoir rapatrier les points situés hors emprise.
   */
  const allWaypoints = useMemo(
    () => (allRows === unscopedRows ? waypoints : buildWaypoints(unscopedRows)),
    [buildWaypoints, unscopedRows, allRows, waypoints],
  );

  /** Observations de la fenêtre temporelle, toutes portées confondues. */
  const periodWaypoints = useMemo(
    () => (timeRows === unscopedRows ? allWaypoints : buildWaypoints(timeRows)),
    [buildWaypoints, timeRows, unscopedRows, allWaypoints],
  );






  // 7. Contributeurs (agrégation par marcheur_id)
  const contributorSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        marcheurId: string;
        observations: number;
        speciesKeys: Set<string>;
        lastSeen: string | null;
      }
    >();
    for (const sp of allRows) {
      const attrs: any[] = Array.isArray(sp.marcheur_attrs) ? sp.marcheur_attrs : [];
      const key = normName(sp.scientific_name || sp.common_name || sp.key || '');
      for (const a of attrs) {
        const mid = a?.marcheur_id;
        if (!mid) continue;
        const ex = map.get(mid);
        if (!ex) {
          map.set(mid, {
            marcheurId: mid,
            observations: 1,
            speciesKeys: new Set(key ? [key] : []),
            lastSeen: a?.observation_date || null,
          });
        } else {
          ex.observations += 1;
          if (key) ex.speciesKeys.add(key);
          if ((a?.observation_date || '') > (ex.lastSeen || '')) ex.lastSeen = a.observation_date;
        }
      }
    }
    return Array.from(map.values())
      .map((c) => ({
        marcheurId: c.marcheurId,
        observations: c.observations,
        speciesCount: c.speciesKeys.size,
        speciesKeys: Array.from(c.speciesKeys),
        lastSeen: c.lastSeen,
      }))
      .sort((a, b) => b.observations - a.observations);
  }, [allRows]);

  /** Compteurs de portée (sélecteur Cadastre / Tous), dans la fenêtre en cours. */
  const scopeCounts = useMemo(() => {
    const all = periodWaypoints.filter((w) => w.overrideStatus !== 'excluded');
    return {
      all: all.length,
      cadastre: fence.empty
        ? null
        : all.filter((w) => isInsideGeofence(fence, w.lat, w.lng)).length,
    };
  }, [periodWaypoints, fence]);

  return {
    species,
    fieldPhotos,
    waypoints,
    /** Hors portée — Contrôle GPS uniquement. */
    allWaypoints,
    /** Portée réellement appliquée. */
    vivantScope: effectiveScope,
    scopeCounts,
    contributorSummaries,
    /** Corrections GPS appliquées par la base (écartées / repositionnées / validées) */
    curation,
    isLoading: idsQuery.isLoading || poolsLoading,
    explorationIds,
    /** Exploration la plus récente : bon candidat pour prioriser les photos terrain */
    latestExplorationId: explorationIds[0],
  };
}

