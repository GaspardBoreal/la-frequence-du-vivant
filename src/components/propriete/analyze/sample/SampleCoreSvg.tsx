import React from 'react';
import type { SoilBlockId } from '@/components/propriete/analyze/media/soilTestCatalog';
import { SOIL_BLOCKS } from '@/components/propriete/analyze/media/soilTestCatalog';

export interface CoreStratum {
  id: SoilBlockId;
  label: string;
  value: string | null;
  /** Couleur dominante lue sur le terrain (sinon accent du bloc). */
  color?: string | null;
}

interface Props {
  strata: CoreStratum[];
  active: SoilBlockId | null;
  onSelect: (id: SoilBlockId) => void;
  height?: number;
}

/**
 * Carotte verticale interactive : chaque strate = une dimension du sol.
 * Elle sert de fil de navigation dans la fiche prélèvement.
 */
export const SampleCoreSvg: React.FC<Props> = ({ strata, active, onSelect, height = 420 }) => {
  const W = 120;
  const H = height;
  const top = 16;
  const bandH = (H - top - 16) / strata.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ maxHeight: '100%', display: 'block' }}
      role="navigation"
      aria-label="Carotte de sol : navigation par strate"
    >
      <defs>
        <linearGradient id="ds-core-gloss" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id="ds-core-clip">
          <rect x="26" y={top} width="68" height={H - top - 16} rx="24" />
        </clipPath>
      </defs>

      <g clipPath="url(#ds-core-clip)">
        {strata.map((s, i) => {
          const y = top + i * bandH;
          const filled = !!s.value;
          const color = s.color || `hsl(${SOIL_BLOCKS[s.id].accent})`;
          const isActive = active === s.id;
          return (
            <g
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="26"
                y={y}
                width="68"
                height={bandH}
                fill={filled ? color : '#efe9dc'}
                opacity={filled ? (isActive ? 1 : 0.78) : 0.5}
              />
              {!filled && (
                <rect
                  x="26"
                  y={y}
                  width="68"
                  height={bandH}
                  fill="none"
                  stroke="#8a8577"
                  strokeDasharray="3 4"
                  strokeWidth="1"
                  opacity="0.6"
                />
              )}
              {/* grain de terre */}
              {filled &&
                Array.from({ length: 7 }).map((_, k) => (
                  <circle
                    key={k}
                    cx={34 + ((k * 23) % 52)}
                    cy={y + 10 + ((k * 17) % Math.max(10, bandH - 18))}
                    r={1.4 + (k % 3) * 0.5}
                    fill="#2b2119"
                    opacity="0.16"
                  />
                ))}
              <rect x="26" y={y} width="68" height={bandH} fill="url(#ds-core-gloss)" />
              {i > 0 && (
                <line x1="26" y1={y} x2="94" y2={y} stroke="#2b2119" strokeOpacity="0.25" strokeWidth="1" />
              )}
            </g>
          );
        })}
      </g>

      {/* tube */}
      <rect
        x="26"
        y={top}
        width="68"
        height={H - top - 16}
        rx="24"
        fill="none"
        stroke="#3a2f22"
        strokeOpacity="0.5"
        strokeWidth="2"
      />

      {/* repères & étiquettes */}
      {strata.map((s, i) => {
        const y = top + i * bandH;
        const cy = y + bandH / 2;
        const isActive = active === s.id;
        return (
          <g key={`lbl-${s.id}`} onClick={() => onSelect(s.id)} style={{ cursor: 'pointer' }}>
            <line
              x1="94"
              y1={cy}
              x2="104"
              y2={cy}
              stroke="#3a2f22"
              strokeOpacity={isActive ? 0.9 : 0.35}
              strokeWidth={isActive ? 2 : 1}
            />
            <circle
              cx="108"
              cy={cy}
              r={isActive ? 4.5 : 3}
              fill={s.value ? s.color || `hsl(${SOIL_BLOCKS[s.id].accent})` : 'transparent'}
              stroke="#3a2f22"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <text
              x="20"
              y={cy - 3}
              textAnchor="end"
              fontSize="8"
              letterSpacing="1.4"
              fill="#3a2f22"
              opacity={isActive ? 0.95 : 0.5}
              style={{ textTransform: 'uppercase' }}
            >
              {s.label}
            </text>
            <text
              x="20"
              y={cy + 8}
              textAnchor="end"
              fontSize="9.5"
              fontWeight={600}
              fill="#2f5d3a"
              opacity={s.value ? (isActive ? 1 : 0.7) : 0.35}
            >
              {s.value ?? '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default SampleCoreSvg;
