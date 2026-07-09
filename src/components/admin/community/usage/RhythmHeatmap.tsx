import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { UsageHeatmapCell } from '@/hooks/useCommunityUsageDashboard';

interface Props { heatmap: UsageHeatmapCell[] }

const DOW_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const RhythmHeatmap: React.FC<Props> = ({ heatmap }) => {
  const { grid, max, best } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let m = 0;
    let bestCell = { dow: 0, hour: 0, count: 0 };
    heatmap?.forEach((c) => {
      if (c.dow >= 0 && c.dow < 7 && c.hour >= 0 && c.hour < 24) {
        g[c.dow][c.hour] = c.count;
        if (c.count > m) m = c.count;
        if (c.count > bestCell.count) bestCell = c;
      }
    });
    return { grid: g, max: m, best: bestCell };
  }, [heatmap]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Rythmes de connexion (Europe/Paris)</h3>
          <p className="text-xs text-muted-foreground">Meilleurs créneaux pour campagnes email / push.</p>
        </div>
        {best.count > 0 && (
          <div className="text-xs text-right">
            <div className="uppercase tracking-wide text-muted-foreground">Pic</div>
            <div className="text-foreground font-semibold">{DOW_LABELS[best.dow]} · {best.hour}h</div>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="grid" style={{ gridTemplateColumns: '3rem repeat(24, minmax(14px, 1fr))', gap: 2 }}>
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-[9px] text-muted-foreground text-center tabular-nums">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
            {grid.map((row, dow) => (
              <React.Fragment key={dow}>
                <div className="text-[10px] text-muted-foreground pr-2 flex items-center justify-end">{DOW_LABELS[dow]}</div>
                {row.map((v, h) => {
                  const intensity = max > 0 ? v / max : 0;
                  const bg = intensity === 0
                    ? 'hsl(var(--muted) / 0.4)'
                    : `hsl(160 60% ${Math.round(70 - intensity * 40)}% / ${0.25 + intensity * 0.75})`;
                  return (
                    <div
                      key={h}
                      className="aspect-square rounded-sm relative group"
                      style={{ backgroundColor: bg, minWidth: 14 }}
                      title={`${DOW_LABELS[dow]} ${h}h — ${v} actions`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RhythmHeatmap;
