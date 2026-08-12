import React from 'react';
import { VIZ, prefersReducedMotion, smoothPath } from '@/lib/roadmap/vizPalette';
import { AUDIENCES, type RoadmapEntry, type RoadmapWeek } from '@/lib/roadmap/types';

interface Props {
  weeks: RoadmapWeek[];
  entries: RoadmapEntry[];
}

const W = 900;
const H = 260;

/** Sismographe de cadence : aires empilées par public, tracées au trait. */
const Sismographe: React.FC<Props> = ({ weeks, entries }) => {
  const [on, setOn] = React.useState(prefersReducedMotion());
  React.useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const ordered = React.useMemo(
    () => [...weeks].sort((a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week).slice(-16),
    [weeks],
  );
  if (ordered.length === 0) return null;

  const series = AUDIENCES.map((a) => ({
    ...a,
    values: ordered.map(
      (w) => entries.filter((e) => e.week_id === w.id && e.audiences.includes(a.key)).length,
    ),
  }));

  const totals = ordered.map((_, i) => series.reduce((s, x) => s + x.values[i], 0));
  const max = Math.max(1, ...totals);
  const stepX = (W - 80) / Math.max(1, ordered.length - 1);
  const base = H - 42;
  const scale = (v: number) => (v / max) * (H - 90);

  const stacks: number[][] = ordered.map(() => []);
  ordered.forEach((_, i) => {
    let acc = 0;
    series.forEach((s) => {
      acc += s.values[i];
      stacks[i].push(acc);
    });
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Cadence de livraison par public, semaine après semaine"
      >
        <line x1="40" y1={base} x2={W - 40} y2={base} stroke={VIZ.line} />
        {series.map((s, si) => {
          const top = ordered.map((_, i) => ({ x: 40 + i * stepX, y: base - scale(stacks[i][si]) }));
          const bottom = ordered
            .map((_, i) => ({
              x: 40 + i * stepX,
              y: base - scale(si === 0 ? 0 : stacks[i][si - 1]),
            }))
            .reverse();
          const d = `${smoothPath(top)} L${bottom[0].x} ${bottom[0].y} ${smoothPath(bottom).slice(1)} Z`;
          return (
            <g key={s.key}>
              <path
                d={d}
                fill={`hsl(var(--primary) / ${0.1 + si * 0.12})`}
                stroke="none"
                opacity={on ? 1 : 0}
                className="transition-opacity duration-1000"
              />
              <path
                d={smoothPath(top)}
                fill="none"
                stroke={VIZ.accent}
                strokeWidth="1.4"
                opacity={0.5 + si * 0.2}
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: on ? 0 : 1,
                  transition: `stroke-dashoffset 1.4s ease-out ${si * 180}ms`,
                }}
              />
            </g>
          );
        })}
        {ordered.map((w, i) => (
          <text
            key={w.id}
            x={40 + i * stepX}
            y={base + 18}
            textAnchor="middle"
            fontSize="10"
            fill={VIZ.soft}
          >
            S{w.iso_week}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
        {series.map((s, si) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 rounded-sm"
              style={{ background: `hsl(var(--primary) / ${0.25 + si * 0.25})` }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Sismographe;
