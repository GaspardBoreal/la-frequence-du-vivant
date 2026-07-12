import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';

const TYPE_COLORS: Record<string, string> = {
  agroecologique: '#10b981',
  eco_poetique: '#a855f7',
  eco_tourisme: '#f59e0b',
};

const ConstellationView: React.FC<{ events: CarteMdVEvent[] }> = ({ events }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const W = 1000, H = 600;

  const stars = useMemo(() => {
    // Deterministic pseudo-random distribution based on id
    return events.map((e, i) => {
      const seed = e.id.charCodeAt(0) + e.id.charCodeAt(1) + i * 7;
      const angle = (seed % 360) * (Math.PI / 180);
      const radius = 80 + ((seed * 13) % (Math.min(W, H) / 2 - 100));
      const cx = W / 2 + Math.cos(angle) * radius;
      const cy = H / 2 + Math.sin(angle) * radius;
      const r = Math.min(28, 6 + Math.sqrt(e.species_count ?? 0) * 2);
      return { e, cx, cy, r, color: TYPE_COLORS[e.event_type ?? ''] ?? '#0d6b58' };
    });
  }, [events]);

  if (events.length === 0) {
    return <p className="text-center py-16 text-muted-foreground">Aucune marche à afficher.</p>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-slate-950 relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[70vh] min-h-[500px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="60%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Background twinkle */}
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i}
            cx={(i * 137) % W} cy={(i * 89) % H}
            r={0.5 + (i % 3) * 0.3}
            fill="white" opacity={0.3 + (i % 4) * 0.1} />
        ))}
        {/* Stars */}
        {stars.map(({ e, cx, cy, r, color }, i) => (
          <g key={e.id}
             onMouseEnter={() => setHovered(e.id)}
             onMouseLeave={() => setHovered(null)}
             className="cursor-pointer">
            <motion.circle
              cx={cx} cy={cy} r={r * 2}
              fill="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered === e.id ? 0.9 : 0.4 }}
              transition={{ delay: i * 0.02 }}
            />
            <motion.circle
              cx={cx} cy={cy} r={r}
              fill={color}
              stroke="white" strokeWidth={1.5}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.05 }}
            />
            <text x={cx} y={cy + r + 14} fontSize={11} fill="white" opacity={hovered === e.id ? 1 : 0.7}
                  textAnchor="middle" className="pointer-events-none">
              {e.title.length > 24 ? e.title.slice(0, 22) + '…' : e.title}
            </text>
          </g>
        ))}
      </svg>

      {hovered && (() => {
        const e = events.find((x) => x.id === hovered);
        if (!e) return null;
        const meta = getMarcheEventTypeMeta(e.event_type);
        const detailUrl = e.category === 'jardin' && e.is_public && e.public_slug
          ? `/jardin/${e.public_slug}`
          : e.is_public && e.public_slug ? `/m/${e.public_slug}` : `/admin/marche-events/${e.id}`;
        return (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm rounded-lg bg-background/95 backdrop-blur border border-border p-3 shadow-lg pointer-events-auto">
            <p className="font-semibold text-sm">{e.title}</p>
            {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta.shortLabel}</p>}
            <p className="text-xs mt-1">🌿 {e.species_count} espèces · 📍 {e.lieu ?? '—'}</p>
            <Link to={detailUrl} className="mt-2 inline-block text-xs text-primary hover:underline">
              Découvrir cette marche →
            </Link>
          </div>
        );
      })()}
      <p className="absolute bottom-3 left-3 text-xs text-white/60">
        Chaque étoile est une marche. Sa taille grandit avec la diversité observée.
      </p>
    </div>
  );
};

export default ConstellationView;
