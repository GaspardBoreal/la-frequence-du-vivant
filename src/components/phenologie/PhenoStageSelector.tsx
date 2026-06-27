import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2, Check, HelpCircle } from 'lucide-react';
import {
  type BbchCrop,
  getStagesForCrop,
  getStageColor,
} from '@/lib/bbchStages';
import { useCreatePhenoObservation } from '@/hooks/usePhenoObservations';
import { useBbchStageSuggestion } from '@/hooks/useBbchStageSuggestion';

interface PhenoStageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: BbchCrop;
  speciesScientificName: string;
  explorationId?: string | null;
  marcheId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  onSaved?: () => void;
}

export const PhenoStageSelector: React.FC<PhenoStageSelectorProps> = ({
  open,
  onOpenChange,
  crop,
  speciesScientificName,
  explorationId,
  marcheId,
  latitude,
  longitude,
  photoUrl,
  onSaved,
}) => {
  const stages = useMemo(() => getStagesForCrop(crop), [crop]);
  const [selected, setSelected] = useState<number | null>(null);
  const mutation = useCreatePhenoObservation();
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Suggestion IA déclenchée à l'ouverture si une photo est disponible.
  const {
    data: suggestion,
    isFetching: aiLoading,
    error: aiError,
  } = useBbchStageSuggestion({
    crop,
    stages,
    scientificName: speciesScientificName,
    photoUrl,
    enabled: open,
  });

  const suggestedIdx = useMemo(() => {
    if (!suggestion || suggestion.unknown || suggestion.macro === null) return null;
    const i = stages.findIndex((s) => s.macro === suggestion.macro);
    return i >= 0 ? i : null;
  }, [suggestion, stages]);

  const alternativeIdx = useMemo(() => {
    if (!suggestion?.alternative_macro && suggestion?.alternative_macro !== 0) return null;
    const i = stages.findIndex((s) => s.macro === suggestion.alternative_macro);
    return i >= 0 ? i : null;
  }, [suggestion, stages]);

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) setSelected(null);
  }, [open, crop.key]);

  const acceptSuggestion = (idx: number) => {
    setSelected(idx);
    setTimeout(() => {
      tileRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleSave = async () => {
    if (selected === null) return;
    const stage = stages[selected];
    const aiAccepted = suggestedIdx !== null && selected === suggestedIdx;
    await mutation.mutateAsync({
      crop,
      stage,
      species_scientific_name: speciesScientificName,
      exploration_id: explorationId ?? null,
      marche_id: marcheId ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      photo_url: photoUrl ?? null,
      ai_suggested_macro: suggestion?.macro ?? null,
      ai_confidence: suggestion?.confidence ?? null,
      ai_rationale: suggestion?.rationale ?? null,
      ai_accepted: suggestion ? aiAccepted : null,
    } as any);
    onOpenChange(false);
    setSelected(null);
    onSaved?.();
  };

  const confidencePct = suggestion ? Math.round((suggestion.confidence ?? 0) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[85vh] rounded-t-3xl bg-gradient-to-b from-emerald-950/95 via-emerald-950/95 to-emerald-900/95 border-emerald-500/20 text-white overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-5xl drop-shadow-lg">{crop.emoji}</div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-emerald-300/80">
                Carnet Phéno · BBCH
              </div>
              <SheetTitle className="text-white text-xl font-serif">
                {crop.labelFr}
              </SheetTitle>
              <p className="text-xs italic text-emerald-200/70">{crop.scientificName}</p>
            </div>
          </div>
          <SheetDescription className="text-emerald-100/70 text-sm">
            À quel stade de développement se trouve cette culture aujourd'hui&nbsp;?
          </SheetDescription>
        </SheetHeader>

        {/* Bandeau IA */}
        {photoUrl && (
          <div className="mt-4">
            {aiLoading && (
              <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-4 flex items-center gap-3">
                <div className="relative">
                  <Wand2 className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-100">
                    Lecture de la photo en cours…
                  </div>
                  <div className="text-[11px] text-amber-200/70">
                    L'IA compare aux 10 stades BBCH de {crop.labelFr}
                  </div>
                </div>
                <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
            )}

            {!aiLoading && suggestion && !suggestion.unknown && suggestedIdx !== null && (
              <div
                className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/15 via-amber-300/5 to-emerald-500/10 p-4 shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-200 text-[10px] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    Suggestion IA
                  </div>
                  <div className="text-[10px] font-mono text-amber-100/80">
                    confiance {confidencePct}%
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-4xl drop-shadow">{stages[suggestedIdx].emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-white/60">
                      BBCH {stages[suggestedIdx].macro}
                    </div>
                    <div className="text-base font-semibold text-white leading-snug">
                      {stages[suggestedIdx].labelFr}
                    </div>
                    {suggestion.rationale && (
                      <p className="mt-1 text-xs text-emerald-100/80 italic leading-snug">
                        « {suggestion.rationale} »
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptSuggestion(suggestedIdx)}
                    className="h-8 rounded-full bg-amber-400 text-emerald-950 hover:bg-amber-300 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Accepter la suggestion
                  </Button>
                  {alternativeIdx !== null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acceptSuggestion(alternativeIdx)}
                      className="h-8 rounded-full border-amber-300/40 bg-transparent text-amber-100 hover:bg-amber-400/10"
                    >
                      Ou&nbsp;: {stages[alternativeIdx].emoji} BBCH {stages[alternativeIdx].macro}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!aiLoading && suggestion?.unknown && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-emerald-200/70 shrink-0" />
                <div className="text-xs text-emerald-100/80">
                  L'IA n'a pas pu identifier un stade clair sur cette photo.
                  Choisis le stade manuellement ci-dessous.
                </div>
              </div>
            )}

            {!aiLoading && aiError && !suggestion && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-emerald-100/70">
                Suggestion IA indisponible — choisis manuellement.
              </div>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stages.map((stage, idx) => {
            const isActive = selected === idx;
            const isSuggested = suggestedIdx === idx && !stage.na;
            const isNa = !!stage.na;
            return (
              <button
                key={stage.macro}
                ref={(el) => (tileRefs.current[idx] = el)}
                onClick={() => !isNa && setSelected(idx)}
                disabled={isNa}
                aria-disabled={isNa}
                className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isNa
                    ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                    : isActive
                    ? 'border-amber-400/80 bg-amber-400/15 shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)] scale-[1.02]'
                    : isSuggested
                    ? 'border-amber-300/50 bg-amber-400/[0.06] hover:bg-amber-400/[0.10]'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20'
                }`}
                style={
                  isActive && !isNa
                    ? { boxShadow: `0 0 32px -8px ${getStageColor(stage.macro)}` }
                    : undefined
                }
              >
                {isSuggested && !isActive && (
                  <span className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-amber-400 text-emerald-950 text-[9px] font-bold px-2 py-0.5 shadow">
                    <Sparkles className="w-2.5 h-2.5" /> IA
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{stage.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                      BBCH {stage.macro}{isNa && ' · n/a'}
                    </div>
                    <div className={`text-sm font-medium leading-snug ${isNa ? 'text-white/50 italic' : 'text-white'}`}>
                      {stage.labelFr}
                    </div>
                  </div>
                </div>
                {!isNa && (
                  <div
                    className="absolute left-3 bottom-2 right-3 h-[2px] rounded-full opacity-60"
                    style={{ background: getStageColor(stage.macro) }}
                  />
                )}
              </button>
            );
          })}
        </div>


        <div className="sticky bottom-0 left-0 right-0 mt-6 pt-4 pb-2 bg-gradient-to-t from-emerald-950 via-emerald-950/90 to-transparent">
          <Button
            onClick={handleSave}
            disabled={selected === null || mutation.isPending}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-emerald-950 font-semibold hover:from-amber-300 hover:to-orange-300 disabled:opacity-40"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {selected === null
              ? 'Choisissez un stade'
              : `Enregistrer · ${stages[selected].labelFr}`}
          </Button>
          <p className="text-center text-[10px] text-emerald-200/50 mt-2">
            Échelle BBCH · INRAE / AgroPortal · +10 Fréquences
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PhenoStageSelector;
