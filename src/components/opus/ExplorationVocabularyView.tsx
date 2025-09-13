import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Users, 
  BookOpen,
  Lightbulb,
  Cog,
  SortAsc,
  SortDesc,
  Calendar,
  Hash
} from 'lucide-react';
import { processVocabularyData } from '@/utils/vocabularyDataUtils';
import { InteractiveVignette } from '@/components/opus/InteractiveVignette';

interface ImportRecord {
  id: string;
  opus_id: string;
  marche_id: string;
  import_date: string;
  contexte_data: any;
  marche_nom?: string;
  marche_ville?: string;
}

interface ProcessedVocabularyWithMeta {
  titre: string;
  description_courte: string;
  type: string;
  details: string;
  category: string;
  metadata: any;
  // Métadonnées d'occurrence
  marchesCount: number;
  marches: string[];
  lastImportDate: string;
  importId: string;
}

interface ExplorationVocabularyViewProps {
  imports: ImportRecord[];
}

export const ExplorationVocabularyView: React.FC<ExplorationVocabularyViewProps> = ({ imports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'date-desc'>('name-asc');

  // Extraire tout le vocabulaire de tous les imports
  const allVocabulary = useMemo(() => {
    const vocabularyMap = new Map<string, ProcessedVocabularyWithMeta>();
    
    imports.forEach(importRecord => {
      const vocabularyData = importRecord.contexte_data?.vocabulaire_local;
      if (!vocabularyData) return;

      // Traiter les différentes catégories du vocabulaire
      const processVocabularyCategory = (items: any[], categoryName: string) => {
        if (!Array.isArray(items)) return;
        
        items.forEach(item => {
          // Si l'item a des metadata avec des sous-éléments
          if (item.metadata && item.metadata[categoryName] && Array.isArray(item.metadata[categoryName])) {
            item.metadata[categoryName].forEach((subItem: any) => {
              const titre = subItem.nom || subItem.terme || subItem.titre || subItem.name || 'Terme sans nom';
              const key = `${titre}_${categoryName}_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
              
              if (vocabularyMap.has(key)) {
                const existing = vocabularyMap.get(key)!;
                existing.marchesCount += 1;
                existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
                if (importRecord.import_date > existing.lastImportDate) {
                  existing.lastImportDate = importRecord.import_date;
                  existing.importId = importRecord.id;
                }
              } else {
                vocabularyMap.set(key, {
                  titre,
                  description_courte: subItem.description || subItem.definition || subItem.explication || '',
                  type: subItem.type || subItem.categorie || categoryName,
                  details: subItem.details || subItem.usage || subItem.application || '',
                  category: categoryName === 'termes_locaux' ? 'Termes locaux' : 
                           categoryName === 'phenomenes' ? 'Phénomènes' : 'Pratiques',
                  metadata: subItem,
                  marchesCount: 1,
                  marches: [importRecord.marche_nom || 'Marché inconnu'],
                  lastImportDate: importRecord.import_date,
                  importId: importRecord.id
                });
              }
            });
          } else {
            // Traiter l'item directement
            const titre = item.nom || item.terme || item.titre || item.name || 'Terme sans nom';
            const description = item.description || item.definition || item.explication || '';
            const details = item.details || item.usage || item.application || '';
            
            // Clé globale pour déduplication basée sur le contenu, pas la marche
            const globalKey = `${titre}_${categoryName}`.toLowerCase().replace(/\s+/g, '_');
            
            if (vocabularyMap.has(globalKey)) {
              const existing = vocabularyMap.get(globalKey)!;
              
              // Vérifier si c'est vraiment le même terme (même description/détails)
              const isSameTerm = existing.description_courte === description && existing.details === details;
              
              if (isSameTerm) {
                // Même terme, incrémenter le compteur de marches
                if (!existing.marches.includes(importRecord.marche_nom || 'Marché inconnu')) {
                  existing.marchesCount += 1;
                  existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
                }
                if (importRecord.import_date > existing.lastImportDate) {
                  existing.lastImportDate = importRecord.import_date;
                  existing.importId = importRecord.id;
                }
              } else {
                // Même titre mais contenu différent, créer une entrée séparée avec identifiant marche
                const marcheSpecificKey = `${titre}_${categoryName}_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
                vocabularyMap.set(marcheSpecificKey, {
                  titre,
                  description_courte: description,
                  type: item.type || item.categorie || categoryName,
                  details,
                  category: categoryName === 'termes_locaux' ? 'Termes locaux' : 
                           categoryName === 'phenomenes' ? 'Phénomènes' : 'Pratiques',
                  metadata: item,
                  marchesCount: 1,
                  marches: [importRecord.marche_nom || 'Marché inconnu'],
                  lastImportDate: importRecord.import_date,
                  importId: importRecord.id
                });
              }
            } else {
              vocabularyMap.set(globalKey, {
                titre,
                description_courte: description,
                type: item.type || item.categorie || categoryName,
                details,
                category: categoryName === 'termes_locaux' ? 'Termes locaux' : 
                         categoryName === 'phenomenes' ? 'Phénomènes' : 'Pratiques',
                metadata: item,
                marchesCount: 1,
                marches: [importRecord.marche_nom || 'Marché inconnu'],
                lastImportDate: importRecord.import_date,
                importId: importRecord.id
              });
            }
          }
        });
      };

      // Traiter chaque catégorie
      if (vocabularyData.termes_locaux) {
        processVocabularyCategory(vocabularyData.termes_locaux, 'termes_locaux');
      }
      if (vocabularyData.phenomenes) {
        processVocabularyCategory(vocabularyData.phenomenes, 'phenomenes');
      }
      if (vocabularyData.pratiques) {
        processVocabularyCategory(vocabularyData.pratiques, 'pratiques');
      }

      // Traiter l'ancien format uniquement s'il n'y a pas de nouveau format
      const hasNewFormat = vocabularyData.termes_locaux || vocabularyData.phenomenes || vocabularyData.pratiques;
      
      if (!hasNewFormat) {
        const processed = processVocabularyData(vocabularyData);
        processed.termes.forEach(term => {
          const titre = term.titre;
          const key = `${titre}_legacy_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
          
          if (!vocabularyMap.has(key)) {
            vocabularyMap.set(key, {
              titre,
              description_courte: term.description_courte,
              type: term.type,
              details: term.details,
              category: term.category === 'termes' ? 'Termes locaux' : term.category,
              metadata: term.metadata,
              marchesCount: 1,
              marches: [importRecord.marche_nom || 'Marché inconnu'],
              lastImportDate: importRecord.import_date,
              importId: importRecord.id
            });
          }
        });
      }
    });

    return Array.from(vocabularyMap.values());
  }, [imports]);

  // Filtrer et trier le vocabulaire
  const filteredAndSortedVocabulary = useMemo(() => {
    let filtered = allVocabulary;

    // Filtre par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vocab => 
        vocab.titre.toLowerCase().includes(term) ||
        vocab.description_courte.toLowerCase().includes(term) ||
        vocab.type.toLowerCase().includes(term) ||
        vocab.details.toLowerCase().includes(term)
      );
    }

    // Filtre par marché
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(vocab => 
        vocab.marches.some(marche => marche === selectedMarche)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vocab => vocab.category === selectedCategory);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.titre.localeCompare(b.titre, 'fr');
        case 'name-desc':
          return b.titre.localeCompare(a.titre, 'fr');
        case 'count-desc':
          return b.marchesCount - a.marchesCount;
        case 'date-desc':
          return new Date(b.lastImportDate).getTime() - new Date(a.lastImportDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allVocabulary, searchTerm, selectedMarche, selectedCategory, sortBy]);

  const uniqueMarches = useMemo(() => {
    const marches = new Set<string>();
    imports.forEach(imp => {
      if (imp.marche_nom) marches.add(imp.marche_nom);
    });
    return Array.from(marches).sort();
  }, [imports]);

  // Statistiques par catégorie
  const categoryStats = useMemo(() => {
    const stats = {
      'Termes locaux': 0,
      'Phénomènes': 0,
      'Pratiques': 0
    };
    allVocabulary.forEach(vocab => {
      if (stats[vocab.category as keyof typeof stats] !== undefined) {
        stats[vocab.category as keyof typeof stats]++;
      }
    });
    return stats;
  }, [allVocabulary]);

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{allVocabulary.length}</div>
                <div className="text-sm text-muted-foreground">Total éléments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Termes locaux']}</div>
                <div className="text-sm text-muted-foreground">Termes locaux</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Phénomènes']}</div>
                <div className="text-sm text-muted-foreground">Phénomènes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cog className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Pratiques']}</div>
                <div className="text-sm text-muted-foreground">Pratiques</div>
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
                placeholder="Rechercher par mot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre marche */}
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

            {/* Filtre catégorie */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Termes locaux">Termes locaux</SelectItem>
                <SelectItem value="Phénomènes">Phénomènes</SelectItem>
                <SelectItem value="Pratiques">Pratiques</SelectItem>
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

      {/* Liste du vocabulaire */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAndSortedVocabulary.map((vocab, index) => (
          <div key={`${vocab.importId}-${index}`} className="space-y-2">
            <InteractiveVignette
              data={{
                titre: vocab.titre,
                description_courte: vocab.description_courte,
                details: vocab.details,
                type: vocab.type !== vocab.category ? vocab.type : undefined,
                category: vocab.category,
                metadata: vocab.metadata
              }}
              variant="vocabulary"
            />
            
            {/* Métadonnées spécifiques au dashboard */}
            <div className="px-4 pb-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {vocab.marchesCount} marche{vocab.marchesCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(vocab.lastImportDate).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {vocab.marches.length > 1 && (
                <div className="text-xs">
                  <span className="font-medium text-foreground">Marches : </span>
                  <span className="text-muted-foreground">
                    {vocab.marches.slice(0, 2).join(', ')}
                    {vocab.marches.length > 2 && ` +${vocab.marches.length - 2} autres`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredAndSortedVocabulary.length === 0 && (
        <Card className="bg-background/50 backdrop-blur-sm border-border/30">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">
              Aucun élément de vocabulaire trouvé
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