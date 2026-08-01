import React from 'react';
import { motion } from 'framer-motion';

import { sizeAt, toLocal } from '@/lib/immersion/growthModel';
import { buildSilhouette } from '@/lib/immersion/silhouettes';
import type { ImmersionSceneProps } from './types';

const W = 1000;
const H = 560;
const GROUND = 400;

/**
 * La Coupe Vivante : une tranche verticale de l'ouvrage.
 *
 * Le trait de coupe pivote autour du centre du massif ; les plantes se
 * redressent à leur hauteur réelle, à l'échelle. C'est la vue qui dit la
 * vérité d'un aménagement : les vides, les concurrences, les ombres portées.
 */
export const CoupeVivante: React.FC<ImmersionSceneProps & { angleDeg?: number }> = ({
  plantings,
  center,
  year,
  season,
  cinematic,
  angleDeg,
}) => {
  const [angle, setAngle] = React.useState(angleDeg ?? 0);
  React.useEffect(() => {
    if (typeof angleDeg === 'number') setAngle(angleDeg);
  }, [angleDeg]);
  const [hover, setHover] = React.useState<string | null>(null);

  const a = (angle * Math.PI) / 180;
  const u = { x: Math.sin(a), y: Math.cos(a) };
  const n = { x: Math.cos(a), y: -Math.sin(a) };

  const projected = React.useMemo(() => {
    const rows = plantings.map((p) => {
      const l = toLocal(p, center);
      const along = l.x * u.x + l.y * u.y;
      const depth = l.x * n.x + l.y * n.y;
      return { p, along, depth, size: sizeAt(p, year) };
    });
    const span = rows.reduce((m, r) => Math.max(m, Math.abs(r.along) + r.size.spreadM / 2), 3);
    const maxHeight = rows.reduce((m, r) => Math.max(m, r.size.heightM), 2.2);
    const pxPerM = Math.min((W - 120) / (span * 2), (GROUND - 70) / (maxHeight * 1.12));
    return { rows: rows.sort((x, y2) => Math.abs(y2.depth) - Math.abs(x.depth)), pxPerM };
  }, [plantings, center, year, u.x, u.y, n.x, n.y]);

  const { rows, pxPerM } = projected;
  const soilDensity = Math.min(1, 0.25 + year / 12);

  return (
    <div className="relative w-full h-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="coupe-sky" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={season === 'hiver' ? '#20303a' : season === 'automne' ? '#3a2f24' : '#16302b'}
            />
            <stop offset="100%" stopColor="#0b1512" />
          </linearGradient>
          <linearGradient id="coupe-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2018" />
            <stop offset="100%" stopColor="#120d09" />
          </linearGradient>
          <radialGradient id="coupe-sun" cx="0.5" cy="0.5">
            <stop offset="0%" stopColor="#c8a24a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#c8a24a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={GROUND} fill="url(#coupe-sky)" />
        <motion.circle
          cx={W * 0.78}
          cy={GROUND * 0.28}
          r={130}
          fill="url(#coupe-sun)"
          animate={{ opacity: [0.7, 1, 0.7], r: [126, 136, 126] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Sol vivant : la densité racinaire suit l'âge de l'ouvrage. */}
        <rect y={GROUND} width={W} height={H - GROUND} fill="url(#coupe-soil)" />
        <line x1={0} y1={GROUND} x2={W} y2={GROUND} stroke="#c8a24a" strokeOpacity={0.4} strokeWidth={1.2} />
        {Array.from({ length: 90 }).map((_, i) => {
          const x = (i / 90) * W + ((i * 37) % 11);
          const d = 12 + ((i * 53) % 100) * soilDensity;
          return (
            <path
              key={i}
              d={`M ${x} ${GROUND} q ${((i % 5) - 2) * 4} ${d / 2} ${((i % 7) - 3) * 3} ${d}`}
              stroke="#c8a24a"
              strokeOpacity={0.06 + 0.16 * soilDensity}
              strokeWidth={0.9}
              fill="none"
            />
          );
        })}

        {/* Les plantes traversées par la coupe */}
        {rows.map(({ p, along, depth, size }) => {
          const scale = 1 / (1 + Math.abs(depth) / 14);
          const x = W / 2 + along * pxPerM;
          const baseY = GROUND - Math.max(-26, Math.min(26, depth)) * 1.6;
          const wPx = Math.max(8, size.spreadM * pxPerM * scale);
          const hPx = Math.max(10, size.heightM * pxPerM * scale);
          const { parts } = buildSilhouette({
            key: p.scientificName || p.id,
            strate: p.strate,
            widthPx: wPx,
            heightPx: hPx,
            season,
            maturity: size.factor,
          });
          const dim = 0.35 + 0.65 * scale;
          const active = hover === p.id;
          return (
            <motion.g
              key={p.id}
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
              style={{ transformOrigin: `${x}px ${baseY}px` }}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
            >
              <ellipse
                cx={x}
                cy={baseY + 2}
                rx={wPx * 0.55}
                ry={Math.max(2, wPx * 0.12)}
                fill="#000"
                opacity={0.32 * dim}
              />
              <g transform={`translate(${x} ${baseY})`} opacity={dim}>
                {parts.map((part, i) => (
                  <path key={i} d={part.d} fill={part.fill} opacity={(part.opacity ?? 1) * (active ? 1 : 0.94)} />
                ))}
              </g>
              {(active || (p.origin === 'proposee' && hPx > 46)) && (
                <g transform={`translate(${x} ${baseY - hPx - 14})`}>
                  <rect x={-78} y={-16} width={156} height={22} rx={11} fill="#0b1512" opacity={0.82} />
                  <text
                    textAnchor="middle"
                    y={-1}
                    fontSize={11}
                    fill={p.origin === 'proposee' ? '#c8a24a' : '#f2ece0'}
                  >
                    {(p.commonNameFr || p.scientificName || '').slice(0, 26)}
                  </text>
                </g>
              )}
            </motion.g>
          );
        })}

        {/* Règle métrique */}
        <g opacity={0.5}>
          <line x1={60} y1={GROUND - 4} x2={60 + pxPerM} y2={GROUND - 4} stroke="#f2ece0" strokeWidth={1.4} />
          <text x={60} y={GROUND - 10} fontSize={10} fill="#f2ece0">
            1 m
          </text>
        </g>
      </svg>

      {!cinematic && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-3 rounded-full border border-[#c8a24a]/30 bg-black/50 px-4 py-2 backdrop-blur">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#c8a24a]">Trait de coupe</span>
          <input
            type="range"
            min={0}
            max={179}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-52 accent-[#c8a24a]"
            aria-label="Orientation du trait de coupe"
          />
          <span className="w-10 text-right text-[11px] tabular-nums text-[#f2ece0]/80">{angle}°</span>
        </div>
      )}
    </div>
  );
};

export default CoupeVivante;
