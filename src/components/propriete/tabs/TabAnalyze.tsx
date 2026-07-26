import React from 'react';
import { ArrowRight, CheckCheck, Loader2, Check, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { TerrainBlock } from '@/components/propriete/analyze/blocks/TerrainBlock';
import { SamplesMapBlock } from '@/components/propriete/analyze/blocks/SamplesMapBlock';
import { StructureBlock } from '@/components/propriete/analyze/blocks/StructureBlock';
import { TextureBlock } from '@/components/propriete/analyze/blocks/TextureBlock';
import { PhBlock } from '@/components/propriete/analyze/blocks/PhBlock';
import { LifeSignsBlock } from '@/components/propriete/analyze/blocks/LifeSignsBlock';

const TOTAL = 7; // 6 blocs + synthèse

export const TabAnalyze: React.FC<{
  bio?: PropertyBiodiversity;
  proprieteId?: string;
  proprieteCenter?: [number, number] | null;
}> = ({ bio, proprieteId, proprieteCenter }) => {
  const {
    state,
    setLocal,
    saving,
    savedAt,
    completedAt,
    setField,
    toggleLifeSign,
    updateSample,
    addSample,
    removeSample,
    markComplete,
  } = usePropertySoil(proprieteId);

  const [submitting, setSubmitting] = React.useState(false);

  const filled =
    (state.terrain_status ? 1 : 0) +
    (state.samples.some((s) => (s.location ?? '').trim().length > 0) ? 1 : 0) +
    (state.samples.some((s) => s.structure_test && s.structure_result) ? 1 : 0) +
    (state.samples.some((s) => s.texture_test && s.texture_result) || state.boudin_shape ? 1 : 0) +
    (state.samples.some((s) => typeof s.ph_value === 'number') || state.ph != null ? 1 : 0) +
    (state.life_signs.length > 0 ? 1 : 0) +
    ((state.synthesis ?? '').trim().length > 0 ? 1 : 0);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await markComplete();
      toast.success('Étape 2 marquée comme terminée ✓');
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
      <StepHeader
        current={2}
        savedAt={savedAt}
        saving={saving}
        title="J'analyse le sol"
        subtitle={
          <>
            Lire la terre par les mains et les yeux : texture, structure, pH, signes de vie.
            <span className="italic"> Toucher · Sentir · Comprendre.</span>
          </>
        }
      />

      {/* Blocs 1 → 4 : pleine largeur pour laisser respirer les cartes et pictos */}
      <div className="space-y-5">
        <TerrainBlock
          value={state.terrain_status}
          onChange={(v) => setField('terrain_status', v)}
          index={0}
        />
        <div id="etape2-prelevements" className="scroll-mt-24">
        <SamplesMapBlock
          proprieteId={proprieteId}
          proprieteCenter={proprieteCenter}
          samples={state.samples}
          onUpdate={updateSample}
          onAdd={addSample}
          onRemove={removeSample}
          onBulkSet={(next) => setLocal((s) => ({ ...s, samples: next }))}
          index={1}
        />
        </div>
        <StructureBlock
          value={state.structure}
          onChange={(v) => setField('structure', v)}
          samples={state.samples}
          onUpdateSample={updateSample}
          index={2}
        />
        <TextureBlock
          boudinShape={state.boudin_shape}
          texture={state.texture}
          onChangeBoudin={(v) => setField('boudin_shape', v)}
          onChangeTexture={(v) => setField('texture', v)}
          samples={state.samples}
          onUpdateSample={updateSample}
          index={3}
        />

      </div>

      {/* Bloc 5 : pleine largeur — une mesure de pH par prélèvement */}
      <PhBlock
        value={state.ph}
        onChange={(v) => setField('ph', v)}
        samples={state.samples}
        onUpdateSample={updateSample}
        index={4}
      />

      {/* Bloc 6 */}
      <div className="grid md:grid-cols-2 gap-5">
        <LifeSignsBlock values={state.life_signs} onToggle={toggleLifeSign} index={5} />
      </div>


      {/* Synthèse */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          <BarChart3 className="w-3 h-3" /> Synthèse d'analyse
        </div>
        <textarea
          rows={3}
          value={state.synthesis ?? ''}
          onChange={(e) => setField('synthesis', e.target.value)}
          placeholder="Ce que ce sol raconte : forces, limites, points d'attention pour la suite du diagnostic…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </div>

      {/* Empreinte biodiversité (contexte) */}
      {bio && (
        <div className="rounded-3xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-5 text-xs text-[hsl(var(--ds-forest-deep))]/80">
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70 mb-2">
            En appui — biodiversité connue
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(bio.kingdoms ?? {}).map(([k, v]) => (
              <span key={k} className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-3 py-1">
                <span className="font-semibold">{v}</span> {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="flex items-center gap-3 text-sm text-[hsl(var(--ds-forest-deep))]">
          <span>
            <span className="font-semibold">{filled}</span> / {TOTAL} blocs renseignés
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
            Étape suivante · J'identifie <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
