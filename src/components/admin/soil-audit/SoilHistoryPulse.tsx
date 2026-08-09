import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoilHistoryPulseRow } from '@/hooks/propriete/useSoilGuardAudit';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export const SoilHistoryPulse: React.FC<{ rows: SoilHistoryPulseRow[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-6 text-center">
        Aucune écriture archivée pour l'instant. Le journal se remplira à la première
        modification d'un registre.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const prev = r.previous_count;
        const cur = r.samples_count ?? 0;
        const delta = prev == null ? 0 : cur - prev;
        const Icon = delta < 0 ? ArrowDownRight : delta > 0 ? ArrowUpRight : Minus;
        return (
          <li
            key={r.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3',
              delta < 0
                ? 'border-destructive/40 bg-destructive/5'
                : 'border-border bg-card',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                delta < 0 ? 'text-destructive' : delta > 0 ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {r.propriete_nom ?? 'Propriété inconnue'}
              </p>
              <p className="text-xs text-muted-foreground">{fmt(r.changed_at)}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {prev == null ? `${cur} prélèv.` : `${prev} → ${cur}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default SoilHistoryPulse;
