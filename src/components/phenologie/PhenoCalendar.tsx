import React, { useMemo } from 'react';
import { Sprout, Calendar } from 'lucide-react';
import { usePhenoObservations } from '@/hooks/usePhenoObservations';
import { getCropByKey, getStageColor, getStagesForCrop } from '@/lib/bbchStages';

interface PhenoCalendarProps {
  explorationId?: string | null;
}

/**
 * Calendrier phéno : pour chaque culture observée dans l'exploration,
 * affiche la frise BBCH avec les stades constatés et le nombre d'observations.
 */
export const PhenoCalendar: React.FC<PhenoCalendarProps> = ({ explorationId }) => {
  const { data: obs = [], isLoading } = usePhenoObservations(explorationId);

  const grouped = useMemo(() => {
    const byCrop = new Map<string, { count: number; macros: Map<number, number>; latest: string }>();
    for (const o of obs) {
      const entry = byCrop.get(o.crop_key) ?? {
        count: 0,
        macros: new Map<number, number>(),
        latest: o.observed_at,
      };
      entry.count++;
      entry.macros.set(o.bbch_macro, (entry.macros.get(o.bbch_macro) ?? 0) + 1);
      if (o.observed_at > entry.latest) entry.latest = o.observed_at;
      byCrop.set(o.crop_key, entry);
    }
    return Array.from(byCrop.entries())
      .map(([key, value]) => ({ key, ...value, crop: getCropByKey(key) }))
      .filter((row) => row.crop)
      .sort((a, b) => b.count - a.count);
  }, [obs]);

  if (isLoading) return null;
  if (!explorationId || grouped.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-transparent p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sprout className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">
          Calendrier phéno · {grouped.length} culture{grouped.length > 1 ? 's' : ''} suivie{grouped.length > 1 ? 's' : ''}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Stades BBCH (INRAE / AgroPortal) notés par les marcheurs. Lecture&nbsp;: germination → floraison → récolte.
      </p>

      <div className="space-y-4">
        {grouped.map(({ key, count, macros, latest, crop }) => {
          if (!crop) return null;
          const stages = getStagesForCrop(crop);
          return (
            <div key={key} className="rounded-xl bg-background/40 border border-border/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{crop.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{crop.labelFr}</div>
                    <div className="text-[10px] italic text-muted-foreground">{crop.scientificName}</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  <div>{count} note{count > 1 ? 's' : ''}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(latest).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-1">
                {stages.map((stage) => {
                  const n = macros.get(stage.macro) ?? 0;
                  const active = n > 0;
                  return (
                    <div
                      key={stage.macro}
                      title={`BBCH ${stage.macro} · ${stage.labelFr}${n ? ` · ${n} obs.` : ''}`}
                      className={`relative aspect-square rounded-md border flex items-center justify-center text-base transition-all ${
                        active
                          ? 'border-transparent shadow-sm scale-105'
                          : 'border-border/40 bg-muted/20 text-muted-foreground/30'
                      }`}
                      style={
                        active
                          ? {
                              background: `linear-gradient(135deg, ${getStageColor(stage.macro)}40, ${getStageColor(stage.macro)}15)`,
                              boxShadow: `inset 0 0 0 1px ${getStageColor(stage.macro)}60`,
                            }
                          : undefined
                      }
                    >
                      <span className={active ? 'opacity-100' : 'opacity-40 grayscale'}>
                        {stage.emoji}
                      </span>
                      {active && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] text-[9px] rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center px-1">
                          {n}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-mono text-muted-foreground/60 px-0.5">
                <span>0 germination</span>
                <span>6 floraison</span>
                <span>9 récolte</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhenoCalendar;
