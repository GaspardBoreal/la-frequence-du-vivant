import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Bird, 
  TreePine, 
  Bug, 
  Fish,
  Leaf,
  HelpCircle,
  Save,
  CheckCheck,
  XCircle
} from 'lucide-react';

interface MarcheurObservationPickerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
  onComplete?: () => void;
}

interface SpeciesItem {
  scientificName: string;
  commonName: string | null;
  kingdom: string;
  photos?: string[];
}

interface MarcheWithSpecies {
  id: string;
  nom_marche: string | null;
  ville: string;
  species: SpeciesItem[];
}

// Map kingdoms to display categories with icons
const kingdomConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  'Animalia': { label: 'Faune', icon: Bird, color: 'text-amber-500' },
  'Plantae': { label: 'Flore', icon: TreePine, color: 'text-emerald-500' },
  'Fungi': { label: 'Champignons', icon: Leaf, color: 'text-orange-500' },
  'Insecta': { label: 'Insectes', icon: Bug, color: 'text-yellow-500' },
  'Aves': { label: 'Oiseaux', icon: Bird, color: 'text-sky-500' },
  'Actinopterygii': { label: 'Poissons', icon: Fish, color: 'text-blue-500' },
  'Unknown': { label: 'Autres', icon: HelpCircle, color: 'text-gray-500' },
};

function getKingdomConfig(kingdom: string) {
  return kingdomConfig[kingdom] || kingdomConfig['Unknown'];
}

