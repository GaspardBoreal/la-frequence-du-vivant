import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Trophy } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, photoUrl, displayName, shuffle } from './gameUtils';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

interface Card { id: string; key: string; type: 'photo' | 'name'; s: BiodiversitySpecies; }

const MemoryGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);
  const [pairsCount] = useState(6);

  const cards = useMemo<Card[]>(() => {
    const picks = pickWithPhotos(species, photoBy, pairsCount);
    const all: Card[] = [];
    picks.forEach((s) => {
      all.push({ id: `p-${s.id}`, key: s.id, type: 'photo', s });
      all.push({ id: `n-${s.id}`, key: s.id, type: 'name',  s });
    });
    return shuffle(all);
  }, [species, photoBy, pairsCount, round]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);

  useEffect(() => { setFlipped([]); setMatched(new Set()); setMoves(0); }, [round]);

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

  const won = matched.size === pairsCount && pairsCount > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>
          Coups : <strong>{moves}</strong>
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
                <div
                  className="absolute inset-0 rounded-2xl bg-amber-300 border-2 border-[#3B2A1A]/20 shadow-[4px_4px_0_rgba(59,42,26,0.15)] flex items-center justify-center text-4xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  🌱
                </div>
                <div
                  className="absolute inset-0 rounded-2xl bg-white border-2 border-[#3B2A1A]/20 overflow-hidden shadow-[4px_4px_0_rgba(59,42,26,0.15)]"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {c.type === 'photo' ? (
                    <img src={photoUrl(c.s, photoBy)} alt="" className="w-full h-full object-cover" />
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
