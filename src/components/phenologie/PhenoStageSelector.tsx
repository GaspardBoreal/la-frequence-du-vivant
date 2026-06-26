import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import {
  type BbchCrop,
  getStagesForCrop,
  getStageColor,
} from '@/lib/bbchStages';
import { useCreatePhenoObservation } from '@/hooks/usePhenoObservations';

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
  const stages = getStagesForCrop(crop);
  const [selected, setSelected] = useState<number | null>(null);
  const mutation = useCreatePhenoObservation();

  const handleSave = async () => {
    if (selected === null) return;
    const stage = stages[selected];
    await mutation.mutateAsync({
      crop,
      stage,
      species_scientific_name: speciesScientificName,
      exploration_id: explorationId ?? null,
      marche_id: marcheId ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      photo_url: photoUrl ?? null,
    });
    onOpenChange(false);
    setSelected(null);
    onSaved?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:h-[80vh] rounded-t-3xl bg-gradient-to-b from-emerald-950/95 via-emerald-950/95 to-emerald-900/95 border-emerald-500/20 text-white overflow-y-auto"
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stages.map((stage, idx) => {
            const isActive = selected === idx;
            return (
              <button
                key={stage.macro}
                onClick={() => setSelected(idx)}
                className={`group relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-amber-400/80 bg-amber-400/15 shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)] scale-[1.02]'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20'
                }`}
                style={
                  isActive
                    ? { boxShadow: `0 0 32px -8px ${getStageColor(stage.macro)}` }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{stage.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                      BBCH {stage.macro}
                    </div>
                    <div className="text-sm font-medium leading-snug text-white">
                      {stage.labelFr}
                    </div>
                  </div>
                </div>
                <div
                  className="absolute left-3 bottom-2 right-3 h-[2px] rounded-full opacity-60"
                  style={{ background: getStageColor(stage.macro) }}
                />
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
