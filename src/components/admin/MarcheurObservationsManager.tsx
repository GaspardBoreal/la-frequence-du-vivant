import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Search, 
  ArrowLeft,
  ChevronRight,
  Loader2,
  User,
  Leaf,
  Check,
  Star,
  MapPin
} from 'lucide-react';

interface MarcheurObservationsManagerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
}

interface Attribution {
  observerName: string;
}

interface SpeciesItem {
  scientificName: string;
  commonName: string | null;
  kingdom: string;
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

export default function MarcheurObservationsManager({ 
  marcheur, 
  explorationId 
}: MarcheurObservationsManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState<{
    contributor: string;
    marcheId: string;
    marcheName: string;
    species: SpeciesItem[];
  } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const marcheurFullName = `${marcheur.prenom} ${marcheur.nom}`.trim();

  // Fetch all marches with species and attributions
  const { data: contributorsData, isLoading } = useQuery({
    queryKey: ['contributors-with-marches', explorationId],
    queryFn: async (): Promise<ContributorWithMarches[]> => {
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

      const marcheMap = new Map<string, { id: string; name: string }>();
      (explorationMarches || []).forEach(em => {
        const m = em.marches as any;
        if (m) {
          marcheMap.set(m.id, { id: m.id, name: m.nom_marche || m.ville });
        }
      });

      const marcheIds = Array.from(marcheMap.keys());
      if (marcheIds.length === 0) return [];

      // Get biodiversity snapshots
      const { data: snapshots, error: snapError } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, species_data')
        .in('marche_id', marcheIds)
        .not('species_data', 'is', null);

      if (snapError) throw snapError;

      // Build contributor -> marches -> species structure
      const contributorMap = new Map<string, Map<string, SpeciesItem[]>>();

      (snapshots || []).forEach(snapshot => {
        const marcheId = snapshot.marche_id;
        const speciesData = snapshot.species_data as any[];
        
        if (!speciesData || !Array.isArray(speciesData)) return;

        speciesData.forEach((s: any) => {
          const scientificName = s.scientificName || s.nom_scientifique;
          if (!scientificName) return;

          const species: SpeciesItem = {
            scientificName,
            commonName: s.commonName || s.nom_commun || null,
            kingdom: s.kingdom || 'Unknown',
          };

          const attributions = s.attributions as Attribution[] || [];
          attributions.forEach(attr => {
            const observerName = attr.observerName || 'Anonyme';
            
            if (!contributorMap.has(observerName)) {
              contributorMap.set(observerName, new Map());
            }
            
            const marcheSpeciesMap = contributorMap.get(observerName)!;
            if (!marcheSpeciesMap.has(marcheId)) {
              marcheSpeciesMap.set(marcheId, []);
            }
            
            // Add species if not already present
            const existingSpecies = marcheSpeciesMap.get(marcheId)!;
            if (!existingSpecies.find(sp => sp.scientificName === scientificName)) {
              existingSpecies.push(species);
            }
          });
        });
      });

      // Convert to array structure
      const result: ContributorWithMarches[] = [];
      
      contributorMap.forEach((marchesMap, contributorName) => {
        const marches: ContributorMarche[] = [];
        let totalSpecies = 0;
        
        marchesMap.forEach((species, marcheId) => {
          const marcheInfo = marcheMap.get(marcheId);
          if (marcheInfo) {
            marches.push({
              marcheId,
              marcheName: marcheInfo.name,
              speciesCount: species.length,
              species,
            });
            totalSpecies += species.length;
          }
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
    },
  });

  // Fetch existing observations
  const { data: existingObservations } = useQuery({
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

  // Filter contributors
  const filteredContributors = useMemo(() => {
    if (!contributorsData) return [];
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
      
      queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['marcheur-all-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });

      setSelectedSpecies(new Set());
      setSelectedView(null);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
            <p className="text-sm text-muted-foreground">
              Contributeur : {selectedView.contributor}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-sm">
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

      {/* Results */}
      {filteredContributors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun contributeur trouvé</p>
          <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
        </div>
      ) : (
        <ScrollArea className="h-[450px]">
          <div className="space-y-2">
            {filteredContributors.map(contributor => (
              <div 
                key={contributor.name}
                className={`border rounded-lg overflow-hidden ${
                  contributor.isMatch ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                {/* Contributor Header */}
                <div className="flex items-center gap-3 p-3 bg-muted/30">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium flex-1">{contributor.name}</span>
                  {contributor.isMatch && (
                    <Badge className="bg-primary/20 text-primary gap-1">
                      <Star className="h-3 w-3" />
                      Correspond au marcheur
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {contributor.totalSpecies} espèce(s)
                  </Badge>
                </div>

                {/* Marches list */}
                <div className="divide-y">
                  {contributor.marches.map(marche => (
                    <button
                      key={marche.marcheId}
                      onClick={() => handleSelectMarche(contributor, marche)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
                      <span className="flex-1 truncate">{marche.marcheName}</span>
                      <Badge variant="outline">
                        {marche.speciesCount} espèce(s)
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}