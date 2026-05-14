import React from 'react';
import { motion } from 'framer-motion';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { cn } from '@/lib/utils';

interface RadialGaugeProps {
  /** Value to display (in 0..max range) */
  value: number;
  /** Maximum of the gauge (default 1) */
  max?: number;
  /** Number of decimals for the displayed value */
  decimals?: number;
  /** Optional suffix shown after the value (e.g. "%", "/ ln(S)") */
  suffix?: string;
  /** Headline text inside the gauge */
  label?: string;
  /** Additional caption below the value */
  caption?: string;
  /** Color tone class for the arc and label */
  toneClass?: string;
  /** Diameter in px (default 220) */
  size?: number;
  /** Reference markers (0..max) shown as small ticks */
  benchmarks?: Array<{ value: number; label: string }>;
}

/**
 * Animated radial gauge — pure SVG, no chart lib. Tokens-only colors via
 * `currentColor` driven by `toneClass`.
 */
export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max = 1,
  decimals = 2,
  suffix,
  label,
  caption,
  toneClass = 'text-emerald-500',
  size = 220,
  benchmarks,
}) => {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const arcLen = Math.PI * r; // half-circle perimeter
  const dash = ratio * arcLen;

  // Animate displayed number (×10^decimals to use the int counter)
  const factor = Math.pow(10, decimals);
  const animated = useAnimatedCounter(Math.round(value * factor), 1200, 100);
  const display = (animated / factor).toFixed(decimals);

  return (
    <div
      className={cn('relative flex flex-col items-center', toneClass)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      aria-label={label}
      style={{ width: size }}
    >
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <defs>
          <linearGradient id={`gauge-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground) / 0.3)" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${stroke / 2} ${c} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${c}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d={`M ${stroke / 2} ${c} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${c}`}
          fill="none"
          stroke={`url(#gauge-grad-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLen}`}
          initial={{ strokeDasharray: `0 ${arcLen}` }}
          animate={{ strokeDasharray: `${dash} ${arcLen}` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Benchmarks */}
        {benchmarks?.map((b, i) => {
          const a = Math.PI * (1 - Math.max(0, Math.min(1, b.value / safeMax)));
          const x1 = c + Math.cos(a) * (r - stroke / 2);
          const y1 = c - Math.sin(a) * (r - stroke / 2);
          const x2 = c + Math.cos(a) * (r + stroke / 2);
          const y2 = c - Math.sin(a) * (r + stroke / 2);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--foreground) / 0.5)"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1 flex flex-col items-center pointer-events-none">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {display}
          {suffix && <span className="text-base ml-1 text-muted-foreground">{suffix}</span>}
        </span>
        {label && <span className="text-xs font-medium text-muted-foreground mt-1">{label}</span>}
      </div>
      {caption && (
        <p className="mt-3 text-xs text-muted-foreground text-center max-w-[260px] leading-relaxed">
          {caption}
        </p>
      )}
      {benchmarks && benchmarks.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {benchmarks.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className="w-1 h-2.5 bg-foreground/40 rounded-sm" />
              {b.label} ({b.value.toFixed(2)})
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadialGauge;
