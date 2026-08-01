import React from 'react';
import { Search, Plus, Sprout, Sparkles, Loader2, MapPin } from 'lucide-react';
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
}

interface Props {
  inPlace: HerbierEntry[];
  proposed: HerbierEntry[];
  armedKey: string | null;
  onArm: (entry: HerbierEntry | null) => void;
  placedCount: Record<string, number>;
  onAddFree: (entry: HerbierEntry) => void;
}

type TabKey = 'place' | 'proposee' | 'libre';

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
}> = ({ entry, armed, placed, onClick }) => {
  const info = STRATES[entry.strate];
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-scenographe', JSON.stringify(entry));
        e.dataTransfer.effectAllowed = 'copy';
      }}
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
 * sur le plan (clic ou glisser-déposer).
 */
export const HerbierPanel: React.FC<Props> = ({
  inPlace,
  proposed,
  armedKey,
  onArm,
  placedCount,
  onAddFree,
}) => {
  const [tab, setTab] = React.useState<TabKey>(proposed.length ? 'proposee' : 'place');
  const [term, setTerm] = React.useState('');
  const [strate, setStrate] = React.useState<Strate>('herbacee');
  const search = useInatSearch(term);

  const list = tab === 'place' ? inPlace : proposed;

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

      {armedKey && (
        <div className="mx-2.5 mt-2 rounded-lg border border-[#c8a24a]/50 bg-[#c8a24a]/10 px-2.5 py-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]">
          Espèce en main — <strong>cliquez sur le plan</strong> pour la poser.{' '}
          <button onClick={() => onArm(null)} className="underline underline-offset-2 opacity-70">
            reposer
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
        {tab === 'libre' ? (
          <>
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
            {term.trim().length >= 3 && !search.isFetching && !(search.data || []).length && (
              <p className="px-1 py-4 text-center text-[11px] opacity-50">Aucune espèce trouvée.</p>
            )}
          </>
        ) : list.length ? (
          list.map((e) => (
            <Card
              key={e.key}
              entry={e}
              armed={armedKey === e.key}
              placed={placedCount[e.key] || 0}
              onClick={() => onArm(armedKey === e.key ? null : e)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--ds-line))] px-3 py-8 text-center">
            <Sprout className="h-5 w-5 opacity-35" />
            <p className="text-[11px] opacity-60">
              {tab === 'place'
                ? 'Aucune espèce observée dans l’emprise de cet ouvrage.'
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
