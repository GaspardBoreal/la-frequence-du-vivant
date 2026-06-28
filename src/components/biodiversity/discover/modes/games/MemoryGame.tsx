import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Trophy, Leaf, Loader2, HelpCircle, Sparkles } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, hasPhoto } from './gameUtils';
import GameCardImage from './GameCardImage';
import MemoryOnboarding, { hasSeenMemoryOnboarding } from './MemoryOnboarding';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

interface Card { id: string; key: string; type: 'photo' | 'name'; s: BiodiversitySpecies; }

const TARGET_PAIRS = 6;
const MIN_PAIRS = 3;

const MemoryGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenMemoryOnboarding());
  const [started, setStarted] = useState(false);
  const [lastMatchLabel, setLastMatchLabel] = useState<string | null>(null);
  const [lastMissShake, setLastMissShake] = useState(0);

  const availableCount = useMemo(
    () => species.filter((s) => hasPhoto(s, photoBy)).length,
    [species, photoBy],
  );

  const desiredPairs = Math.min(TARGET_PAIRS, Math.max(MIN_PAIRS, availableCount));

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  // Tirage (uniquement quand prêt et non commencé) + re-tirage tant que possible
  useEffect(() => {
    if (availableCount < MIN_PAIRS) {
      setCards([]);
      return;
    }
    const currentPairs = new Set(cards.map((c) => c.key)).size;
    const shouldRepick =
      moves === 0 && matched.size === 0 && (currentPairs === 0 || currentPairs < desiredPairs);
    if (!shouldRepick && cards.length > 0) return;
    const picks = pickWithPhotos(species, photoBy, desiredPairs);
    const all: Card[] = [];
    picks.forEach((s) => {
      all.push({ id: `p-${s.id}`, key: s.id, type: 'photo', s });
      all.push({ id: `n-${s.id}`, key: s.id, type: 'name', s });
    });
    setCards(shuffle(all));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, availableCount, desiredPairs]);

  const handleFlip = (c: Card) => {
    if (!started) return;
    if (flipped.includes(c.id) || matched.has(c.key)) return;
    if (flipped.length === 2) return;
    const next = [...flipped, c.id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
      if (a.key === b.key) {
        const lbl = displayName(a.s);
        setTimeout(() => {
          setMatched((prev) => new Set(prev).add(a.key));
          setFlipped([]);
          setLastMatchLabel(lbl);
          setTimeout(() => setLastMatchLabel((v) => (v === lbl ? null : v)), 1400);
        }, 500);
      } else {
        setLastMissShake((n) => n + 1);
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const pairsCount = new Set(cards.map((c) => c.key)).size;
  const won = pairsCount > 0 && matched.size === pairsCount;
  const isWarming = availableCount < desiredPairs && availableCount < TARGET_PAIRS;
  const tooFew = availableCount < MIN_PAIRS;

  // --- Onboarding ---
  if (showOnboarding) {
    return (
      <div className="relative min-h-[400px]">
        <MemoryOnboarding
          open
          pairsCount={desiredPairs}
          onStart={() => { setShowOnboarding(false); setStarted(true); }}
        />
      </div>
    );
  }

  // --- Trop peu de photos après préchauffage ---
  if (tooFew) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-3">🌾</div>
        <h3 className="text-3xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>
          Pas assez de photos pour ce jeu ici
        </h3>
        <p className="mt-2 text-[#3B2A1A]/70 max-w-md" style={{ fontFamily: '"Patrick Hand", sans-serif' }}>
          Essaie un autre jeu (« Qui suis-je ? ») ou élargis tes filtres pour inclure plus d'espèces.
        </p>
      </div>
    );
  }

  // --- Scène de chargement ---
  if (cards.length === 0 || (isWarming && !started)) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 text-amber-700 animate-spin mb-3" />
        <p className="text-2xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive' }}>
          Les espèces enfilent leur costume…
        </p>
        <p className="text-sm text-[#3B2A1A]/60 mt-2">
          {availableCount}/{TARGET_PAIRS} photos prêtes
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Bandeau consigne permanent */}
      <div
        className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-100/80 border-2 border-amber-300/60 shadow-[3px_3px_0_rgba(59,42,26,0.08)]"
        style={{ fontFamily: '"Patrick Hand", sans-serif' }}
      >
        <p className="text-base sm:text-lg text-[#3B2A1A] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
          Trouve la <strong>photo</strong> et le <strong>nom</strong> qui vont ensemble
          — <strong>{pairsCount}</strong> paires à reconstituer.
        </p>
        <button
          onClick={() => setShowOnboarding(true)}
          className="shrink-0 inline-flex items-center gap-1 text-amber-900 hover:text-amber-700 px-2.5 py-1 rounded-full bg-white/70 border border-amber-300/50 text-sm"
        >
          <HelpCircle className="h-4 w-4" /> Revoir la règle
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>
          Coups : <strong>{moves}</strong> · {matched.size}/{pairsCount} paires
        </p>
        <button onClick={() => setRound((r) => r + 1)} className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50">
          <RotateCw className="h-4 w-4" /> Rejouer
        </button>
      </div>

      <motion.div
        key={lastMissShake}
        animate={lastMissShake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-3 sm:grid-cols-4 gap-3"
      >
        {cards.map((c) => {
          const isOpen = flipped.includes(c.id) || matched.has(c.key);
          const isMatched = matched.has(c.key);
          return (
            <button
              key={c.id}
              onClick={() => handleFlip(c)}
              className="relative aspect-[3/4] [perspective:1000px]"
            >
              <motion.div
                animate={{ rotateY: isOpen ? 180 : 0, scale: isMatched ? 0.96 : 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 18 }}
                className="absolute inset-0 [transform-style:preserve-3d]"
              >
                {/* Dos */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-[#3B2A1A]/20 shadow-[4px_4px_0_rgba(59,42,26,0.15)] flex items-center justify-center overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    background:
                      'repeating-linear-gradient(45deg, #f5c761 0 12px, #f0b945 12px 24px)',
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center shadow-inner">
                    <Leaf className="w-7 h-7 text-amber-900" />
                  </div>
                </div>
                {/* Face */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-white border-2 ${isMatched ? 'border-emerald-500/70 ring-2 ring-emerald-300' : 'border-[#3B2A1A]/20'} overflow-hidden shadow-[4px_4px_0_rgba(59,42,26,0.15)]`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {c.type === 'photo' ? (
                    <GameCardImage
                      species={c.s}
                      photoBy={photoBy}
                      className="w-full h-full object-cover"
                      alt={displayName(c.s)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center"
                         style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>
                      <span className="text-xl sm:text-2xl text-[#3B2A1A]">{displayName(c.s)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </button>
          );
        })}
      </motion.div>

      {/* Toast match */}
      <AnimatePresence>
        {lastMatchLabel && !won && (
          <motion.div
            key={lastMatchLabel}
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-emerald-200 border-2 border-emerald-700/30 shadow-[4px_4px_0_rgba(59,42,26,0.2)]"
            style={{ fontFamily: '"Caveat", cursive', fontSize: 26, color: '#1f3a2b' }}
          >
            🎉 {lastMatchLabel} !
          </motion.div>
        )}
      </AnimatePresence>

      {won && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-2xl text-amber-900" style={{ fontFamily: '"Caveat", cursive' }}>
            <Trophy className="h-6 w-6" /> Bravo&nbsp;! Trouvé en {moves} coups.
          </div>
          <div>
            <button onClick={() => setRound((r) => r + 1)} className="mt-3 px-5 py-2 rounded-full bg-emerald-300 border-2 border-[#3B2A1A]/15 shadow-[3px_3px_0_rgba(59,42,26,0.2)]" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
              Une autre partie
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryGame;
