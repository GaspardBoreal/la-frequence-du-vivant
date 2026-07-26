import React, { useMemo, useEffect } from 'react';
import { ArrowRight, CheckCheck, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertyFlora } from '@/hooks/propriete/usePropertyFlora';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { BiodiversityEvidenceBlock } from '@/components/propriete/BiodiversityEvidenceBlock';
import { SkipBlock } from '@/components/propriete/identify/blocks/SkipBlock';
import { IdentifyBriefBlock } from '@/components/propriete/identify/blocks/IdentifyBriefBlock';
import { EcoMatrixBlock } from '@/components/propriete/identify/blocks/EcoMatrixBlock';
import { CortegeBlock } from '@/components/propriete/identify/blocks/CortegeBlock';
import { IntensitiesBlock } from '@/components/propriete/identify/blocks/IntensitiesBlock';
import { ConcordanceBlock } from '@/components/propriete/identify/blocks/ConcordanceBlock';
import { NarrativeBlock } from '@/components/propriete/identify/blocks/NarrativeBlock';
import { DeltaBlock } from '@/components/propriete/identify/blocks/DeltaBlock';
import { RevealMapBlock } from '@/components/propriete/identify/blocks/RevealMapBlock';
import { SentinellesBlock } from '@/components/propriete/identify/blocks/SentinellesBlock';
import {
  computeFloraProfile,
  computePoleScores,
  computeConcordanceDetail,
  narratePoleScores,
} from '@/lib/plantIndicatorKb';

const TOTAL = 5; // Tableau + Cortège illustré + Somme des indices + Concordance + Narration

export const TabIdentify: React.FC<{
  proprieteId?: string;
  proprieteNom?: string;
  bio?: PropertyBiodiversity;
}> = ({ proprieteId, proprieteNom, bio }) => {
  const {
    state,
    saving,
    savedAt,
    completedAt,
    setField,
    togglePlant,
    markComplete,
  } = usePropertyFlora(proprieteId);

  const { state: soil } = usePropertySoil(proprieteId);
  const [submitting, setSubmitting] = React.useState(false);

  const profile = useMemo(() => computeFloraProfile(state.observed_plants), [state.observed_plants]);
  const soilAvailable = !!(soil.structure || soil.texture || soil.ph != null || (soil.life_signs?.length ?? 0) > 0);
  const scores = useMemo(() => computePoleScores(state.observed_plants), [state.observed_plants]);
  const detail = useMemo(
    () => computeConcordanceDetail(state.observed_plants, soil),
    [state.observed_plants, soil]
  );
  const autoNarrative = useMemo(() => narratePoleScores(scores), [scores]);

  // Persister ICG dans la base pour l'onglet Synthèse
  useEffect(() => {
    if (profile.count > 0 && soilAvailable) {
      setField('icg_score', detail.icg);
      setField('concordance', detail as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.icg, profile.count, soilAvailable]);

  const filled = state.skip_bioindication
    ? TOTAL
    : (profile.count > 0 ? 1 : 0) +
      (profile.count > 0 ? 1 : 0) +
      (profile.count > 0 ? 1 : 0) +
      (soilAvailable && profile.count > 0 ? 1 : 0) +
      ((state.flora_conclusion ?? '').trim().length > 0 ? 1 : 0);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success('Étape 3 marquée comme terminée ✓');
    } catch (e: any) {
      toast.error("Échec de l'enregistrement", { description: e?.message ?? 'Réessayez.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isDone = !!completedAt;
  const doneDate = completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : null;

  return (
    <div className="space-y-6">
      <BiodiversityEvidenceBlock bio={bio} proprieteId={proprieteId} proprieteNom={proprieteNom} />
      <StepHeader current={3} savedAt={savedAt} saving={saving} />

      <SkipBlock skip={state.skip_bioindication} onToggle={(v) => setField('skip_bioindication', v)} index={0} />

      {!state.skip_bioindication && (
        <>
          {/* Nouveautés depuis 30j — accroche de retour */}
          <DeltaBlock proprieteId={proprieteId} index={0} />

          {/* Preuve spatiale : carte des observations marcheurs */}
          <RevealMapBlock proprieteId={proprieteId} index={1} />

          <IdentifyBriefBlock index={2} />

          <EcoMatrixBlock
            observed={state.observed_plants}
            onToggle={togglePlant}
            index={3}
            proprieteId={proprieteId}
          />

          <CortegeBlock observed={state.observed_plants} onToggle={togglePlant} index={4} proprieteId={proprieteId} />

          <IntensitiesBlock
            scores={scores}
            plantCount={profile.count}
            narrative={autoNarrative}
            index={5}
            onUseNarrative={(t) =>
              setField(
                'flora_conclusion',
                (state.flora_conclusion ?? '').trim() ? `${state.flora_conclusion}\n${t}` : t
              )
            }
          />

          <ConcordanceBlock detail={detail} soilAvailable={soilAvailable && profile.count > 0} index={6} />

          <NarrativeBlock
            conclusion={state.flora_conclusion ?? ''}
            onChangeConclusion={(v) => setField('flora_conclusion', v)}
            notes={state.notes ?? ''}
            onChangeNotes={(v) => setField('notes', v)}
            autoNarrative={autoNarrative}
            index={7}
          />

          {/* Humains derrière la donnée */}
          <SentinellesBlock proprieteId={proprieteId} index={8} />
        </>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{Math.min(filled, TOTAL)}</span> / {TOTAL} blocs renseignés
          </span>
          {isDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))] px-2.5 py-0.5 text-xs font-semibold">
              <Check className="w-3 h-3" /> Terminée
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleComplete}
            disabled={submitting}
            className={
              isDone
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white hover:bg-[hsl(var(--ds-forest))] border border-[hsl(var(--ds-forest))]/40'
                : 'bg-[hsl(var(--ds-forest))]/85 text-white hover:bg-[hsl(var(--ds-forest-deep))] border border-[hsl(var(--ds-forest))]/40'
            }
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {isDone
              ? `Étape terminée${doneDate ? ` le ${doneDate}` : ''} · Réenregistrer`
              : "Marquer l'étape comme terminée"}
          </Button>
          <Button className="bg-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
            Étape suivante · Je synthétise <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
