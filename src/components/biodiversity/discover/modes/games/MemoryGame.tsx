import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Trophy, Leaf, Loader2 } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, hasPhoto } from './gameUtils';
import GameCardImage from './GameCardImage';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

interface Card { id: string; key: string; type: 'photo' | 'name'; s: BiodiversitySpecies; }

const TARGET_PAIRS = 6;
const MIN_PAIRS = 3;

const MemoryGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);

  // Nombre de cartes disponibles avec photo (réactif au préchauffage)
  const availableCount = useMemo(
    () => species.filter((s) => hasPhoto(s, photoBy)).length,
    [species, photoBy],
  );

  // On tire les cartes UNE fois par round, en se basant sur le pool actuel.
  // Si le pool s'enrichit pendant que la partie n'a pas commencé, on retire.
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const desired = Math.min(TARGET_PAIRS, Math.max(MIN_PAIRS, availableCount));
    if (availableCount < MIN_PAIRS) {
      setCards([]);
      return;
    }
    // Retire seulement si pas encore commencé ou si on a moins de paires que désiré
    const currentPairs = new Set(cards.map((c) => c.key)).size;
    const shouldRepick =
      moves === 0 && matched.size === 0 && (currentPairs === 0 || currentPairs < desired);
    if (!shouldRepick && cards.length > 0) return;
    const picks = pickWithPhotos(species, photoBy, desired);
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
  }, [round, availableCount]);

  const handleFlip = (c: Card) => {
    if (flipped.includes(c.id) || matched.has(c.key)) return;
    if (flipped.length === 2) return;
    const next = [...flipped, c.id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
      if (a.key === b.key) {
        setTimeout(() => { setMatched((prev) => new Set(prev).add(a.key)); setFlipped([]); }, 500);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const pairsCount = new Set(cards.map((c) => c.key)).size;
  const won = pairsCount > 0 && matched.size === pairsCount;

  // États dégradés : aucune photo, ou en chargement
  if (cards.length === 0) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 text-amber-700 animate-spin mb-3" />
        <p className="text-2xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive' }}>
          {availableCount < MIN_PAIRS
            ? `Pas encore assez de photos (${availableCount}/${MIN_PAIRS})…`
            : 'Préparation des cartes…'}
        </p>
        <p className="text-sm text-[#3B2A1A]/60 mt-2">
          Les photos terrain et iNaturalist arrivent en quelques secondes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>
          Coups : <strong>{moves}</strong> · {matched.size}/{pairsCount} paires
        </p>
        <button onClick={() => setRound((r) => r + 1)} className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50">
          <RotateCw className="h-4 w-4" /> Rejouer
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map((c) => {
          const isOpen = flipped.includes(c.id) || matched.has(c.key);
          return (
            <button
              key={c.id}
              onClick={() => handleFlip(c)}
              className="relative aspect-[3/4] [perspective:1000px]"
            >
              <motion.div
                animate={{ rotateY: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 18 }}
                className="absolute inset-0 [transform-style:preserve-3d]"
              >
                {/* Dos de carte : motif + icône SVG (pas d'emoji pour éviter le tofu) */}
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
                {/* Face : photo ou nom */}
                <div
                  className="absolute inset-0 rounded-2xl bg-white border-2 border-[#3B2A1A]/20 overflow-hidden shadow-[4px_4px_0_rgba(59,42,26,0.15)]"
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
      </div>

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
