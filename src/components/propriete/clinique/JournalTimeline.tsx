import React from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { ConsultationMedia, CareAction } from '@/hooks/propriete/useGardenClinique';

const dateShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';

const at = (m: ConsultationMedia) => m.taken_at ?? m.created_at;

/* ────────── Frise d'évolution de l'étendue ────────── */

export const JournalTimeline: React.FC<{
  medias: ConsultationMedia[];
  actions: CareAction[];
  activeIndex: number | null;
  onPick: (i: number) => void;
}> = ({ medias, actions, activeIndex, onPick }) => {
  const points = medias
    .map((m, i) => ({ m, i, t: new Date(at(m)).getTime(), s: m.severity_at_capture }))
    .filter((p) => Number.isFinite(p.t) && p.s != null)
    .sort((a, b) => a.t - b.t);

  if (points.length < 2) return null;

  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const span = Math.max(1, t1 - t0);
  const x = (t: number) => 4 + ((t - t0) / span) * 92;
  const y = (s: number) => 6 + ((5 - s) / 4) * 30;

  const path = points.map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.t)} ${y(p.s as number)}`).join(' ');
  const first = points[0].s as number;
  const last = points[points.length - 1].s as number;
  const delta = last - first;
  const gestes = actions
    .filter((a) => a.done && a.done_at)
    .map((a) => ({ a, t: new Date(a.done_at as string).getTime() }))
    .filter((g) => g.t >= t0 - 864e5 && g.t <= t1 + 864e5);

  const Trend = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;
  const trendText =
    delta < 0 ? 'Le foyer régresse' : delta > 0 ? 'Le foyer progresse' : 'Le foyer stagne';

  return (
    <div className="mt-3 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[hsl(var(--ds-forest))]">
          Évolution de l'étendue
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]">
          <Trend className="h-3.5 w-3.5" />
          {trendText} · {first}/5 → {last}/5
        </span>
      </div>

      <svg viewBox="0 0 100 42" className="mt-2 h-24 w-full" preserveAspectRatio="none">
        {[1, 2, 3, 4, 5].map((s) => (
          <line
            key={s}
            x1={0}
            x2={100}
            y1={y(s)}
            y2={y(s)}
            stroke="hsl(var(--ds-line))"
            strokeWidth={0.3}
          />
        ))}
        {gestes.map((g) => (
          <line
            key={g.a.id}
            x1={x(g.t)}
            x2={x(g.t)}
            y1={2}
            y2={40}
            stroke="hsl(var(--ds-gold))"
            strokeWidth={0.5}
            strokeDasharray="1.5 1.5"
          />
        ))}
        <motion.path
          d={path}
          fill="none"
          stroke="hsl(var(--ds-forest))"
          strokeWidth={0.9}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {points.map((p) => (
          <circle
            key={p.m.id}
            cx={x(p.t)}
            cy={y(p.s as number)}
            r={p.i === activeIndex ? 2.2 : 1.4}
            fill={p.i === activeIndex ? 'hsl(var(--ds-gold))' : 'hsl(var(--ds-forest))'}
            stroke="white"
            strokeWidth={0.4}
            className="cursor-pointer"
            onClick={() => onPick(p.i)}
          />
        ))}
      </svg>

      <div className="flex items-center justify-between text-[10px] text-[hsl(var(--ds-forest-deep))]/75">
        <span>{dateShort(at(points[0].m))}</span>
        {!!gestes.length && (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--ds-gold))]" />
            {gestes.length} geste{gestes.length > 1 ? 's' : ''} réalisé{gestes.length > 1 ? 's' : ''}
          </span>
        )}
        <span>{dateShort(at(points[points.length - 1].m))}</span>
      </div>
    </div>
  );
};

/* ────────── Rideau Avant / Après ────────── */

export const BeforeAfterCurtain: React.FC<{ medias: ConsultationMedia[] }> = ({ medias }) => {
  const photos = medias
    .filter((m) => m.media_type === 'photo')
    .sort((a, b) => new Date(at(a)).getTime() - new Date(at(b)).getTime());
  const [pos, setPos] = React.useState(50);
  if (photos.length < 2) return null;

  const before = photos[0];
  const after = photos[photos.length - 1];
  const days = Math.max(
    0,
    Math.round((new Date(at(after)).getTime() - new Date(at(before)).getTime()) / 864e5),
  );
  const gap =
    before.severity_at_capture != null && after.severity_at_capture != null
      ? `étendue ${before.severity_at_capture}/5 → ${after.severity_at_capture}/5`
      : null;

  return (
    <div className="mt-3 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[hsl(var(--ds-forest))]">
          Avant / Après
        </span>
        <span className="text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]">
          {gap ? `${gap} · ` : ''}
          {days} jour{days > 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative mt-2 aspect-[4/3] w-full select-none overflow-hidden rounded-xl border border-[hsl(var(--ds-line))] bg-black/5">
        <img src={before.url} alt="Avant" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img src={after.url} alt="Après" className="h-full w-full object-cover" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-[hsl(var(--ds-gold))]"
          style={{ left: `${pos}%` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] shadow"
          style={{ left: `${pos}%` }}
        >
          <MoveHorizontal className="h-4 w-4" />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Curseur avant / après"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
          {dateShort(at(before))}
        </span>
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
          {dateShort(at(after))}
        </span>
      </div>
    </div>
  );
};

export default JournalTimeline;
