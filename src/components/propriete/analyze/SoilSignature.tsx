import React from 'react';
import type { SoilReading } from './soilReading';
import { PH_CLASS_MAP } from './phTests';
import { LIFE_CLASS_MAP } from './lifeTests';

/**
 * Signature du sol — glyphe unique généré depuis les dominantes du diagnostic.
 * Quatre strates horizontales (terrain · structure · texture · vie) traversées
 * par une ligne de pH, et un point par prélèvement renseigné.
 */
export const SoilSignature: React.FC<{ reading: SoilReading; dateStr?: string }> = ({
  reading,
  dateStr,
}) => {
  const W = 800;
  const H = 120;

  const phClass = reading.ph.dominant ? PH_CLASS_MAP[reading.ph.dominant] : null;
  const lifeClass = reading.life.dominant ? LIFE_CLASS_MAP[reading.life.dominant] : null;

  // Densité d'agrégats pilotée par la structure dominante
  const grain =
    reading.structure.dominant === 'compacte'
      ? 3
      : reading.structure.dominant === 'grumeleuse'
        ? 9
        : reading.structure.dominant === 'particulaire'
          ? 22
          : 6;

  // Amplitude de la ligne de pH : amplitude mesurée entre prélèvements
  const amp = 6 + Math.min(reading.ph.amplitude, 3) * 8;
  const phY = (v: number | null) =>
    v == null ? H / 2 : H - 18 - ((v - 4) / 5) * (H - 44);

  const samples = reading.samples;
  const step = W / (Math.max(samples.length, 1) + 1);

  const linePath = samples
    .map((s, i) => {
      const x = step * (i + 1);
      const y = phY(typeof s.ph_value === 'number' ? s.ph_value : reading.ph.average);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="mb-8 print-avoid-break">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[120px]" preserveAspectRatio="none">
        {/* strates */}
        <rect x="0" y={H - 16} width={W} height="16" fill="hsl(var(--ds-forest-deep))" opacity="0.14" />
        <rect x="0" y={H - 40} width={W} height="24" fill="hsl(var(--ds-gold))" opacity="0.16" />
        <rect x="0" y={H - 72} width={W} height="32" fill="hsl(var(--ds-forest))" opacity="0.10" />

        {/* agrégats — densité = structure */}
        {Array.from({ length: grain * 4 }).map((_, i) => {
          const x = ((i * 97) % W) + ((i % 3) * 7);
          const y = H - 70 + ((i * 37) % 52);
          const r = reading.structure.dominant === 'compacte' ? 1.1 : reading.structure.dominant === 'particulaire' ? 0.8 : 1.8;
          return <circle key={i} cx={x % W} cy={y} r={r} fill="hsl(var(--ds-forest-deep))" opacity="0.25" />;
        })}

        {/* ligne de pH */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={phClass?.color ?? 'hsl(var(--ds-forest))'}
            strokeWidth={2 + Math.min(amp / 14, 2)}
            strokeLinecap="round"
          />
        )}

        {/* points par prélèvement */}
        {samples.map((s, i) => {
          const x = step * (i + 1);
          const y = phY(typeof s.ph_value === 'number' ? s.ph_value : reading.ph.average);
          const filled =
            !!s.structure_result || !!s.texture_result || typeof s.ph_value === 'number';
          return (
            <g key={s.id}>
              <circle
                cx={x}
                cy={y}
                r={filled ? 5 : 3.5}
                fill={filled ? (lifeClass?.color ?? 'hsl(var(--ds-forest))') : 'transparent'}
                stroke={lifeClass?.color ?? 'hsl(var(--ds-forest))'}
                strokeWidth="1.4"
              />
              <text
                x={x}
                y={H - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="hsl(var(--ds-forest-deep))"
                opacity="0.7"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1.5 flex items-baseline justify-between text-[9px] uppercase tracking-[0.28em] text-[hsl(var(--ds-forest))]/60">
        <span>Signature du sol</span>
        <span>{dateStr ?? ''}</span>
      </div>
    </div>
  );
};
