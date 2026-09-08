import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PersonaGroup } from '@/lib/onboardingSegments';
import type { GardenAnswers } from '@/lib/onboardingStats';

/** 1. Les personae : des visages, pas des colonnes. */
const PersonaeAnalysis: React.FC<{
  personae: PersonaGroup[];
  onSelect: (titre: string, sousTitre: string, gardens: GardenAnswers[]) => void;
}> = ({ personae, onSelect }) => (
  <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {personae.map((p) => (
        <Card key={p.key} className="overflow-hidden">
          <div className="relative h-28 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
            {p.vignette && (
              <img src={p.vignette} alt="" loading="lazy" className="h-full w-full object-cover opacity-60" />
            )}
            <span className="absolute bottom-2 left-3 text-3xl">{p.emoji}</span>
            <Badge className="absolute right-2 top-2 tabular-nums">{p.gardens.length} · {p.part}%</Badge>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <h4 className="text-base font-semibold">{p.nom}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{p.promesse}</p>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/60 p-2">
                <dt className="text-muted-foreground">Surface médiane</dt>
                <dd className="font-medium tabular-nums">
                  {p.surfaceMediane != null ? `${p.surfaceMediane.toLocaleString('fr-FR')} m²` : '—'}
                </dd>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <dt className="text-muted-foreground">Temps médian</dt>
                <dd className="font-medium tabular-nums">
                  {p.tempsMedian != null ? `${p.tempsMedian} h/sem.` : '—'}
                </dd>
              </div>
            </dl>
            {p.reveDominant && (
              <p className="text-xs text-muted-foreground">
                Rêve dominant : <span className="font-medium text-foreground">{p.reveDominant}</span>
              </p>
            )}
            {p.freins.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.freins.map((f) => (
                  <Badge key={f.label} variant="secondary" className="text-[10px] font-normal">
                    {f.label} · {f.count}
                  </Badge>
                ))}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-16 shrink-0">Ambition</span>
                <span className="h-1.5 flex-1 rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${p.ambitionMoyenne}%` }} />
                </span>
                <span className="w-8 text-right tabular-nums">{p.ambitionMoyenne}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-16 shrink-0">Moyens</span>
                <span className="h-1.5 flex-1 rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${p.moyensMoyens}%` }} />
                </span>
                <span className="w-8 text-right tabular-nums">{p.moyensMoyens}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[10px] italic text-muted-foreground">Règle : {p.regle}</p>
              <button
                type="button"
                onClick={() => onSelect(p.nom, 'Persona', p.gardens)}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Voir les jardins
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default PersonaeAnalysis;
