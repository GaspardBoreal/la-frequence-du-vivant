import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Search, Check, AlertTriangle, Loader2, FileText, Sparkles } from 'lucide-react';

interface MarcheurObservationsImportProps {
  marcheur: ExplorationMarcheur;
  explorationId: string;
  onComplete?: () => void;
}

interface SpeciesMatch {
  searchTerm: string;
  scientificName: string | null;
  commonName: string | null;
  found: boolean;
  alreadyRegistered: boolean;
}

interface SpeciesFromSnapshot {
  scientificName: string;
  commonName: string | null;
}

export default function MarcheurObservationsImport({
  marcheur,
  explorationId,
  onComplete,
}: MarcheurObservationsImportProps) {
  const queryClient = useQueryClient();
  const [selectedMarcheId, setSelectedMarcheId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [matchResults, setMatchResults] = useState<SpeciesMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch available marches for this exploration
  const { data: availableMarches } = useQuery({
    queryKey: ['exploration-marches-for-import', explorationId],
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

  // Fetch biodiversity snapshots for selected marche
  const { data: speciesFromSnapshot } = useQuery({
    queryKey: ['biodiversity-species-for-import', selectedMarcheId],
    queryFn: async (): Promise<SpeciesFromSnapshot[]> => {
      if (!selectedMarcheId) return [];

      const { data, error } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .eq('marche_id', selectedMarcheId)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const speciesData = data[0].species_data as any;
      if (!speciesData?.species || !Array.isArray(speciesData.species)) return [];

      return speciesData.species.map((s: any) => ({
        scientificName: s.scientificName || s.scientific_name || '',
        commonName: s.commonName || s.common_name || s.vernacularName || null,
      })).filter((s: SpeciesFromSnapshot) => s.scientificName);
    },
    enabled: !!selectedMarcheId,
  });

  // Fetch existing observations for this marcheur
  const { data: existingObservations } = useQuery({
    queryKey: ['existing-obs-for-import', marcheur.id, selectedMarcheId],
    queryFn: async () => {
      if (!selectedMarcheId) return new Set<string>();

      const { data, error } = await supabase
        .from('marcheur_observations')
        .select('species_scientific_name')
        .eq('marcheur_id', marcheur.id)
        .eq('marche_id', selectedMarcheId);

      if (error) throw error;
      return new Set((data || []).map(o => o.species_scientific_name.toLowerCase()));
    },
    enabled: !!selectedMarcheId,
  });

  const handleSearch = () => {
    if (!inputText.trim()) {
      toast.error('Collez une liste d\'espèces à rechercher');
      return;
    }
    if (!selectedMarcheId) {
      toast.error('Sélectionnez une marche');
      return;
    }
    if (!speciesFromSnapshot || speciesFromSnapshot.length === 0) {
      toast.error('Aucune donnée Open Data pour cette marche');
      return;
    }

    setSearching(true);

    const lines = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const results: SpeciesMatch[] = lines.map(searchTerm => {
      const termLower = searchTerm.toLowerCase();
      
      // Search in species from snapshot
      const found = speciesFromSnapshot.find(s => 
        s.scientificName.toLowerCase().includes(termLower) ||
        s.scientificName.toLowerCase() === termLower ||
        (s.commonName && s.commonName.toLowerCase().includes(termLower)) ||
        (s.commonName && s.commonName.toLowerCase() === termLower)
      );

      if (found) {
        const alreadyRegistered = existingObservations?.has(found.scientificName.toLowerCase()) || false;
        return {
          searchTerm,
          scientificName: found.scientificName,
          commonName: found.commonName,
          found: true,
          alreadyRegistered,
        };
      }

      return {
        searchTerm,
        scientificName: null,
        commonName: null,
        found: false,
        alreadyRegistered: false,
      };
    });

    setMatchResults(results);
    setSearching(false);
  };

  const speciesToSave = useMemo(() => {
    return matchResults.filter(r => r.found && !r.alreadyRegistered && r.scientificName);
  }, [matchResults]);

  const handleSave = async () => {
    if (speciesToSave.length === 0) {
      toast.error('Aucune nouvelle espèce à enregistrer');
      return;
    }

    setSaving(true);
    try {
      const insertData = speciesToSave.map(species => ({
        marcheur_id: marcheur.id,
        marche_id: selectedMarcheId,
        species_scientific_name: species.scientificName!,
        observation_date: new Date().toISOString().split('T')[0],
      }));

      const { error } = await supabase
        .from('marcheur_observations')
        .insert(insertData);

      if (error) throw error;

      toast.success(`${speciesToSave.length} observation(s) enregistrée(s)`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['marcheur-observations', marcheur.id] });
      queryClient.invalidateQueries({ queryKey: ['existing-obs-for-import', marcheur.id, selectedMarcheId] });
      queryClient.invalidateQueries({ queryKey: ['exploration-marcheurs', explorationId] });

      // Reset
      setInputText('');
      setMatchResults([]);
      onComplete?.();
    } catch (error: any) {
      console.error('Error saving observations:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const foundCount = matchResults.filter(r => r.found).length;
  const notFoundCount = matchResults.filter(r => !r.found).length;
  const alreadyRegisteredCount = matchResults.filter(r => r.alreadyRegistered).length;

  return (
    <div className="space-y-6 p-4">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Importer une liste d'espèces pour {marcheur.prenom} {marcheur.nom}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Collez une liste d'espèces (une par ligne) observées par {marcheur.prenom}. 
            Le système recherchera les correspondances dans les données Open Data de la marche sélectionnée.
          </p>
        </CardContent>
      </Card>

      {/* Step 1: Select marche */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full">1</Badge>
          Sélectionner la marche
        </Label>
        <Select value={selectedMarcheId} onValueChange={setSelectedMarcheId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une marche..." />
          </SelectTrigger>
          <SelectContent>
            {availableMarches?.map((marche) => (
              <SelectItem key={marche.id} value={marche.id}>
                {marche.nom_marche || marche.ville}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedMarcheId && speciesFromSnapshot && (
          <p className="text-sm text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-1 text-amber-500" />
            {speciesFromSnapshot.length} espèces disponibles dans Open Data
          </p>
        )}
      </div>

      {/* Step 2: Paste species list */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full">2</Badge>
          Coller la liste d'espèces (une par ligne)
        </Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Martin-pêcheur d'Europe
Héron cendré
Calopteryx splendens
Cygne tuberculé
...`}
          rows={8}
          className="font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch} 
            disabled={searching || !selectedMarcheId || !inputText.trim()}
            className="gap-2"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Rechercher correspondances
          </Button>
          {inputText && (
            <Button 
              variant="ghost" 
              onClick={() => { setInputText(''); setMatchResults([]); }}
            >
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Step 3: Results */}
      {matchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full">3</Badge>
              Résultats
            </Label>
            <div className="flex gap-2 ml-auto">
              <Badge variant="default" className="bg-emerald-500">
                <Check className="h-3 w-3 mr-1" />
                {foundCount} trouvé(s)
              </Badge>
              {alreadyRegisteredCount > 0 && (
                <Badge variant="secondary">
                  {alreadyRegisteredCount} déjà enregistré(s)
                </Badge>
              )}
              {notFoundCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {notFoundCount} non trouvé(s)
                </Badge>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {matchResults.map((result, idx) => (
              <div 
                key={idx} 
                className={`p-3 flex items-center gap-3 text-sm ${
                  result.found 
                    ? result.alreadyRegistered 
                      ? 'bg-muted/50' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20'
                    : 'bg-red-50 dark:bg-red-950/20'
                }`}
              >
                {result.found ? (
                  result.alreadyRegistered ? (
                    <Badge variant="secondary" className="shrink-0">Déjà</Badge>
                  ) : (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  )
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{result.searchTerm}</span>
                  {result.found && result.scientificName && (
                    <span className="text-muted-foreground ml-2">
                      → <span className="italic">{result.scientificName}</span>
                      {result.commonName && ` (${result.commonName})`}
                    </span>
                  )}
                  {!result.found && (
                    <span className="text-red-600 dark:text-red-400 ml-2">
                      → Non trouvé dans Open Data
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {speciesToSave.length > 0 && (
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full gap-2"
              size="lg"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Enregistrer {speciesToSave.length} observation(s)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
