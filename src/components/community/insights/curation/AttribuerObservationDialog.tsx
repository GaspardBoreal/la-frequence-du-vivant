import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserPlus, MapPin, CheckCircle2, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useExplorationParticipants, type MarcheurWithStats } from '@/hooks/useExplorationParticipants';
import { useExplorationAllMarches } from '@/hooks/useExplorationAllMarches';
import { useSpeciesObservers } from '@/hooks/useSpeciesObservers';
import { getSpeciesCategoryOptions } from '@/lib/speciesClassification';
import type { SpeciesCategory } from '@/lib/speciesClassification';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explorationId: string;
  speciesScientificName: string;
  speciesDisplayName: string;
}

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** "Sophie D" matche "Sophie Dupont" */
const fuzzyMatch = (citizenName: string, fullName: string): boolean => {
  const c = normalize(citizenName);
  const m = normalize(fullName);
  if (!c || !m) return false;
  if (m.includes(c) || c.includes(m)) return true;
  const cParts = c.split(/\s+/);
  const mParts = m.split(/\s+/);
  if (cParts.length >= 2 && mParts.length >= 2) {
    if (cParts[0] === mParts[0] && mParts[1].startsWith(cParts[1])) return true;
  }
  return false;
};

/** Stable selection key: prefer userId (community), else crewId. */
const selectionKey = (p: MarcheurWithStats): string => p.userId || p.crewId || `${p.prenom}-${p.nom}`;

const CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  bioindicatrice: 'Bio-indicatrice',
  auxiliaire: 'Auxiliaire',
  eee: 'EEE',
  patrimoniale: 'Patrimoniale',
  ravageur: 'Ravageur',
  indigene: 'Indigène',
};

const CATEGORY_TONE: Record<SpeciesCategory, string> = {
  bioindicatrice: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  auxiliaire: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  eee: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  patrimoniale: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ravageur: 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  indigene: 'border-primary/40 bg-primary/10 text-primary',
};

