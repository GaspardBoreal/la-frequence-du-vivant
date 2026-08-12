import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VIZ, prefersReducedMotion, smoothPath } from '@/lib/roadmap/vizPalette';
import type { RoadmapAudience, RoadmapEntry, RoadmapWeek } from '@/lib/roadmap/types';

interface Props {
  weeks: RoadmapWeek[];
  entries: RoadmapEntry[];
  audience: RoadmapAudience | null;
  activeWeekId?: string;
}

const W = 1000;
const H = 220;

/** La frise vivante : une nervure par semaine, épaisseur = densité de nouveautés. */
const FriseVivante: React.FC<Props> = ({ weeks, entries, audience, activeWeekId }) => {
  const navigate = useNavigate();
  const [hover, setHover] = React.useState<string | null>(null);
  const [drawn, setDrawn] = React.useState(prefersReducedMotion());

  React.useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const ordered = React.useMemo(
    () =>
      [...weeks].sort(
        (a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week,
      ),
    [weeks],
  );

  if (ordered.length === 0) return null;

  const counts = ordered.map((w) => entries.filter((e) => e.week_id === w.id).length);
  const max = Math.max(1, ...counts);
  const stepX = (W - 120) / Math.max(1, ordered.length - 1);
  const baseY = H - 58;

  const nodes = ordered.map((w, i) => {
    const n = counts[i];
    const x = 60 + i * stepX;
    const y = baseY - (n / max) * 108;
    return { w, n, x, y };
  });

  const spine = smoothPath(nodes.map((p) => ({ x: p.x, y: p.y })));
  const area = `${spine} L${nodes[nodes.length - 1].x} ${baseY} L${nodes[0].x} ${baseY} Z`;
  const focus = hover ?? activeWeekId ?? null;
  const focused = nodes.find((p) => p.w.id === focus);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-2 backdrop-blur">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Frise des semaines : hauteur proportionnelle au nombre de nouveautés publiées"
      >
        <defs>
          <linearGradient id="frise-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.28)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
          </linearGradient>
        </defs>

        <line x1="40" y1={baseY} x2={W - 40} y2={baseY} stroke={VIZ.line} strokeWidth="1" />

        <path d={area} fill="url(#frise-fill)" opacity={drawn ? 1 : 0} className="transition-opacity duration-700" />
        <path
          d={spine}
          fill="none"
          stroke={VIZ.accent}
          strokeWidth="1.8"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            transition: 'stroke-dashoffset 1.6s ease-out',
          }}
        />

        {nodes.map((p) => {
          const on = p.w.id === focus;
          return (
            <g
              key={p.w.id}
              className="cursor-pointer"
              onMouseEnter={() => setHover(p.w.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                navigate(
                  `/roadmap/semaine/${p.w.iso_year}/${p.w.iso_week}${audience ? `?public=${audience}` : ''}`,
                )
              }
            >
              <line
                x1={p.x}
                y1={baseY}
                x2={p.x}
                y2={p.y}
                stroke={on ? VIZ.accent : VIZ.line}
                strokeWidth={on ? 1.6 : 1}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 8 : 4.5}
                fill={on ? VIZ.accent : 'hsl(var(--card))'}
                stroke={VIZ.accent}
                strokeWidth="1.4"
                className="transition-all duration-300"
              />
              {on && <circle cx={p.x} cy={p.y} r="15" fill="none" stroke={VIZ.accentSoft} strokeWidth="1" />}
              <text
                x={p.x}
                y={baseY + 18}
                textAnchor="middle"
                fontSize="11"
                fill={on ? VIZ.ink : VIZ.soft}
              >
                S{p.w.iso_week}
              </text>
              <rect
                x={p.x - stepX / 2}
                y="0"
                width={Math.max(stepX, 24)}
                height={H}
                fill="transparent"
              />
            </g>
          );
        })}

        {focused && (
          <text
            x={Math.min(Math.max(focused.x, 130), W - 130)}
            y="24"
            textAnchor="middle"
            fontSize="14"
            fill={VIZ.ink}
          >
            {(focused.w.title || `Semaine ${focused.w.iso_week}`).slice(0, 58)}
          </text>
        )}
        {focused && (
          <text
            x={Math.min(Math.max(focused.x, 130), W - 130)}
            y="42"
            textAnchor="middle"
            fontSize="11"
            fill={VIZ.soft}
          >
            {focused.n} nouveauté{focused.n > 1 ? 's' : ''}
          </text>
        )}
      </svg>
    </div>
  );
};

export default FriseVivante;
