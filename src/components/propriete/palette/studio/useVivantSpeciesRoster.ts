import React from 'react';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { indicatorOf, typeOfWaypoint, type VivantType } from './LivingLayer';

export interface VivantRosterEntry {
  /** Nom scientifique normalisé (clé de regroupement, identique au reste de l'app). */
  key: string;
  scientificName: string;
  commonName: string | null;
  type: VivantType;
  bio: boolean;
  /** Observations correspondant aux filtres, les plus récentes d'abord. */
  observations: PropertyWaypoint[];
  photoUrl: string | null;
  lastSeen: string | null;
  sources: Set<'marcheur' | 'inaturalist'>;
}

const norm = (s: string | null | undefined) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const timeOf = (d: string | null | undefined) => {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Regroupe les observations visibles par espèce (dédup stricte par nom
 * scientifique) et résout une vignette : photo terrain du marcheur d'abord,
 * puis le cache serveur (iNaturalist / GBIF).
 */
export function useVivantSpeciesRoster(
  waypoints: PropertyWaypoint[],
  fieldPhotoFor?: (w: PropertyWaypoint) => string[],
) {
  const grouped = React.useMemo(() => {
    const m = new Map<string, VivantRosterEntry>();
    for (const w of waypoints) {
      const key = norm(w.scientificName);
      if (!key) continue;
      let e = m.get(key);
      if (!e) {
        e = {
          key,
          scientificName: w.scientificName,
          commonName: w.commonName ?? null,
          type: typeOfWaypoint(w),
          bio: !!indicatorOf(w),
          observations: [],
          photoUrl: null,
          lastSeen: null,
          sources: new Set(),
        };
        m.set(key, e);
      }
      e.observations.push(w);
      e.sources.add(w.source);
      if (!e.commonName && w.commonName) e.commonName = w.commonName;
      if (timeOf(w.observationDate) > timeOf(e.lastSeen)) e.lastSeen = w.observationDate ?? null;
      if (!e.photoUrl && w.photoUrl) e.photoUrl = w.photoUrl;
    }
    const list = Array.from(m.values());
    list.forEach((e) => {
      e.observations.sort((a, b) => timeOf(b.observationDate) - timeOf(a.observationDate));
      if (!e.photoUrl && fieldPhotoFor) e.photoUrl = fieldPhotoFor(e.observations[0])[0] ?? null;
    });
    return list;
  }, [waypoints, fieldPhotoFor]);

  const missing = React.useMemo(
    () => grouped.filter((e) => !e.photoUrl).map((e) => e.scientificName),
    [grouped],
  );
  const { data: thumbs } = useSpeciesThumbs(missing);

  const entries = React.useMemo(() => {
    const withThumbs = grouped.map((e) =>
      e.photoUrl ? e : { ...e, photoUrl: thumbs?.get(e.key)?.photo_url ?? null },
    );
    // Bio-indicatrices d'abord (elles portent le diagnostic), puis par abondance,
    // puis alphabétiquement : une lecture stable d'une session à l'autre.
    return withThumbs.sort(
      (a, b) =>
        Number(b.bio) - Number(a.bio) ||
        b.observations.length - a.observations.length ||
        a.scientificName.localeCompare(b.scientificName, 'fr'),
    );
  }, [grouped, thumbs]);

  return {
    entries,
    speciesCount: entries.length,
    observationCount: waypoints.length,
  };
}
