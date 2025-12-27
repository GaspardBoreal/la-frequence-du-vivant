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
import { InteractiveVignette } from './InteractiveVignette';

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
  marchesCount: number;
  marches: string[];
  lastImportDate: string;
  importId: string;
  marcheId: string;
  categoryKey: string;
  indexInArray: number;
}

interface ExplorationSpeciesViewProps {
  imports: ImportRecord[];
  opusId?: string;
  onDeleteItem?: (params: {
    marcheId: string;
    dimension: string;
    categoryKey: string;
    itemIndex: number;
    itemName: string;
  }) => Promise<boolean>;
  isDeleting?: boolean;
}

export const ExplorationSpeciesView: React.FC<ExplorationSpeciesViewProps> = ({ 
  imports, 
  opusId, 
  onDeleteItem, 
  isDeleting 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'date-desc'>('name-asc');

  // Mapping des clés JSONB vers catégories d'affichage (même logique que speciesDataUtils)
  const mapKeyToCategory = (key: string): string => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('poisson')) return 'Poissons';
    if (keyLower.includes('oiseau')) return 'Oiseaux';
    if (keyLower.includes('vegetation') || keyLower.includes('plante') || keyLower.includes('flore') || keyLower.includes('vegetale')) return 'Flore';
    if (keyLower.includes('invertebr') || keyLower.includes('crustac') || keyLower.includes('mollusque')) return 'Invertébrés';
    if (keyLower.includes('insecte') || keyLower.includes('arthropode')) return 'Insectes';
    if (keyLower.includes('reptile') || keyLower.includes('serpent')) return 'Reptiles';
    if (keyLower.includes('mammifère') || keyLower.includes('mammifere') || keyLower.includes('indicatrice')) return 'Mammifères';
    if (keyLower.includes('animale')) return 'Oiseaux';
    if (keyLower.includes('aquatique')) return 'Poissons';
    
    return 'Autres';
  };

  // Clés à ignorer (métadonnées, pas des espèces)
  const ignoredKeys = ['sources', 'description', 'resume', 'date_observation', 'contexte', 'methodologie', 'notes'];

  // Extraire TOUTES les espèces dynamiquement (comme speciesDataUtils)
  const allSpecies = useMemo(() => {
    const speciesList: ProcessedSpeciesWithMeta[] = [];

    imports.forEach((importRecord) => {
      const raw = importRecord.contexte_data?.especes_caracteristiques;
      const dataToProcess = raw?.donnees && typeof raw.donnees === 'object' ? raw.donnees : raw;

      if (!dataToProcess || typeof dataToProcess !== 'object') return;

      const pushSpecies = (
        item: any,
        categoryKey: string,
        indexInArray: number,
        category: string
      ) => {
        const nom_commun =
          item?.nom_vernaculaire || item?.nom_commun || item?.nom || item?.espece || item?.titre || item?.terme || '';
        const nom_scientifique = item?.nom_scientifique || item?.nom_latin || item?.scientific_name || '';
        const statut_conservation =
          item?.statut_conservation ||
          item?.statut ||
          item?.conservation_status ||
          item?.protection ||
          'Non renseigné';
        const description_courte =
          item?.description_courte || item?.description || item?.details || item?.role_ecologique || item?.caracteristiques || '';

        // Vérifier que c'est bien une espèce (a un nom)
        if (!nom_commun && !nom_scientifique) return;

        speciesList.push({
          titre: nom_commun || nom_scientifique || 'Espèce',
          nom_commun: nom_commun || 'Espèce',
          nom_scientifique,
          statut_conservation,
          description_courte,
          type: category,
          category,
          metadata: item,
          marchesCount: 1,
          marches: [importRecord.marche_nom || 'Marché inconnu'],
          lastImportDate: importRecord.import_date,
          importId: importRecord.id,
          marcheId: importRecord.marche_id,
          categoryKey,
          indexInArray,
        });
      };

      // Parcourir TOUTES les clés dynamiquement
      Object.entries(dataToProcess).forEach(([key, value]) => {
        // Ignorer les clés de métadonnées
        if (ignoredKeys.includes(key.toLowerCase())) return;
        
        const category = mapKeyToCategory(key);

        if (Array.isArray(value)) {
          // Tableau d'espèces
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              pushSpecies(item, key, index, category);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          // Objet unique (ex: espece_indicatrice)
          pushSpecies(value, key, 0, category);
        }
      });
    });

    return speciesList;
  }, [imports]);

  // Filtrer et trier les espèces
  const filteredAndSortedSpecies = useMemo(() => {
    let filtered = allSpecies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(species => 
        species.nom_commun.toLowerCase().includes(term) ||
        species.nom_scientifique.toLowerCase().includes(term) ||
        species.description_courte.toLowerCase().includes(term) ||
        species.type.toLowerCase().includes(term)
      );
    }

    if (selectedMarche !== 'all') {
      filtered = filtered.filter(species => 
        species.marches.some(marche => marche === selectedMarche)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(species => {
        switch (selectedType) {
          case 'flore':
            return species.category === 'Flore';
          case 'faune':
            return ['Poissons', 'Oiseaux', 'Insectes', 'Reptiles', 'Mammifères', 'Invertébrés', 'Autres'].includes(species.category);
          case 'fonge':
            return species.type.toLowerCase().includes('champignon') || species.type.toLowerCase().includes('fonge');
          case 'microbiote':
            return species.type.toLowerCase().includes('micro') || species.type.toLowerCase().includes('bactérie');
          case 'autres':
            return !['Flore', 'Poissons', 'Oiseaux', 'Insectes', 'Reptiles', 'Mammifères', 'Invertébrés'].includes(species.category) &&
                   !species.type.toLowerCase().includes('champignon') &&
                   !species.type.toLowerCase().includes('micro');
          default:
            return true;
        }
      });
    }

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

  const uniqueMarches = useMemo(() => {
    const marches = new Set<string>();
    imports.forEach(imp => {
      if (imp.marche_nom) marches.add(imp.marche_nom);
    });
    return Array.from(marches).sort();
  }, [imports]);

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
                <div className="text-sm text-muted-foreground">Marches sources</div>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une espèce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedMarche} onValueChange={setSelectedMarche}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les marches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marches</SelectItem>
                {uniqueMarches.map(marche => (
                  <SelectItem key={marche} value={marche}>{marche}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedSpecies.map((species) => {
          const vignetteData = {
            titre: species.nom_commun,
            nom_commun: species.nom_commun,
            nom_scientifique: species.nom_scientifique,
            statut_conservation: species.statut_conservation,
            description_courte: species.description_courte,
            type: species.category,
            category: species.category,
            metadata: {
              marchesCount: species.marchesCount,
              marches: species.marches,
              lastImportDate: species.lastImportDate,
              importId: species.importId
            }
          };

          return (
            <InteractiveVignette
              key={`${species.importId}-${species.categoryKey}-${species.indexInArray}`}
              data={vignetteData}
              variant="species"
              canDelete={!!onDeleteItem}
              isDeleting={isDeleting}
              onDelete={onDeleteItem ? async () => {
                return await onDeleteItem({
                  marcheId: species.marcheId,
                  dimension: 'especes_caracteristiques',
                  categoryKey: species.categoryKey,
                  itemIndex: species.indexInArray,
                  itemName: species.nom_commun
                });
              } : undefined}
            />
          );
        })}
      </div>

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
