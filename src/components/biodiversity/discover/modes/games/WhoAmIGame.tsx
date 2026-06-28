import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  HelpCircle,
  Sparkles,
  Leaf,
  Star,
} from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, hasPhoto } from './gameUtils';
import MysteryFrame, { type MysteryMode } from './MysteryFrame';
import WhoAmIOnboarding, { hasSeenWhoAmIOnboarding } from './WhoAmIOnboarding';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const MODES: MysteryMode[] = ['blur', 'keyhole', 'silhouette'];

const WhoAmIGame: React.FC<Props> = ({ species, photoBy }) => {
  const seenOnboarding = hasSeenWhoAmIOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(() => !seenOnboarding);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ ok: 0, ko: 0, stars: 0 });
  const [reveal, setReveal] = useState<null | { correct: boolean; pickedId: string }>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [confetti, setConfetti] = useState(0);

  const eligible = useMemo(
    () => species.filter((s) => hasPhoto(s, photoBy)),
    [species, photoBy],
  );

  const { target, options, mode } = useMemo(() => {
    const picks = pickWithPhotos(species, photoBy, 4);
    const t = picks[0];
    const m = MODES[Math.floor(Math.random() * MODES.length)];
    return { target: t, options: shuffle(picks), mode: m };
  }, [species, photoBy, round]);

  useEffect(() => {
    setHintLevel(0);
    setReveal(null);
  }, [round]);

  if (showOnboarding) {
    return (
      <div className="relative min-h-[420px]">
        <WhoAmIOnboarding open onStart={() => setShowOnboarding(false)} />
      </div>
    );
  }

  if (eligible.length < 4) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-3">🌾</div>
        <h3 className="text-3xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>
          Pas assez d'espèces pour ce jeu
        </h3>
        <p className="mt-2 text-[#3B2A1A]/70 max-w-md" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
          Essaie un autre jeu ou élargis tes filtres pour inclure plus d'espèces avec photos.
        </p>
      </div>
    );
  }

  if (!target) return null;

  const onPick = (s: BiodiversitySpecies) => {
    if (reveal) return;
    const correct = s.id === target.id;
    setReveal({ correct, pickedId: s.id });
    const gained = correct ? Math.max(0, 1 - hintLevel * 0.5) : 0;
    setScore((sc) => ({
      ok: sc.ok + (correct ? 1 : 0),
      ko: sc.ko + (correct ? 0 : 1),
      stars: +(sc.stars + gained).toFixed(1),
    }));
    if (correct) setConfetti((n) => n + 1);
    setTimeout(() => { setRound((r) => r + 1); }, 2000);
  };

  const askHint = () => {
    if (reveal) return;
    setHintLevel((h) => (h < 2 ? ((h + 1) as 0 | 1 | 2) : h));
  };

  const revealLevel = reveal ? 3 : hintLevel;

  return (
    <div className="relative">
      {/* Bandeau consigne */}
      <div
        className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-100/80 border-2 border-amber-300/60 shadow-[3px_3px_0_rgba(59,42,26,0.08)]"
        style={{ fontFamily: '"Patrick Hand", sans-serif' }}
      >
        <p className="text-base sm:text-lg text-[#3B2A1A] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
          Devine l'espèce mystère parmi les 4 propositions.
        </p>
        <button
          onClick={() => setShowOnboarding(true)}
          className="shrink-0 inline-flex items-center gap-1 text-amber-900 hover:text-amber-700 px-2.5 py-1 rounded-full bg-white/70 border border-amber-300/50 text-sm"
        >
          <HelpCircle className="h-4 w-4" /> Revoir la règle
        </button>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xl" style={{ fontFamily: '"Caveat", cursive' }}>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300/60 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> {score.ok}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 border border-rose-300/60 text-rose-800">
            <XCircle className="h-4 w-4" /> {score.ko}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300/60 text-amber-800">
            <Star className="h-4 w-4" /> {score.stars}
          </span>
        </div>
        <button
          onClick={() => { setScore({ ok: 0, ko: 0, stars: 0 }); setRound((r) => r + 1); }}
          className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50"
        >
          <RotateCw className="h-4 w-4" /> Recommencer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Cadre mystère */}
        <div className="relative">
          <motion.div
            key={`frame-${round}`}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`relative aspect-square rounded-3xl overflow-hidden border-2 ${
              reveal ? (reveal.correct ? 'border-emerald-500 ring-4 ring-emerald-300/50' : 'border-rose-500 ring-4 ring-rose-300/50') : 'border-[#3B2A1A]/20'
            } bg-white shadow-[6px_6px_0_rgba(59,42,26,0.15)]`}
          >
            <MysteryFrame
              species={target}
              photoBy={photoBy}
              mode={mode}
              revealLevel={revealLevel as 0 | 1 | 2 | 3}
            />

            {/* Halo cinématique sur bonne réponse */}
            <AnimatePresence>
              {reveal?.correct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(253,224,71,0.0) 40%, rgba(253,224,71,0.45) 100%)',
                    mixBlendMode: 'screen',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Confettis */}
            <AnimatePresence>
              {reveal?.correct && (
                <Confetti key={confetti} />
              )}
            </AnimatePresence>

            {/* Badge mode */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 shadow" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
              {reveal ? (reveal.correct ? 'Bravo !' : 'Raté…') : 'Qui suis-je ?'}
            </div>

            {/* Légende révélation */}
            <AnimatePresence>
              {reveal && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white"
                  style={{ fontFamily: '"Caveat", cursive' }}
                >
                  <p className="text-2xl leading-none">{displayName(target)}</p>
                  <p className="text-sm italic opacity-80">{target.scientificName}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Indices */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={askHint}
              disabled={!!reveal || hintLevel >= 2}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-amber-900 border-2 border-amber-300 shadow-[3px_3px_0_rgba(59,42,26,0.15)]"
              style={{ fontFamily: '"Caveat", cursive', fontSize: 20 }}
            >
              <Lightbulb className="h-4 w-4" /> Donne-moi un indice
            </button>
            <span className="text-xs text-[#3B2A1A]/60" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              {hintLevel === 0 && 'Sans indice — 1 ⭐'}
              {hintLevel === 1 && '1 indice utilisé — 0,5 ⭐'}
              {hintLevel === 2 && '2 indices — 0 ⭐'}
            </span>
          </div>
        </div>

        {/* Options */}
        <motion.div
          key={`opts-${round}-${reveal?.correct === false ? 'miss' : 'ok'}`}
          animate={reveal && !reveal.correct ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          {options.map((o) => {
            const picked = reveal?.pickedId === o.id;
            const isTarget = o.id === target.id;
            return (
              <motion.button
                key={o.id}
                whileHover={{ scale: reveal ? 1 : 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPick(o)}
                disabled={!!reveal}
                className={`relative rounded-2xl p-4 border-2 text-left transition ${
                  reveal && isTarget ? 'bg-emerald-200 border-emerald-700/30' :
                  picked && !reveal?.correct ? 'bg-rose-200 border-rose-700/30' :
                  'bg-white border-[#3B2A1A]/15 hover:bg-amber-50'
                } shadow-[3px_3px_0_rgba(59,42,26,0.12)]`}
              >
                <p className="text-2xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>{displayName(o)}</p>
                <p className="italic text-sm text-[#3B2A1A]/60">{o.scientificName}</p>
                {reveal && isTarget && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-emerald-700" />}
                {picked && !reveal?.correct && <XCircle className="absolute top-2 right-2 h-5 w-5 text-rose-700" />}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

/** Confettis légers feuilles/étoiles tombant du haut. */
const Confetti: React.FC = () => {
  const items = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 0.8,
      rotate: Math.random() * 360,
      Icon: i % 2 === 0 ? Leaf : Star,
      color: i % 2 === 0 ? 'text-emerald-500' : 'text-amber-400',
    })),
    [],
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((it) => (
        <motion.div
          key={it.id}
          initial={{ y: -20, x: `${it.x}%`, opacity: 0, rotate: 0 }}
          animate={{ y: '120%', opacity: [0, 1, 1, 0], rotate: it.rotate }}
          transition={{ duration: it.duration, delay: it.delay, ease: 'easeIn' }}
          className="absolute top-0"
        >
          <it.Icon className={`h-5 w-5 ${it.color} drop-shadow`} />
        </motion.div>
      ))}
    </div>
  );
};

export default WhoAmIGame;
