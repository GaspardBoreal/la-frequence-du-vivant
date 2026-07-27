import { useMemo, useState } from 'react';
import type { GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import {
  useMarcheurSpeciesTags,
  indexTagsBySpecies,
  normalizeTagKey,
  type MarcheurSpeciesTag,
} from '@/hooks/useMarcheurSpeciesTags';

export type RevealSortKey = 'name' | 'date';

export interface RevealTagFacet {
  key: string;
  label: string;
  color_hash: number;
  count: number;
}

export interface RevealIndex {
  /** Recherche « nom contient ». */
  query: string;
  setQuery: (v: string) => void;
  sortKey: RevealSortKey;
  setSortKey: (k: RevealSortKey) => void;
  nameAsc: boolean;
  setNameAsc: React.Dispatch<React.SetStateAction<boolean>>;
  dateDesc: boolean;
  setDateDesc: React.Dispatch<React.SetStateAction<boolean>>;
  activeTagKeys: string[];
  setActiveTagKeys: React.Dispatch<React.SetStateAction<string[]>>;
  /** Observations correspondant à la recherche/tags, triées pour l'affichage. */
  matched: GpsCandidate[];
  /** Identifiants correspondants — utilisé par la carte pour estomper le reste. */
  matchedIds: Set<string>;
  /** Vrai dès qu'une recherche ou un tag est actif (la carte doit alors se restreindre). */
  isActive: boolean;
  tagFacets: RevealTagFacet[];
  tagsFor: (w: GpsCandidate) => MarcheurSpeciesTag[];
  reset: () => void;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Index vivant partagé entre le bandeau latéral et la carte des révélations :
 * une seule source de vérité pour la recherche, les tags et le tri, afin que
 * les points affichés soient toujours alignés sur la liste.
 */
export function useRevealIndex(
  items: GpsCandidate[],
  displayNameFor: (w: { scientificName?: string | null; commonName?: string | null }) => string,
): RevealIndex {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<RevealSortKey>('name');
  const [nameAsc, setNameAsc] = useState(true);
  const [dateDesc, setDateDesc] = useState(true);
  const [activeTagKeys, setActiveTagKeys] = useState<string[]>([]);

  const scientificNames = useMemo(
    () => Array.from(new Set(items.map((w) => (w.scientificName || '').trim()).filter(Boolean))),
    [items],
  );
  const { data: tags } = useMarcheurSpeciesTags(scientificNames);
  const tagIndex = useMemo(() => indexTagsBySpecies(tags), [tags]);

  const tagsFor = useMemo(
    () => (w: GpsCandidate): MarcheurSpeciesTag[] =>
      tagIndex.get(normalizeTagKey(w.scientificName || '')) || [],
    [tagIndex],
  );

  const tagFacets = useMemo<RevealTagFacet[]>(() => {
    const m = new Map<string, { label: string; color_hash: number; count: number }>();
    items.forEach((w) => {
      const seen = new Set<string>();
      tagsFor(w).forEach((t) => {
        const k = normalizeTagKey(t.label);
        if (seen.has(k)) return;
        seen.add(k);
        const ex = m.get(k);
        if (ex) ex.count++;
        else m.set(k, { label: t.label, color_hash: t.color_hash, count: 1 });
      });
    });
    return Array.from(m.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
  }, [items, tagsFor]);

  const matched = useMemo(() => {
    const q = norm(query.trim());
    let list = items.filter((w) => {
      if (q) {
        const hay = norm(
          [displayNameFor(w), w.scientificName || '', (w as any).observerName || ''].join(' '),
        );
        if (!hay.includes(q)) return false;
      }
      if (activeTagKeys.length) {
        const keys = new Set(tagsFor(w).map((t) => normalizeTagKey(t.label)));
        if (!activeTagKeys.every((k) => keys.has(k))) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') {
        const c = displayNameFor(a).localeCompare(displayNameFor(b), 'fr', { sensitivity: 'base' });
        return nameAsc ? c : -c;
      }
      const da = a.observationDate ? new Date(a.observationDate).getTime() : NaN;
      const db = b.observationDate ? new Date(b.observationDate).getTime() : NaN;
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1; // sans date → toujours en fin de liste
      if (isNaN(db)) return -1;
      return dateDesc ? db - da : da - db;
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, activeTagKeys, sortKey, nameAsc, dateDesc, tagsFor]);

  const matchedIds = useMemo(() => new Set(matched.map((w) => w.id)), [matched]);

  return {
    query,
    setQuery,
    sortKey,
    setSortKey,
    nameAsc,
    setNameAsc,
    dateDesc,
    setDateDesc,
    activeTagKeys,
    setActiveTagKeys,
    matched,
    matchedIds,
    isActive: query.trim().length > 0 || activeTagKeys.length > 0,
    tagFacets,
    tagsFor,
    reset: () => {
      setQuery('');
      setActiveTagKeys([]);
    },
  };
}
