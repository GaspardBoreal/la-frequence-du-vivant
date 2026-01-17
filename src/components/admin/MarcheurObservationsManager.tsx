import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Search, 
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  User,
  Leaf,
  Check,
  Star,
  MapPin,
  RefreshCw,
  Trash2,
  ListTree
} from 'lucide-react';

interface MarcheurObservationsManagerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
  onObservationsSaved?: () => void;
}

interface DetailedObservation {
  id: string;
  species_scientific_name: string;
  marche_id: string;
  observation_date: string | null;
  marcheName: string;
}

interface GroupedObservations {
  marcheId: string;
  marcheName: string;
  observations: DetailedObservation[];
}

interface Attribution {
  observerName: string;
}

interface SpeciesItem {
  scientificName: string;
  commonName: string | null;
  kingdom: string;
  observers?: string[];
}

interface ContributorMarche {
  marcheId: string;
  marcheName: string;
  speciesCount: number;
  species: SpeciesItem[];
}

interface ContributorWithMarches {
  name: string;
  isMatch: boolean;
  totalSpecies: number;
  marches: ContributorMarche[];
}

interface MarcheWithCoords {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface MarcheWithSpecies {
  id: string;
  name: string;
  speciesCount: number;
  species: SpeciesItem[];
  contributorsCount: number;
}

// Normalize name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .trim();
}

function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

// Parse species from Edge Function response
function parseSpeciesFromResponse(data: any): { species: SpeciesItem[], contributors: Set<string> } {
  const species: SpeciesItem[] = [];
  const contributors = new Set<string>();
  
  if (!data?.species || !Array.isArray(data.species)) {
    return { species, contributors };
  }
  
  data.species.forEach((s: any) => {
    const scientificName = s.scientificName || s.nom_scientifique;
    if (!scientificName) return;
    
    const observers: string[] = [];
    
    // Extract observers from attributions
    if (s.attributions && Array.isArray(s.attributions)) {
      s.attributions.forEach((attr: Attribution) => {
        const observerName = attr.observerName || 'Anonyme';
        if (observerName !== 'Anonyme') {
          observers.push(observerName);
          contributors.add(observerName);
        }
      });
    }
    
    species.push({
      scientificName,
      commonName: s.commonName || s.vernacularName || s.nom_commun || null,
      kingdom: s.kingdom || 'Unknown',
      observers: observers.length > 0 ? observers : undefined,
    });
  });
  
  return { species, contributors };
}

