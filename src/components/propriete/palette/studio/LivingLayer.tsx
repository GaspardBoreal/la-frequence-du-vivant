import React from 'react';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { Search, X, Tag as TagIcon, RotateCcw } from 'lucide-react';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { PLANT_INDICATORS, type PlantFamily } from '@/lib/plantIndicatorKb';
import ObservationPopupCard, {
  type ObservationPopupWaypoint,
} from '@/components/propriete/species/ObservationPopupCard';


export type VivantType = 'flore' | 'faune' | 'champignons' | 'autres';
export type VivantSource = 'marcheur' | 'inaturalist';
export type VivantTagMode = 'and' | 'or' | 'not';

export interface VivantTagFilter {
  /** Clés normalisées des libellés de tags sélectionnés. */
  labels: string[];
  mode: VivantTagMode;
}

export interface VivantFilterState {
  types: VivantType[];
  familles: PlantFamily[];
  sources: VivantSource[];
  bioOnly: boolean;
  /** Recherche libre : nom français, nom scientifique, observateur. */
  query: string;
  /** Filtre « mes tags » (table marcheur_species_tags). */
  tags: VivantTagFilter;
}

/**
 * Contexte de filtrage : ce que le waypoint ne porte pas lui-même.
 * Optionnel — sans lui, recherche et tags sont simplement inopérants,
 * ce qui garde `matchVivantFilter` rétrocompatible.
 */
export interface VivantFilterContext {
  displayName?: (scientific: string, fallback?: string | null) => string;
  /** nom scientifique normalisé → clés de tags normalisées. */
  tagsBySpecies?: Map<string, string[]>;
}

