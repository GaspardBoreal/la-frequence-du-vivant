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
import { MapPin, Loader2, Sparkles } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

  // Sync defaults when they change (e.g. when drawer reopens)
  React.useEffect(() => {
    if (open) {
      setVille(defaultVille);
      setDate(defaultDate);
      setNom('');
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
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Nouvelle marche
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Créez une marche à l'emplacement choisi sur la carte.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="marche-nom" className="text-xs font-medium">
                Nom de la marche <span className="text-destructive">*</span>
              </Label>
              <Input
                id="marche-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Boucle des prairies humides"
                autoFocus
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="marche-ville" className="text-xs font-medium">Ville</Label>
                <Input
                  id="marche-ville"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marche-date" className="text-xs font-medium">Date</Label>
                <Input
                  id="marche-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">Position GPS</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                {position
                  ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
                  : '—'}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Glissez le repère sur la carte pour ajuster.
              </p>
            </div>

            {(explorationName || marcheEventTitle) && (
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-[11px] text-foreground/80">
                Cette marche sera ajoutée à
                {explorationName && (
                  <> l'exploration <strong>{explorationName}</strong></>
                )}
                {marcheEventTitle && (
                  <> et liée à l'événement <strong>{marcheEventTitle}</strong></>
                )}
                .
              </div>
            )}
          </div>

          <DrawerFooter className="pt-0">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !nom.trim() || !position}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création…
                </>
              ) : (
                'Créer la marche'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateMarcheDrawer;