export default function MarcheurObservationsManager({ 
  marcheur, 
  explorationId,
  onObservationsSaved
}: MarcheurObservationsManagerProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'marche' | 'contributor'>('marche');
  const [searchTerm, setSearchTerm] = useState('');
  const [marcheSearchTerm, setMarcheSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState<{
    contributor: string;
    marcheId: string;
    marcheName: string;
    species: SpeciesItem[];
  } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [expandedContributors, setExpandedContributors] = useState<Set<string>>(new Set());
  const [loadingMarcheId, setLoadingMarcheId] = useState<string | null>(null);
  const [loadedMarchesData, setLoadedMarchesData] = useState<Map<string, MarcheWithSpecies>>(new Map());
  const [contributorsData, setContributorsData] = useState<ContributorWithMarches[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number, marcheName: string} | null>(null);
  const [showMyObservations, setShowMyObservations] = useState(true);
  const [expandedObsMarches, setExpandedObsMarches] = useState<Set<string>>(new Set());
  const [deletingObservation, setDeletingObservation] = useState<string | null>(null);

  const marcheurFullName = `${marcheur.prenom} ${marcheur.nom}`.trim();

  // Toggle contributor expansion
  const toggleContributor = (name: string) => {
    const newSet = new Set(expandedContributors);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedContributors(newSet);
  };

  // Fetch marches with coordinates (base info only)
  const { data: marchesWithCoords, isLoading: marchesLoading } = useQuery({
    queryKey: ['marches-coords', explorationId],
    queryFn: async (): Promise<MarcheWithCoords[]> => {
      const { data: explorationMarches, error: emError } = await supabase
        .from('exploration_marches')
        .select(`
          marche_id,
          marches:marche_id (
            id,
            nom_marche,
            ville,
            latitude,
            longitude
          )
        `)
        .eq('exploration_id', explorationId);

      if (emError) throw emError;

      const result: MarcheWithCoords[] = [];
      (explorationMarches || []).forEach(em => {
        const m = em.marches as any;
        if (m) {
          result.push({
            id: m.id,
            name: m.nom_marche || m.ville,
            latitude: m.latitude,
            longitude: m.longitude,
          });
        }
      });

      return result;
    },
  });

  // Fetch existing observations (simple set for checking)
  const { data: existingObservations, refetch: refetchExisting } = useQuery({
    queryKey: ['marcheur-all-observations', marcheur.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcheur_observations')
        .select('species_scientific_name, marche_id')
        .eq('marcheur_id', marcheur.id);

      if (error) throw error;
      return new Set((data || []).map(o => `${o.marche_id}:${o.species_scientific_name}`));
    },
  });

  // Fetch detailed observations for "Mes observations" section
  const { data: detailedObservations, refetch: refetchDetailed } = useQuery({
    queryKey: ['marcheur-detailed-observations', marcheur.id],
    queryFn: async (): Promise<GroupedObservations[]> => {
      const { data, error } = await supabase
        .from('marcheur_observations')
        .select(`
          id,
          species_scientific_name,
          marche_id,
          observation_date,
          marches:marche_id (nom_marche, ville)
        `)
        .eq('marcheur_id', marcheur.id)
        .order('observation_date', { ascending: false });

      if (error) throw error;

      // Group by marche
      const grouped = new Map<string, GroupedObservations>();
      (data || []).forEach((obs: any) => {
        const marcheName = obs.marches?.nom_marche || obs.marches?.ville || 'Marche inconnue';
        
        if (!grouped.has(obs.marche_id)) {
          grouped.set(obs.marche_id, {
            marcheId: obs.marche_id,
            marcheName,
            observations: [],
          });
        }
        
        grouped.get(obs.marche_id)!.observations.push({
          id: obs.id,
          species_scientific_name: obs.species_scientific_name,
          marche_id: obs.marche_id,
          observation_date: obs.observation_date,
          marcheName,
        });
      });

      return Array.from(grouped.values()).sort((a, b) => 
        b.observations.length - a.observations.length
      );
    },
    staleTime: 0,
  });

  // Toggle marche expansion in "Mes observations"
  const toggleObsMarche = (marcheId: string) => {
    const newSet = new Set(expandedObsMarches);
    if (newSet.has(marcheId)) {
      newSet.delete(marcheId);
    } else {
      newSet.add(marcheId);
    }
    setExpandedObsMarches(newSet);
  };

  // Delete a single observation
  const handleDeleteObservation = async (observationId: string) => {
    setDeletingObservation(observationId);
    try {
      const { error } = await supabase
        .from('marcheur_observations')
        .delete()
        .eq('id', observationId);

      if (error) throw error;
      
      toast.success('Observation supprimée');
      await Promise.all([refetchDetailed(), refetchExisting()]);
      onObservationsSaved?.();
    } catch (error: any) {
      console.error('Error deleting observation:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setDeletingObservation(null);
    }
  };

  // Delete all observations for a marche
  const handleDeleteMarcheObservations = async (marcheId: string, count: number) => {
    if (!confirm(`Supprimer les ${count} observation(s) de cette marche ?`)) return;
    
    try {
      const { error } = await supabase
        .from('marcheur_observations')
        .delete()
        .eq('marcheur_id', marcheur.id)
        .eq('marche_id', marcheId);

      if (error) throw error;
      
      toast.success(`${count} observation(s) supprimée(s)`);
      await Promise.all([refetchDetailed(), refetchExisting()]);
      onObservationsSaved?.();
    } catch (error: any) {
      console.error('Error deleting marche observations:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Load species data for a specific marche via Edge Function
  const loadMarcheData = async (marche: MarcheWithCoords) => {
    if (marche.latitude == null || marche.longitude == null) {
      toast.error(`Coordonnées manquantes pour ${marche.name}`);
      return null;
    }

    setLoadingMarcheId(marche.id);
    
    try {
      console.log(`🔄 Chargement des données pour: ${marche.name}`);
      
      const { data, error } = await supabase.functions.invoke('biodiversity-data', {
        body: {
          latitude: marche.latitude,
          longitude: marche.longitude,
          radius: 5, // 5km - radius is in kilometers, same as bioacoustique page
          mode: 'interactive'
        }
      });

      if (error) throw error;

      const { species, contributors } = parseSpeciesFromResponse(data);
      
      console.log(`✅ ${marche.name}: ${species.length} espèces, ${contributors.size} contributeurs`);
      
      const marcheData: MarcheWithSpecies = {
        id: marche.id,
        name: marche.name,
        speciesCount: species.length,
        species,
        contributorsCount: contributors.size,
      };

      // Update cache
      setLoadedMarchesData(prev => new Map(prev).set(marche.id, marcheData));
      
      return marcheData;
    } catch (error: any) {
      console.error(`❌ Erreur pour ${marche.name}:`, error);
      toast.error(`Erreur: ${error.message}`);
      return null;
    } finally {
      setLoadingMarcheId(null);
    }
  };

  // Helper: Build contributors list from contributorMap
  const buildContributorsList = (
    contributorMap: Map<string, Map<string, SpeciesItem[]>>,
    marcheNameMap: Map<string, string>
  ): ContributorWithMarches[] => {
    const result: ContributorWithMarches[] = [];
    
    contributorMap.forEach((marchesMap, contributorName) => {
      const marches: ContributorMarche[] = [];
      let totalSpecies = 0;
      
      marchesMap.forEach((species, marcheId) => {
        const marcheName = marcheNameMap.get(marcheId) || marcheId;
        marches.push({
          marcheId,
          marcheName,
          speciesCount: species.length,
          species,
        });
        totalSpecies += species.length;
      });

      if (marches.length > 0) {
        result.push({
          name: contributorName,
          isMatch: namesMatch(contributorName, marcheurFullName),
          totalSpecies,
          marches: marches.sort((a, b) => b.speciesCount - a.speciesCount),
        });
      }
    });

    // Sort: matches first, then by total species
    return result.sort((a, b) => {
      if (a.isMatch && !b.isMatch) return -1;
      if (!a.isMatch && b.isMatch) return 1;
      return b.totalSpecies - a.totalSpecies;
    });
  };

  // Load all contributors data with parallel calls and progress
  const loadAllContributorsData = async () => {
    if (!marchesWithCoords || marchesWithCoords.length === 0) return;

    setLoadingContributors(true);
    setLoadingProgress(null);
    
    try {
      const contributorMap = new Map<string, Map<string, SpeciesItem[]>>();
      const marcheNameMap = new Map<string, string>();

      // Filter marches with coordinates
      const marchesToLoad = marchesWithCoords.filter(m => m.latitude != null && m.longitude != null);
      const totalToLoad = marchesToLoad.length;
      
      // Initialize marche names
      marchesToLoad.forEach(m => marcheNameMap.set(m.id, m.name));

      // Process in parallel batches of 3
      const BATCH_SIZE = 3;
      let loadedCount = 0;

      for (let i = 0; i < marchesToLoad.length; i += BATCH_SIZE) {
        const batch = marchesToLoad.slice(i, i + BATCH_SIZE);
        
        // Update progress with first marche of batch
        setLoadingProgress({
          current: loadedCount + 1,
          total: totalToLoad,
          marcheName: batch.map(m => m.name).join(', ')
        });

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (marche) => {
            // Check cache first
            let marcheData = loadedMarchesData.get(marche.id);
            
            if (!marcheData) {
              try {
                console.log(`🔄 Chargement: ${marche.name}`);
                const { data, error } = await supabase.functions.invoke('biodiversity-data', {
                  body: {
                    latitude: marche.latitude,
                    longitude: marche.longitude,
                    radius: 5, // 5km - radius is in kilometers
                    mode: 'interactive'
                  }
                });

                if (error) {
                  console.error(`❌ Erreur pour ${marche.name}:`, error);
                  return null;
                }

                const { species } = parseSpeciesFromResponse(data);
                marcheData = {
                  id: marche.id,
                  name: marche.name,
                  speciesCount: species.length,
                  species,
                  contributorsCount: 0,
                };
                
                console.log(`✅ ${marche.name}: ${species.length} espèces`);
              } catch (err) {
                console.error(`❌ Exception pour ${marche.name}:`, err);
                return null;
              }
            }

            return { marche, marcheData };
          })
        );

        // Process batch results and update cache
        batchResults.forEach(result => {
          if (!result || !result.marcheData) return;
          
          const { marche, marcheData } = result;
          
          // Update cache
          setLoadedMarchesData(prev => new Map(prev).set(marche.id, marcheData));

          // Build contributor -> marches -> species structure
          marcheData.species.forEach(s => {
            const observers = s.observers || ['Anonyme'];
            observers.forEach(observerName => {
              if (!contributorMap.has(observerName)) {
                contributorMap.set(observerName, new Map());
              }
              
              const marcheSpeciesMap = contributorMap.get(observerName)!;
              if (!marcheSpeciesMap.has(marche.id)) {
                marcheSpeciesMap.set(marche.id, []);
              }
              
              const existingSpecies = marcheSpeciesMap.get(marche.id)!;
              if (!existingSpecies.find(sp => sp.scientificName === s.scientificName)) {
                existingSpecies.push(s);
              }
            });
          });
        });

        loadedCount += batch.length;

        // Update contributors progressively after each batch
        const partialResult = buildContributorsList(contributorMap, marcheNameMap);
        setContributorsData(partialResult);
        
        // Auto-expand matching contributor
        const matchingContributor = partialResult.find(c => c.isMatch);
        if (matchingContributor) {
          setExpandedContributors(prev => new Set([...prev, matchingContributor.name]));
        }
      }

      setLoadingProgress(null);
      toast.success(`${contributorsData.length || buildContributorsList(contributorMap, marcheNameMap).length} contributeurs chargés depuis ${loadedCount} marches`);
    } catch (error: any) {
      console.error('Erreur chargement contributeurs:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoadingContributors(false);
      setLoadingProgress(null);
    }
  };

  // Filter contributors
  const filteredContributors = useMemo(() => {
    if (!contributorsData.length) return [];
    if (!searchTerm.trim()) return contributorsData;
    
    const search = searchTerm.toLowerCase();
    return contributorsData.filter(c => 
      c.name.toLowerCase().includes(search)
    );
  }, [contributorsData, searchTerm]);

  // Check if species is already registered
  const isRegistered = (marcheId: string, scientificName: string) => {
    return existingObservations?.has(`${marcheId}:${scientificName}`) || false;
  };

  // Get available species (not yet registered)
  const availableSpecies = useMemo(() => {
    if (!selectedView) return [];
    return selectedView.species.filter(s => !isRegistered(selectedView.marcheId, s.scientificName));
  }, [selectedView, existingObservations]);

  // Filter marches for "Par marche" mode
  const filteredMarches = useMemo(() => {
    if (!marchesWithCoords) return [];
    if (!marcheSearchTerm.trim()) return marchesWithCoords;
    
    const search = marcheSearchTerm.toLowerCase();
    return marchesWithCoords.filter(m => 
      m.name.toLowerCase().includes(search)
    );
  }, [marchesWithCoords, marcheSearchTerm]);

  // Handle select marche from contributor
  const handleSelectMarche = (contributor: ContributorWithMarches, marche: ContributorMarche) => {
    setSelectedView({
      contributor: contributor.name,
      marcheId: marche.marcheId,
      marcheName: marche.marcheName,
      species: marche.species,
    });
    setSelectedSpecies(new Set());
  };

  // Handle select marche directly (mode "Par marche") - loads via API
  const handleSelectMarcheDirectly = async (marche: MarcheWithCoords) => {
    // Check cache first
    const cached = loadedMarchesData.get(marche.id);
    if (cached) {
      setSelectedView({
        contributor: 'Direct',
        marcheId: cached.id,
        marcheName: cached.name,
        species: cached.species,
      });
      setSelectedSpecies(new Set());
      return;
    }

    // Load from API
    const marcheData = await loadMarcheData(marche);
    if (marcheData) {
      setSelectedView({
        contributor: 'Direct',
        marcheId: marcheData.id,
        marcheName: marcheData.name,
        species: marcheData.species,
      });
      setSelectedSpecies(new Set());
    }
  };

  // Toggle species
  const toggleSpecies = (scientificName: string) => {
    const newSet = new Set(selectedSpecies);
    if (newSet.has(scientificName)) {
      newSet.delete(scientificName);
    } else {
      newSet.add(scientificName);
    }
    setSelectedSpecies(newSet);
  };

  // Select all available
  const selectAll = () => {
    setSelectedSpecies(new Set(availableSpecies.map(s => s.scientificName)));
  };

  // Save observations
  const handleSave = async () => {
    if (!selectedView || selectedSpecies.size === 0) return;

    setSaving(true);
    try {
      const observations = Array.from(selectedSpecies).map(scientificName => ({
        marcheur_id: marcheur.id,
        marche_id: selectedView.marcheId,
        species_scientific_name: scientificName,
        observation_date: new Date().toISOString().split('T')[0],
      }));

      const { error } = await supabase
        .from('marcheur_observations')
        .insert(observations);

      if (error) throw error;

      toast.success(`${selectedSpecies.size} espèce(s) associée(s) à ${marcheur.prenom}`);
      
      // Refresh all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] }),
        queryClient.invalidateQueries({ queryKey: ['marcheur-all-observations', marcheur.id] }),
        queryClient.invalidateQueries({ queryKey: ['marcheur-detailed-observations', marcheur.id] }),
        queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] }),
      ]);
      
      // Notify parent to refresh
      onObservationsSaved?.();

      setSelectedSpecies(new Set());
      setSelectedView(null);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate total observations count
  const totalObservationsCount = detailedObservations?.reduce(
    (sum, group) => sum + group.observations.length, 0
  ) || 0;

  if (marchesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // SPECIES VIEW - Step 2
  if (selectedView) {
    const registeredCount = selectedView.species.length - availableSpecies.length;
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedView(null)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold">{selectedView.marcheName}</h3>
            {selectedView.contributor !== 'Direct' && (
              <p className="text-sm text-muted-foreground">
                Contributeur : {selectedView.contributor}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-sm flex-wrap">
          <Badge variant="secondary">
            {selectedView.species.length} espèce(s) total
          </Badge>
          {registeredCount > 0 && (
            <Badge variant="outline" className="text-emerald-600">
              <Check className="h-3 w-3 mr-1" />
              {registeredCount} déjà associée(s)
            </Badge>
          )}
          <Badge variant="default" className="bg-primary">
            {availableSpecies.length} disponible(s)
          </Badge>
        </div>

        {/* Actions */}
        {availableSpecies.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner ({availableSpecies.length})
            </Button>
            {selectedSpecies.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedSpecies(new Set())}>
                Désélectionner tout
              </Button>
            )}
          </div>
        )}

        {/* Species List */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="divide-y">
            {selectedView.species.map(species => {
              const registered = isRegistered(selectedView.marcheId, species.scientificName);
              const selected = selectedSpecies.has(species.scientificName);
              
              return (
                <label
                  key={species.scientificName}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    registered 
                      ? 'bg-muted/50 opacity-60 cursor-not-allowed' 
                      : selected 
                        ? 'bg-primary/5' 
                        : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={registered || selected}
                    disabled={registered}
                    onCheckedChange={() => !registered && toggleSpecies(species.scientificName)}
                  />
                  <Leaf className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {species.commonName || species.scientificName}
                    </div>
                    {species.commonName && (
                      <div className="text-sm text-muted-foreground italic truncate">
                        {species.scientificName}
                      </div>
                    )}
                    {species.observers && species.observers.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Par : {species.observers.slice(0, 3).join(', ')}
                        {species.observers.length > 3 && ` +${species.observers.length - 3}`}
                      </div>
                    )}
                  </div>
                  {registered && (
                    <Badge variant="outline" className="text-emerald-600 shrink-0">
                      <Check className="h-3 w-3 mr-1" />
                      Associée
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </ScrollArea>

        {/* Save Button */}
        {selectedSpecies.size > 0 && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Associer {selectedSpecies.size} espèce(s) à {marcheur.prenom}
          </Button>
        )}
      </div>
    );
  }

  // SEARCH VIEW - Step 1
  return (
    <div className="space-y-4">
      {/* MY OBSERVATIONS SECTION */}
      {totalObservationsCount > 0 && (
        <div className="border rounded-lg overflow-hidden bg-muted/20">
          {/* Header - collapsible */}
          <button
            onClick={() => setShowMyObservations(!showMyObservations)}
            className="w-full flex items-center gap-3 p-3 bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            {showMyObservations ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <ListTree className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold flex-1 text-left">
              Mes observations
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
              {totalObservationsCount} espèce{totalObservationsCount > 1 ? 's' : ''}
            </Badge>
          </button>

          {/* Content - conditionally shown */}
          {showMyObservations && detailedObservations && detailedObservations.length > 0 && (
            <div className="divide-y border-t max-h-[250px] overflow-y-auto">
              {detailedObservations.map(group => {
                const isExpanded = expandedObsMarches.has(group.marcheId);
                
                return (
                  <div key={group.marcheId}>
                    {/* Marche header */}
                    <div className="flex items-center gap-2 p-2 bg-background/50">
                      <button
                        onClick={() => toggleObsMarche(group.marcheId)}
                        className="flex items-center gap-2 flex-1 hover:bg-muted/30 rounded p-1 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium truncate flex-1 text-left">
                          {group.marcheName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.observations.length}
                        </Badge>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMarcheObservations(group.marcheId, group.observations.length)}
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Species list */}
                    {isExpanded && (
                      <div className="divide-y pl-6 bg-muted/10">
                        {group.observations.map(obs => (
                          <div
                            key={obs.id}
                            className="flex items-center gap-2 p-2 text-sm group/obs"
                          >
                            <Leaf className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="flex-1 truncate">
                              {obs.species_scientific_name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteObservation(obs.id)}
                              disabled={deletingObservation === obs.id}
                              className="h-6 px-1.5 opacity-0 group-hover/obs:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                            >
                              {deletingObservation === obs.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b pb-4">
        <Button 
          variant={mode === 'marche' ? 'default' : 'outline'}
          onClick={() => setMode('marche')}
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Par marche
        </Button>
        <Button 
          variant={mode === 'contributor' ? 'default' : 'outline'}
          onClick={() => setMode('contributor')}
          size="sm"
        >
          <User className="h-4 w-4 mr-2" />
          Par contributeur Open Data
        </Button>
      </div>

      {/* MODE: Par marche */}
      {mode === 'marche' && (
        <>
          {/* Info banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
            <p className="text-primary">
              📡 <strong>Mode temps réel</strong> : Les données sont chargées depuis l'API biodiversité (rayon 5km) 
              avec les mêmes contributeurs que la page publique.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={marcheSearchTerm}
              onChange={(e) => setMarcheSearchTerm(e.target.value)}
              placeholder="Rechercher une marche..."
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>

          {/* Results */}
          {filteredMarches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune marche trouvée</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredMarches.map(marche => {
                  const isLoading = loadingMarcheId === marche.id;
                  const cached = loadedMarchesData.get(marche.id);
                  const hasCoords = marche.latitude != null && marche.longitude != null;
                  
                  return (
                    <button
                      key={marche.id}
                      onClick={() => handleSelectMarcheDirectly(marche)}
                      disabled={isLoading || !hasCoords}
                      className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        isLoading 
                          ? 'bg-muted/50' 
                          : hasCoords
                            ? 'hover:bg-muted/50'
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <MapPin className={`h-5 w-5 shrink-0 ${hasCoords ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="flex-1 text-left font-medium truncate">{marche.name}</span>
                      
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : cached ? (
                        <Badge variant="secondary">{cached.speciesCount} espèces</Badge>
                      ) : hasCoords ? (
                        <Badge variant="outline">Charger</Badge>
                      ) : (
                        <Badge variant="destructive">Pas de coords</Badge>
                      )}
                      
                      {!isLoading && hasCoords && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {/* MODE: Par contributeur Open Data */}
      {mode === 'contributor' && (
        <>
          {/* Load button if no data and not loading */}
          {contributorsData.length === 0 && !loadingContributors && (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Chargez les contributeurs depuis l'API biodiversité<br />
                <span className="text-sm">(Chargement parallélisé ~1 minute)</span>
              </p>
              <Button 
                onClick={loadAllContributorsData}
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Charger tous les contributeurs
              </Button>
            </div>
          )}

          {/* Progress indicator during loading */}
          {loadingContributors && loadingProgress && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-semibold text-lg">
                  Chargement {loadingProgress.current}/{loadingProgress.total}
                </p>
                <p className="text-sm text-muted-foreground truncate max-w-sm mx-auto mt-1">
                  {loadingProgress.marcheName}
                </p>
              </div>
              <Progress 
                value={(loadingProgress.current / loadingProgress.total) * 100} 
                className="max-w-xs mx-auto h-2"
              />
              <p className="text-xs text-muted-foreground">
                {contributorsData.length > 0 && `${contributorsData.length} contributeurs trouvés...`}
              </p>
            </div>
          )}

          {/* Loading spinner without progress (initial state) */}
          {loadingContributors && !loadingProgress && (
            <div className="text-center py-8">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Initialisation...</p>
            </div>
          )}

          {/* Contributors loaded */}
          {contributorsData.length > 0 && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un contributeur Open Data..."
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
              </div>

              {/* Refresh button */}
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={loadAllContributorsData}
                  disabled={loadingContributors}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingContributors ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>

              {/* Results */}
              {filteredContributors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun contributeur trouvé</p>
                  <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
                </div>
              ) : (
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2">
                    {filteredContributors.map(contributor => {
                      const isExpanded = expandedContributors.has(contributor.name);
                      
                      return (
                        <div 
                          key={contributor.name}
                          className={`border rounded-lg overflow-hidden ${
                            contributor.isMatch ? 'border-primary/50 bg-primary/5' : ''
                          }`}
                        >
                          {/* Contributor Header - Clickable */}
                          <button
                            onClick={() => toggleContributor(contributor.name)}
                            className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium flex-1 text-left">{contributor.name}</span>
                            {contributor.isMatch && (
                              <Badge className="bg-primary/20 text-primary gap-1">
                                <Star className="h-3 w-3" />
                                Correspond
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {contributor.totalSpecies} espèce(s)
                            </Badge>
                          </button>

                          {/* Marches list - Conditionally visible */}
                          {isExpanded && (
                            <div className="divide-y border-t">
                              {contributor.marches.map(marche => (
                                <button
                                  key={marche.marcheId}
                                  onClick={() => handleSelectMarche(contributor, marche)}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                                >
                                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 ml-6" />
                                  <span className="flex-1 truncate">{marche.marcheName}</span>
                                  <Badge variant="outline">
                                    {marche.speciesCount} espèce(s)
                                  </Badge>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
