import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pencil, Check, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCanCurateTranslations } from '@/hooks/useCanCurateTranslations';

interface Props {
  scientificName: string;
  currentCommonNameFr: string;
  source?: string | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  /** Called after a successful save so the parent can refetch/swap visuals */
  onSaved?: (newName: string) => void;
}

const confidenceStyles: Record<string, string> = {
  high: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  low: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

/**
 * Badge "Traduction X - Y" qui devient un éditeur in-place pour les
 * curateurs (admin / ambassadeur / sentinelle). Sauvegarde via la RPC
 * `update_species_translation_manual` puis invalide les caches FR partagés.
 */
export const SpeciesTranslationCuratorBadge: React.FC<Props> = ({
  scientificName,
  currentCommonNameFr,
  source,
  confidence,
  onSaved,
}) => {
  const { data: canCurate } = useCanCurateTranslations();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentCommonNameFr);
  const [saving, setSaving] = useState(false);

  // Si traduction déjà manuelle/high : juste un petit badge informatif élégant.
  const isCurated = source === 'manual' && confidence === 'high';

  const labelConfidence = confidence || 'low';
  const labelSource = source || 'auto';

  const handleSave = async (newName?: string) => {
    const finalName = (newName ?? value).trim();
    if (!finalName) {
      toast.error('Le nom français ne peut pas être vide');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc('update_species_translation_manual', {
        p_scientific_name: scientificName,
        p_common_name_fr: finalName,
      });
      if (error) throw error;

      toast.success(`Traduction enregistrée : ${finalName}`);
      // Invalidate every cache that depends on species translations
      queryClient.invalidateQueries({ queryKey: ['species-translation', scientificName] });
      queryClient.invalidateQueries({ queryKey: ['fr-species-names-auto'] });
      queryClient.invalidateQueries({ queryKey: ['species-photo'] });
      onSaved?.(finalName);
      setOpen(false);
    } catch (e: any) {
      console.error('update_species_translation_manual failed', e);
      toast.error(e?.message || 'Impossible d\'enregistrer la traduction');
    } finally {
      setSaving(false);
    }
  };

  // Vue lecture seule (curateur ou pas, traduction validée)
  if (isCurated && !canCurate) {
    return (
      <Badge variant="outline" className={`text-xs ${confidenceStyles.high} flex items-center gap-1`}>
        <ShieldCheck className="w-3 h-3" />
        Traduction validée
      </Badge>
    );
  }

  // Vue lecture seule pour utilisateur lambda
  if (!canCurate) {
    return (
      <Badge
        variant="outline"
        className={`text-xs ${confidenceStyles[labelConfidence] || confidenceStyles.low}`}
      >
        Traduction {labelConfidence} · {labelSource}
      </Badge>
    );
  }

  // Curateur : badge cliquable
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(currentCommonNameFr); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 group"
          aria-label="Corriger la traduction"
        >
          {isCurated ? (
            <Badge variant="outline" className={`text-xs ${confidenceStyles.high} flex items-center gap-1 group-hover:brightness-110 transition`}>
              <ShieldCheck className="w-3 h-3" />
              Traduction validée
              <Pencil className="w-3 h-3 opacity-50 group-hover:opacity-100 transition" />
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={`text-xs ${confidenceStyles[labelConfidence] || confidenceStyles.low} flex items-center gap-1 group-hover:brightness-110 transition`}
            >
              Traduction {labelConfidence} · {labelSource}
              <Pencil className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-4 space-y-3 bg-background/95 backdrop-blur-md border-border/60 shadow-xl z-[200]"
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Curation traduction</p>
          <p className="text-sm font-medium italic text-foreground/90">{scientificName}</p>
          <p className="text-[11px] text-muted-foreground">
            Source actuelle : <span className="font-medium">{labelSource}</span> · {labelConfidence}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fr-name" className="text-xs font-medium text-foreground/80">
            Nom français
          </label>
          <Input
            id="fr-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ex. Loche espagnole"
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !saving) handleSave();
            }}
            autoFocus
          />
        </div>

        <div className="flex gap-2 pt-1">
          {!isCurated && value.trim() === currentCommonNameFr.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleSave(currentCommonNameFr)}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              Valider tel quel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => handleSave()}
            disabled={saving || value.trim().length === 0 || (isCurated && value.trim() === currentCommonNameFr.trim())}
          >
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            Enregistrer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SpeciesTranslationCuratorBadge;
