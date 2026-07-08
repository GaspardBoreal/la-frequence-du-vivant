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
  Flag,
} from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, hasPhoto, photoUrl } from './gameUtils';
import MysteryFrame, { type MysteryMode, type RevealLevel } from './MysteryFrame';
import ZoomLoupeButton from './ZoomLoupeButton';
import ZoomLightbox from './ZoomLightbox';
import WhoAmIOnboarding, { hasSeenWhoAmIOnboarding } from './WhoAmIOnboarding';
import {
  getKingdomHint,
  getInitialHint,
  getFamilyEcologyHint,
  getRevealedLettersHint,
} from './whoAmIHints';
import { useGameToolbar } from './GameToolbarContext';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const MODES: MysteryMode[] = ['blur', 'keyhole', 'silhouette'];
const MAX_HINTS = 4;
// Malus cumulés (étoiles soustraites) après n indices : 0, 0.25, 0.5, 0.75, 1
const MALUS: number[] = [0, 0.25, 0.5, 0.75, 1];

type HintLevel = 0 | 1 | 2 | 3 | 4;

const HINT_LABEL: Record<HintLevel, string> = {
  0: 'Sans indice — 1 ⭐',
  1: '1 indice — 0,75 ⭐',
  2: '2 indices — 0,5 ⭐',
  3: '3 indices — 0,25 ⭐',
  4: '4 indices — 0 ⭐',
};

