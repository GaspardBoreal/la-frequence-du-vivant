import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Leaf, 
  Bug, 
  Fish, 
  Bird, 
  Rabbit, 
  TreePine,
  SortAsc,
  SortDesc,
  Calendar,
  Hash
} from 'lucide-react';
import { processSpeciesData } from '@/utils/speciesDataUtils';

interface ImportRecord {
  id: string;
  opus_id: string;
  marche_id: string;
  import_date: string;
  contexte_data: any;
  marche_nom?: string;
  marche_ville?: string;
}

interface ProcessedSpeciesWithMeta {
  titre: string;
  nom_commun: string;
  nom_scientifique: string;
  statut_conservation: string;
  description_courte: string;
  type: string;
  category: string;
  metadata: any;
  // Métadonnées d'occurrence
  marchesCount: number;
  marches: string[];
  lastImportDate: string;
  importId: string;
}

interface ExplorationSpeciesViewProps {
  imports: ImportRecord[];
}

export const ExplorationSpeciesView: React.FC<ExplorationSpeciesViewProps> = ({ imports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'date-desc'>('name-asc');

  // Extraire toutes les espèces de tous les imports
  const allSpecies = useMemo(() => {
    const speciesMap = new Map<string, ProcessedSpeciesWithMeta>();
    
    imports.forEach(importRecord => {
      const processed = processSpeciesData(importRecord.contexte_data?.especes_caracteristiques);
      
      // Traiter la flore
      processed.flore.forEach(species => {
        const key = `${species.nom_commun}_${species.nom_scientifique}`.toLowerCase().replace(/\s+/g, '_');
        
        if (speciesMap.has(key)) {
          const existing = speciesMap.get(key)!;
          existing.marchesCount += 1;
          existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
          if (importRecord.import_date > existing.lastImportDate) {
            existing.lastImportDate = importRecord.import_date;
            existing.importId = importRecord.id;
          }
        } else {
          speciesMap.set(key, {
            ...species,
            marchesCount: 1,
            marches: [importRecord.marche_nom || 'Marché inconnu'],
            lastImportDate: importRecord.import_date,
            importId: importRecord.id
          });
        }
      });

      // Traiter la faune
      Object.entries(processed.faune).forEach(([fauneType, speciesList]) => {
        speciesList.forEach(species => {
          const key = `${species.nom_commun}_${species.nom_scientifique}`.toLowerCase().replace(/\s+/g, '_');
          
          if (speciesMap.has(key)) {
            const existing = speciesMap.get(key)!;
            existing.marchesCount += 1;
            existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
            if (importRecord.import_date > existing.lastImportDate) {
              existing.lastImportDate = importRecord.import_date;
              existing.importId = importRecord.id;
            }
          } else {
            speciesMap.set(key, {
              ...species,
              marchesCount: 1,
              marches: [importRecord.marche_nom || 'Marché inconnu'],
              lastImportDate: importRecord.import_date,
              importId: importRecord.id
            });
          }
        });
      });
    });

    return Array.from(speciesMap.values());
  }, [imports]);

  // Filtrer et trier les espèces
  const filteredAndSortedSpecies = useMemo(() => {
    let filtered = allSpecies;

    // Filtre par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(species => 
        species.nom_commun.toLowerCase().includes(term) ||
        species.nom_scientifique.toLowerCase().includes(term) ||
        species.description_courte.toLowerCase().includes(term) ||
        species.type.toLowerCase().includes(term)
      );
    }

    // Filtre par marché
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(species => 
        species.marches.some(marche => marche === selectedMarche)
      );
    }

    // Filtre par type d'espèces
    if (selectedType !== 'all') {
      filtered = filtered.filter(species => {
        switch (selectedType) {
          case 'flore':
            return species.category === 'Flore';
          case 'faune':
            return ['Poissons', 'Oiseaux', 'Insectes', 'Reptiles', 'Mammifères', 'Autres'].includes(species.category);
          case 'fonge':
            return species.type.toLowerCase().includes('champignon') || species.type.toLowerCase().includes('fonge');
          case 'microbiote':
            return species.type.toLowerCase().includes('micro') || species.type.toLowerCase().includes('bactérie');
          case 'autres':
            return !['Flore', 'Poissons', 'Oiseaux', 'Insectes', 'Reptiles', 'Mammifères'].includes(species.category) &&
                   !species.type.toLowerCase().includes('champignon') &&
                   !species.type.toLowerCase().includes('micro');
          default:
            return true;
        }
      });
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.nom_commun.localeCompare(b.nom_commun);
        case 'name-desc':
          return b.nom_commun.localeCompare(a.nom_commun);
        case 'count-desc':
          return b.marchesCount - a.marchesCount;
        case 'date-desc':
          return new Date(b.lastImportDate).getTime() - new Date(a.lastImportDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allSpecies, searchTerm, selectedMarche, selectedType, sortBy]);

  // Listes pour les selects
  const uniqueMarches = useMemo(() => {
    const marches = new Set<string>();
    imports.forEach(imp => {
      if (imp.marche_nom) marches.add(imp.marche_nom);
    });
    return Array.from(marches).sort();
  }, [imports]);

  const getSpeciesIcon = (category: string) => {
    switch (category) {
      case 'Flore':
        return <Leaf className="w-4 h-4" />;
      case 'Oiseaux':
        return <Bird className="w-4 h-4" />;
      case 'Poissons':
        return <Fish className="w-4 h-4" />;
      case 'Insectes':
        return <Bug className="w-4 h-4" />;
      case 'Mammifères':
        return <Rabbit className="w-4 h-4" />;
      default:
        return <TreePine className="w-4 h-4" />;
    }
  };

  const getConservationColor = (statut: string) => {
    const statutLower = statut.toLowerCase();
    if (statutLower.includes('critique') || statutLower.includes('danger')) return 'destructive';
    if (statutLower.includes('vulnérable') || statutLower.includes('menacé')) return 'outline';
    if (statutLower.includes('protégé') || statutLower.includes('protection')) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">{allSpecies.length}</div>
                <div className="text-sm text-muted-foreground">Espèces uniques</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{filteredAndSortedSpecies.length}</div>
                <div className="text-sm text-muted-foreground">Espèces filtrées</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold">{uniqueMarches.length}</div>
                <div className="text-sm text-muted-foreground">Marchés sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres & Tri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une espèce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre marché */}
            <Select value={selectedMarche} onValueChange={setSelectedMarche}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les marchés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les marchés</SelectItem>
                {uniqueMarches.map(marche => (
                  <SelectItem key={marche} value={marche}>{marche}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre type */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="faune">Faune</SelectItem>
                <SelectItem value="flore">Flore</SelectItem>
                <SelectItem value="fonge">Fonge</SelectItem>
                <SelectItem value="microbiote">Microbiote</SelectItem>
                <SelectItem value="autres">Autres</SelectItem>
              </SelectContent>
            </Select>

            {/* Tri */}
            <Select value={sortBy} onValueChange={setSortBy as (value: string) => void}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    Nom A→Z
                  </div>
                </SelectItem>
                <SelectItem value="name-desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="w-4 h-4" />
                    Nom Z→A
                  </div>
                </SelectItem>
                <SelectItem value="count-desc">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Plus fréquent
                  </div>
                </SelectItem>
                <SelectItem value="date-desc">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Plus récent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des espèces */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAndSortedSpecies.map((species, index) => (
          <Card key={`${species.importId}-${index}`} className="bg-background/50 backdrop-blur-sm border-border/30 hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getSpeciesIcon(species.category)}
                  <div>
                    <CardTitle className="text-lg">{species.nom_commun}</CardTitle>
                    {species.nom_scientifique && (
                      <CardDescription className="italic text-sm">
                        {species.nom_scientifique}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <Badge variant={getConservationColor(species.statut_conservation)} className="text-xs">
                  {species.statut_conservation}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {species.description_courte && (
                <p className="text-sm text-muted-foreground">
                  {species.description_courte}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {species.category}
                </Badge>
                {species.type && species.type !== species.category && (
                  <Badge variant="secondary" className="text-xs">
                    {species.type}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {species.marchesCount} marché{species.marchesCount > 1 ? 's' : ''}
                </span>
                <span>
                  {new Date(species.lastImportDate).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {species.marches.length > 1 && (
                <div className="text-xs">
                  <span className="font-medium">Marchés : </span>
                  <span className="text-muted-foreground">
                    {species.marches.slice(0, 2).join(', ')}
                    {species.marches.length > 2 && ` +${species.marches.length - 2} autres`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredAndSortedSpecies.length === 0 && (
        <Card className="bg-background/50 backdrop-blur-sm border-border/30">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">
              Aucune espèce trouvée
            </h3>
            <p className="text-muted-foreground">
              Modifiez vos critères de recherche pour afficher des résultats
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};