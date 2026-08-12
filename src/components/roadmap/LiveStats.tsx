import React from 'react';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
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

const LiveStats: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {stats.map((s) => (
      <div
        key={s.label}
        className="rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center backdrop-blur"
      >
        <div className="text-2xl font-semibold text-foreground">
          <Counter value={s.value} />
          {s.suffix}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {s.label}
        </div>
      </div>
    ))}
  </div>
);

export default LiveStats;
