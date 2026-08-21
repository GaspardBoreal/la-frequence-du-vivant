import React from 'react';

/**
 * Frise de vitalité : une barre par heure sur la fenêtre demandée.
 * L'intensité dit combien de mesures sont arrivées ; les trous se voient.
 */
export interface VitalityStripProps {
  /** Horodatages de réception (ISO). */
  timestamps: string[];
  hours?: number;
  className?: string;
  color?: string;
  showScale?: boolean;
  /** Rend les barres cliquables : renvoie l'index et les bornes de l'heure. */
  onSelectHour?: (index: number, from: Date, to: Date) => void;
  /** Index de la barre actuellement ouverte. */
  selectedIndex?: number | null;
}

export const VitalityStrip: React.FC<VitalityStripProps> = ({
  timestamps,
  hours = 48,
  className = '',
  color = '16 122 96',
  showScale = false,
  onSelectHour,
  selectedIndex = null,
}) => {
  const nowRef = React.useRef(Date.now());
  const buckets = React.useMemo(() => {
    const now = Date.now();
    nowRef.current = now;
    const arr = new Array(hours).fill(0);
    timestamps.forEach((t) => {
      const h = Math.floor((now - new Date(t).getTime()) / 3_600_000);
      if (h >= 0 && h < hours) arr[hours - 1 - h] += 1;
    });
    return arr;
  }, [timestamps, hours]);

  const max = Math.max(1, ...buckets);

  const boundsFor = (i: number) => {
    const to = new Date(nowRef.current - (hours - 1 - i) * 3_600_000);
    const from = new Date(to.getTime() - 3_600_000);
    return { from, to };
  };

  return (
    <div className={className}>
      <div className="flex h-8 items-end gap-[2px]">
        {buckets.map((n, i) => {
          const ratio = n / max;
          const selected = selectedIndex === i;
          const bar = (
            <div
              className="w-full rounded-[1px] transition-all"
              style={{
                height: n ? `${Math.max(18, ratio * 100)}%` : '10%',
                background: n ? `rgba(${color} / ${0.35 + ratio * 0.65})` : 'hsl(var(--muted-foreground) / 0.16)',
                outline: selected ? '1px solid hsl(var(--primary))' : undefined,
                outlineOffset: selected ? '1px' : undefined,
              }}
            />
          );
          const { from, to } = boundsFor(i);
          const fmt = (d: Date) => new Intl.DateTimeFormat('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
          }).format(d);
          const title = n
            ? `${n} valeur${n > 1 ? 's' : ''} · ${fmt(from)} → ${fmt(to)}`
            : `Silence · ${fmt(from)} → ${fmt(to)}`;

          if (!onSelectHour) {
            return (
              <div key={i} title={title} className="flex h-full flex-1 items-end">{bar}</div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              title={title}
              aria-label={title}
              onClick={() => {
                const { from, to } = boundsFor(i);
                onSelectHour(i, from, to);
              }}
              className="flex h-full flex-1 items-end opacity-90 transition hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {bar}
            </button>
          );
        })}
      </div>

      {showScale && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>−{hours} h</span>
          <span>maintenant</span>
        </div>
      )}
    </div>
  );
};

export default VitalityStrip;
