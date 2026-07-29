import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { PLANT_INDICATORS, type PlantFamily } from '@/lib/plantIndicatorKb';

export type VivantType = 'flore' | 'faune' | 'champignons' | 'autres';
export type VivantSource = 'marcheur' | 'inaturalist';

export interface VivantFilterState {
  types: VivantType[];
  familles: PlantFamily[];
  sources: VivantSource[];
  bioOnly: boolean;
}

export const DEFAULT_VIVANT_FILTER: VivantFilterState = {
  types: ['flore', 'faune', 'champignons', 'autres'],
  familles: [],
  sources: ['marcheur', 'inaturalist'],
  bioOnly: false,
};

export const TYPE_META: Record<VivantType, { label: string; color: string; glyph: string }> = {
  flore: { label: 'Flore', color: '#5c8a3c', glyph: '🌿' },
  faune: { label: 'Faune', color: '#b06a2c', glyph: '🦋' },
  champignons: { label: 'Champignons', color: '#8a5a7a', glyph: '🍄' },
  autres: { label: 'Autres', color: '#6b7280', glyph: '·' },
};

export const FAMILY_FILTER_LABEL: Record<PlantFamily, string> = {
  herbacee: 'Herbacées',
  arbuste: 'Arbustes',
  liane: 'Lianes / grimpantes',
  arbre: 'Arbres',
};

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Index latin normalisé → fiche bio-indicatrice (familles + statut indicateur). */
export const INDICATOR_BY_LATIN: Record<string, { famille: PlantFamily; id: string }> =
  Object.fromEntries(
    PLANT_INDICATORS.flatMap((p: any) => {
      const latin = norm(p.latin || p.scientificName || '');
      if (!latin) return [];
      const genus = latin.split(' ')[0];
      const entry = { famille: (p.famille || p.family || 'herbacee') as PlantFamily, id: p.id };
      return [
        [latin, entry],
        [genus, entry],
      ];
    }),
  );

export const typeOfWaypoint = (w: PropertyWaypoint): VivantType => {
  const k = norm(w.kingdom || '');
  if (k.startsWith('plant')) return 'flore';
  if (k.startsWith('animal')) return 'faune';
  if (k.startsWith('fungi')) return 'champignons';
  return 'autres';
};

export const indicatorOf = (w: PropertyWaypoint) => {
  const latin = norm(w.scientificName);
  return INDICATOR_BY_LATIN[latin] || INDICATOR_BY_LATIN[latin.split(' ')[0]] || null;
};

export const matchVivantFilter = (w: PropertyWaypoint, f: VivantFilterState): boolean => {
  if (!f.types.includes(typeOfWaypoint(w))) return false;
  if (!f.sources.includes(w.source)) return false;
  const ind = indicatorOf(w);
  if (f.bioOnly && !ind) return false;
  if (f.familles.length > 0) {
    if (!ind || !f.familles.includes(ind.famille)) return false;
  }
  return true;
};

interface LayerProps {
  waypoints: PropertyWaypoint[];
  filter: VivantFilterState;
  frenchName?: (scientific: string, fallback?: string | null) => string;
  onSelect?: (w: PropertyWaypoint) => void;
}

/** Nuage d'observations filtrable, en fond de plan de l'atelier. */
export const LivingLayer: React.FC<LayerProps> = ({
  waypoints,
  filter,
  frenchName,
  onSelect,
}) => (
  <>
    {waypoints.map((w) => {
      if (!matchVivantFilter(w, filter)) return null;
      const t = typeOfWaypoint(w);
      const meta = TYPE_META[t];
      const bio = !!indicatorOf(w);
      return (
        <CircleMarker
          key={w.id}
          center={[w.lat, w.lng] as any}
          radius={bio ? 5 : 3.5}
          pathOptions={{
            color: bio ? '#fffdf7' : meta.color,
            weight: bio ? 1.6 : 0.8,
            fillColor: meta.color,
            fillOpacity: 0.8,
          }}
          eventHandlers={onSelect ? { click: () => onSelect(w) } : undefined}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            <span style={{ fontSize: 11 }}>
              {meta.glyph}{' '}
              {frenchName ? frenchName(w.scientificName, w.commonName) : w.commonName || w.scientificName}
              <em style={{ display: 'block', opacity: 0.6 }}>{w.scientificName}</em>
            </span>
          </Tooltip>
        </CircleMarker>
      );
    })}
  </>
);

interface BarProps {
  filter: VivantFilterState;
  onChange: (f: VivantFilterState) => void;
  counts: { total: number; visible: number; byType: Record<VivantType, number>; bio: number };
}

const chip = (on: boolean) =>
  `rounded-full border px-2 py-0.5 text-[10px] transition-all ${
    on
      ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
      : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/55'
  }`;

export const LivingFilterPanel: React.FC<BarProps> = ({ filter, onChange, counts }) => {
  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-2.5 text-[hsl(var(--ds-forest-deep))]">
      <p className="text-[10px] leading-snug opacity-60">
        <span className="font-semibold">{counts.visible}</span> observations affichées sur{' '}
        {counts.total} · {counts.bio} bio-indicatrices
      </p>

      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.16em] opacity-55">Types</p>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(TYPE_META) as VivantType[]).map((t) => (
            <button
              key={t}
              className={chip(filter.types.includes(t))}
              onClick={() => onChange({ ...filter, types: toggle(filter.types, t) })}
            >
              {TYPE_META[t].glyph} {TYPE_META[t].label}
              <span className="ml-1 opacity-60">{counts.byType[t] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.16em] opacity-55">
          Catégories végétales
        </p>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(FAMILY_FILTER_LABEL) as PlantFamily[]).map((f) => (
            <button
              key={f}
              className={chip(filter.familles.includes(f))}
              onClick={() => onChange({ ...filter, familles: toggle(filter.familles, f) })}
            >
              {FAMILY_FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[9px] uppercase tracking-[0.16em] opacity-55">Sources</p>
        <div className="flex flex-wrap gap-1">
          {(['marcheur', 'inaturalist'] as VivantSource[]).map((s) => (
            <button
              key={s}
              className={chip(filter.sources.includes(s))}
              onClick={() => onChange({ ...filter, sources: toggle(filter.sources, s) })}
            >
              {s === 'marcheur' ? 'Marcheurs' : 'iNaturalist'}
            </button>
          ))}
          <button
            className={chip(filter.bioOnly)}
            onClick={() => onChange({ ...filter, bioOnly: !filter.bioOnly })}
          >
            Bio-indicatrices seulement
          </button>
        </div>
      </div>
    </div>
  );
};

export default LivingLayer;
