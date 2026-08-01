import React from 'react';
import { Search, Plus, Sprout, Sparkles, Loader2, MapPin, Wand2, Eraser } from 'lucide-react';
import { STRATES, STRATE_ORDER, type Strate, ECO_FUNCTIONS } from '@/lib/plantSpread';
import { useInatSearch } from '@/hooks/propriete/useInatThumbs';

export interface HerbierEntry {
  key: string;
  scientificName: string;
  commonNameFr?: string | null;
  strate: Strate;
  spreadM: number;
  origin: 'place' | 'proposee' | 'libre';
  photoUrl?: string | null;
  functions?: string[];
  note?: string | null;
  /** Nombre d'observations sur place (herbier « En place »). */
  observations?: number;
  /** Ouvrage d'où provient l'espèce, quand la portée dépasse l'ouvrage courant. */
  ouvrageNom?: string | null;
  /** Positions GPS réelles observées — servent à la pose en masse. */
  points?: Array<{ lat: number; lng: number }>;
  /** Position de l'espèce par rapport à l'emprise (herbier « En place »). */
  zone?: 'dedans' | 'lisiere' | 'voisinage';
  /** Distance minimale au bord de l'ouvrage, en mètres. */
  distanceM?: number;
}


interface Props {
  inPlace: HerbierEntry[];
  proposed: HerbierEntry[];
  armedKey: string | null;
  onArm: (entry: HerbierEntry | null) => void;
  placedCount: Record<string, number>;
  onAddFree: (entry: HerbierEntry) => void;
  /** Sélecteur de portée affiché en tête de l'onglet « En place ». */
  scopeControl?: React.ReactNode;
  /** Curseur de rigueur du périmètre, sous la portée (onglet « En place »). */
  rigourControl?: React.ReactNode;
  /** Survol d'une fiche : met en évidence ses points sur le plan. */
  onHoverEntry?: (entry: HerbierEntry | null) => void;
  /** Pose en masse des espèces affichées, à leur position GPS réelle. */
  onPlaceMany?: (entries: HerbierEntry[]) => void;
  /** Retire du plan toutes les plantations issues des espèces affichées. */
  onRemoveMany?: (entries: HerbierEntry[]) => void;
  /** Grille 2 colonnes quand le bandeau est élargi. */
  wide?: boolean;
}

const ZONE_BADGE: Record<
  NonNullable<HerbierEntry['zone']>,
  { label: string; bg: string; fg: string; ring: string }
> = {
  dedans: { label: 'dedans', bg: 'hsl(var(--ds-forest-deep) / 0.14)', fg: 'hsl(var(--ds-forest-deep))', ring: 'hsl(var(--ds-forest-deep) / 0.45)' },
  lisiere: { label: 'lisière', bg: 'rgba(200,162,74,.20)', fg: '#8a6b23', ring: 'rgba(200,162,74,.75)' },
  voisinage: { label: 'voisinage', bg: 'rgba(59,126,161,.16)', fg: '#2b5f7a', ring: 'rgba(59,126,161,.6)' },
};


type TabKey = 'place' | 'proposee' | 'libre';
type PlacedFilter = 'all' | 'todo' | 'done';

const TABS: Array<{ key: TabKey; label: string; glyph: React.ReactNode }> = [
  { key: 'place', label: 'En place', glyph: <MapPin className="h-3.5 w-3.5" /> },
  { key: 'proposee', label: 'Proposées', glyph: <Sparkles className="h-3.5 w-3.5" /> },
  { key: 'libre', label: 'Chercher', glyph: <Search className="h-3.5 w-3.5" /> },
];

