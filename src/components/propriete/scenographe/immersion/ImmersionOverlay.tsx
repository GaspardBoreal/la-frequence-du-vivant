import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Scissors, Orbit, SplitSquareHorizontal, Clapperboard } from 'lucide-react';

import { fullscreenSurfaces } from '@/lib/uiOverlayLevel';
import { sizeAt, centroidOf } from '@/lib/immersion/growthModel';
import { SEASON_LABELS, type SeasonKey } from '@/lib/immersion/silhouettes';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';

import CoupeVivante from './CoupeVivante';
import DomePanorama from './DomePanorama';
import AvantApres from './AvantApres';
import FilmSequence, { type FilmStats } from './FilmSequence';

type Mode = 'coupe' | 'dome' | 'avant' | 'film';

const MODES: { key: Mode; label: string; hint: string; icon: React.ComponentType<any> }[] = [
  { key: 'coupe', label: 'Coupe vivante', hint: 'La tranche du massif, à l\u2019échelle', icon: Scissors },
  { key: 'dome', label: 'Le Dôme', hint: 'Au milieu, à hauteur d\u2019homme', icon: Orbit },
  { key: 'avant', label: 'Avant / Après', hint: 'La photo réelle et son futur', icon: SplitSquareHorizontal },
  { key: 'film', label: 'Le Film', hint: 'La séquence complète', icon: Clapperboard },
];

const SEASON_KEYS: SeasonKey[] = ['printemps', 'ete', 'automne', 'hiver'];

interface Props {
  plantings: Planting[];
  photos: ObjetPhoto[];
  scenarioName: string;
  ouvrageName: string;
  onClose: () => void;
}

/**
 * La Chambre du Vivant : la surface où le scénario cesse d'être un plan vu
 * de dessus pour devenir un lieu où l'on se tient.
 */
export const ImmersionOverlay: React.FC<Props> = ({
  plantings,
  photos,
  scenarioName,
  ouvrageName,
  onClose,
}) => {
  const [mode, setMode] = React.useState<Mode>('coupe');
  const [year, setYear] = React.useState(10);
  const [season, setSeason] = React.useState<SeasonKey>('ete');
  const [origin, setOrigin] = React.useState<'all' | 'place' | 'proposee'>('all');

  React.useEffect(() => {
    fullscreenSurfaces.push();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      fullscreenSurfaces.pop();
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const visible = React.useMemo(
    () => (origin === 'all' ? plantings : plantings.filter((p) => (origin === 'place' ? p.origin === 'place' : p.origin !== 'place'))),
    [plantings, origin],
  );
  const center = React.useMemo(() => centroidOf(plantings), [plantings]);

  const stats: FilmStats = React.useMemo(() => {
    const fonctions = new Set<string>();
    const strates = new Set<string>();
    let couverture = 0;
    plantings.forEach((p) => {
      (p.functions || []).forEach((f) => fonctions.add(f));
      strates.add(p.strate);
      const s = sizeAt(p, 10);
      couverture += Math.PI * (s.spreadM / 2) ** 2;
    });
    return {
      total: plantings.length,
      enPlace: plantings.filter((p) => p.origin === 'place').length,
      proposees: plantings.filter((p) => p.origin !== 'place').length,
      strates: strates.size,
      fonctions: fonctions.size,
      couvertureM2: couverture,
    };
  }, [plantings]);

  const scene = { plantings: visible, center, photos, year, season };

  return createPortal(
    <div className="fixed inset-0 z-[3000] bg-[#0b1512] text-[#f2ece0]">
      {/* Molette des immersions */}
      <div className="absolute left-0 top-0 bottom-0 z-20 w-[68px] sm:w-[210px] border-r border-[#c8a24a]/15 bg-black/40 backdrop-blur-xl flex flex-col">
        <div className="px-3 sm:px-4 pt-4 pb-3">
          <div className="text-[9px] uppercase tracking-[0.3em] text-[#c8a24a]">La Chambre</div>
          <div className="hidden sm:block font-serif italic text-lg leading-tight mt-1">du Vivant</div>
        </div>
        <div className="flex-1 px-2 space-y-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-current={active}
                className={`group w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                  active ? 'bg-[#c8a24a]/15 border border-[#c8a24a]/40' : 'border border-transparent hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#c8a24a]' : 'text-[#f2ece0]/60'}`} />
                <span className="hidden sm:block min-w-0">
                  <span className={`block text-[12.5px] font-semibold ${active ? 'text-[#f2ece0]' : 'text-[#f2ece0]/75'}`}>
                    {m.label}
                  </span>
                  <span className="block text-[10px] text-[#f2ece0]/45 truncate">{m.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="hidden sm:block px-4 pb-4 text-[10px] leading-relaxed text-[#f2ece0]/35">
          {stats.total} espèces · {stats.enPlace} en place · {stats.proposees} proposées
        </div>
      </div>

      {/* Scène */}
      <div className="absolute inset-y-0 left-[68px] sm:left-[210px] right-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0 pb-16"
          >
            {mode === 'coupe' && <CoupeVivante {...scene} />}
            {mode === 'dome' && <DomePanorama {...scene} />}
            {mode === 'avant' && <AvantApres {...scene} />}
            {mode === 'film' && (
              <FilmSequence
                plantings={visible}
                center={center}
                photos={photos}
                scenarioName={scenarioName}
                ouvrageName={ouvrageName}
                stats={stats}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bandeau commun : le Souffle */}
        {mode !== 'film' && (
          <div className="absolute inset-x-0 bottom-0 h-16 z-20 border-t border-[#c8a24a]/15 bg-black/55 backdrop-blur-xl px-4 flex items-center gap-5 overflow-x-auto">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[9px] uppercase tracking-[0.26em] text-[#c8a24a]">Année</span>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-40 accent-[#c8a24a]"
                aria-label="Année du projet"
              />
              <span className="text-[12px] tabular-nums w-12">An {year.toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {SEASON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSeason(k)}
                  aria-current={season === k}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                    season === k ? 'bg-[#c8a24a] text-[#0b1512] font-semibold' : 'text-[#f2ece0]/60 hover:bg-white/8'
                  }`}
                >
                  {SEASON_LABELS[k].glyph} {SEASON_LABELS[k].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {([
                ['all', 'Tout'],
                ['place', 'En place'],
                ['proposee', 'Proposées'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setOrigin(k)}
                  aria-current={origin === k}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    origin === k
                      ? 'border-[#c8a24a]/60 bg-[#c8a24a]/15 text-[#f2ece0]'
                      : 'border-white/12 text-[#f2ece0]/55 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="ml-auto shrink-0 text-[10px] text-[#f2ece0]/35">
              {visible.length} espèce{visible.length > 1 ? 's' : ''} en scène
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <div className="hidden sm:block rounded-full bg-black/50 backdrop-blur px-3 py-1.5 text-[11px] text-[#f2ece0]/70">
          {ouvrageName} · <span className="font-serif italic text-[#f2ece0]">{scenarioName}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 grid place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur hover:bg-black/70 transition"
          aria-label="Fermer l'immersion"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default ImmersionOverlay;