export const DEFAULT_VIVANT_FILTER: VivantFilterState = {
  types: ['flore', 'faune', 'champignons', 'autres'],
  familles: [],
  sources: ['marcheur', 'inaturalist'],
  bioOnly: false,
  query: '',
  tags: { labels: [], mode: 'or' },
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

/** Clés de tags (normalisées) portées par l'espèce d'un waypoint. */
export const tagKeysOf = (w: PropertyWaypoint, ctx?: VivantFilterContext): string[] =>
  ctx?.tagsBySpecies?.get(norm(w.scientificName)) ?? [];

/**
 * Filtres « durs » : types, sources, bio-indicatrices, familles, mes tags.
 * La recherche texte en est volontairement exclue (voir `matchVivantQuery`) :
 * sur la carte elle estompe au lieu de masquer, pour que l'on voie *où* se
 * trouve ce que l'on cherche.
 */
export const matchVivantBase = (
  w: PropertyWaypoint,
  f: VivantFilterState,
  ctx?: VivantFilterContext,
): boolean => {
  if (!f.types.includes(typeOfWaypoint(w))) return false;
  if (!f.sources.includes(w.source)) return false;
  const ind = indicatorOf(w);
  if (f.bioOnly && !ind) return false;
  if (f.familles.length > 0) {
    if (!ind || !f.familles.includes(ind.famille)) return false;
  }

  const wanted = f.tags?.labels ?? [];
  if (wanted.length > 0) {
    const own = new Set(tagKeysOf(w, ctx));
    const mode = f.tags.mode;
    if (mode === 'and' && !wanted.every((k) => own.has(k))) return false;
    if (mode === 'or' && !wanted.some((k) => own.has(k))) return false;
    if (mode === 'not' && wanted.some((k) => own.has(k))) return false;
  }
  return true;
};

/** Recherche libre sur nom français, nom scientifique et observateur. */
export const matchVivantQuery = (
  w: PropertyWaypoint,
  f: VivantFilterState,
  ctx?: VivantFilterContext,
): boolean => {
  const q = norm(f.query || '');
  if (!q) return true;
  const french = ctx?.displayName
    ? ctx.displayName(w.scientificName, w.commonName)
    : w.commonName || '';
  const hay = norm([french, w.scientificName, w.observerName || ''].join(' '));
  return q.split(/\s+/).every((token) => hay.includes(token));
};

export const matchVivantFilter = (
  w: PropertyWaypoint,
  f: VivantFilterState,
  ctx?: VivantFilterContext,
): boolean => matchVivantBase(w, f, ctx) && matchVivantQuery(w, f, ctx);

/** Un filtre est-il actif (autre chose que l'état par défaut) ? */
export const isVivantFilterActive = (f: VivantFilterState): boolean =>
  f.types.length !== 4 ||
  f.familles.length > 0 ||
  f.sources.length !== 2 ||
  f.bioOnly ||
  !!f.query.trim() ||
  (f.tags?.labels?.length ?? 0) > 0;

interface LayerProps {
  waypoints: ObservationPopupWaypoint[];
  filter: VivantFilterState;
  /** Contexte de filtrage (noms français + tags) — partagé avec le panneau. */
  filterContext?: VivantFilterContext;
  /** Résolveur de nom français (source unique partagée avec la Carte des révélations). */
  frenchName?: (scientific: string, fallback?: string | null) => string;
  onSelect?: (w: ObservationPopupWaypoint) => void;
  canCurate?: boolean;
  /** Autres photos terrain de la même espèce (clé = nom scientifique normalisé). */
  walkerPhotosFor?: (w: PropertyWaypoint) => string[];
  onZoomPhoto?: (id: string) => void;
  onStartInlineMove?: (w: ObservationPopupWaypoint) => void;
  onOpenGps?: (w: ObservationPopupWaypoint) => void;
}

/** Nuage d'observations filtrable, en fond de plan de l'atelier. */
export const LivingLayer: React.FC<LayerProps> = ({
  waypoints,
  filter,
  filterContext,
  frenchName,
  onSelect,
  canCurate,
  walkerPhotosFor,
  onZoomPhoto,
  onStartInlineMove,
  onOpenGps,
}) => (

  <>
    {waypoints.map((w) => {
      if (!matchVivantBase(w, filter, filterContext)) return null;
      /**
       * Recherche : on n'efface pas, on estompe. Le contexte spatial reste
       * lisible et la correspondance ressort par un halo.
       */
      const hit = matchVivantQuery(w, filter, filterContext);
      const searching = !!filter.query.trim();
      const t = typeOfWaypoint(w);
      const meta = TYPE_META[t];
      const bio = !!indicatorOf(w);
      const label = frenchName
        ? frenchName(w.scientificName, w.commonName)
        : w.commonName || w.scientificName;
      const highlighted = searching && hit;
      const muted = searching && !hit;
      return (
        <CircleMarker
          key={w.id}
          center={[w.lat, w.lng] as any}
          radius={highlighted ? (bio ? 8 : 6.5) : bio ? 5 : 3.5}
          interactive={!muted}
          pathOptions={{
            color: highlighted ? '#f2c14e' : bio ? '#fffdf7' : meta.color,
            weight: highlighted ? 2.6 : bio ? 1.6 : 0.8,
            opacity: muted ? 0.18 : 1,
            fillColor: meta.color,
            fillOpacity: muted ? 0.12 : 0.8,
          }}
          eventHandlers={onSelect && !muted ? { click: () => onSelect(w) } : undefined}
        >

          <Tooltip direction="top" offset={[0, -4]}>
            <span style={{ fontSize: 11 }}>
              {meta.glyph} {label}
              <em style={{ display: 'block', opacity: 0.6 }}>{w.scientificName}</em>
            </span>
          </Tooltip>
          <Popup>
            <ObservationPopupCard
              waypoint={w}
              displayName={label}
              canCurate={canCurate}
              onZoomPhoto={onZoomPhoto}
              onStartInlineMove={onStartInlineMove}
              onOpenGps={onOpenGps}
            />
          </Popup>
        </CircleMarker>
      );
    })}
  </>

);

export interface VivantTagFacet {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface BarProps {
  filter: VivantFilterState;
  onChange: (f: VivantFilterState) => void;
  counts: { total: number; visible: number; byType: Record<VivantType, number>; bio: number };
  /** Tags du marcheur présents sur la propriété, avec leur compte d'observations. */
  tagFacets?: VivantTagFacet[];
  tagsLoading?: boolean;
}

const chip = (on: boolean) =>
  `rounded-full border px-2 py-0.5 text-[10px] transition-all ${
    on
      ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
      : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/55'
  }`;

const TAG_MODE_LABEL: Record<VivantTagMode, string> = {
  or: 'Au moins un',
  and: 'Tous',
  not: 'Sauf',
};

export const LivingFilterPanel: React.FC<BarProps> = ({
  filter,
  onChange,
  counts,
  tagFacets = [],
  tagsLoading,
}) => {
  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  /* Recherche : saisie locale immédiate, propagation temporisée. */
  const [draft, setDraft] = React.useState(filter.query);
  const lastPushed = React.useRef(filter.query);
  React.useEffect(() => {
    if (filter.query !== lastPushed.current) {
      lastPushed.current = filter.query;
      setDraft(filter.query);
    }
  }, [filter.query]);
  React.useEffect(() => {
    if (draft === lastPushed.current) return;
    const id = window.setTimeout(() => {
      lastPushed.current = draft;
      onChange({ ...filter, query: draft });
    }, 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const active = isVivantFilterActive(filter);
  const searching = !!filter.query.trim();

  return (
    <div className="space-y-2.5 text-[hsl(var(--ds-forest-deep))]">
      {/* Scanner du vivant */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-45"
          aria-hidden
        />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setDraft('');
            }
          }}
          placeholder="Chercher une espèce, un latin, un marcheur…"
          aria-label="Rechercher dans les observations"
          className="w-full rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 py-1.5 pl-8 pr-7 text-[11px] text-[hsl(var(--ds-forest-deep))] outline-none transition-all placeholder:opacity-45 focus:border-[hsl(var(--ds-forest))]/70 focus:bg-[hsl(var(--ds-cream))]"
        />
        {!!draft && (
          <button
            onClick={() => setDraft('')}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <p className="text-[10px] leading-snug opacity-60">
        <span className="font-semibold">{counts.visible}</span> observations affichées sur{' '}
        {counts.total} · {counts.bio} bio-indicatrices
        {searching && (
          <span className="ml-1 italic opacity-75">— les autres restent en filigrane</span>
        )}
      </p>

      {active && (
        <button
          onClick={() => onChange({ ...DEFAULT_VIVANT_FILTER })}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/35 bg-[hsl(var(--ds-forest))]/8 px-2 py-1 text-[10px] text-[hsl(var(--ds-forest-deep))] transition-colors hover:bg-[hsl(var(--ds-forest))]/15"
        >
          <RotateCcw className="h-3 w-3" />
          Réinitialiser les filtres
        </button>
      )}

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

      {/* Mes tags */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] opacity-55">
            <TagIcon className="h-2.5 w-2.5" /> Mes tags
          </p>
          {filter.tags.labels.length > 0 && (
            <div className="flex overflow-hidden rounded-full border border-[hsl(var(--ds-line))]">
              {(['or', 'and', 'not'] as VivantTagMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onChange({ ...filter, tags: { ...filter.tags, mode: m } })}
                  className={`px-1.5 py-[1px] text-[9px] transition-colors ${
                    filter.tags.mode === m
                      ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'hover:bg-[hsl(var(--ds-forest))]/10'
                  }`}
                >
                  {TAG_MODE_LABEL[m]}
                </button>
              ))}
            </div>
          )}
        </div>

        {tagsLoading ? (
          <p className="text-[10px] italic opacity-45">Lecture de vos tags…</p>
        ) : tagFacets.length === 0 ? (
          <p className="text-[10px] leading-snug italic opacity-55">
            Aucun tag encore posé ici. Étiquetez une espèce depuis sa fiche pour la retrouver d'un
            geste.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tagFacets.map((t) => {
              const on = filter.tags.labels.includes(t.key);
              const empty = t.count === 0;
              return (
                <button
                  key={t.key}
                  onClick={() =>
                    onChange({
                      ...filter,
                      tags: { ...filter.tags, labels: toggle(filter.tags.labels, t.key) },
                    })
                  }
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all ${
                    on ? 'text-[hsl(var(--ds-cream))]' : 'border-[hsl(var(--ds-line))]'
                  } ${empty && !on ? 'opacity-40' : ''}`}
                  style={
                    on
                      ? { background: t.color, borderColor: t.color }
                      : { borderColor: `${t.color}` }
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: on ? 'currentColor' : t.color }}
                  />
                  {t.label}
                  <span className="opacity-65">{t.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default LivingLayer;
