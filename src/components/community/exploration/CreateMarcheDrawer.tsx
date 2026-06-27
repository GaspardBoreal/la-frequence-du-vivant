import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, Loader2, Sparkles, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface CreateMarcheDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { lat: number; lng: number } | null;
  defaultVille: string;
  defaultDate: string;
  explorationId: string;
  explorationName?: string;
  marcheEventTitle?: string;
  onCreated: () => void;
}

const CreateMarcheDrawer: React.FC<CreateMarcheDrawerProps> = ({
  open,
  onOpenChange,
  position,
  defaultVille,
  defaultDate,
  explorationId,
  explorationName,
  marcheEventTitle,
  onCreated,
}) => {
  const queryClient = useQueryClient();
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState(defaultVille);
  const [date, setDate] = useState(defaultDate);
  const [description, setDescription] = useState('');
  const [collectBio, setCollectBio] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Sync defaults when they change (e.g. when drawer reopens)
  React.useEffect(() => {
    if (open) {
      setVille(defaultVille);
      setDate(defaultDate);
      setNom('');
      setDescription('');
      setCollectBio(true);
    }
  }, [open, defaultVille, defaultDate]);

  const handleSubmit = async () => {
    if (!nom.trim()) {
      toast.error('Le nom de la marche est requis');
      return;
    }
    if (!position) {
      toast.error('Position GPS manquante');
      return;
    }
    if (!explorationId) {
      toast.error('Exploration introuvable');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insert marche
      const { data: newMarche, error: marcheErr } = await supabase
        .from('marches')
        .insert({
          nom_marche: nom.trim(),
          ville: ville.trim() || 'Inconnue',
          date: date || null,
          latitude: position.lat,
          longitude: position.lng,
          coordonnees: `(${position.lng},${position.lat})`,
          descriptif_court: description.trim() || null,
        })
        .select('id')
        .single();

      if (marcheErr) throw marcheErr;

      // 2. Compute next ordre
      const { data: existing } = await supabase
        .from('exploration_marches')
        .select('ordre')
        .eq('exploration_id', explorationId)
        .order('ordre', { ascending: false })
        .limit(1);

      const nextOrdre = (existing?.[0]?.ordre ?? 0) + 1;

      // 3. Link to exploration
      const { error: linkErr } = await supabase
        .from('exploration_marches')
        .insert({
          exploration_id: explorationId,
          marche_id: newMarche.id,
          ordre: nextOrdre,
          publication_status: 'published_public',
        });

      if (linkErr) throw linkErr;

      // 4. Optional: kick off biodiversity collection (fire and forget — failure tolerated)
      if (collectBio) {
        supabase.functions
          .invoke('collect-biodiversity-step', { body: { marcheId: newMarche.id } })
          .then(({ error }) => {
            if (error) {
              console.warn('[CreateMarcheDrawer] collect-biodiversity-step failed:', error);
              toast.message('Collecte biodiversité en différé', { description: 'Le point est créé, la collecte sera relancée automatiquement.' });
            } else {
              toast.success('Biodiversité collectée 🌿');
              queryClient.invalidateQueries({ queryKey: ['exploration-marcheur-steps', explorationId] });
            }
          });
      }

      toast.success('Marche créée ✨', {
        description: 'Elle apparaît maintenant sur la carte de l\'exploration',
      });

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheur-steps', explorationId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marches', explorationId] });

      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      console.error('[CreateMarcheDrawer] Erreur:', err);
      const msg = err?.message?.includes('row-level security')
        ? 'Vous n\'avez pas les droits pour créer une marche (rôle Ambassadeur ou Sentinelle requis).'
        : 'Erreur lors de la création de la marche';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] border-t border-amber-500/20">
        <div className="mx-auto w-full max-w-md">
          {/* Header refondu */}
          <DrawerHeader className="px-6 pt-5 pb-4 border-b border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DrawerTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Nouvelle marche
                </DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground">
                  Créez une étape à l'emplacement choisi sur la carte.
                </DrawerDescription>
              </div>
            </div>

            {/* Pill statut GPS — séparée du titre */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[11px] font-medium w-fit">
              <MapPin className="w-3 h-3" />
              <span>Repère posé</span>
              <span className="font-mono text-amber-400/90 tabular-nums">
                {position
                  ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
                  : '—'}
              </span>
            </div>
          </DrawerHeader>

          {/* Corps aéré */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[58vh]">
            <div className="space-y-2">
              <Label htmlFor="marche-nom" className="text-sm font-semibold text-foreground">
                Nom de l'étape <span className="text-destructive">*</span>
              </Label>
              <Input
                id="marche-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Boucle des prairies humides"
                autoFocus
                disabled={submitting}
                className="bg-muted/40 border-border focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marche-ville" className="text-sm font-semibold text-foreground">Ville</Label>
                <Input
                  id="marche-ville"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  disabled={submitting}
                  className="bg-muted/40 border-border focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marche-date" className="text-sm font-semibold text-foreground">Date</Label>
                <Input
                  id="marche-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                  className="bg-muted/40 border-border focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marche-desc" className="text-sm font-semibold text-foreground">
                Description courte <span className="text-muted-foreground font-normal text-xs">(optionnel)</span>
              </Label>
              <Textarea
                id="marche-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Ex. Massif est, lisière bordée d'arbres mellifères"
                rows={3}
                disabled={submitting}
                className="resize-none text-sm bg-muted/40 border-border focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
              />
              <div className="text-[10px] text-muted-foreground text-right tabular-nums">
                {description.length}/200
              </div>
            </div>

            <label
              htmlFor="collect-bio"
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 cursor-pointer hover:bg-emerald-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Collecter la biodiversité</div>
                  <div className="text-[11px] text-muted-foreground">Lance une collecte iNaturalist autour du point.</div>
                </div>
              </div>
              <Switch
                id="collect-bio"
                checked={collectBio}
                onCheckedChange={setCollectBio}
                disabled={submitting}
              />
            </label>

            {(explorationName || marcheEventTitle) && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 text-[11px] text-foreground/80 leading-relaxed">
                Cette marche sera ajoutée à
                {explorationName && (
                  <> l'exploration <strong className="text-emerald-300">{explorationName}</strong></>
                )}
                {marcheEventTitle && (
                  <> et liée à l'événement <strong className="text-emerald-300">{marcheEventTitle}</strong></>
                )}
                .
              </div>
            )}
          </div>

          {/* Footer sticky — actions contrastées */}
          <DrawerFooter className="px-6 py-4 pt-3 border-t border-border/60 bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="flex-1 border-border text-foreground/80 hover:bg-muted/50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !nom.trim() || !position}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création…
                  </>
                ) : (
                  'Créer l\'étape'
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateMarcheDrawer;

