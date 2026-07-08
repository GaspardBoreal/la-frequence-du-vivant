import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Check, X } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, photoUrl } from './gameUtils';
import GameCardImage from './GameCardImage';
import DetailCropImage from './DetailCropImage';
import ZoomLoupeButton from './ZoomLoupeButton';
import ZoomLightbox from './ZoomLightbox';
import { highResDetailSrc } from './zoomImageSrc';
import { useGameToolbar } from './GameToolbarContext';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

const ZoomDetailGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ ok: 0, ko: 0 });
  const [reveal, setReveal] = useState<null | { correct: boolean; pickedId: string }>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Reset lightbox à chaque nouvelle manche
  useEffect(() => { setZoomOpen(false); }, [round]);

  const { target, options, zoom } = useMemo(() => {
    const picks = pickWithPhotos(species, photoBy, 4);
    const t = picks[0];
    const zoomVal = 2.4 + Math.random() * 1.2;
    const cx = 25 + Math.random() * 50;
    const cy = 25 + Math.random() * 50;
    return { target: t, options: shuffle(picks), zoom: { zoomVal, cx, cy } };
  }, [species, photoBy, round]);

  if (!target) return null;

  const onPick = (s: BiodiversitySpecies) => {
    if (reveal) return;
    const correct = s.id === target.id;
    setReveal({ correct, pickedId: s.id });
    setScore((sc) => correct ? { ...sc, ok: sc.ok + 1 } : { ...sc, ko: sc.ko + 1 });
    setTimeout(() => { setReveal(null); setRound((r) => r + 1); }, 1300);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>✅ {score.ok} · ❌ {score.ko}</p>
        <button onClick={() => { setScore({ ok: 0, ko: 0 }); setRound((r) => r + 1); }} className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50">
          <RotateCw className="h-4 w-4" /> Recommencer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="group relative aspect-square rounded-3xl overflow-hidden border-2 border-[#3B2A1A]/20 bg-white shadow-[6px_6px_0_rgba(59,42,26,0.15)]">
          {(() => {
            const url = photoUrl(target, photoBy);
            return url ? (
              <DetailCropImage
                url={url}
                cx={zoom.cx}
                cy={zoom.cy}
                zoom={zoom.zoomVal}
                alt="détail"
                className="w-full h-full"
              />
            ) : (
              <GameCardImage
                species={target}
                photoBy={photoBy}
                alt="détail"
                className="w-full h-full object-cover"
              />
            );
          })()}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-sky-200/90 text-sky-900" style={{ fontFamily: '"Caveat", cursive', fontSize: 22 }}>
            Devine en gros plan
          </div>
          <ZoomLoupeButton onActivate={() => setZoomOpen(true)} alwaysVisible />
        </div>


        <div className="grid grid-cols-2 gap-3">
          {options.map((o) => {
            const picked = reveal?.pickedId === o.id;
            const isTarget = o.id === target.id;
            return (
              <motion.button
                key={o.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPick(o)}
                className={`relative rounded-2xl p-4 border-2 text-left transition ${
                  reveal && isTarget ? 'bg-emerald-200 border-emerald-700/30' :
                  picked && !reveal?.correct ? 'bg-rose-200 border-rose-700/30' :
                  'bg-white border-[#3B2A1A]/15 hover:bg-amber-50'
                } shadow-[3px_3px_0_rgba(59,42,26,0.12)]`}
              >
                <p className="text-2xl text-[#3B2A1A]" style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}>{displayName(o)}</p>
                <p className="italic text-sm text-[#3B2A1A]/60">{o.scientificName}</p>
                {reveal && isTarget && <Check className="absolute top-2 right-2 h-5 w-5 text-emerald-700" />}
                {picked && !reveal?.correct && <X className="absolute top-2 right-2 h-5 w-5 text-rose-700" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      <ZoomLightbox
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        renderImage={({ className }) => {
          const url = photoUrl(target, photoBy);
          if (!url) return null;
          const hr = highResDetailSrc(url) || url;
          // Avant la réponse: on garde le cadrage du détail (anti-spoiler).
          // Après la réponse: image complète.
          return reveal ? (
            <img src={hr} alt={displayName(target)} draggable={false} className={className} />
          ) : (
            <div className="w-[88vmin] h-[88vmin] max-w-[96vw] max-h-[88dvh] overflow-hidden rounded-2xl">
              <div
                aria-label="détail"
                role="img"
                className="w-full h-full select-none"
                style={{
                  backgroundImage: `url("${hr}")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${zoom.zoomVal * 100}%`,
                  backgroundPosition: `${zoom.cx}% ${zoom.cy}%`,
                }}
              />
            </div>
          );
        }}
        caption={reveal ? <>{displayName(target)} <em className="opacity-75 text-base">({target.scientificName})</em></> : 'Espèce mystère — devine sans tricher 😉'}
        notice={!reveal ? 'Réponds pour voir la photo entière' : undefined}
        initialScale={1}
      />
    </div>
  );
};

export default ZoomDetailGame;
