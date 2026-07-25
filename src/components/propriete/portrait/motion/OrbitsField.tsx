import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  onOpen: (i: number) => void;
}

/**
 * Constellation Vivante — les photos flottent sur des orbites elliptiques
 * décalées, à vitesses différentes. Fils ambrés reliant l'ordre narratif.
 * Utilise requestAnimationFrame + transform GPU.
 */
export const OrbitsField: React.FC<Props> = ({ photos, onOpen }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let running = true;
    const onVis = () => { running = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);
    const loop = () => {
      if (running && hovered === null) setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); };
  }, [hovered, reduce]);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const rx = Math.min(size.w, size.h * 1.6) / 2 - 60;
  const ry = size.h / 2 - 60;

  // Deterministic per-photo orbit params
  const orbits = useMemo(() => photos.map((_, i) => {
    const layer = i % 3; // 0 inner, 1 mid, 2 outer
    const scale = 0.45 + layer * 0.28;
    const speed = 0.00025 + (2 - layer) * 0.00018; // rad/ms — inner faster
    const phase = (i * (Math.PI * 2)) / photos.length + layer * 0.7;
    const tilt = (layer - 1) * 0.18;
    return { scale, speed, phase, tilt, layer };
  }), [photos]);

  const t = performance.now();
  const positions = orbits.map((o) => {
    const angle = reduce ? o.phase : o.phase + t * o.speed;
    const x = cx + Math.cos(angle) * rx * o.scale;
    const y = cy + Math.sin(angle) * ry * o.scale + Math.sin(angle * 2 + o.tilt) * 8;
    return { x, y, layer: o.layer };
  });
  // consume tick to keep react re-rendering
  void tick;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-[560px] rounded-2xl overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, hsl(220 40% 18%) 0%, hsl(225 45% 8%) 55%, hsl(230 50% 4%) 100%)',
      }}
    >
      {/* starfield */}
      <StarField />

      {/* narrative thread */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'screen' }}>
        <defs>
          <linearGradient id="thread" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(251,191,36,0.0)" />
            <stop offset="50%" stopColor="rgba(251,191,36,0.55)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.0)" />
          </linearGradient>
        </defs>
        <polyline
          points={positions.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="url(#thread)"
          strokeWidth={1.2}
          strokeDasharray="3 5"
        />
      </svg>

      {photos.map((p, i) => {
        const pos = positions[i];
        const isHover = hovered === i;
        const dim = 44 + pos.layer * 14; // inner smaller
        const z = 10 + pos.layer * 5 + (isHover ? 100 : 0);
        return (
          <button
            key={p.id}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onOpen(i)}
            className="absolute transition-[transform,box-shadow] duration-300 ease-out group"
            style={{
              left: pos.x - dim / 2,
              top: pos.y - dim / 2,
              width: dim,
              height: dim,
              zIndex: z,
              transform: isHover ? 'scale(2.2)' : 'scale(1)',
            }}
          >
            <div
              className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
              style={{ boxShadow: isHover ? '0 0 40px rgba(251,191,36,0.85)' : undefined }}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              {i + 1}
            </div>
            {isHover && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap bg-black/70 backdrop-blur text-white text-[10px] font-serif italic px-2 py-1 rounded pointer-events-none">
                {p.author_name ?? 'Anonyme'}
                {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
              </div>
            )}
          </button>
        );
      })}

      <div className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.25em] text-white/40">
        Constellation vivante — {photos.length} fragments
      </div>
    </div>
  );
};

const StarField: React.FC = () => {
  const stars = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 1.4 + 0.3,
      d: Math.random() * 3 + 2,
      k: i,
    })),
    []
  );
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {stars.map((s) => (
        <circle
          key={s.k}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.s}
          fill="white"
          opacity={0.5}
          style={{ animation: `star-twinkle ${s.d}s ease-in-out infinite alternate` }}
        />
      ))}
    </svg>
  );
};

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches);
    const h = (e: MediaQueryListEvent) => setR(e.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return r;
}