const Card: React.FC<{
  entry: HerbierEntry;
  armed: boolean;
  placed: number;
  onClick: () => void;
  onHover?: (entry: HerbierEntry | null) => void;
}> = ({ entry, armed, placed, onClick, onHover }) => {
  const info = STRATES[entry.strate];
  const zone = entry.zone ? ZONE_BADGE[entry.zone] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover?.(entry)}
      onMouseLeave={() => onHover?.(null)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-scenographe', JSON.stringify(entry));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      style={
        zone && entry.zone !== 'dedans'
          ? { borderStyle: 'dashed', borderColor: zone.ring }
          : undefined
      }
      className={`group relative flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
        armed
          ? 'border-[#c8a24a] bg-[#c8a24a]/12 shadow-[0_0_0_3px_rgba(200,162,74,.18)]'
          : 'border-[hsl(var(--ds-line))] bg-white/60 hover:border-[hsl(var(--ds-forest))]/40 hover:bg-white/85'
      }`}
    >

      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[18px]"
        style={{ backgroundColor: `${info.color}22` }}
      >
        {entry.photoUrl ? (
          <img src={entry.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          info.glyph
        )}
        {placed > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ds-forest-deep))] px-1 text-[9px] font-bold text-white">
            {placed}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-semibold leading-tight text-[hsl(var(--ds-forest-deep))]">
          {entry.commonNameFr || entry.scientificName}
        </span>
        <span className="block truncate text-[10px] italic opacity-55">{entry.scientificName}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1">
          <span
            className="rounded-full px-1.5 py-px text-[9px] font-medium"
            style={{ backgroundColor: `${info.color}26`, color: info.color }}
          >
            {info.label} · Ø {entry.spreadM} m
          </span>
          {zone && (
            <span
              className="rounded-full px-1.5 py-px text-[9px] font-medium"
              style={{ backgroundColor: zone.bg, color: zone.fg }}
            >
              {zone.label}
              {entry.zone !== 'dedans' && entry.distanceM != null
                ? ` ${entry.distanceM < 10 ? entry.distanceM.toFixed(1) : Math.round(entry.distanceM)} m`
                : ''}
            </span>
          )}

          {entry.ouvrageNom && (
            <span className="max-w-[110px] truncate rounded-full bg-[hsl(var(--ds-forest-deep))]/10 px-1.5 py-px text-[9px] font-medium text-[hsl(var(--ds-forest-deep))]/75">
              {entry.ouvrageNom}
            </span>
          )}
          {(entry.functions || []).slice(0, 3).map((f) => {
            const eco = ECO_FUNCTIONS.find((x) => x.key === f);
            return eco ? (
              <span key={f} title={eco.label} className="text-[10px]">
                {eco.glyph}
              </span>
            ) : null;
          })}
          {entry.observations ? (
            <span className="text-[9px] opacity-50">{entry.observations} obs.</span>
          ) : null}
        </span>
      </span>
    </button>
  );
};

/**
 * L'Herbier : trois registres de puisage — ce que le lieu porte déjà, ce que
 * l'IA propose, et la recherche libre. On « arme » une espèce, puis on la pose
 * sur le plan (clic ou glisser-déposer). Les espèces en place peuvent aussi
 * être posées en une fois, à leur position réelle d'observation.
 */
