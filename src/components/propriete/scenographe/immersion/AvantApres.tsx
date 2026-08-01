import React from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

import PerspectiveScene from './PerspectiveScene';
import type { ImmersionSceneProps } from './types';
import { formatPhotoDate } from '@/components/propriete/palette/studio/photos/seasons';

const useSize = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ w: 1200, h: 700 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return { ref, size };
};

/**
 * Avant / Après : la photo réelle du lieu, et par-dessus le scénario qui
 * sort de terre. La poignée glissante compare l'aujourd'hui au futur.
 */
export const AvantApres: React.FC<ImmersionSceneProps & { splitOverride?: number }> = ({
  plantings,
  center,
  year,
  season,
  photos,
  cinematic,
  splitOverride,
}) => {
  const { ref, size } = useSize();
  const [split, setSplit] = React.useState(0.45);
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const dragging = React.useRef(false);

  React.useEffect(() => {
    if (typeof splitOverride === 'number') setSplit(splitOverride);
  }, [splitOverride]);

  const usable = React.useMemo(() => photos.filter((p) => p.url), [photos]);
  const photo = usable[Math.min(photoIdx, Math.max(0, usable.length - 1))];

  const onMove = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSplit(Math.max(0.04, Math.min(0.96, (clientX - r.left) / r.width)));
  };

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden bg-[#0b1512] select-none">
      {photo?.url ? (
        <img
          src={photo.url}
          alt={photo.caption || 'Photo du lieu'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[#f2ece0]/40">
          <div className="flex flex-col items-center gap-2">
            <ImageOff className="w-6 h-6" />
            <p className="text-xs">Ajoute une photo au carnet de l'ouvrage pour activer l'avant / après.</p>
          </div>
        </div>
      )}

      {/* Le futur, révélé par la poignée */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}
      >
        {photo?.url && (
          <img
            src={photo.url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'saturate(1.12) brightness(1.04)' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(11,21,18,0.15), rgba(11,21,18,0.55))' }}
        />
        <PerspectiveScene
          plantings={plantings}
          center={center}
          yaw={0}
          year={year}
          season={season}
          width={size.w}
          height={size.h}
          reveal={1}
          showLabels={false}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.18, 0.4, 0.18] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(50% 45% at 50% 70%, rgba(200,162,74,0.28), transparent 70%)' }}
        />
      </div>

      {/* Poignée */}
      <div
        className="absolute inset-y-0 w-[2px] bg-[#c8a24a]"
        style={{ left: `${split * 100}%`, boxShadow: '0 0 22px rgba(200,162,74,.7)' }}
      />
      {!cinematic && (
        <div
          role="slider"
          aria-label="Comparer aujourd'hui et le futur"
          aria-valuenow={Math.round(split * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-11 w-11 rounded-full border border-[#c8a24a]/70 bg-black/60 backdrop-blur grid place-items-center cursor-ew-resize"
          style={{ left: `${split * 100}%` }}
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => dragging.current && onMove(e.clientX)}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setSplit((v) => Math.max(0.04, v - 0.03));
            if (e.key === 'ArrowRight') setSplit((v) => Math.min(0.96, v + 0.03));
          }}
        >
          <span className="text-[#c8a24a] text-xs">↔</span>
        </div>
      )}

      <div className="absolute top-4 left-4 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#f2ece0]/70">
        Aujourd'hui
      </div>
      <div className="absolute top-4 right-4 rounded-full bg-[#c8a24a]/20 border border-[#c8a24a]/40 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#c8a24a]">
        An {Math.round(year)}
      </div>

      {!cinematic && usable.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[#c8a24a]/30 bg-black/55 px-3 py-1.5 backdrop-blur">
          {usable.slice(0, 8).map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhotoIdx(i)}
              aria-current={i === photoIdx}
              title={formatPhotoDate(p)}
              className={`h-8 w-8 rounded-md overflow-hidden border transition ${
                i === photoIdx ? 'border-[#c8a24a]' : 'border-white/15 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvantApres;
