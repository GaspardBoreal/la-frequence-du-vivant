import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sprout, Sparkles, Loader2 } from 'lucide-react';
import { findCropByScientificName, getStagesForCrop } from '@/lib/bbchStages';
import { useBbchStageSuggestion } from '@/hooks/useBbchStageSuggestion';
import PhenoStageSelector from './PhenoStageSelector';

interface PhenoCtaButtonProps {
  speciesScientificName?: string | null;
  explorationId?: string | null;
  marcheId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  variant?: 'default' | 'inline';
  className?: string;
}

/**
 * Bouton conditionnel : ne s'affiche QUE si l'espèce observée fait partie
 * du référentiel BBCH (12 cultures suivables).
 *
 * Vague 1 — visibilité IA :
 * - Annonce explicitement « Détecter ✨ IA » quand une photo est disponible.
 * - Pré-chauffe `useBbchStageSuggestion` (cache 24h) dès le montage pour que
 *   l'ouverture du Sheet affiche un résultat instantané.
 * - Affiche un statut discret « IA prête · BBCH X » quand la suggestion arrive.
 */
export const PhenoCtaButton: React.FC<PhenoCtaButtonProps> = ({
  speciesScientificName,
  explorationId,
  marcheId,
  latitude,
  longitude,
  photoUrl,
  variant = 'default',
  className,
}) => {
  const crop = findCropByScientificName(speciesScientificName);
  const [open, setOpen] = useState(false);

  if (!crop) return null;

  const stages = getStagesForCrop(crop);

  // Pré-fetch silencieux : déclenché au montage du CTA (carte espèce ouverte),
  // bien avant que l'utilisateur clique. Le hook a un cache 24h côté serveur,
  // donc cet appel est gratuit après la première fois.
  const {
    data: suggestion,
    isFetching: aiLoading,
  } = useBbchStageSuggestion({
    crop,
    stages,
    scientificName: speciesScientificName ?? crop.scientificName,
    photoUrl,
    enabled: !!photoUrl,
  });

  const hasUsableSuggestion =
    !!suggestion && !suggestion.unknown && suggestion.macro !== null;
  const suggestedStage = hasUsableSuggestion
    ? stages.find((s) => s.macro === suggestion!.macro) ?? null
    : null;
  const confidencePct = suggestion
    ? Math.round((suggestion.confidence ?? 0) * 100)
    : 0;

  const hasPhoto = !!photoUrl;
  const label = hasPhoto
    ? 'Détecter le stade BBCH'
    : 'Noter le stade phénologique';

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={variant === 'inline' ? 'sm' : 'default'}
        className={`group relative overflow-hidden bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-500/90 hover:from-amber-400 hover:to-orange-400 text-emerald-950 font-semibold border-0 shadow-lg shadow-amber-500/20 ${
          variant === 'default' ? 'w-full h-auto min-h-[44px] py-2.5' : 'h-9'
        } ${className ?? ''}`}
      >
        <span className="flex w-full items-center justify-center gap-2">
          {hasPhoto ? (
            aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )
          ) : (
            <Sprout className="w-4 h-4 group-hover:rotate-6 transition-transform" />
          )}
          <span className="mr-1">{crop.emoji}</span>
          <span>{label}</span>
          {hasPhoto && (
            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/25">
              IA
            </span>
          )}
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/20">
            BBCH
          </span>
        </span>

        {/* Bandeau statut IA — visible quand le pré-fetch a réussi */}
        {hasPhoto && suggestedStage && (
          <span className="block w-full text-[10.5px] font-medium text-emerald-950/85 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            IA prête · {suggestedStage.emoji} BBCH {suggestedStage.macro} ·{' '}
            {suggestedStage.labelFr}
            <span className="font-mono opacity-70">({confidencePct}%)</span>
          </span>
        )}
        {hasPhoto && aiLoading && !suggestion && (
          <span className="block w-full text-[10.5px] text-emerald-950/70 mt-1">
            Analyse de la photo en cours…
          </span>
        )}
      </Button>
      {open && (
        <PhenoStageSelector
          open={open}
          onOpenChange={setOpen}
          crop={crop}
          speciesScientificName={speciesScientificName ?? crop.scientificName}
          explorationId={explorationId}
          marcheId={marcheId}
          latitude={latitude}
          longitude={longitude}
          photoUrl={photoUrl}
        />
      )}
    </>
  );
};

export default PhenoCtaButton;
