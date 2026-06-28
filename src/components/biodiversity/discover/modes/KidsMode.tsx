import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import MemoryGame from './games/MemoryGame';
import WhoAmIGame from './games/WhoAmIGame';
import KingdomSortGame from './games/KingdomSortGame';
import ZoomDetailGame from './games/ZoomDetailGame';
import '@fontsource/caveat';
import '@fontsource/patrick-hand';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

type GameKey = 'menu' | 'memory' | 'whoami' | 'kingdom' | 'zoom';

const GAMES: Array<{ key: GameKey; title: string; desc: string; emoji: string; color: string }> = [
  { key: 'memory',  title: 'Memory',           desc: 'Retrouve les paires d\'espèces.',   emoji: '🃏', color: 'bg-amber-200' },
  { key: 'whoami',  title: 'Qui suis-je ?',    desc: 'Devine l\'espèce à la silhouette.', emoji: '🔍', color: 'bg-rose-200' },
  { key: 'kingdom', title: 'Tri Vivant',       desc: 'Faune, flore ou champignon ?',      emoji: '🌿', color: 'bg-emerald-200' },
  { key: 'zoom',    title: 'Chasse aux détails', desc: 'Reconnais l\'espèce, en gros plan.', emoji: '🔎', color: 'bg-sky-200' },
];

const KidsMode: React.FC<Props> = ({ species, photoBy }) => {
  const [game, setGame] = useState<GameKey>('menu');
  const hasEnough = species.length >= 4;

  return (
    <div
      className="absolute inset-0 overflow-y-auto"
      style={{
        background: 'radial-gradient(circle at 20% 10%, #FFF6E5 0%, #FAF6EC 60%, #F4ECDA 100%)',
        color: '#3B2A1A',
        fontFamily: '"Patrick Hand", "Caveat", sans-serif',
      }}
    >
      {/* Paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-16">
        {game === 'menu' ? (
          <>
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 sm:mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-800/70">Mode enfant</p>
              <h2 className="mt-2 text-4xl sm:text-6xl" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>
                On joue avec le vivant&nbsp;?
              </h2>
              <p className="mt-2 text-lg text-amber-900/70">
                {species.length} espèces de cette aventure t'attendent.
              </p>
            </motion.div>

            {!hasEnough && (
              <div className="mb-6 text-center text-amber-800 bg-amber-100/70 border border-amber-300/60 rounded-2xl px-4 py-3">
                Il faut au moins 4 espèces pour jouer. Élargis tes filtres&nbsp;!
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {GAMES.map((g, i) => (
                <motion.button
                  key={g.key}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.08, type: 'spring', stiffness: 220, damping: 18 }}
                  whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => hasEnough && setGame(g.key)}
                  disabled={!hasEnough}
                  className={`relative ${g.color} rounded-[28px] p-6 text-left shadow-[6px_6px_0_rgba(59,42,26,0.15)] border-2 border-[#3B2A1A]/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ transform: `rotate(${i % 2 ? -1.2 : 1.2}deg)` }}
                >
                  <div className="text-5xl mb-3">{g.emoji}</div>
                  <h3 className="text-2xl leading-tight" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>{g.title}</h3>
                  <p className="text-sm text-[#3B2A1A]/70 mt-1">{g.desc}</p>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setGame('menu')}
              className="inline-flex items-center gap-2 text-amber-900 hover:text-amber-700 mb-4 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="text-base">Choisir un autre jeu</span>
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={game}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3 }}
              >
                {game === 'memory'  && <MemoryGame  species={species} photoBy={photoBy} />}
                {game === 'whoami'  && <WhoAmIGame  species={species} photoBy={photoBy} />}
                {game === 'kingdom' && <KingdomSortGame species={species} photoBy={photoBy} />}
                {game === 'zoom'    && <ZoomDetailGame species={species} photoBy={photoBy} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default KidsMode;
