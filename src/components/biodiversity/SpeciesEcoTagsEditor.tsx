import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X as XIcon, Sparkles, Save, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ECO_FUNCTIONS, ECO_FAMILIES, type EcoFunction } from '@/lib/ecologicalFunctions';
import type { SpeciesWithFunctions } from '@/hooks/useEcologicalFunctions';
import { SpeciesName } from '@/components/species/SpeciesName';
import { useExplorationCurations } from '@/hooks/useExplorationCurations';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explorationId: string;
  species: SpeciesWithFunctions | null;
}

/**
 * Sheet — Ajuster les tags écologiques d'une espèce.
 * Réservé aux ambassadeurs / sentinelles / admin (RLS côté DB).
 * Stocke l'override dans `exploration_curations.functions text[]`.
 */
const SpeciesEcoTagsEditor: React.FC<Props> = ({ open, onOpenChange, explorationId, species }) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: allCurations } = useExplorationCurations(explorationId, 'oeil');

  const existingCuration = useMemo(() => {
    if (!species) return null;
    return (allCurations || []).find(
      (c: any) =>
        c.entity_type === 'species' &&
        c.entity_id &&
        c.entity_id.trim() === species.scientificName.trim(),
    ) as any;
  }, [allCurations, species]);

  const [selected, setSelected] = useState<Set<EcoFunction>>(new Set());
  const [saving, setSaving] = useState(false);

  // Init from existing curation OR auto-classification
  useEffect(() => {
    if (!species) return;
    if (existingCuration?.functions && Array.isArray(existingCuration.functions)) {
      setSelected(new Set(existingCuration.functions as EcoFunction[]));
    } else {
      setSelected(new Set(species.autoFunctions));
    }
  }, [species, existingCuration]);

  if (!species) return null;

  const toggle = (f: EcoFunction) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const resetAuto = () => setSelected(new Set(species.autoFunctions));

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Connexion requise');
      return;
    }
    setSaving(true);
    try {
      const finalFns = Array.from(selected);
      const payload: any = {
        exploration_id: explorationId,
        sense: 'oeil',
        entity_type: 'species',
        entity_id: species.scientificName.trim(),
        category: 'eco_functions',
        title: species.commonNameFr || species.commonName || species.scientificName,
        functions: finalFns,
        classification_source: 'curator',
        classification_confidence: 1.0,
        needs_review: false,
      };
      if (existingCuration?.id) {
        const { error } = await supabase
          .from('exploration_curations')
          .update({
            functions: finalFns,
            classification_source: 'curator',
            classification_confidence: 1.0,
            needs_review: false,
          } as any)
          .eq('id', existingCuration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exploration_curations')
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ['exploration-curations', explorationId] });
      toast.success('Tags écologiques mis à jour');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const byFamily = ECO_FUNCTIONS.reduce((acc, f) => {
    (acc[f.family] = acc[f.family] || []).push(f);
    return acc;
  }, {} as Record<string, typeof ECO_FUNCTIONS>);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto sm:max-w-2xl sm:mx-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted shrink-0">
              {species.imageUrl ? (
                <img src={species.imageUrl} alt={species.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">🌿</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-0.5">
                Ajuster les tags écologiques
              </div>
              <SheetTitle className="text-lg leading-tight">
                <SpeciesName
                  scientificName={species.scientificName}
                  commonName={species.commonNameFr || species.commonName}
                  size="lg"
                />
              </SheetTitle>
              <div className="text-xs text-muted-foreground italic">{species.scientificName}</div>
            </div>
          </div>
          <SheetDescription className="text-xs mt-2">
            Coche les fonctions écologiques pertinentes. Ta sélection remplace l'auto-classification
            pour cette exploration.
          </SheetDescription>
        </SheetHeader>

        {/* Tags grouped by family */}
        <div className="mt-5 space-y-5">
          {Object.entries(byFamily).map(([fam, fns]) => (
            <div key={fam}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">{ECO_FAMILIES[fam as keyof typeof ECO_FAMILIES].emoji}</span>
                <h4 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                  {ECO_FAMILIES[fam as keyof typeof ECO_FAMILIES].label}
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fns.map(f => {
                  const active = selected.has(f.value);
                  const wasAuto = species.autoFunctions.includes(f.value);
                  return (
                    <motion.button
                      key={f.value}
                      type="button"
                      onClick={() => toggle(f.value)}
                      whileTap={{ scale: 0.96 }}
                      className={`relative text-left rounded-2xl border p-3 transition-all min-h-[72px] ${
                        active
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-border/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl leading-none" aria-hidden>{f.emoji}</span>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                            >
                              <Check className="w-3 h-3" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="mt-1.5 text-xs font-semibold text-foreground leading-tight">
                        {f.shortLabel}
                      </div>
                      {wasAuto && !active && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Sparkles className="w-2.5 h-2.5" /> proposé
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="mt-6 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAuto}
            disabled={saving}
            className="sm:mr-auto text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Restaurer la proposition auto
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <XIcon className="w-4 h-4 mr-1.5" />
            Annuler
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SpeciesEcoTagsEditor;
