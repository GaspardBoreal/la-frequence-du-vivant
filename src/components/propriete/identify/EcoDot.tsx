import React from 'react';
import { motion } from 'framer-motion';
import type { EcoAxis, EcoIntensity } from '@/lib/plantIndicatorKb';
import { ECO_AXES, INTENSITY_LABEL } from '@/lib/plantIndicatorKb';

/**
 * Pastille d'intensité écologique — méthode D.S. page 10.
 * 3 = disque plein · 2 = demi-disque · 1 = anneau · 0 = point discret
 */
export const EcoDot: React.FC<{
  axis: EcoAxis;
  value: EcoIntensity;
  size?: number;
  delay?: number;
  title?: string;
}> = ({ axis, value, size = 18, delay = 0, title }) => {
  const color = `hsl(var(${ECO_AXES[axis].token}))`;
  const r = size / 2;

  return (
    <motion.span
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      title={title ?? `${ECO_AXES[axis].label} · ${INTENSITY_LABEL[value]}`}
      className="inline-flex items-center justify-center align-middle"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
        {value === 0 && <circle cx="10" cy="10" r="1.6" fill="currentColor" opacity={0.18} />}
        {value === 1 && (
          <circle cx="10" cy="10" r="6" fill="none" stroke={color} strokeWidth="1.8" opacity={0.85} />
        )}
        {value === 2 && (
          <>
            <circle cx="10" cy="10" r="6.5" fill="none" stroke={color} strokeWidth="1.6" opacity={0.9} />
            <path d="M10 3.5 A6.5 6.5 0 0 1 10 16.5 Z" fill={color} opacity={0.9} />
          </>
        )}
        {value === 3 && (
          <>
            <circle cx="10" cy="10" r="7.6" fill={color} opacity={0.16} />
            <circle cx="10" cy="10" r="5.6" fill={color} />
          </>
        )}
      </svg>
      <span className="sr-only">{INTENSITY_LABEL[value]}</span>
    </motion.span>
  );
};

export const EcoDotLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
    {([3, 2, 1, 0] as EcoIntensity[]).map((v) => (
      <span key={v} className="inline-flex items-center gap-1.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/70">
        <EcoDot axis="eau" value={v} size={16} />
        {INTENSITY_LABEL[v]}
      </span>
    ))}
  </div>
);
