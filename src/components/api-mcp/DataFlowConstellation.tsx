import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  label: string;
  desc: string;
}

interface Props {
  steps: Step[];
  compact?: boolean;
}

/**
 * Animated SVG flow: glowing nodes linked by pulsing emerald threads.
 * Each step is a luminous point on a horizontal constellation.
 */
const DataFlowConstellation: React.FC<Props> = ({ steps, compact }) => {
  if (!steps?.length) return null;
  const h = compact ? 90 : 140;
  const w = 800;
  const padX = 60;
  const innerW = w - padX * 2;
  const gap = steps.length > 1 ? innerW / (steps.length - 1) : 0;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 p-4 backdrop-blur">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4A8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#73FFB8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2DD4A8" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="#73FFB8" stopOpacity="1" />
            <stop offset="60%" stopColor="#2DD4A8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0D6B58" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* threads */}
        {steps.slice(0, -1).map((_, i) => (
          <motion.line
            key={`l-${i}`}
            x1={padX + gap * i}
            y1={h / 2}
            x2={padX + gap * (i + 1)}
            y2={h / 2}
            stroke="url(#threadGrad)"
            strokeWidth={1.5}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: i * 0.25, ease: 'easeOut' }}
          />
        ))}

        {/* travelling pulses */}
        {steps.slice(0, -1).map((_, i) => (
          <motion.circle
            key={`p-${i}`}
            r={3}
            fill="#73FFB8"
            initial={{ cx: padX + gap * i, cy: h / 2, opacity: 0 }}
            animate={{ cx: padX + gap * (i + 1), opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 2.4,
              delay: 1 + i * 0.6,
              repeat: Infinity,
              repeatDelay: steps.length * 0.6,
            }}
          />
        ))}

        {/* nodes */}
        {steps.map((step, i) => {
          const cx = padX + gap * i;
          return (
            <g key={`n-${i}`}>
              <motion.circle
                cx={cx}
                cy={h / 2}
                r={22}
                fill="url(#nodeGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.6, delay: i * 0.25 }}
              />
              <circle cx={cx} cy={h / 2} r={5} fill="#73FFB8" />
              <text
                x={cx}
                y={h / 2 - 32}
                textAnchor="middle"
                fill="#E8FFF6"
                fontSize={compact ? 9 : 10}
                fontWeight={600}
                className="select-none"
              >
                {i + 1}
              </text>
              {!compact && (
                <text
                  x={cx}
                  y={h / 2 + 42}
                  textAnchor="middle"
                  fill="#A7F3D0"
                  fontSize={9}
                  className="select-none"
                >
                  {step.label.length > 22 ? step.label.slice(0, 20) + '…' : step.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DataFlowConstellation;
