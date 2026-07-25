import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  onOpen: (i: number) => void;
}

/**
 * Nuée — mouvement brownien contraint, mise en lumière tournante,
 * fil narratif ténu qui respire.
 */
export const SwarmFloat: React.FC<Props> = ({ photos, onOpen }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [spotlight, setSpotlight] = useState(0);
  const [tick, setTick] = useState(0);
  const stateRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const r = e[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // init positions
  useEffect(() => {
    stateRef.current = photos.map((_, i) => ({
      x: (size.w / (photos.length + 1)) * (i + 1),
      y: size.h / 2 + Math.sin(i) * 60,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
  }, [photos.length, size.w, size.h]);

  useEffect(() => {
    let raf = 0;
    let running = true;
    const onVis = () => { running = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);
    const loop = () => {
      if (running) {
        const arr = stateRef.current;
        for (let i = 0; i < arr.length; i++) {
          const a = arr[i];
          a.vx += (Math.random() - 0.5) * 0.06;
          a.vy += (Math.random() - 0.5) * 0.06;
          a.vx *= 0.96;
          a.vy *= 0.96;
          a.x += a.vx;
          a.y += a.vy;
          // repulsion soft from others
          for (let j = 0; j < arr.length; j++) {
            if (i === j) continue;
            const b = arr[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 90 * 90 && d2 > 1) {
              const f = (90 - Math.sqrt(d2)) * 0.02;
              a.vx += (dx / Math.sqrt(d2)) * f;
              a.vy += (dy / Math.sqrt(d2)) * f;
            }
          }
          // bounds
          const pad = 60;
          if (a.x < pad) a.vx += 0.15;
          if (a.x > size.w - pad) a.vx -= 0.15;
          if (a.y < pad) a.vy += 0.15;
          if (a.y > size.h - pad) a.vy -= 0.15;
        }
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); };
  }, [size]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSpotlight((s) => (s + 1) % Math.max(photos.length, 1));
    }, 3500);
    return () => clearInterval(id);
  }, [photos.length]);

  void tick;
  const pts = stateRef.current;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-[560px] rounded-2xl overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 60%, hsl(180 30% 12%) 0%, hsl(200 40% 6%) 70%, hsl(220 50% 3%) 100%)',
      }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'screen' }}>
        {pts.length > 1 && (
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(251,191,36,0.35)"
            strokeWidth={1}
            strokeDasharray="2 6"
          />
        )}
      </svg>

      {photos.map((p, i) => {
        const pt = pts[i] ?? { x: size.w / 2, y: size.h / 2 };
        const isSpot = spotlight === i;
        const dim = isSpot ? 160 : 68;
        return (
          <button
            key={p.id}
            onClick={() => onOpen(i)}
            className="absolute rounded-full overflow-hidden border-2 transition-all duration-[1200ms] ease-out"
            style={{
              left: pt.x - dim / 2,
              top: pt.y - dim / 2,
              width: dim,
              height: dim,
              borderColor: isSpot ? 'rgb(251,191,36)' : 'rgba(255,255,255,0.6)',
              boxShadow: isSpot
                ? '0 0 50px rgba(251,191,36,0.7)'
                : '0 4px 14px rgba(0,0,0,0.4)',
              zIndex: isSpot ? 50 : 10,
            }}
          >
            <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            {isSpot && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap bg-black/60 backdrop-blur text-white text-[11px] font-serif italic px-2.5 py-1 rounded">
                {p.author_name ?? 'Anonyme'}
                {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
              </div>
            )}
          </button>
        );
      })}

      <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.25em] text-white/40">
        Nuée — {photos.length} fragments
      </div>
    </div>
  );
};
