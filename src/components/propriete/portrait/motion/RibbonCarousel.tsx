import React, { useEffect, useRef, useState } from 'react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  onOpen: (i: number) => void;
}

/**
 * Ruban de mémoire — anneau 3D en perspective. Défilement auto,
 * pause au survol, drag horizontal, photo centrale mise en avant.
 */
export const RibbonCarousel: React.FC<Props> = ({ photos, onOpen }) => {
  const [focus, setFocus] = useState(0);
  const [paused, setPaused] = useState(false);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setFocus((f) => (f + 1) % photos.length);
    }, 2400);
    return () => clearInterval(id);
  }, [paused, photos.length]);

  const n = photos.length;
  const radius = 320;

  return (
    <div
      className="relative w-full h-[560px] rounded-2xl overflow-hidden select-none"
      style={{
        background:
          'linear-gradient(160deg, hsl(38 55% 96%) 0%, hsl(35 60% 88%) 60%, hsl(30 55% 80%) 100%)',
        perspective: '1400px',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => { startXRef.current = e.clientX; }}
      onPointerUp={(e) => {
        if (startXRef.current == null) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 40) {
          setFocus((f) => (f + (dx < 0 ? 1 : -1) + n) % n);
        }
        startXRef.current = null;
      }}
    >
      {/* subtle grain */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '3px 3px' }} />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {photos.map((p, i) => {
          const rel = ((i - focus + n) % n + n) % n;
          // Normalize -n/2..n/2
          const norm = rel > n / 2 ? rel - n : rel;
          const angle = (norm / n) * Math.PI * 2; // full turn distributed
          const tx = Math.sin(angle) * radius;
          const tz = -Math.cos(angle) * radius + radius / 2;
          const rotateY = -norm * (360 / n);
          const isFocus = norm === 0;
          const blur = Math.min(Math.abs(norm) * 1.6, 6);
          const opacity = 1 - Math.min(Math.abs(norm) / (n / 2), 0.85);
          return (
            <button
              key={p.id}
              onClick={() => (isFocus ? onOpen(i) : setFocus(i))}
              className="absolute rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-out"
              style={{
                width: isFocus ? 300 : 220,
                height: isFocus ? 400 : 300,
                transform: `translate3d(${tx}px, 0, ${tz}px) rotateY(${rotateY}deg)`,
                filter: `blur(${blur}px)`,
                opacity,
                zIndex: 100 - Math.abs(norm),
              }}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {isFocus && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left">
                  <div className="text-white text-xs font-serif italic">
                    {p.author_name ?? 'Anonyme'}
                  </div>
                  {p.photo_date && (
                    <div className="text-white/70 text-[10px]">
                      {new Date(p.photo_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/10 backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.25em] text-amber-900">
        {focus + 1} / {photos.length} · Ruban de mémoire
      </div>
    </div>
  );
};