export const HerbierPanel: React.FC<Props> = ({
  inPlace,
  proposed,
  armedKey,
  onArm,
  placedCount,
  onAddFree,
  scopeControl,
  rigourControl,
  onHoverEntry,

  onPlaceMany,
  onRemoveMany,
  wide,
}) => {
  const [tab, setTab] = React.useState<TabKey>(proposed.length ? 'proposee' : 'place');
  const [term, setTerm] = React.useState('');
  const [strate, setStrate] = React.useState<Strate>('herbacee');
  const [placedFilter, setPlacedFilter] = React.useState<PlacedFilter>('all');
  const search = useInatSearch(term);

  const base = tab === 'place' ? inPlace : proposed;
  const isPlaced = React.useCallback((e: HerbierEntry) => (placedCount[e.key] || 0) > 0, [placedCount]);

  const list = React.useMemo(() => {
    if (tab === 'libre') return [];
    if (placedFilter === 'todo') return base.filter((e) => !isPlaced(e));
    if (placedFilter === 'done') return base.filter(isPlaced);
    return base;
  }, [base, placedFilter, isPlaced, tab]);

  const todoCount = base.filter((e) => !isPlaced(e)).length;
  const doneCount = base.length - todoCount;

  const FILTERS: Array<{ key: PlacedFilter; label: string; n: number }> = [
    { key: 'all', label: 'Toutes', n: base.length },
    { key: 'todo', label: 'À poser', n: todoCount },
    { key: 'done', label: 'Posées', n: doneCount },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-[hsl(var(--ds-line))]/70 px-2.5 py-2">
        {TABS.map((t) => {
          const n = t.key === 'place' ? inPlace.length : t.key === 'proposee' ? proposed.length : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[hsl(var(--ds-forest-deep))] text-white'
                  : 'text-[hsl(var(--ds-forest-deep))]/65 hover:bg-white/70'
              }`}
            >
              {t.glyph}
              {t.label}
              {n != null && (
                <span className={`text-[9.5px] ${tab === t.key ? 'opacity-70' : 'opacity-50'}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab !== 'libre' && (
        <div className="space-y-2 border-b border-[hsl(var(--ds-line))]/60 px-2.5 py-2">
          {tab === 'place' && scopeControl}
          {tab === 'place' && rigourControl}


          <div className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setPlacedFilter(f.key)}
                className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium transition-colors ${
                  placedFilter === f.key
                    ? 'bg-[#c8a24a] text-white'
                    : 'bg-white/60 text-[hsl(var(--ds-forest-deep))]/65 hover:bg-white'
                }`}
              >
                {f.label} <span className="opacity-70">{f.n}</span>
              </button>
            ))}
          </div>

          {(onPlaceMany || onRemoveMany) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {onPlaceMany && (
                <button
                  onClick={() => onPlaceMany(list.filter((e) => !isPlaced(e)))}
                  disabled={!list.some((e) => !isPlaced(e))}
                  className="flex items-center gap-1 rounded-lg bg-[hsl(var(--ds-forest-deep))] px-2 py-1 text-[10px] font-medium text-white transition-opacity disabled:opacity-35"
                >
                  <Wand2 className="h-3 w-3" />
                  Tout poser
                </button>
              )}
              {onRemoveMany && (
                <button
                  onClick={() => onRemoveMany(list.filter(isPlaced))}
                  disabled={!list.some(isPlaced)}
                  className="flex items-center gap-1 rounded-lg border border-[#c1663f]/40 px-2 py-1 text-[10px] font-medium text-[#c1663f] transition-opacity hover:bg-[#c1663f]/10 disabled:opacity-35"
                >
                  <Eraser className="h-3 w-3" />
                  Tout retirer
                </button>
              )}
              <span className="text-[9.5px] italic opacity-50">à leur position réelle</span>
            </div>
          )}
        </div>
      )}

      {armedKey && (
        <div className="mx-2.5 mt-2 rounded-lg border border-[#c8a24a]/50 bg-[#c8a24a]/10 px-2.5 py-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]">
          Espèce en main — <strong>cliquez sur le plan</strong> pour la poser.{' '}
          <button onClick={() => onArm(null)} className="underline underline-offset-2 opacity-70">
            reposer
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {tab === 'libre' ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 opacity-45" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Nom français ou latin…"
                className="w-full bg-transparent text-[11.5px] outline-none"
              />
              {search.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin opacity-45" />}
            </div>
            <div className="flex flex-wrap gap-1 pb-1">
              {STRATE_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setStrate(s)}
                  className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium transition-colors ${
                    strate === s ? 'text-white' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: strate === s ? STRATES[s].color : `${STRATES[s].color}20`,
                    color: strate === s ? '#fff' : STRATES[s].color,
                  }}
                >
                  {STRATES[s].glyph} {STRATES[s].label}
                </button>
              ))}
            </div>
            <div className={wide ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'}>
              {(search.data || []).map((r) => (
                <Card
                  key={r.scientificName}
                  entry={{
                    key: `libre:${r.scientificName}`,
                    scientificName: r.scientificName,
                    commonNameFr: r.commonName,
                    strate,
                    spreadM: STRATES[strate].spreadM,
                    origin: 'libre',
                    photoUrl: r.photoUrl,
                  }}
                  armed={armedKey === `libre:${r.scientificName}`}
                  placed={placedCount[`libre:${r.scientificName}`] || 0}
                  onClick={() =>
                    onAddFree({
                      key: `libre:${r.scientificName}`,
                      scientificName: r.scientificName,
                      commonNameFr: r.commonName,
                      strate,
                      spreadM: STRATES[strate].spreadM,
                      origin: 'libre',
                      photoUrl: r.photoUrl,
                    })
                  }
                />
              ))}
            </div>
            {term.trim().length >= 3 && !search.isFetching && !(search.data || []).length && (
              <p className="px-1 py-4 text-center text-[11px] opacity-50">Aucune espèce trouvée.</p>
            )}
          </div>
        ) : list.length ? (
          <div className={wide ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5'}>
            {list.map((e) => (
              <Card
                key={e.key}
                entry={e}
                armed={armedKey === e.key}
                placed={placedCount[e.key] || 0}
                onClick={() => onArm(armedKey === e.key ? null : e)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--ds-line))] px-3 py-8 text-center">
            <Sprout className="h-5 w-5 opacity-35" />
            <p className="text-[11px] opacity-60">
              {tab === 'place'
                ? 'Aucune espèce observée dans cette portée — élargissez à d’autres ouvrages ou à toute la propriété.'
                : 'Aucune proposition. Demandez une palette à l’IA de Jardin, puis rouvrez le Scénographe depuis sa synthèse.'}
            </p>
          </div>
        )}
      </div>

      <p className="border-t border-[hsl(var(--ds-line))]/70 px-2.5 py-1.5 text-[9.5px] leading-snug opacity-50">
        <Plus className="mr-1 inline h-3 w-3" />
        Cliquez une fiche pour la prendre en main, ou glissez-la directement sur le plan.
      </p>
    </div>
  );
};

export default HerbierPanel;
