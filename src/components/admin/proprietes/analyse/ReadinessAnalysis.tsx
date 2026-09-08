import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from 'lucide-react';
import { readinessLabel, type GardenReadiness, type ReadinessLevel } from '@/lib/onboardingSegments';
import type { GardenAnswers } from '@/lib/onboardingStats';

const NIVEAU_STYLE: Record<ReadinessLevel, string> = {
  prioritaire: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  conforter: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  autonome: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

/** 4. L'écart entre le rêve et les moyens : où l'accompagnement change tout. */
const ReadinessAnalysis: React.FC<{
  rows: GardenReadiness[];
  onSelect: (titre: string, sousTitre: string, gardens: GardenAnswers[]) => void;
}> = ({ rows, onSelect }) => {
  const groupes: ReadinessLevel[] = ['prioritaire', 'conforter', 'autonome'];
  const compte = (n: ReadinessLevel) => rows.filter((r) => r.niveau === n).length;
  const indice = rows.length
    ? Math.round(rows.reduce((s, r) => s + Math.max(0, 100 - Math.max(0, r.ecart) * 2), 0) / rows.length)
    : 0;

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-primary" />
            <div>
              <p className="text-3xl font-semibold tabular-nums">{indice}<span className="text-base text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground">Indice de réussite de la sélection</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {groupes.map((n) => (
              <span key={n} className={`rounded-full px-3 py-1 text-xs font-medium ${NIVEAU_STYLE[n]}`}>
                {readinessLabel(n)} · {compte(n)}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          {groupes.map((n) => {
            const part = rows.length ? (compte(n) / rows.length) * 100 : 0;
            const couleur = n === 'prioritaire' ? 'bg-rose-500' : n === 'conforter' ? 'bg-amber-500' : 'bg-emerald-500';
            return <span key={n} className={`inline-block h-full ${couleur}`} style={{ width: `${part}%` }} />;
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Ambition : priorité, objectif à six mois, nombre d’espaces souhaités, surface. Moyens : temps, budget, eau,
          soleil, expérience, freins déclarés. L’indice baisse quand l’ambition dépasse les moyens.
        </p>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.slice(0, 12).map((r) => (
          <Card key={r.garden.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelect(r.garden.nom, 'Écart rêve / moyens', [r.garden])}
                className="min-w-0 text-left"
              >
                <p className="truncate text-sm font-semibold hover:underline">{r.garden.nom}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[r.garden.ville, r.garden.departement].filter(Boolean).join(' · ') || 'Lieu non renseigné'}
                </p>
              </button>
              <Badge className={`shrink-0 border-0 ${NIVEAU_STYLE[r.niveau]}`}>{readinessLabel(r.niveau)}</Badge>
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0">Ambition</span>
                <span className="h-1.5 flex-1 rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${r.ambition}%` }} />
                </span>
                <span className="w-7 text-right tabular-nums">{r.ambition}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0">Moyens</span>
                <span className="h-1.5 flex-1 rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${r.moyens}%` }} />
                </span>
                <span className="w-7 text-right tabular-nums">{r.moyens}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-foreground">{r.levier}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReadinessAnalysis;
