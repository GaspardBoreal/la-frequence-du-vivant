import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserPlus, MapPin, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import { useExplorationAllMarches } from '@/hooks/useExplorationAllMarches';
import { useSpeciesObservers } from '@/hooks/useSpeciesObservers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explorationId: string;
  speciesScientificName: string;
  speciesDisplayName: string;
}

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Renvoie true si un nom citoyen "Sophie D" matche un marcheur "Sophie Dupont". */
const fuzzyMatch = (citizenName: string, marcheurFullName: string): boolean => {
  const c = normalize(citizenName);
  const m = normalize(marcheurFullName);
  if (!c || !m) return false;
  if (m.includes(c) || c.includes(m)) return true;
  // "Sophie D" vs "Sophie Dupont" : prénom + initiale
  const cParts = c.split(/\s+/);
  const mParts = m.split(/\s+/);
  if (cParts.length >= 2 && mParts.length >= 2) {
    const sameFirst = cParts[0] === mParts[0];
    const initialMatch = cParts[1].length === 1 && mParts[1].startsWith(cParts[1]);
    if (sameFirst && (initialMatch || mParts[1].startsWith(cParts[1]))) return true;
  }
  return false;
};

const AttribuerObservationDialog: React.FC<Props> = ({
  open, onOpenChange, explorationId, speciesScientificName, speciesDisplayName,
}) => {
  const qc = useQueryClient();
  const { data: marcheurs = [] } = useExplorationMarcheurs(explorationId);
  const { data: marches = [] } = useExplorationAllMarches(explorationId);
  const { data: observers = [] } = useSpeciesObservers(speciesScientificName, explorationId);

  const [selectedMarcheurs, setSelectedMarcheurs] = useState<Set<string>>(new Set());
  const [marcheId, setMarcheId] = useState<string>('');

  // Pré-sélection floue à partir des observateurs citoyens détectés
  useEffect(() => {
    if (!open) return;
    const matches = new Set<string>();
    observers.forEach(o => {
      marcheurs.forEach(m => {
        if (fuzzyMatch(o.observerName, m.fullName)) matches.add(m.id);
      });
    });
    setSelectedMarcheurs(matches);
    // Marche par défaut : celle de la 1ʳᵉ observation citoyenne, sinon 1ʳᵉ marche
    const firstObsMarcheId = observers.find(o => o.marcheId)?.marcheId;
    setMarcheId(firstObsMarcheId || marches[0]?.marcheId || '');
  }, [open, observers, marcheurs, marches]);

  const matchedSuggestions = useMemo(() => {
    const map = new Map<string, string[]>(); // marcheurId -> citizenNames
    observers.forEach(o => {
      marcheurs.forEach(m => {
        if (fuzzyMatch(o.observerName, m.fullName)) {
          const arr = map.get(m.id) || [];
          if (!arr.includes(o.observerName)) arr.push(o.observerName);
          map.set(m.id, arr);
        }
      });
    });
    return map;
  }, [observers, marcheurs]);

  const toggle = (id: string) => {
    setSelectedMarcheurs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('attribute_species_to_marcheurs', {
        p_exploration_id: explorationId,
        p_marche_id: marcheId,
        p_species: speciesScientificName,
        p_marcheur_ids: Array.from(selectedMarcheurs),
        p_notes: `Attribution depuis L'Œil — ${speciesDisplayName}`,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast.success(
        count > 0
          ? `${speciesDisplayName} attribué à ${count} marcheur${count > 1 ? 's' : ''} — Indice de Sentinelle mis à jour`
          : 'Attribution déjà existante (aucune nouvelle ligne)',
      );
      qc.invalidateQueries({ queryKey: ['exploration-marcheurs'] });
      qc.invalidateQueries({ queryKey: ['exploration-participants'] });
      qc.invalidateQueries({ queryKey: ['marcheur-impact-snapshots'] });
      qc.invalidateQueries({ queryKey: ['marcheur-observations'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Échec de l\'attribution');
    },
  });

  const canSubmit = selectedMarcheurs.size > 0 && !!marcheId && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Attribuer cette observation
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{speciesDisplayName}</span>
            {speciesScientificName && (
              <span className="italic text-muted-foreground"> — {speciesScientificName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {observers.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
              <p className="text-muted-foreground mb-1">Observateurs citoyens détectés :</p>
              <div className="flex flex-wrap gap-1">
                {observers.slice(0, 8).map(o => (
                  <Badge key={o.id} variant="secondary" className="text-[10px]">
                    {o.observerName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Marche concernée
            </Label>
            <select
              value={marcheId}
              onChange={(e) => setMarcheId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {marches.map(m => (
                <option key={m.marcheId} value={m.marcheId}>
                  {m.marcheName || m.ville}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Marcheurs à créditer ({selectedMarcheurs.size} sélectionné{selectedMarcheurs.size > 1 ? 's' : ''})
            </Label>
            <ScrollArea className="h-64 rounded-md border border-border p-2">
              <div className="space-y-1">
                {marcheurs.map(m => {
                  const isSelected = selectedMarcheurs.has(m.id);
                  const suggestions = matchedSuggestions.get(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggle(m.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{m.fullName}</span>
                          {suggestions && suggestions.length > 0 && (
                            <Badge variant="default" className="text-[9px] gap-0.5 px-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {suggestions.join(', ')}
                            </Badge>
                          )}
                        </div>
                        {m.role && m.role !== 'marcheur' && (
                          <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
                {marcheurs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center p-4">
                    Aucun marcheur dans cette exploration.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmer l'attribution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttribuerObservationDialog;
