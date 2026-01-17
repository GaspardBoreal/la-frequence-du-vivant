import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Leaf, MapPin, Calendar, Zap, List } from 'lucide-react';
import MarcheurObservationPicker from './MarcheurObservationPicker';

interface MarcheurObservationsManagerProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
}

interface Observation {
  id: string;
  species_scientific_name: string;
  marche_id: string;
  observation_date: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  marche?: {
    nom_marche: string | null;
    ville: string;
  };
}

interface AvailableSpecies {
  scientific_name: string;
  common_name_fr: string | null;
}

export default function MarcheurObservationsManager({ 
  marcheur, 
  explorationId 
}: MarcheurObservationsManagerProps) {
  const queryClient = useQueryClient();
  const [addingNew, setAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newObservation, setNewObservation] = useState({
    species_scientific_name: '',
    marche_id: '',
    observation_date: '',
    notes: '',
    photo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch observations for this marcheur
  const { data: observations, isLoading: loadingObs } = useQuery({
    queryKey: ['marcheur-observations', marcheur.id],
    queryFn: async (): Promise<Observation[]> => {
      const { data, error } = await supabase
        .from('marcheur_observations')
        .select(`
          id,
          species_scientific_name,
          marche_id,
          observation_date,
          notes,
          photo_url,
          created_at,
          marches:marche_id (
            nom_marche,
            ville
          )
        `)
        .eq('marcheur_id', marcheur.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(obs => ({
        ...obs,
        marche: obs.marches as Observation['marche']
      }));
    },
  });

  // Fetch available marches for this exploration
  const { data: availableMarches } = useQuery({
    queryKey: ['exploration-marches-for-obs', explorationId],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return (data || []).map(em => em.marches).filter(Boolean) as Array<{
        id: string;
        nom_marche: string | null;
        ville: string;
      }>;
    },
  });

  // Fetch species for autocomplete (from biodiversity snapshots)
  const { data: availableSpecies } = useQuery({
    queryKey: ['available-species-for-obs'],
    queryFn: async (): Promise<AvailableSpecies[]> => {
      // Get species from translations table
      const { data, error } = await supabase
        .from('species_translations')
        .select('scientific_name, common_name_fr')
        .order('scientific_name')
        .limit(500);

      if (error) throw error;
      return data || [];
    },
  });

  // Filter species based on search
  const filteredSpecies = useMemo(() => {
    if (!searchTerm || !availableSpecies) return [];
    const term = searchTerm.toLowerCase();
    return availableSpecies
      .filter(s => 
        s.scientific_name.toLowerCase().includes(term) ||
        (s.common_name_fr && s.common_name_fr.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [searchTerm, availableSpecies]);

  const handleSelectSpecies = (scientificName: string) => {
    setNewObservation(prev => ({ ...prev, species_scientific_name: scientificName }));
    setSearchTerm(scientificName);
  };

  const handleAddObservation = async () => {
    if (!newObservation.species_scientific_name.trim()) {
      toast.error('Le nom scientifique est requis');
      return;
    }
    if (!newObservation.marche_id) {
      toast.error('Sélectionnez une marche');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('marcheur_observations')
        .insert({
          marcheur_id: marcheur.id,
          marche_id: newObservation.marche_id,
          species_scientific_name: newObservation.species_scientific_name.trim(),
          observation_date: newObservation.observation_date || null,
          notes: newObservation.notes.trim() || null,
          photo_url: newObservation.photo_url.trim() || null,
        });

      if (error) throw error;
      
      toast.success('Observation ajoutée');
      queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });
      
      // Reset form
      setNewObservation({
        species_scientific_name: '',
        marche_id: '',
        observation_date: '',
        notes: '',
        photo_url: '',
      });
      setSearchTerm('');
      setAddingNew(false);
    } catch (error: any) {
      console.error('Error adding observation:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteObservation = async (obsId: string) => {
    if (!confirm('Supprimer cette observation ?')) return;
    
    setDeleting(obsId);
    try {
      const { error } = await supabase
        .from('marcheur_observations')
        .delete()
        .eq('id', obsId);

      if (error) throw error;
      
      toast.success('Observation supprimée');
      queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });
    } catch (error: any) {
      console.error('Error deleting observation:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Tabs defaultValue="picker" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="picker" className="gap-2">
          <Zap className="h-4 w-4" />
          Sélection rapide
        </TabsTrigger>
        <TabsTrigger value="manual" className="gap-2">
          <List className="h-4 w-4" />
          Liste détaillée
        </TabsTrigger>
      </TabsList>

      <TabsContent value="picker">
        <MarcheurObservationPicker 
          marcheur={marcheur} 
          explorationId={explorationId}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
          }}
        />
      </TabsContent>

      <TabsContent value="manual">
        <div className="space-y-6 p-4">
          {/* Add New Section */}
          {!addingNew ? (
            <Button onClick={() => setAddingNew(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une observation
            </Button>
          ) : (
            <Card className="border-primary/50">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Espèce (nom scientifique) *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setNewObservation(prev => ({ ...prev, species_scientific_name: e.target.value }));
                      }}
                      placeholder="Rechercher une espèce..."
                      className="pl-10"
                    />
                    {filteredSpecies.length > 0 && searchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredSpecies.map((species) => (
                          <button
                            key={species.scientific_name}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                            onClick={() => handleSelectSpecies(species.scientific_name)}
                          >
                            <span className="italic">{species.scientific_name}</span>
                            {species.common_name_fr && (
                              <span className="text-sm text-muted-foreground">{species.common_name_fr}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marche *</Label>
                    <Select
                      value={newObservation.marche_id}
                      onValueChange={(value) => setNewObservation(prev => ({ ...prev, marche_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une marche" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMarches?.map((marche) => (
                          <SelectItem key={marche.id} value={marche.id}>
                            {marche.nom_marche || marche.ville}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date d'observation</Label>
                    <Input
                      type="date"
                      value={newObservation.observation_date}
                      onChange={(e) => setNewObservation(prev => ({ ...prev, observation_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newObservation.notes}
                    onChange={(e) => setNewObservation(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observations, contexte..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL Photo (optionnel)</Label>
                  <Input
                    value={newObservation.photo_url}
                    onChange={(e) => setNewObservation(prev => ({ ...prev, photo_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddObservation} disabled={saving}>
                    {saving ? 'Ajout...' : 'Ajouter l\'observation'}
                  </Button>
                  <Button variant="outline" onClick={() => setAddingNew(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observations List */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {observations?.length || 0} observation{(observations?.length || 0) > 1 ? 's' : ''}
            </h4>
            
            {loadingObs ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            ) : observations && observations.length > 0 ? (
              <div className="space-y-2">
                {observations.map((obs) => (
                  <Card key={obs.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium italic">{obs.species_scientific_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {obs.marche && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {obs.marche.nom_marche || obs.marche.ville}
                              </span>
                            )}
                            {obs.observation_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(obs.observation_date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                          {obs.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{obs.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteObservation(obs.id)}
                          disabled={deleting === obs.id}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune observation enregistrée</p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
