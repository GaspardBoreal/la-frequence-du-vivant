import React from 'react';
import type { CarpetRow } from '@/lib/iot/analyses';

/** Du sec au saturé : ocre → vert → bleu. */
const shade = (v: number) => {
  if (v < 12) return '#b4553a';
  if (v < 20) return '#c9a24a';
  if (v < 30) return '#6f9f66';
  if (v < 38) return '#3f7f52';
  return '#2f6f8f';
};

const dayLabel = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);

/** Niveau 2 — le tapis d'humidité : une bande par profondeur, heures × jours. */
const MoistureCarpet: React.FC<{ rows: CarpetRow[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
        Aucune humidité de sol transmise : le tapis ne peut pas être tissé pour cette sonde.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.key} className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-medium">{row.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {row.min} % → {row.max} % sur {row.days.length} jours
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {row.days.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-12 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                    {dayLabel(day)}
                  </div>
                  <div className="flex flex-1 gap-[1px]">
                    {Array.from({ length: 24 }, (_, h) => {
                      const cell = row.cells.find((c) => c.day === day && c.hour === h);
                      const v = cell?.v ?? null;
                      return (
                        <div
                          key={h}
                          title={v == null ? `${dayLabel(day)} ${h}h · pas de relevé` : `${dayLabel(day)} ${h}h · ${v} %`}
                          className="h-3 flex-1 rounded-[2px]"
                          style={{
                            backgroundColor: v == null ? 'transparent' : shade(v),
                            border: v == null ? '1px dashed hsl(var(--border))' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-1 flex items-center gap-2">
                <div className="w-12" />
                <div className="flex flex-1 justify-between text-[9px] text-muted-foreground">
                  <span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            {[
              ['Sec (<12 %)', '#b4553a'],
              ['Juste (12–20 %)', '#c9a24a'],
              ['Confortable (20–38 %)', '#3f7f52'],
              ['Saturé (>38 %)', '#2f6f8f'],
              ['Pas de relevé', 'transparent'],
            ].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1">
                <span
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: c, border: c === 'transparent' ? '1px dashed hsl(var(--border))' : 'none' }}
                />
                {l}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MoistureCarpet;
