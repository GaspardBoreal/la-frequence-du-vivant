import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sprout } from 'lucide-react';
import { findCropByScientificName } from '@/lib/bbchStages';
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
 * du référentiel BBCH (12 cultures suivables). Ouvre le drawer PhenoStageSelector.
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

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={variant === 'inline' ? 'sm' : 'default'}
        className={`group relative overflow-hidden bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-500/90 hover:from-amber-400 hover:to-orange-400 text-emerald-950 font-semibold border-0 shadow-lg shadow-amber-500/20 ${
          variant === 'default' ? 'w-full h-11' : 'h-9'
        } ${className ?? ''}`}
      >
        <Sprout className="w-4 h-4 mr-2 group-hover:rotate-6 transition-transform" />
        <span className="mr-1.5">{crop.emoji}</span>
        Noter le stade phénologique
        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/20">
          BBCH
        </span>
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
