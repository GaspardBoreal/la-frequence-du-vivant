import React from 'react';
import { ArrowRight, CheckCheck } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { OBSERVE_BLOCKS } from '@/components/propriete/observe/observeConfig';
import { ObservationCard } from '@/components/propriete/observe/ObservationCard';
import { SensorialBlock } from '@/components/propriete/observe/SensorialBlock';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { Button } from '@/components/ui/button';

export const TabObserve: React.FC<{ bio?: PropertyBiodiversity; proprieteId?: string }> = ({
  bio,
  proprieteId,
}) => {
  const { state, saving, savedAt, toggleChoice, setSensorial, setNotes, markComplete } =
    usePropertyObservation(proprieteId);

  const blocksAnswered = Object.values(state.answers).reduce(
    (n, arr) => n + (arr?.length ? 1 : 0),
    0
  );
  const sensorialFilled = Object.entries(state.sensorial ?? {}).some(
    ([k, v]) => k !== 'intensity' && typeof v === 'string' && v.trim().length > 0
  );
  const totalAnswered = blocksAnswered + (sensorialFilled ? 1 : 0);
  const totalBlocks = OBSERVE_BLOCKS.length + 1;

  return (
    <div className="space-y-6">
      <StepHeader current={1} savedAt={savedAt} saving={saving} />

      {/* Grille des 8 cartes */}
      <div className="grid md:grid-cols-2 gap-5">
        {OBSERVE_BLOCKS.map((b, i) => (
          <ObservationCard
            key={b.id}
            block={b}
            selected={state.answers[b.id] ?? []}
            onToggle={(v) => toggleChoice(b.id, v)}
            index={i}
          />
        ))}
        <SensorialBlock values={state.sensorial} onChange={setSensorial} />
      </div>

      {/* Notes libres */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          Notes de terrain
        </div>
        <textarea
          rows={3}
          value={state.notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Impressions, hypothèses, points d'attention à discuter avec le client…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="text-sm text-[hsl(var(--ds-forest-deep))]">
          <span className="font-semibold">{totalAnswered}</span> / {totalBlocks} blocs
          renseignés
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={markComplete}
            className="bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40"
          >
            <CheckCheck className="w-4 h-4 mr-2" /> Marquer l'étape comme terminée
          </Button>
          <Button className="bg-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
            Étape suivante · J'analyse le sol <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
