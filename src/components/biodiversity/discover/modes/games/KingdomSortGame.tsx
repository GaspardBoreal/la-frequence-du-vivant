import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle } from './gameUtils';
import GameCardImage from './GameCardImage';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

type Kingdom = 'Animalia' | 'Plantae' | 'Fungi';
const KINGDOMS: { key: Kingdom; label: string; emoji: string; color: string }[] = [
  { key: 'Animalia', label: 'Faune',      emoji: '🦋', color: 'bg-rose-200 border-rose-700/20' },
  { key: 'Plantae',  label: 'Flore',      emoji: '🌿', color: 'bg-emerald-200 border-emerald-700/20' },
  { key: 'Fungi',    label: 'Champignon', emoji: '🍄', color: 'bg-amber-200 border-amber-700/20' },
];

const KingdomSortGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<Record<string, Kingdom>>({});
  const [feedback, setFeedback] = useState<Record<string, 'ok' | 'ko'>>({});

  const items = useMemo(() => {
    const eligible = species.filter((s) => s.kingdom !== 'Other');
    return pickWithPhotos(shuffle(eligible), photoBy, 8);
  }, [species, photoBy, round]);

  const reset = () => { setPlaced({}); setFeedback({}); setRound((r) => r + 1); };

  const onDrop = (s: BiodiversitySpecies, k: Kingdom) => {
    const ok = s.kingdom === k;
    setPlaced((p) => ({ ...p, [s.id]: k }));
    setFeedback((f) => ({ ...f, [s.id]: ok ? 'ok' : 'ko' }));
  };

  const remaining = items.filter((s) => !placed[s.id]);
  const score = Object.values(feedback).filter((v) => v === 'ok').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>Score : <strong>{score}</strong> / {items.length}</p>
        <button onClick={reset} className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50">
          <RotateCw className="h-4 w-4" /> Rejouer
        </button>
      </div>

      {/* Items à classer */}
      <div className="flex flex-wrap gap-3 mb-6 min-h-[120px] p-3 rounded-2xl bg-white/70 border-2 border-dashed border-[#3B2A1A]/20">
        {remaining.length === 0 ? (
          <p className="m-auto text-xl text-[#3B2A1A]/60" style={{ fontFamily: '"Caveat", cursive' }}>Tout est trié&nbsp;!</p>
        ) : remaining.map((s) => (
          <motion.div
            key={s.id}
            layout
            draggable
            onDragStart={(e) => (e as unknown as DragEvent).dataTransfer?.setData('text/id', s.id)}
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#3B2A1A]/20 bg-white shadow-[3px_3px_0_rgba(59,42,26,0.15)] cursor-grab active:cursor-grabbing relative"
          >
            <GameCardImage species={s} photoBy={photoBy} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 text-[10px] bg-black/55 text-white px-1 py-0.5 truncate text-center">
              {displayName(s)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Zones de dépôt */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {KINGDOMS.map((k) => {
          const items_k = items.filter((s) => placed[s.id] === k.key);
          return (
            <div
              key={k.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/id');
                const s = items.find((x) => x.id === id);
                if (s) onDrop(s, k.key);
              }}
              className={`min-h-[180px] rounded-2xl border-2 ${k.color} p-3 shadow-[4px_4px_0_rgba(59,42,26,0.12)]`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{k.emoji}</span>
                <span style={{ fontFamily: '"Caveat", cursive', fontSize: 24 }}>{k.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {items_k.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                      feedback[s.id] === 'ok' ? 'border-emerald-700/40 ring-2 ring-emerald-500/50' :
                      feedback[s.id] === 'ko' ? 'border-rose-700/40 ring-2 ring-rose-500/50' :
                      'border-[#3B2A1A]/20'
                    }`}
                  >
                    <img src={photoUrl(s, photoBy)} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KingdomSortGame;
