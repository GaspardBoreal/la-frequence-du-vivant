import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

import CoupeVivante from './CoupeVivante';
import DomePanorama from './DomePanorama';
import AvantApres from './AvantApres';
import type { ImmersionSceneProps } from './types';
import { SEASON_LABELS, type SeasonKey } from '@/lib/immersion/silhouettes';

export interface FilmStats {
  total: number;
  enPlace: number;
  proposees: number;
  strates: number;
  fonctions: number;
  couvertureM2: number;
}

interface Props extends Omit<ImmersionSceneProps, 'year' | 'season' | 'cinematic'> {
  scenarioName: string;
  ouvrageName: string;
  stats: FilmStats;
}

const D = { titre: 4, coupe: 9, dome: 8, avant: 7, fin: 6 };
const TOTAL = D.titre + D.coupe + D.dome + D.avant + D.fin;

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

/**
 * Le Film du scénario : une séquence continue qui traverse les trois
 * immersions et se referme sur la carte de synthèse. Rien à régler,
 * juste à regarder — c'est la version que l'on montre au propriétaire.
 */
export const FilmSequence: React.FC<Props> = ({
  plantings,
  center,
  photos,
  scenarioName,
  ouvrageName,
  stats,
}) => {
  const [t, setT] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [season, setSeason] = React.useState<SeasonKey>('ete');

  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((v) => {
        const nv = v + dt;
        if (nv >= TOTAL) {
          setPlaying(false);
          return TOTAL;
        }
        return nv;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  /* Les saisons défilent pendant le chapitre du dôme. */
  React.useEffect(() => {
    const domeStart = D.titre + D.coupe;
    if (t < domeStart || t > domeStart + D.dome) return;
    const k = (t - domeStart) / D.dome;
    const order: SeasonKey[] = ['printemps', 'ete', 'automne', 'hiver'];
    setSeason(order[Math.min(3, Math.floor(k * 4))]);
  }, [t]);

  let chapter: 'titre' | 'coupe' | 'dome' | 'avant' | 'fin' = 'titre';
  let local = t;
  if (local > D.titre) {
    local -= D.titre;
    chapter = 'coupe';
    if (local > D.coupe) {
      local -= D.coupe;
      chapter = 'dome';
      if (local > D.dome) {
        local -= D.dome;
        chapter = 'avant';
        if (local > D.avant) {
          local -= D.avant;
          chapter = 'fin';
        }
      }
    }
  }

  const scene = { plantings, center, photos, cinematic: true as const };

  return (
    <div className="relative w-full h-full bg-[#0b1512] overflow-hidden">
      <AnimatePresence mode="wait">
        {chapter === 'titre' && (
          <motion.div
            key="titre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center text-center px-8"
          >
            <div>
              <motion.div
                initial={{ letterSpacing: '0.6em', opacity: 0 }}
                animate={{ letterSpacing: '0.3em', opacity: 1 }}
                transition={{ duration: 2.2, ease: [0.19, 1, 0.22, 1] }}
                className="text-[10px] uppercase text-[#c8a24a]"
              >
                Atelier du jardin nourricier
              </motion.div>
              <motion.h2
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
                className="mt-4 font-serif italic text-4xl sm:text-6xl text-[#f2ece0]"
              >
                {scenarioName}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.65 }}
                transition={{ delay: 1.4, duration: 1.4 }}
                className="mt-3 text-sm text-[#f2ece0]"
              >
                {ouvrageName} · {stats.total} espèces · dix années en trente secondes
              </motion.p>
            </div>
          </motion.div>
        )}

        {chapter === 'coupe' && (
          <motion.div key="coupe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <CoupeVivante
              {...scene}
              season="ete"
              year={lerp(0, 10, local / D.coupe)}
              angleDeg={lerp(-15, 35, local / D.coupe)}
            />
            <Caption text={`An ${Math.round(lerp(0, 10, local / D.coupe))} — l'ouvrage prend son ampleur`} />
          </motion.div>
        )}

        {chapter === 'dome' && (
          <motion.div key="dome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <DomePanorama {...scene} season={season} year={10} yawOverride={lerp(0, Math.PI * 1.6, local / D.dome)} />
            <Caption text={`${SEASON_LABELS[season].glyph} ${SEASON_LABELS[season].label} — au milieu du massif`} />
          </motion.div>
        )}

        {chapter === 'avant' && (
          <motion.div key="avant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <AvantApres {...scene} season="ete" year={10} splitOverride={lerp(0.95, 0.06, local / D.avant)} />
            <Caption text="Aujourd'hui · dans dix ans" />
          </motion.div>
        )}

        {chapter === 'fin' && (
          <motion.div
            key="fin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 grid place-items-center px-8"
          >
            <div className="w-full max-w-3xl">
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#c8a24a] text-center">
                Ce que ce scénario engage
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat n={stats.total} label="espèces posées" />
                <Stat n={stats.enPlace} label="déjà en place" />
                <Stat n={stats.proposees} label="proposées" />
                <Stat n={stats.strates} label="strates mobilisées" />
                <Stat n={stats.fonctions} label="fonctions écologiques" />
                <Stat n={Math.round(stats.couvertureM2)} label="m² couverts à 10 ans" />
              </div>
              <p className="mt-8 text-center font-serif italic text-[#f2ece0]/70">
                « Un jardin ne se dessine pas : il se laisse advenir, avec méthode. »
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de lecture */}
      <div className="absolute inset-x-0 bottom-0 p-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (t >= TOTAL ? (setT(0), setPlaying(true)) : setPlaying((v) => !v))}
          className="h-9 w-9 grid place-items-center rounded-full border border-[#c8a24a]/40 bg-black/50 text-[#c8a24a] backdrop-blur hover:bg-black/70 transition"
          aria-label="Lecture"
        >
          {t >= TOTAL ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div
          className="relative h-1 flex-1 rounded-full bg-white/12 cursor-pointer"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setT(((e.clientX - r.left) / r.width) * TOTAL);
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#c8a24a]" style={{ width: `${(t / TOTAL) * 100}%` }} />
        </div>
        <span className="text-[11px] tabular-nums text-[#f2ece0]/60 w-16 text-right">
          {t.toFixed(0)}s / {TOTAL}s
        </span>
      </div>
    </div>
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute left-6 bottom-12 text-[#f2ece0] font-serif italic text-lg drop-shadow"
  >
    {text}
  </motion.div>
);

const Stat: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div className="rounded-2xl border border-[#c8a24a]/25 bg-white/[0.04] px-4 py-3 backdrop-blur">
    <div className="text-3xl font-serif text-[#f2ece0]">{n}</div>
    <div className="text-[10px] uppercase tracking-[0.2em] text-[#f2ece0]/50 mt-1">{label}</div>
  </div>
);

export default FilmSequence;