const WhoAmIGame: React.FC<Props> = ({ species, photoBy }) => {
  const seenOnboarding = hasSeenWhoAmIOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(() => !seenOnboarding);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ ok: 0, ko: 0, stars: 0 });
  const [reveal, setReveal] = useState<null | { correct: boolean; pickedId: string; gaveUp?: boolean }>(null);
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  useEffect(() => { setZoomOpen(false); }, [round]);

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
    setHintToast(null);
  }, [round]);

  // Auto-hide toast indices
  useEffect(() => {
    if (!hintToast) return;
    const t = setTimeout(() => setHintToast(null), 1800);
    return () => clearTimeout(t);
  }, [hintToast]);

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
    const gained = correct ? Math.max(0, 1 - MALUS[hintLevel]) : 0;
    setScore((sc) => ({
      ok: sc.ok + (correct ? 1 : 0),
      ko: sc.ko + (correct ? 0 : 1),
      stars: +(sc.stars + gained).toFixed(2),
    }));
    if (correct) setConfetti((n) => n + 1);
    setTimeout(() => { setRound((r) => r + 1); }, 2200);
  };

  const askHint = () => {
    if (reveal) return;
    if (hintLevel >= MAX_HINTS) return;
    const next = (hintLevel + 1) as HintLevel;
    setHintLevel(next);
    const toasts = [
      'Petit coup de pouce 🌱',
      'On t\'aide encore un peu ✨',
      'Allez, presque… 🌿',
      'Dernier indice 🔓',
    ];
    setHintToast(toasts[next - 1] ?? 'Indice !');
  };

  const giveUp = () => {
    if (reveal) return;
    setReveal({ correct: false, pickedId: '', gaveUp: true });
    setScore((sc) => ({ ok: sc.ok, ko: sc.ko + 1, stars: sc.stars }));
    setTimeout(() => { setRound((r) => r + 1); }, 2800);
  };

  const revealLevel: RevealLevel = reveal ? 5 : (hintLevel as RevealLevel);

  // Indices texte cumulés selon le palier
  const kingdomHint = getKingdomHint(target);
  const initialHint = hintLevel >= 2 ? getInitialHint(target) : null;
  const familyHint = hintLevel >= 3 ? getFamilyEcologyHint(target) : null;
  const lettersHint = hintLevel >= 4 ? getRevealedLettersHint(target) : null;

  return (
    <div className="relative">
      <WhoAmIToolbarBridge
        onRule={() => setShowOnboarding(true)}
        onReset={() => { setScore({ ok: 0, ko: 0, stars: 0 }); setRound((r) => r + 1); }}
      />
      {/* Bandeau consigne + score fusionnés */}
      <div
        className="mb-4 px-4 py-2.5 rounded-2xl bg-amber-100/80 border-2 border-amber-300/60 shadow-[3px_3px_0_rgba(59,42,26,0.08)] flex items-center justify-center gap-3 flex-wrap"
        style={{ fontFamily: '"Patrick Hand", sans-serif' }}
      >
        <div className="flex items-center gap-2" style={{ fontFamily: '"Caveat", cursive', fontSize: 20 }}>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300/60 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> {score.ok}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300/60 text-rose-800">
            <XCircle className="h-4 w-4" /> {score.ko}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300/60 text-amber-800">
            <Star className="h-4 w-4" /> {score.stars}
          </span>
        </div>
        <span className="text-[#3B2A1A]/30 select-none">·</span>
        <p className="text-base sm:text-lg text-[#3B2A1A] flex items-center gap-2 text-center">
          <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
          Devine l'espèce mystère parmi les 4 propositions.
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Cadre mystère */}
        <div className="relative">
          <motion.div
            key={`frame-${round}`}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`relative aspect-square rounded-3xl overflow-hidden border-2 ${
              reveal
                ? (reveal.correct
                    ? 'border-emerald-500 ring-4 ring-emerald-300/50'
                    : reveal.gaveUp
                      ? 'border-amber-500 ring-4 ring-amber-300/40'
                      : 'border-rose-500 ring-4 ring-rose-300/50')
                : 'border-[#3B2A1A]/20'
            } bg-white shadow-[6px_6px_0_rgba(59,42,26,0.15)]`}
          >
            <MysteryFrame
              species={target}
              photoBy={photoBy}
              mode={mode}
              revealLevel={revealLevel}
            />
            {/* Loupe : disponible uniquement après la réponse (sinon ce serait tricher) */}
            {reveal && (
              <ZoomLoupeButton onActivate={() => setZoomOpen(true)} alwaysVisible />
            )}



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

            {/* Toast indice */}
            <AnimatePresence>
              {hintToast && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-200/95 text-emerald-900 border border-emerald-400/50 shadow"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: 20 }}
                >
                  {hintToast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badge mode */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 shadow" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
              {reveal
                ? (reveal.correct ? 'Bravo !' : reveal.gaveUp ? 'C\'était…' : 'Raté…')
                : 'Qui suis-je ?'}
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

          {/* Jauge d'indices segmentée */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={askHint}
                disabled={!!reveal || hintLevel >= MAX_HINTS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-200 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-amber-900 border-2 border-amber-300 shadow-[3px_3px_0_rgba(59,42,26,0.15)]"
                style={{ fontFamily: '"Caveat", cursive', fontSize: 20 }}
                title="4 indices possibles — chaque indice te coûte un peu d'étoile"
              >
                <Lightbulb className="h-4 w-4" />
                {hintLevel >= MAX_HINTS ? 'Plus d\'indice…' : 'Donne-moi un indice'}
              </button>

              {/* Segments 4 crans */}
              <div className="flex items-center gap-1.5" aria-label="Indices utilisés">
                {Array.from({ length: MAX_HINTS }).map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      backgroundColor: i < hintLevel ? '#f59e0b' : 'rgba(180, 140, 80, 0.18)',
                      scale: i === hintLevel - 1 ? [1, 1.35, 1] : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-2.5 w-6 rounded-full border border-amber-400/40"
                  />
                ))}
              </div>

              <button
                onClick={giveUp}
                disabled={!!reveal}
                className="inline-flex items-center gap-1 text-amber-900 px-2.5 py-1 rounded-full bg-white/70 hover:bg-amber-50 border border-amber-300/50 text-sm disabled:opacity-40"
                style={{ fontFamily: '"Patrick Hand", sans-serif' }}
              >
                <Flag className="h-3.5 w-3.5" /> Ma langue au chat
              </button>
            </div>
            <p className="text-xs text-[#3B2A1A]/60 text-right" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
              {HINT_LABEL[hintLevel]}
            </p>
          </div>

          {/* Cartes d'indices manuscrits cumulés */}
          <AnimatePresence>
            {hintLevel >= 1 && !reveal && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 space-y-2"
              >
                {hintLevel >= 1 && (
                  <HintCard tint="emerald" icon={kingdomHint.emoji}>
                    C'est {kingdomHint.label}…
                  </HintCard>
                )}
                {initialHint && (
                  <HintCard tint="amber" icon="🅿">
                    Commence par <strong className="text-2xl">« {initialHint.initial} »</strong>
                    <span className="ml-2 text-[#3B2A1A]/60">{initialHint.pattern}</span>
                  </HintCard>
                )}
                {familyHint && (
                  <HintCard tint="rose" icon="🌿">
                    Famille des <em>{familyHint.family}</em> — {familyHint.trait}
                  </HintCard>
                )}
                {lettersHint && (
                  <HintCard tint="sky" icon="🎯">
                    <span className="text-2xl tracking-widest">{lettersHint}</span>
                  </HintCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options */}
        <motion.div
          key={`opts-${round}-${reveal?.correct === false ? 'miss' : 'ok'}`}
          animate={reveal && !reveal.correct && !reveal.gaveUp ? { x: [0, -6, 6, -4, 4, 0] } : {}}
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

      <ZoomLightbox
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        src={photoUrl(target, photoBy)}
        alt={displayName(target)}
        caption={<>{displayName(target)} <em className="opacity-75 text-base">({target.scientificName})</em></>}
      />
    </div>
  );
};

const TINTS: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-300/60 text-emerald-900',
  amber: 'bg-amber-50 border-amber-300/60 text-amber-900',
  rose: 'bg-rose-50 border-rose-300/60 text-rose-900',
  sky: 'bg-sky-50 border-sky-300/60 text-sky-900',
};

const HintCard: React.FC<{ tint: keyof typeof TINTS | string; icon: string; children: React.ReactNode }> = ({ tint, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    className={`relative flex items-start gap-3 px-3 py-2 rounded-2xl border-2 shadow-[3px_3px_0_rgba(59,42,26,0.08)] ${TINTS[tint] ?? TINTS.amber}`}
    style={{ fontFamily: '"Patrick Hand", sans-serif' }}
  >
    <span className="text-2xl leading-none">{icon}</span>
    <div className="text-base leading-snug pt-0.5">{children}</div>
  </motion.div>
);

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

const WhoAmIToolbarBridge: React.FC<{ onRule: () => void; onReset: () => void }> = ({ onRule, onReset }) => {
  useGameToolbar(
    <>
      <button
        onClick={onRule}
        className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50 text-sm"
        aria-label="Revoir la règle"
      >
        <HelpCircle className="h-4 w-4" /> Règle
      </button>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50 text-sm"
      >
        <RotateCw className="h-4 w-4" /> Recommencer
      </button>
    </>,
    [onRule, onReset],
  );
  return null;
};

export default WhoAmIGame;
