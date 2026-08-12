import React from 'react';
import { VIZ, prefersReducedMotion } from '@/lib/roadmap/vizPalette';
import { AUDIENCES, type RoadmapAudience, type RoadmapEntry } from '@/lib/roadmap/types';

interface Props {
  entries: RoadmapEntry[];
  audience: RoadmapAudience | null;
}

const W = 720;
const H = 460;

/** Constellation des domaines : où le projet a poussé, et pour qui. */
const ConstellationDomaines: React.FC<Props> = ({ entries, audience }) => {
  const [on, setOn] = React.useState(prefersReducedMotion());
  React.useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  const domains = React.useMemo(() => {
    const map = new Map<string, { n: number; audiences: Set<RoadmapAudience> }>();
    entries.forEach((e) => {
      const key = e.domain?.trim() || 'Divers';
      const cur = map.get(key) ?? { n: 0, audiences: new Set<RoadmapAudience>() };
      cur.n += 1;
      e.audiences.forEach((a) => cur.audiences.add(a));
      map.set(key, cur);
    });
    return [...map.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 12);
  }, [entries]);

  if (domains.length === 0) return null;

  const max = Math.max(...domains.map((d) => d.n));
  const cx = W / 2;
  const cy = H / 2 + 10;
  const R = 158;

  const audienceAnchors = AUDIENCES.map((a, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / AUDIENCES.length;
    return { ...a, x: cx + Math.cos(ang) * 62, y: cy + Math.sin(ang) * 62 };
  });

  const nodes = domains.map((d, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI) / domains.length;
    return {
      ...d,
      x: cx + Math.cos(ang) * R,
      y: cy + Math.sin(ang) * R,
      r: 8 + (d.n / max) * 18,
      ang,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Constellation des domaines : taille proportionnelle au nombre de nouveautés, fils vers les publics concernés"
    >
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={VIZ.line} strokeDasharray="2 6" />
      <circle cx={cx} cy={cy} r={R * 0.62} fill="none" stroke={VIZ.line} strokeDasharray="2 8" opacity="0.6" />

      {nodes.map((n) =>
        [...n.audiences]
          .filter((a) => !audience || a === audience)
          .map((a) => {
            const anchor = audienceAnchors.find((x) => x.key === a);
            if (!anchor) return null;
            return (
              <path
                key={`${n.label}-${a}`}
                d={`M${anchor.x} ${anchor.y} Q${(anchor.x + n.x) / 2 + (n.y - cy) * 0.12} ${(anchor.y + n.y) / 2 - (n.x - cx) * 0.12} ${n.x} ${n.y}`}
                fill="none"
                stroke={VIZ.accentSoft}
                strokeWidth="0.9"
                opacity={on ? 0.8 : 0}
                className="transition-opacity duration-1000"
              />
            );
          }),
      )}

      {audienceAnchors
        .filter((a) => !audience || a.key === audience)
        .map((a) => (
          <g key={a.key}>
            <circle cx={a.x} cy={a.y} r="6" fill={VIZ.accent} />
            <text x={a.x} y={a.y - 12} textAnchor="middle" fontSize="10.5" fill={VIZ.soft}>
              {a.label}
            </text>
          </g>
        ))}

      {nodes.map((n, i) => {
        const right = Math.cos(n.ang) >= 0;
        return (
          <g
            key={n.label}
            style={{
              opacity: on ? 1 : 0,
              transform: on ? 'none' : `translate(${(cx - n.x) * 0.3}px, ${(cy - n.y) * 0.3}px)`,
              transition: `opacity .7s ease-out ${i * 60}ms, transform .7s ease-out ${i * 60}ms`,
            }}
          >
            <circle cx={n.x} cy={n.y} r={n.r} fill="hsl(var(--primary) / 0.14)" stroke={VIZ.accent} strokeWidth="1.2" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fill={VIZ.ink}>
              {n.n}
            </text>
            <text
              x={n.x + (right ? n.r + 8 : -(n.r + 8))}
              y={n.y + 4}
              textAnchor={right ? 'start' : 'end'}
              fontSize="11"
              fill={VIZ.soft}
            >
              {n.label.length > 20 ? `${n.label.slice(0, 19)}…` : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default ConstellationDomaines;
