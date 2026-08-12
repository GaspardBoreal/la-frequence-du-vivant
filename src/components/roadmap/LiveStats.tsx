import React from 'react';
import { VIZ, smoothPath } from '@/lib/roadmap/vizPalette';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  /** Série optionnelle : micro-sparkline sous le chiffre. */
  series?: number[];
}

/** Compteurs qui montent doucement à l'apparition. */
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown.toLocaleString('fr-FR')}</>;
};

const Spark: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    y: 26 - (v / max) * 22,
  }));
  const d = smoothPath(pts);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-2 h-6 w-full" aria-hidden="true">
      <path d={`${d} L100 30 L0 30 Z`} fill="hsl(var(--primary) / 0.12)" />
      <path d={d} fill="none" stroke={VIZ.accent} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const LiveStats: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {stats.map((s) => (
      <div
        key={s.label}
        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-center backdrop-blur transition hover:border-primary/40 hover:shadow-lg"
      >
        <div className="text-2xl font-semibold text-foreground">
          <Counter value={s.value} />
          {s.suffix}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {s.label}
        </div>
        {s.series && <Spark values={s.series} />}
      </div>
    ))}
  </div>
);

export default LiveStats;
