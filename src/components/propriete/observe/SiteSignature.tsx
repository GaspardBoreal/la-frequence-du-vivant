import React from 'react';
import { OBSERVE_BLOCKS } from './observeConfig';
import { hasRisk } from './summarizeAnswers';

interface Props {
  answers: Record<string, string[]>;
  sensorial: Record<string, any>;
  dateStr?: string;
}

// Amplitude piloted by the "relief" block
const computeAmplitude = (relief: string[]): number => {
  if (relief.includes('pentu')) return 22;
  if (relief.includes('terrasse')) return 16;
  if (relief.includes('pente_legere')) return 10;
  return 4; // plat / default
};

// Stroke width piloted by sensorial intensity (1..10 → 1.2..4)
const computeStroke = (intensity: number): number => {
  const i = Math.max(1, Math.min(10, intensity || 5));
  return 1.2 + (i / 10) * 2.8;
};

// Trait color piloted by dominant water context
const pickWaterColor = (water: string[]): string => {
  if (water.includes('stagnation') || water.includes('humide') || water.includes('inondation'))
    return 'hsl(200 55% 42%)';
  if (water.includes('sec') || water.includes('secheresse')) return 'hsl(35 75% 50%)';
  return 'hsl(var(--ds-forest))';
};

export const SiteSignature: React.FC<Props> = ({ answers, sensorial, dateStr }) => {
  const intensity =
    typeof sensorial?.intensity === 'number' ? sensorial.intensity : 5;
  const amp = computeAmplitude(answers['relief'] ?? []);
  const stroke = computeStroke(intensity);
  const color = pickWaterColor(answers['water'] ?? []);

  const W = 800;
  const H = 90;
  const mid = H / 2;
  const N = OBSERVE_BLOCKS.length; // 8
  const step = W / (N + 1);

  // Build a wave path with N+2 anchors
  const points: Array<[number, number]> = [];
  points.push([0, mid]);
  for (let i = 1; i <= N; i++) {
    const x = step * i;
    const y = mid + Math.sin((i / N) * Math.PI * 2) * amp;
    points.push([x, y]);
  }
  points.push([W, mid]);

  // Smooth path (Catmull-Rom → Bezier approximation)
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p[0]},${p[1]}`;
      const prev = points[i - 1];
      const cx = (prev[0] + p[0]) / 2;
      return `Q ${prev[0]},${prev[1]} ${cx},${(prev[1] + p[1]) / 2} T ${p[0]},${p[1]}`;
    })
    .join(' ');

  return (
    <figure className="mt-6 mb-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-4 py-3 print:border-[#c9a84c]/40 print:bg-transparent">
      <figcaption className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          Signature écologique du site
        </span>
        {dateStr && (
          <span className="text-[10px] tracking-widest uppercase text-[hsl(var(--ds-forest))]/60">
            {dateStr}
          </span>
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-16 md:h-20 print:h-12"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {OBSERVE_BLOCKS.map((b, i) => {
          const [x, y] = points[i + 1];
          const sel = answers[b.id] ?? [];
          const risky = hasRisk(sel);
          const filled = sel.length > 0;
          const above = i % 2 === 0;
          const labelY = above ? y - 14 : y + 22;
          return (
            <g key={b.id}>
              <circle
                cx={x}
                cy={y}
                r={risky ? 5 : 4}
                fill={
                  risky
                    ? 'hsl(35 85% 55%)'
                    : filled
                      ? 'hsl(var(--ds-forest-deep))'
                      : 'hsl(var(--ds-line))'
                }
                stroke="hsl(var(--ds-cream))"
                strokeWidth={1.5}
              >
                {risky && (
                  <animate
                    attributeName="r"
                    values="5;7;5"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                style={{ fontSize: 14 }}
                aria-hidden
              >
                {b.choices.find((c) => sel.includes(c.value))?.icon ?? '·'}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
};
