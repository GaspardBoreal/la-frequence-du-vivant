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
}

export const VitalityStrip: React.FC<VitalityStripProps> = ({
  timestamps,
  hours = 48,
  className = '',
  color = '16 122 96',
  showScale = false,
}) => {
  const buckets = React.useMemo(() => {
    const now = Date.now();
    const arr = new Array(hours).fill(0);
    timestamps.forEach((t) => {
      const h = Math.floor((now - new Date(t).getTime()) / 3_600_000);
      if (h >= 0 && h < hours) arr[hours - 1 - h] += 1;
    });
    return arr;
  }, [timestamps, hours]);

  const max = Math.max(1, ...buckets);

  return (
    <div className={className}>
      <div className="flex h-8 items-end gap-[2px]">
        {buckets.map((n, i) => {
          const ratio = n / max;
          return (
            <div
              key={i}
              title={n ? `${n} mesure${n > 1 ? 's' : ''} · il y a ${hours - 1 - i} h` : `silence · il y a ${hours - 1 - i} h`}
              className="flex-1 rounded-[1px] transition-all"
              style={{
                height: n ? `${Math.max(18, ratio * 100)}%` : '10%',
                background: n ? `rgba(${color} / ${0.35 + ratio * 0.65})` : 'hsl(var(--muted-foreground) / 0.16)',
              }}
            />
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
