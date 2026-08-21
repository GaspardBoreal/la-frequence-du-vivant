import React from 'react';
import AnomalySparkline from '@/components/iot/alerts/AnomalySparkline';
import { GRAVITE_LABEL, type RegleMeta } from '@/lib/iot/anomalies';

/** Fiche explicative d'une règle de détection : ce qu'elle cherche, son seuil, sa signature. */
export const RuleCard: React.FC<{
  regle: RegleMeta;
  count: number;
  exemple?: string | null;
  /** Pictogramme de la veille, affiché devant son nom. */
  icone?: React.ReactNode;
}> = ({ regle, count, exemple, icone }) => (
  <div className="space-y-2 rounded-lg border border-border bg-card p-3 text-left">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          {icone}
          {regle.nom}
        </p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {GRAVITE_LABEL[regle.gravite]} · {count} sur la période
        </p>
      </div>
      <AnomalySparkline forme={regle.signature} className="h-[34px] w-[110px] shrink-0" />
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">{regle.cherche}</p>
    {exemple && (
      <p className="rounded-md bg-muted/50 px-2 py-1.5 text-[11px] leading-relaxed text-foreground/80">
        Seuil appliqué ici — {exemple}
      </p>
    )}
    <p className="text-[11px] italic text-muted-foreground">Ignoré volontairement : {regle.ignore}</p>
  </div>
);

export default RuleCard;
