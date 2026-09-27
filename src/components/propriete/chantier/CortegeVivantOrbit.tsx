import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, List, Orbit, X } from 'lucide-react';
import { CHANTIER_RADIUS_PRESETS, radiusLabel } from '@/lib/chantierIcg';

export interface OrbitSpecies {
  key: string;
  scientificName: string;
  name: string;
  kingdom: string | null;
  photoUrl: string | null;
  /** Distance minimale au bord du tracé (0 = dedans). */
  distanceM: number;
  obs: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

interface Props {
  species: OrbitSpecies[];
  radiusM: number;
  onRadius: (r: number) => void;
  workDate: string | null;
  centerLabel: string;
  hasTrace: boolean;
  onAttachZone?: () => void;
  onLocate?: (scientificName: string) => void;
}

type Kingdom = 'tout' | 'flore' | 'faune' | 'autres';
const kingdomOf = (k: string | null): Exclude<Kingdom, 'tout'> => {
  const v = (k || '').toLowerCase();
  if (v === 'plantae') return 'flore';
  if (v === 'animalia') return 'faune';
  return 'autres';
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—';

const SIZE = 360;
const C = SIZE / 2;
const INNER = 58;
const OUTER = 162;
const MAX_NODES = 150;

/**
 * « Cortège vivant » : les espèces du chantier en orbites autour de ses tracés.
 * L'anneau reflète la distance au bord (dedans au plus près), le curseur
 * temporel rejoue l'arrivée des espèces, la date des travaux en repère.
 */
export const CortegeVivantOrbit: React.FC<Props> = ({
  species,
  radiusM,
  onRadius,
  workDate,
  centerLabel,
  hasTrace,
  onAttachZone,
  onLocate,
}) => {
  const [kingdom, setKingdom] = React.useState<Kingdom>('tout');
  const [view, setView] = React.useState<'orbite' | 'liste'>('orbite');
  const [picked, setPicked] = React.useState<OrbitSpecies | null>(null);

  const dates = React.useMemo(
    () =>
      species
        .map((s) => (s.firstSeen ? new Date(s.firstSeen).getTime() : NaN))
        .filter(Number.isFinite)
        .sort((a, b) => a - b),
    [species],
  );
  const tMin = dates[0] ?? Date.now();
  const tMax = Math.max(dates[dates.length - 1] ?? Date.now(), tMin + 1);
  const [t, setT] = React.useState<number>(tMax);
  React.useEffect(() => setT(tMax), [tMax]);
  const workT = workDate ? new Date(workDate).getTime() : null;

  const counts = React.useMemo(() => {
    const c = { flore: 0, faune: 0, autres: 0 };
    species.forEach((s) => (c[kingdomOf(s.kingdom)] += 1));
    return c;
  }, [species]);

  const filtered = React.useMemo(
    () => species.filter((s) => kingdom === 'tout' || kingdomOf(s.kingdom) === kingdom),
    [species, kingdom],
  );
  const visible = React.useMemo(
    () =>
      filtered.filter((s) => !s.firstSeen || new Date(s.firstSeen).getTime() <= t),
    [filtered, t],
  );

  const maxD = Math.max(radiusM, 1);
  const nodes = React.useMemo(
    () =>
      [...visible]
        .sort((a, b) => a.distanceM - b.distanceM || b.obs - a.obs)
        .slice(0, MAX_NODES)
        .map((s) => {
          const r =
            s.distanceM <= 0
              ? INNER + 10 + hash(s.key + 'r') * 22
              : INNER + 38 + (Math.sqrt(s.distanceM / maxD) * (OUTER - INNER - 38));
          const a = hash(s.key) * Math.PI * 2;
          return { s, x: C + r * Math.cos(a), y: C + r * Math.sin(a), size: 9 + Math.min(8, s.obs * 1.4) };
        }),
    [visible, maxD],
  );

  const rings = radiusM > 0 ? [0.25, 0.5, 1].map((f) => INNER + 38 + Math.sqrt(f) * (OUTER - INNER - 38)) : [];

  if (!hasTrace) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center">
        <Orbit className="mx-auto mb-2 h-8 w-8 text-[#c8a24a]" />
        <p className="text-[14px] font-semibold">Aucun tracé rattaché à ce chantier</p>
        <p className="mx-auto mt-1 max-w-[40ch] text-[12.5px] opacity-65">
          Rattachez un emplacement ou un ouvrage pour voir le cortège vivant qui l'habite.
        </p>
        {onAttachZone && (
          <button
            type="button"
            onClick={onAttachZone}
            className="mt-4 min-h-11 rounded-full border border-[#c8a24a] bg-[#c8a24a]/15 px-4 text-[13px] text-[#e7d3a1]"
          >
            Rattacher un emplacement
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Rayon d'écoute : puces défilantes, pouce-friendly */}
      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
        {CHANTIER_RADIUS_PRESETS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRadius(r)}
            aria-pressed={radiusM === r}
            className={`min-h-10 shrink-0 snap-start rounded-full border px-3 text-[12px] transition ${
              radiusM === r
                ? 'border-[#c8a24a] bg-[#c8a24a]/20 font-semibold text-[#e7d3a1]'
                : 'border-white/15 opacity-70'
            }`}
          >
            {radiusLabel(r)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {(
          [
            ['tout', `Tout ${species.length}`],
            ['flore', `Flore ${counts.flore}`],
            ['faune', `Faune ${counts.faune}`],
            ['autres', `Autres ${counts.autres}`],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKingdom(k)}
            className={`min-h-9 rounded-full px-2.5 text-[11.5px] tabular-nums transition ${
              kingdom === k ? 'bg-white/15 font-semibold' : 'opacity-60'
            }`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setView((v) => (v === 'orbite' ? 'liste' : 'orbite'))}
          className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/15"
          aria-label={view === 'orbite' ? 'Afficher en liste' : 'Afficher en orbites'}
        >
          {view === 'orbite' ? <List className="h-4 w-4" /> : <Orbit className="h-4 w-4" />}
        </button>
      </div>

      {view === 'orbite' ? (
        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
            <defs>
              <radialGradient id="cv-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c8a24a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c8a24a" stopOpacity="0" />
              </radialGradient>
              <clipPath id="cv-dot">
                <circle cx="0" cy="0" r="1" />
              </clipPath>
            </defs>
            <AnimatePresence>
              {rings.map((r, i) => (
                <motion.circle
                  key={`${radiusM}-${i}`}
                  cx={C}
                  cy={C}
                  initial={{ r: INNER, opacity: 0 }}
                  animate={{ r, opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="2 5"
                />
              ))}
            </AnimatePresence>
            <circle cx={C} cy={C} r={INNER + 34} fill="rgba(200,162,74,0.06)" stroke="rgba(200,162,74,0.45)" />
            <circle cx={C} cy={C} r={INNER} fill="url(#cv-core)" />
            <text x={C} y={C - 4} textAnchor="middle" fontSize="11" fill="#e7d3a1" fontWeight={600}>
              {centerLabel.length > 22 ? centerLabel.slice(0, 21) + '…' : centerLabel}
            </text>
            <text x={C} y={C + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)">
              {visible.length} espèce{visible.length > 1 ? 's' : ''} · {radiusLabel(radiusM)}
            </text>
            <AnimatePresence>
              {nodes.map(({ s, x, y, size }) => {
                const after = workT != null && s.firstSeen && new Date(s.firstSeen).getTime() > workT;
                const k = kingdomOf(s.kingdom);
                const ring = after ? '#c8a24a' : k === 'flore' ? '#6fbf8a' : k === 'faune' ? '#7fb2d9' : '#c9a3d6';
                return (
                  <motion.g
                    key={s.key}
                    initial={{ opacity: 0, scale: 0.2, x: C, y: C }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0.2 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                    onClick={() => setPicked(s)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r={size + 2} fill={ring} opacity={picked?.key === s.key ? 1 : 0.85} />
                    {s.photoUrl ? (
                      <image
                        href={s.photoUrl}
                        x={-size}
                        y={-size}
                        width={size * 2}
                        height={size * 2}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="url(#cv-dot)"
                        transform={`scale(1)`}
                        style={{ clipPath: `circle(${size}px at ${size}px ${size}px)` }}
                      />
                    ) : (
                      <circle r={size} fill="rgba(0,0,0,0.45)" />
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
          {visible.length > MAX_NODES && (
            <p className="absolute bottom-0 left-0 right-0 text-center text-[10.5px] opacity-55">
              {MAX_NODES} espèces les plus proches affichées — basculez en liste pour tout voir.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {[...visible]
            .sort((a, b) => a.distanceM - b.distanceM || a.name.localeCompare(b.name))
            .map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setPicked(s)}
                  className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left"
                >
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-white/10" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{s.name}</span>
                    <span className="block truncate text-[11px] italic opacity-55">{s.scientificName}</span>
                  </span>
                  <span className="text-[11px] tabular-nums opacity-65">
                    {s.distanceM <= 0 ? 'dedans' : `${Math.round(s.distanceM)} m`}
                  </span>
                </button>
              </li>
            ))}
          {visible.length === 0 && (
            <li className="px-3 py-6 text-center text-[12.5px] italic opacity-60">
              Aucune espèce dans ce périmètre — élargissez le rayon.
            </li>
          )}
        </ul>
      )}

      {/* Curseur temporel */}
      {dates.length > 1 && (
        <div className="rounded-xl border border-white/10 px-3 py-2.5">
          <div className="mb-1 flex justify-between text-[10.5px] uppercase tracking-[0.14em] opacity-60">
            <span>Avant</span>
            <span className="normal-case tracking-normal text-[#e7d3a1]">
              jusqu'à {fmt(new Date(t).toISOString())}
            </span>
            <span>Après</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={tMin}
              max={tMax}
              step={86400000}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="h-8 w-full accent-[#c8a24a]"
              aria-label="Rejouer l'arrivée des espèces dans le temps"
            />
            {workT != null && workT > tMin && workT < tMax && (
              <span
                className="pointer-events-none absolute top-0 h-8 w-0.5 bg-[#c8a24a]"
                style={{ left: `${((workT - tMin) / (tMax - tMin)) * 100}%` }}
                title="Date des travaux"
              />
            )}
          </div>
          <p className="mt-1 text-[10.5px] opacity-50">
            Liseré doré : espèce apparue après la date des travaux.
          </p>
        </div>
      )}

      {/* Fiche espèce en tiroir bas */}
      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="sticky bottom-2 z-10 flex items-center gap-3 rounded-2xl border border-[#c8a24a]/40 bg-[hsl(var(--ds-forest-deep))] p-3 shadow-xl"
          >
            {picked.photoUrl ? (
              <img src={picked.photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span className="h-14 w-14 rounded-xl bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{picked.name}</p>
              <p className="truncate text-[11px] italic opacity-60">{picked.scientificName}</p>
              <p className="mt-0.5 text-[11px] opacity-75">
                {picked.obs} obs. · {picked.distanceM <= 0 ? 'dans le tracé' : `à ${Math.round(picked.distanceM)} m du bord`} ·{' '}
                {fmt(picked.firstSeen)} → {fmt(picked.lastSeen)}
              </p>
            </div>
            {onLocate && (
              <button
                type="button"
                onClick={() => onLocate(picked.scientificName)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15"
                aria-label="Situer sur la carte"
              >
                <MapPin className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CortegeVivantOrbit;
