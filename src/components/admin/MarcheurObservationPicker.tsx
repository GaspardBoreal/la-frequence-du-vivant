import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  XCircle,
  Search,
  Info,
  User,
  Users,
  Filter
} from 'lucide-react';

interface MarcheurObservationPickerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
  onComplete?: () => void;
}

interface Attribution {
  observerName: string;
  source?: string;
}

interface SpeciesItem {
  scientificName: string;
  commonName: string | null;
  kingdom: string;
  photos?: string[];
  source?: string;
  attributions?: Attribution[];
}

interface MarcheWithSpecies {
  id: string;
  nom_marche: string | null;
  ville: string;
  species: SpeciesItem[];
}

interface ContributorInfo {
  name: string;
  count: number;
  isMatch: boolean; // true if matches the marcheur name
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

// Normalize a name for matching (lowercase, no accents, trim)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .trim();
}

// Check if two names match (fuzzy matching)
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
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
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [contributorFilterEnabled, setContributorFilterEnabled] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<string>('all');
  const [contributorSearch, setContributorSearch] = useState('');

  // Get marcheur full name for auto-matching
  const marcheurFullName = `${marcheur.prenom} ${marcheur.nom}`.trim();

  // Fetch marches with their biodiversity snapshots (including attributions)
  const { data: marchesWithSpecies, isLoading: loadingMarches } = useQuery({
    queryKey: ['marches-with-species-attributions', explorationId],
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
            if (scientificName) {
              // Merge attributions if species already exists
              const existing = uniqueSpecies.get(scientificName);
              const newAttributions: Attribution[] = (s.attributions || []).map((a: any) => ({
                observerName: a.observerName || 'Anonyme',
                source: s.source || 'unknown'
              }));
              
              if (existing) {
                // Merge attributions
                const existingAttrNames = new Set(existing.attributions?.map(a => a.observerName));
                newAttributions.forEach(attr => {
                  if (!existingAttrNames.has(attr.observerName)) {
                    existing.attributions?.push(attr);
                  }
                });
              } else {
                uniqueSpecies.set(scientificName, {
                  scientificName,
                  commonName: s.commonName || s.nom_commun || null,
                  kingdom: s.kingdom || 'Unknown',
                  photos: s.photos || [],
                  source: s.source,
                  attributions: newAttributions.length > 0 ? newAttributions : undefined,
                });
              }
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

  // Extract unique contributors from the selected marche
  const contributors = useMemo((): ContributorInfo[] => {
    if (!selectedMarche) return [];
    
    const contributorMap = new Map<string, { count: number; isMatch: boolean }>();
    
    selectedMarche.species.forEach(species => {
      species.attributions?.forEach(attr => {
        const name = attr.observerName || 'Anonyme';
        const existing = contributorMap.get(name);
        const isMatch = namesMatch(name, marcheurFullName);
        
        if (existing) {
          existing.count++;
          if (isMatch) existing.isMatch = true;
        } else {
          contributorMap.set(name, { count: 1, isMatch });
        }
      });
    });
    
    // Sort: matches first, then by count
    return Array.from(contributorMap.entries())
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => {
        if (a.isMatch && !b.isMatch) return -1;
        if (!a.isMatch && b.isMatch) return 1;
        return b.count - a.count;
      });
  }, [selectedMarche, marcheurFullName]);

  // Filter contributors by search
  const filteredContributors = useMemo(() => {
    if (!contributorSearch.trim()) return contributors;
    const search = contributorSearch.toLowerCase();
    return contributors.filter(c => c.name.toLowerCase().includes(search));
  }, [contributors, contributorSearch]);

  // Auto-select matching contributor when enabled
  useEffect(() => {
    if (contributorFilterEnabled && selectedMarche) {
      const matchingContributor = contributors.find(c => c.isMatch);
      if (matchingContributor) {
        setSelectedContributor(matchingContributor.name);
      } else {
        setSelectedContributor('all');
      }
    } else {
      setSelectedContributor('all');
    }
  }, [contributorFilterEnabled, selectedMarche, contributors]);

  // Reset search when changing marche
  useEffect(() => {
    setSpeciesSearch('');
    setContributorSearch('');
  }, [selectedMarcheId]);

  // Filter and group species by kingdom (with species search AND contributor filter)
  const speciesByKingdom = useMemo(() => {
    if (!selectedMarche) return new Map<string, SpeciesItem[]>();
    
    let speciesToDisplay = selectedMarche.species;
    
    // Filter by contributor if enabled
    if (contributorFilterEnabled && selectedContributor !== 'all') {
      speciesToDisplay = speciesToDisplay.filter(s => 
        s.attributions?.some(attr => attr.observerName === selectedContributor)
      );
    }
    
    // Filter by species name search
    if (speciesSearch.trim()) {
      const search = speciesSearch.toLowerCase();
      speciesToDisplay = speciesToDisplay.filter(s => 
        s.scientificName.toLowerCase().includes(search) ||
        (s.commonName && s.commonName.toLowerCase().includes(search))
      );
    }
    
    const grouped = new Map<string, SpeciesItem[]>();
    speciesToDisplay.forEach(species => {
      const kingdom = species.kingdom || 'Unknown';
      const existing = grouped.get(kingdom) || [];
      existing.push(species);
      grouped.set(kingdom, existing);
    });
    
    // Sort each group by common name or scientific name
    grouped.forEach((species) => {
      species.sort((a, b) => {
        const nameA = a.commonName || a.scientificName;
        const nameB = b.commonName || b.scientificName;
        return nameA.localeCompare(nameB, 'fr');
      });
    });
    
    return grouped;
  }, [selectedMarche, speciesSearch, contributorFilterEnabled, selectedContributor]);

  // Count displayed species
  const displayedSpeciesCount = useMemo(() => {
    let count = 0;
    speciesByKingdom.forEach(species => {
      count += species.length;
    });
    return count;
  }, [speciesByKingdom]);

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

  // Select all unregistered species (respecting current filter)
  const selectAll = () => {
    if (!selectedMarche) return;
    const newSelected = new Set<string>();
    
    // Get displayed species (filtered by contributor)
    speciesByKingdom.forEach((species) => {
      species.forEach(s => {
        if (!isAlreadyRegistered(s.scientificName)) {
          newSelected.add(s.scientificName);
        }
      });
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

  // Calculate stats for current view
  const stats = useMemo(() => {
    if (!selectedMarche || !existingObservations) return { total: 0, registered: 0, available: 0 };
    
    // Count based on displayed (filtered) species
    let total = 0;
    let registered = 0;
    
    speciesByKingdom.forEach((species) => {
      species.forEach(s => {
        total++;
        if (isAlreadyRegistered(s.scientificName)) {
          registered++;
        }
      });
    });
    
    return { total, registered, available: total - registered };
  }, [speciesByKingdom, existingObservations, selectedMarcheId]);

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
          {/* Explanatory Card */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">
                    Les espèces ci-dessous ont été détectées automatiquement via les APIs Open Data 
                    (iNaturalist, eBird, GBIF) dans la zone de cette marche.
                  </p>
                  <p className="font-medium text-foreground">
                    Cochez celles que <span className="text-primary">{marcheur.prenom} {marcheur.nom}</span> a personnellement observées pour les lui attribuer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contributor Filter Section */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-sm">Filtrer par contributeur Open Data</p>
                    <p className="text-xs text-muted-foreground">
                      Retrouvez les observations d'un contributeur spécifique (iNaturalist, eBird, GBIF)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={contributorFilterEnabled}
                  onCheckedChange={setContributorFilterEnabled}
                />
              </div>

              {contributorFilterEnabled && (
                <div className="space-y-3 pt-2 border-t border-amber-500/20">
                  {/* Contributor search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un contributeur..."
                      value={contributorSearch}
                      onChange={(e) => setContributorSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Contributors list */}
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-1">
                      {/* "All" option */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedContributor === 'all' ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedContributor('all')}
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Tous les contributeurs</span>
                        </div>
                        <Badge variant="secondary">{selectedMarche.species.length}</Badge>
                      </div>

                      {filteredContributors.map((contributor) => (
                        <div
                          key={contributor.name}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedContributor === contributor.name 
                              ? 'bg-primary/10 border border-primary/30' 
                              : contributor.isMatch 
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedContributor(contributor.name)}
                        >
                          <div className="flex items-center gap-2">
                            <User className={`h-4 w-4 ${contributor.isMatch ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                            <span className={`text-sm ${contributor.isMatch ? 'font-medium text-emerald-600' : ''}`}>
                              {contributor.name}
                            </span>
                            {contributor.isMatch && (
                              <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                                Correspond au marcheur
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">{contributor.count}</Badge>
                        </div>
                      ))}

                      {filteredContributors.length === 0 && contributorSearch && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Aucun contributeur trouvé pour "{contributorSearch}"
                        </div>
                      )}

                      {contributors.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          Aucune attribution disponible pour cette marche
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {selectedContributor !== 'all' && (
                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                      <span className="text-sm">
                        <span className="font-medium text-amber-600">{displayedSpeciesCount}</span> espèce{displayedSpeciesCount > 1 ? 's' : ''} attribuée{displayedSpeciesCount > 1 ? 's' : ''} à <span className="font-medium">{selectedContributor}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        disabled={stats.available === 0}
                        className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Tout sélectionner
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Species Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une espèce par nom..."
              value={speciesSearch}
              onChange={(e) => setSpeciesSearch(e.target.value)}
              className="pl-9"
            />
          </div>

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
                Tout sélectionner ({stats.available})
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
              {(speciesSearch.trim() || (contributorFilterEnabled && selectedContributor !== 'all')) && (
                <span className="text-blue-500 font-medium mr-2">
                  {displayedSpeciesCount} résultat{displayedSpeciesCount > 1 ? 's' : ''}
                </span>
              )}
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
              
              {displayedSpeciesCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {contributorFilterEnabled && selectedContributor !== 'all'
                      ? `Aucune espèce attribuée à "${selectedContributor}"`
                      : speciesSearch
                        ? `Aucune espèce trouvée pour "${speciesSearch}"`
                        : 'Aucune espèce disponible'
                    }
                  </p>
                  {(speciesSearch || (contributorFilterEnabled && selectedContributor !== 'all')) && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => {
                        setSpeciesSearch('');
                        if (contributorFilterEnabled) setSelectedContributor('all');
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              )}
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

      {!marchesWithSpecies?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Aucune marche avec des données de biodiversité trouvée pour cette exploration.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