const AttribuerObservationDialog: React.FC<Props> = ({
  open, onOpenChange, explorationId, speciesScientificName, speciesDisplayName,
}) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: participants = [], isLoading: loadingParts } = useExplorationParticipants(explorationId);
  const { data: marches = [] } = useExplorationAllMarches(explorationId);
  const { data: observers = [] } = useSpeciesObservers(speciesScientificName, explorationId);

  // KB options for this species (primary + secondaries, deduped)
  const categoryOptions = useMemo(
    () => getSpeciesCategoryOptions(speciesScientificName),
    [speciesScientificName],
  );
  const requiresChoice = categoryOptions.length > 1;

  // Existing L'Œil curation for this species (if any) + count of marcheurs already attributed
  const { data: curationInfo } = useQuery({
    queryKey: ['oeil-species-curation', explorationId, speciesScientificName],
    queryFn: async () => {
      const curRes: any = await supabase
        .from('exploration_curations')
        .select('id, category')
        .eq('exploration_id', explorationId)
        .eq('sense', 'oeil')
        .eq('entity_type', 'species')
        .eq('entity_id', speciesScientificName)
        .maybeSingle();
      const obsRes: any = await (supabase as any)
        .from('marcheur_observations')
        .select('marcheur_id, user_id')
        .eq('exploration_id', explorationId)
        .eq('species_scientific_name', speciesScientificName);
      const ids = new Set<string>();
      ((obsRes.data as any[]) || []).forEach((r: any) => ids.add(r.marcheur_id || r.user_id));
      return {
        curationId: curRes.data?.id as string | undefined,
        currentCategory: (curRes.data?.category as SpeciesCategory | undefined) || undefined,
        attributionCount: ids.size,
      };
    },
    enabled: open && !!explorationId && !!speciesScientificName,
    staleTime: 30 * 1000,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [marcheId, setMarcheId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [chosenCategory, setChosenCategory] = useState<SpeciesCategory | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) =>
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr'),
    );
  }, [participants]);

  const matchedSuggestions = useMemo(() => {
    const map = new Map<string, string[]>();
    sortedParticipants.forEach(p => {
      const fullName = `${p.prenom} ${p.nom}`.trim();
      observers.forEach(o => {
        if (fuzzyMatch(o.observerName, fullName)) {
          const key = selectionKey(p);
          const arr = map.get(key) || [];
          if (!arr.includes(o.observerName)) arr.push(o.observerName);
          map.set(key, arr);
        }
      });
    });
    return map;
  }, [observers, sortedParticipants]);

  useEffect(() => {
    if (!open) return;
    const init = new Set<string>();
    sortedParticipants.forEach(p => {
      if (matchedSuggestions.get(selectionKey(p))) init.add(selectionKey(p));
    });
    setSelected(init);
    const firstObsMarcheId = observers.find(o => o.marcheId)?.marcheId;
    setMarcheId(firstObsMarcheId || marches[0]?.marcheId || '');
    setSearch('');
    // Always reset category — explicit choice required at every attribution
    setChosenCategory(requiresChoice ? null : (categoryOptions[0] ?? null));
  }, [open, sortedParticipants, matchedSuggestions, observers, marches, requiresChoice, categoryOptions]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return sortedParticipants;
    return sortedParticipants.filter(p => normalize(`${p.prenom} ${p.nom}`).includes(q));
  }, [search, sortedParticipants]);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const runAttribution = async (categoryToPersist: SpeciesCategory) => {
    if (!user?.id) throw new Error('Authentification requise');

    // 1) Upsert L'Œil curation so the choice overrides the KB everywhere
    if (curationInfo?.curationId) {
      const { error } = await supabase
        .from('exploration_curations')
        .update({ category: categoryToPersist, classification_source: 'curator', needs_review: false })
        .eq('id', curationInfo.curationId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('exploration_curations').insert({
        exploration_id: explorationId,
        sense: 'oeil',
        entity_type: 'species',
        entity_id: speciesScientificName,
        category: categoryToPersist,
        title: speciesDisplayName,
        classification_source: 'curator',
        needs_review: false,
        created_by: user.id,
      } as any);
      if (error) throw error;
    }

    // 2) Attribute to marcheurs
    const crewIds: string[] = [];
    const userIds: string[] = [];
    sortedParticipants.forEach(p => {
      const k = selectionKey(p);
      if (!selected.has(k)) return;
      if (p.crewId) crewIds.push(p.crewId);
      else if (p.userId) userIds.push(p.userId);
    });

    const { data, error } = await supabase.rpc('attribute_species_to_marcheurs', {
      p_exploration_id: explorationId,
      p_marche_id: marcheId,
      p_species: speciesScientificName,
      p_marcheur_ids: crewIds,
      p_notes: `Attribution depuis L'Œil — ${speciesDisplayName} [${CATEGORY_LABELS[categoryToPersist]}]`,
      p_user_ids: userIds,
    });
    if (error) throw error;
    return data as number;
  };

  const mutation = useMutation({
    mutationFn: (categoryToPersist: SpeciesCategory) => runAttribution(categoryToPersist),
    onSuccess: (count) => {
      toast.success(
        count > 0
          ? `${speciesDisplayName} attribué à ${count} marcheur${count > 1 ? 's' : ''} — Indice de Sentinelle mis à jour`
          : 'Attribution déjà existante (aucune nouvelle ligne)',
      );
      qc.invalidateQueries({ queryKey: ['exploration-marcheurs'] });
      qc.invalidateQueries({ queryKey: ['exploration-participants'] });
      qc.invalidateQueries({ queryKey: ['exploration-curations', explorationId] });
      qc.invalidateQueries({ queryKey: ['oeil-species-curation', explorationId, speciesScientificName] });
      qc.invalidateQueries({ queryKey: ['marcheur-impact-snapshots'] });
      qc.invalidateQueries({ queryKey: ['marcheur-observations'] });
      qc.invalidateQueries({ queryKey: ['marcheur-sensible-species'] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.message || "Échec de l'attribution"),
  });

  const handleConfirm = () => {
    if (!chosenCategory) return;
    const existing = curationInfo?.currentCategory;
    const conflict = existing && existing !== chosenCategory && (curationInfo?.attributionCount ?? 0) > 0;
    if (conflict) { setConflictOpen(true); return; }
    mutation.mutate(chosenCategory);
  };

  const canSubmit = selected.size > 0 && !!marcheId && !!chosenCategory && !mutation.isPending;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Identification (catégorie unique) */}
          {categoryOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Identification de l'espèce
                {requiresChoice && <span className="text-rose-500">*</span>}
              </Label>
              {requiresChoice ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryOptions.map(cat => {
                      const isCurrent = curationInfo?.currentCategory === cat;
                      const isActive = chosenCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setChosenCategory(cat)}
                          className={cn(
                            'h-8 px-3 rounded-full border text-xs font-medium transition flex items-center gap-1.5',
                            CATEGORY_TONE[cat],
                            isActive
                              ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-[1.02]'
                              : 'opacity-70 hover:opacity-100',
                          )}
                          aria-pressed={isActive}
                        >
                          {CATEGORY_LABELS[cat]}
                          {isCurrent && (
                            <span className="text-[9px] uppercase tracking-wide opacity-80">actuel</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cette espèce a plusieurs identifications possibles. Choisissez celle qui s'applique à cette observation.
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={cn('h-7 px-2.5 rounded-full border text-xs font-medium inline-flex items-center', CATEGORY_TONE[categoryOptions[0]])}>
                    {CATEGORY_LABELS[categoryOptions[0]]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Classification confirmée</span>
                </div>
              )}
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
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Marcheurs à créditer ({selected.size}/{sortedParticipants.length})
              </Label>
              {loadingParts && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un participant…"
                className="pl-8 h-8 text-xs"
              />
            </div>
            <ScrollArea className="h-64 rounded-md border border-border p-2">
              <div className="space-y-1">
                {filtered.map(p => {
                  const k = selectionKey(p);
                  const isSelected = selected.has(k);
                  const suggestions = matchedSuggestions.get(k);
                  const fullName = `${p.prenom} ${p.nom}`.trim();
                  return (
                    <label
                      key={k}
                      className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggle(k)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{fullName}</span>
                          {suggestions && suggestions.length > 0 && (
                            <Badge variant="default" className="text-[9px] gap-0.5 px-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {suggestions.join(', ')}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] capitalize">
                            {p.source === 'crew' ? p.role || 'troupe' : 'communauté'}
                          </Badge>
                        </div>
                      </div>
                    </label>
                  );
                })}
                {filtered.length === 0 && !loadingParts && (
                  <p className="text-xs text-muted-foreground text-center p-4">
                    {search ? 'Aucun participant trouvé.' : 'Aucun participant dans cette exploration.'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {requiresChoice && !chosenCategory ? 'Choisissez une identification' : "Confirmer l'attribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Identification déjà fixée
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="italic">{speciesDisplayName}</span> est déjà classé{' '}
            <strong>{curationInfo?.currentCategory ? CATEGORY_LABELS[curationInfo.currentCategory] : ''}</strong>{' '}
            pour {curationInfo?.attributionCount ?? 0} marcheur·se{(curationInfo?.attributionCount ?? 0) > 1 ? 's' : ''} dans cette exploration.
            Modifier l'identification en <strong>{chosenCategory ? CATEGORY_LABELS[chosenCategory] : ''}</strong> écraserait leur classement Sentinelle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button
            variant="secondary"
            onClick={() => {
              const keep = curationInfo?.currentCategory;
              if (!keep) return;
              setChosenCategory(keep);
              setConflictOpen(false);
              mutation.mutate(keep);
            }}
          >
            Conserver l'actuelle
          </Button>
          <AlertDialogAction
            onClick={() => {
              setConflictOpen(false);
              if (chosenCategory) mutation.mutate(chosenCategory);
            }}
          >
            Forcer le nouveau choix
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AttribuerObservationDialog;
