import React from 'react';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { EcoSourceNote } from '../EcoSourceNote';

export interface NarrationAiContext {
  propertyName?: string;
  commune?: string | null;
  plants?: Array<{ name: string; latin?: string; family?: string }>;
  poles?: Array<{ label: string; axis: string; level: string; points: number }>;
  soil?: Record<string, unknown>;
  concordance?: Record<string, unknown>;
  observationNotes?: string | null;
  speciesTotal?: number | null;
}

export const NarrativeBlock: React.FC<{
  conclusion: string;
  onChangeConclusion: (v: string) => void;
  notes: string;
  onChangeNotes: (v: string) => void;
  autoNarrative: string;
  aiContext?: NarrationAiContext;
  index?: number;
}> = ({ conclusion, onChangeConclusion, notes, onChangeNotes, autoNarrative, aiContext, index = 3 }) => {
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);

  const generate = async () => {
    if (!aiContext) return;
    setLoading(true);
    setDraft(null);
    try {
      const { data, error } = await supabase.functions.invoke('propriete-diagnostic-narration', {
        body: aiContext,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const narration = (data as any)?.narration?.trim();
      if (!narration) throw new Error("L'IA n'a rien retourné.");
      setDraft(narration);
      toast.success('Narration générée — relisez et adoptez-la si elle vous convient.');
    } catch (e: any) {
      toast.error('Génération impossible', { description: e?.message ?? 'Réessayez dans un instant.' });
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = !!aiContext;

  return (
    <AnalyzeCard
      number={5}
      category="Narration"
      title="Ce que la flore raconte"
      subtitle="Un texte auto-généré à partir de vos observations. Reformulez-le librement pour qu'il vous ressemble."
      index={index}
    >
      <div className="space-y-4">
        <p className="text-[11.5px] italic leading-relaxed text-[hsl(var(--ds-forest-deep))]/70">
          Rassemblez ici ce que la végétation vous apprend du lieu. Il n’y a pas d’exactitude à atteindre :
          l’objectif est une lecture argumentée, ouverte au doute, que vous pourrez confronter aux saisons suivantes.
        </p>

        {/* Rédaction assistée — nourrie par les 3 étapes du diagnostic */}
        {canGenerate && (
          <div className="rounded-2xl border border-[hsl(var(--ds-gold))]/40 bg-[hsl(var(--ds-gold))]/8 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-[hsl(var(--ds-forest))]">
                  <Sparkles className="w-3 h-3" /> Rédaction assistée
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/75">
                  L’IA lit vos données du site — cortège relevé, sol de l’Étape 2, ICG — et vous propose
                  une première narration argumentée. Vous restez l’auteur : rien n’est écrit sans votre accord.
                </p>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-3.5 py-2 text-[11px] font-semibold text-[hsl(var(--ds-cream))] transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {loading ? 'Lecture du site…' : draft ? 'Régénérer' : 'Générer la narration'}
              </button>
            </div>

            {draft && (
              <div className="mt-3 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/80 p-3">
                <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/90">
                  {draft}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeConclusion(draft);
                      setDraft(null);
                      toast.success('Narration adoptée — modifiez-la librement.');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-cream))]"
                  >
                    <Check className="w-3.5 h-3.5" /> Adopter ce texte
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeConclusion(conclusion ? `${conclusion.trim()}\n\n${draft}` : draft)
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                  >
                    Ajouter à la suite
                  </button>
                  <button
                    type="button"
                    onClick={generate}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Autre proposition
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {autoNarrative && (
          <div className="rounded-xl bg-[hsl(var(--ds-forest))]/6 border border-[hsl(var(--ds-forest))]/20 p-3 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/80 leading-relaxed">
            <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70 mb-1">
              Suggestion automatique
            </div>
            {autoNarrative}
          </div>
        )}
        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Conclusion floristique
          </label>
          <textarea
            rows={conclusion.length > 400 ? 10 : 3}
            value={conclusion}
            onChange={(e) => onChangeConclusion(e.target.value)}
            placeholder="Ce que la végétation vous apprend du lieu…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Notes personnelles
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Anecdotes de terrain, doutes, plantes à revérifier…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
        </div>
        <EcoSourceNote compact />
      </div>
    </AnalyzeCard>
  );
};
