import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Compass } from 'lucide-react';

import PerspectiveScene from './PerspectiveScene';
import type { ImmersionSceneProps } from './types';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import { seasonOf } from '@/components/propriete/palette/studio/photos/seasons';

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

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/**
 * Le Dôme : on se tient au milieu de l'ouvrage, à hauteur d'homme, et la vue
 * tourne. Le fond est une vraie photo du lieu (saison choisie), les plantes
 * sont posées à leur distance réelle.
 */
export const DomePanorama: React.FC<ImmersionSceneProps & { yawOverride?: number }> = ({
  plantings,
  center,
  year,
  season,
  photos,
  cinematic,
  yawOverride,
}) => {
  const { ref, size } = useSize();
  const [yaw, setYaw] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [hover, setHover] = React.useState<Planting | null>(null);
  const drag = React.useRef<{ x: number; yaw: number } | null>(null);

  React.useEffect(() => {
    if (typeof yawOverride === 'number') setYaw(yawOverride);
  }, [yawOverride]);

  React.useEffect(() => {
    if (!playing || typeof yawOverride === 'number') return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setYaw((v) => v + dt * 0.12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, yawOverride]);

  /** Fond : la photo du carnet la plus proche de la saison demandée. */
  const backdrop = React.useMemo(() => {
    if (!photos.length) return null;
    const same = photos.filter((p) => seasonOf(p) === season && p.url);
    const pool = same.length ? same : photos.filter((p) => p.url);
    return pool[0]?.url ?? null;
  }, [photos, season]);

  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  const cardinal = CARDINALS[Math.round(deg / 45) % 8];

  return (
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden select-none"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, yaw };
        setPlaying(false);
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setYaw(drag.current.yaw - ((e.clientX - drag.current.x) / Math.max(1, size.w)) * 1.8);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      style={{ cursor: 'grab' }}
    >
      {/* Ciel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            season === 'hiver'
              ? 'linear-gradient(#1b2a33, #0b1512 62%)'
              : season === 'automne'
                ? 'linear-gradient(#3b2f22, #0b1512 62%)'
                : 'linear-gradient(#17332c, #0b1512 62%)',
        }}
      />
      {/* Photo réelle du lieu, panoramisée par la rotation */}
      {backdrop && (
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `url(${backdrop})`,
            backgroundSize: '260% 130%',
            backgroundPositionX: `${(-deg / 360) * 260 * 2}%`,
            backgroundPositionY: '40%',
            filter: 'blur(6px) saturate(0.85)',
          }}
        />
      )}
      {/* Sol */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: '52%',
          background: 'linear-gradient(#1c2a1f, #0a120e)',
        }}
      />
      {/* Lumière volumétrique */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(60% 50% at 70% 18%, rgba(200,162,74,0.35), transparent 70%)',
        }}
      />

      <PerspectiveScene
        plantings={plantings}
        center={center}
        yaw={yaw}
        year={year}
        season={season}
        width={size.w}
        height={size.h}
        onHover={setHover}
      />

      {/* Pollens */}
      {!cinematic &&
        Array.from({ length: 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#c8a24a]"
            style={{
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              left: `${(i * 37) % 100}%`,
              top: `${30 + ((i * 17) % 50)}%`,
              filter: 'blur(0.5px)',
            }}
            animate={{ y: [0, -40 - (i % 5) * 12, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: 9 + (i % 6), repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          />
        ))}

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.09]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.85\' numOctaves=\'3\'/></filter><rect width=\'80\' height=\'80\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      {hover && (
        <div className="absolute left-4 bottom-16 rounded-xl border border-[#c8a24a]/35 bg-black/65 px-3 py-2 backdrop-blur">
          <div className="font-serif italic text-[#f2ece0]">
            {hover.commonNameFr || hover.scientificName}
          </div>
          <div className="text-[10.5px] text-[#f2ece0]/60">
            {hover.scientificName} · {hover.origin === 'place' ? 'en place' : hover.origin === 'proposee' ? 'proposée' : 'ajoutée'}
          </div>
        </div>
      )}

      {!cinematic && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-3 rounded-full border border-[#c8a24a]/30 bg-black/50 px-4 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="text-[#c8a24a] hover:text-[#f2ece0] transition"
            aria-label={playing ? 'Arrêter la rotation' : 'Reprendre la rotation'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <Compass className="w-3.5 h-3.5 text-[#f2ece0]/60" />
          <span className="text-[11px] tabular-nums text-[#f2ece0]/80">
            {cardinal} · {Math.round(deg)}°
          </span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#f2ece0]/40">glisser pour tourner</span>
        </div>
      )}
    </div>
  );
};

export default DomePanorama;