export default function MarcheurObservationPicker({
  marcheur,
  explorationId,
  onComplete
}: MarcheurObservationPickerProps) {
  const queryClient = useQueryClient();
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Fetch marches with their biodiversity snapshots
  const { data: marchesWithSpecies, isLoading: loadingMarches } = useQuery({
    queryKey: ['marches-with-species', explorationId],
    queryFn: async (): Promise<MarcheWithSpecies[]> => {
      // Get marches for this exploration
      const { data: explorationMarches, error: emError } = await supabase
        .from('exploration_marches')
        .select(`
          marche_id,
          marches:marche_id (
            id,
            nom_marche,
            ville
          )
        `)
        .eq('exploration_id', explorationId);

      if (emError) throw emError;

      const marcheIds = (explorationMarches || [])
        .map(em => em.marches)
        .filter(Boolean)
        .map((m: any) => m.id);

      if (marcheIds.length === 0) return [];

      // Get biodiversity snapshots for these marches
      const { data: snapshots, error: snapError } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data')
        .in('marche_id', marcheIds)
        .not('species_data', 'is', null);

      if (snapError) throw snapError;

      // Build marches with unique species (latest snapshot per marche)
      const marcheSpeciesMap = new Map<string, SpeciesItem[]>();
      
      // Group by marche_id, keep latest (assuming snapshots are ordered)
      const latestSnapshots = new Map<string, any>();
      (snapshots || []).forEach(snap => {
        latestSnapshots.set(snap.marche_id, snap);
      });

      latestSnapshots.forEach((snapshot, marcheId) => {
        const speciesData = snapshot.species_data as any[];
        if (speciesData && Array.isArray(speciesData)) {
          const uniqueSpecies = new Map<string, SpeciesItem>();
          speciesData.forEach((s: any) => {
            const scientificName = s.scientificName || s.nom_scientifique;
            if (scientificName && !uniqueSpecies.has(scientificName)) {
              uniqueSpecies.set(scientificName, {
                scientificName,
                commonName: s.commonName || s.nom_commun || null,
                kingdom: s.kingdom || 'Unknown',
                photos: s.photos || [],
              });
            }
          });
          marcheSpeciesMap.set(marcheId, Array.from(uniqueSpecies.values()));
        }
      });

      return (explorationMarches || [])
        .map(em => em.marches)
        .filter(Boolean)
        .map((m: any) => ({
          id: m.id,
          nom_marche: m.nom_marche,
          ville: m.ville,
          species: marcheSpeciesMap.get(m.id) || [],
        }))
        .filter(m => m.species.length > 0);
    },
  });

  // Fetch already registered observations for this marcheur
  const { data: existingObservations } = useQuery({
    queryKey: ['marcheur-existing-observations', marcheur.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_observations')
        .select('species_scientific_name, marche_id')
        .eq('marcheur_id', marcheur.id);

      if (error) throw error;
      
      // Create a Set of "marche_id:species_name" for quick lookup
      const existingSet = new Set<string>();
      (data || []).forEach(obs => {
        existingSet.add(`${obs.marche_id}:${obs.species_scientific_name}`);
      });
      return existingSet;
    },
  });

  // Get selected marche data
  const selectedMarche = useMemo(() => {
    return marchesWithSpecies?.find(m => m.id === selectedMarcheId);
  }, [marchesWithSpecies, selectedMarcheId]);

  // Group species by kingdom for display
  const speciesByKingdom = useMemo(() => {
    if (!selectedMarche) return new Map<string, SpeciesItem[]>();
    
    const grouped = new Map<string, SpeciesItem[]>();
    selectedMarche.species.forEach(species => {
      const kingdom = species.kingdom || 'Unknown';
      const existing = grouped.get(kingdom) || [];
      existing.push(species);
      grouped.set(kingdom, existing);
    });
    
    // Sort each group by common name or scientific name
    grouped.forEach((species, kingdom) => {
      species.sort((a, b) => {
        const nameA = a.commonName || a.scientificName;
        const nameB = b.commonName || b.scientificName;
        return nameA.localeCompare(nameB, 'fr');
      });
    });
    
    return grouped;
  }, [selectedMarche]);

  // Check if a species is already registered
  const isAlreadyRegistered = (scientificName: string) => {
    if (!existingObservations || !selectedMarcheId) return false;
    return existingObservations.has(`${selectedMarcheId}:${scientificName}`);
  };

  // Toggle species selection
  const toggleSpecies = (scientificName: string) => {
    const newSelected = new Set(selectedSpecies);
    if (newSelected.has(scientificName)) {
      newSelected.delete(scientificName);
    } else {
      newSelected.add(scientificName);
    }
    setSelectedSpecies(newSelected);
  };

  // Select all unregistered species
  const selectAll = () => {
    if (!selectedMarche) return;
    const newSelected = new Set<string>();
    selectedMarche.species.forEach(s => {
      if (!isAlreadyRegistered(s.scientificName)) {
        newSelected.add(s.scientificName);
      }
    });
    setSelectedSpecies(newSelected);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedSpecies(new Set());
  };

  // Save selected observations
  const handleSave = async () => {
    if (selectedSpecies.size === 0 || !selectedMarcheId) {
      toast.error('Sélectionnez au moins une espèce');
      return;
    }

    setSaving(true);
    try {
      const observations = Array.from(selectedSpecies).map(scientificName => ({
        marcheur_id: marcheur.id,
        marche_id: selectedMarcheId,
        species_scientific_name: scientificName,
        observation_date: new Date().toISOString().split('T')[0],
      }));

      const { error } = await supabase
        .from('marcheur_observations')
        .insert(observations);

      if (error) throw error;

      toast.success(`${selectedSpecies.size} observation${selectedSpecies.size > 1 ? 's' : ''} enregistrée${selectedSpecies.size > 1 ? 's' : ''}`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['marcheur-existing-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });

      // Clear selection
      setSelectedSpecies(new Set());
      
      onComplete?.();
    } catch (error: any) {
      console.error('Error saving observations:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!selectedMarche || !existingObservations) return { total: 0, registered: 0, available: 0 };
    
    const total = selectedMarche.species.length;
    const registered = selectedMarche.species.filter(s => isAlreadyRegistered(s.scientificName)).length;
    return { total, registered, available: total - registered };
  }, [selectedMarche, existingObservations]);

  // Global stats across all marches
  const globalStats = useMemo(() => {
    if (!marchesWithSpecies || !existingObservations) return { total: 0, registered: 0 };
    
    let total = 0;
    let registered = 0;
    
    marchesWithSpecies.forEach(marche => {
      marche.species.forEach(s => {
        total++;
        if (existingObservations.has(`${marche.id}:${s.scientificName}`)) {
          registered++;
        }
      });
    });
    
    return { total, registered };
  }, [marchesWithSpecies, existingObservations]);

  if (loadingMarches) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Progress */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Progression globale : {globalStats.registered} / {globalStats.total} espèces associées
              </span>
            </div>
            <Badge variant="secondary">
              {Math.round((globalStats.registered / Math.max(globalStats.total, 1)) * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Marche Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sélectionner une marche</label>
        <Select value={selectedMarcheId} onValueChange={(value) => {
          setSelectedMarcheId(value);
          setSelectedSpecies(new Set());
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir une marche..." />
          </SelectTrigger>
          <SelectContent>
            {marchesWithSpecies?.map((marche) => {
              const marcheRegistered = marche.species.filter(s => 
                existingObservations?.has(`${marche.id}:${s.scientificName}`)
              ).length;
              const isComplete = marcheRegistered === marche.species.length;
              
              return (
                <SelectItem key={marche.id} value={marche.id}>
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{marche.nom_marche || marche.ville}</span>
                    <span className="text-muted-foreground">
                      ({marcheRegistered}/{marche.species.length})
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Species Selection */}
      {selectedMarche && (
        <>
          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={stats.available === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout sélectionner
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={selectedSpecies.size === 0}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tout désélectionner
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.registered} déjà enregistrée{stats.registered > 1 ? 's' : ''} • {stats.available} disponible{stats.available > 1 ? 's' : ''}
            </div>
          </div>

          {/* Species List by Kingdom */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Array.from(speciesByKingdom.entries()).map(([kingdom, species]) => {
                const config = getKingdomConfig(kingdom);
                const Icon = config.icon;
                
                return (
                  <div key={kingdom} className="space-y-3">
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <span className="font-semibold">{config.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {species.length}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2">
                      {species.map((s) => {
                        const isRegistered = isAlreadyRegistered(s.scientificName);
                        const isSelected = selectedSpecies.has(s.scientificName);
                        
                        return (
                          <div
                            key={s.scientificName}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                              ${isRegistered 
                                ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' 
                                : isSelected 
                                  ? 'bg-primary/10 border-primary/50' 
                                  : 'hover:bg-muted/50 border-border'
                              }
                            `}
                            onClick={() => !isRegistered && toggleSpecies(s.scientificName)}
                          >
                            <Checkbox
                              checked={isRegistered || isSelected}
                              disabled={isRegistered}
                              onCheckedChange={() => !isRegistered && toggleSpecies(s.scientificName)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {s.commonName && (
                                  <span className="font-medium truncate">{s.commonName}</span>
                                )}
                                <span className={`text-sm italic ${s.commonName ? 'text-muted-foreground' : ''}`}>
                                  {s.scientificName}
                                </span>
                              </div>
                            </div>
                            {isRegistered && (
                              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">
                                ✓ Déjà associée
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Save Button */}
          {selectedSpecies.size > 0 && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {selectedSpecies.size} espèce{selectedSpecies.size > 1 ? 's' : ''} sélectionnée{selectedSpecies.size > 1 ? 's' : ''}
                  </span>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer les observations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedMarcheId && marchesWithSpecies && marchesWithSpecies.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bird className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Sélectionnez une marche pour voir les espèces Open Data</p>
          <p className="text-sm mt-1">et cochez celles réellement observées</p>
        </div>
      )}

      {marchesWithSpecies && marchesWithSpecies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune donnée biodiversité disponible</p>
          <p className="text-sm mt-1">Lancez d'abord une collecte Open Data sur les marches</p>
        </div>
      )}
    </div>
  );
}
