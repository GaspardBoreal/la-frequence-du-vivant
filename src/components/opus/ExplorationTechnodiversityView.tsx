import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Cpu, 
  Wrench,
  Leaf,
  Zap,
  SortAsc,
  SortDesc,
  Calendar,
  Hash
} from 'lucide-react';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';
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

interface ProcessedTechnodiversityWithMeta {
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
  marcheId?: string;
  categoryKey?: string;
  indexInArray?: number;
}

interface ExplorationTechnodiversityViewProps {
  imports: ImportRecord[];
  opusId?: string;
  onDeleteItem?: (params: {
    marcheId: string;
    dimension: string;
    categoryKey: string;
    itemIndex: number;
    itemName: string;
  }) => Promise<void>;
  isDeleting?: boolean;
}

export const ExplorationTechnodiversityView: React.FC<ExplorationTechnodiversityViewProps> = ({ 
  imports,
  opusId,
  onDeleteItem,
  isDeleting
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'date-desc'>('name-asc');

  // Validation function to check if a tech item is valid
  const isValidTechItem = (item: any): boolean => {
    const titre = item?.nom || item?.titre || item?.name;
    if (!titre || typeof titre !== 'string' || titre.trim().length === 0 || titre.trim() === 'Élément sans nom') {
      return false;
    }
    
    // Exclure les éléments auto-générés du type "niveau_XXX N" ou similaires
    const trimmedTitle = titre.trim();
    const invalidPatterns = [
      /^niveau_\w+\s+\d+$/i,           // "niveau_disruptif_trl_1_3 1"
      /^niveau_\w+_\w+_\d+_\d+\s+\d+$/i, // "niveau_disruptif_trl_1_3 1"
      /^\w+_\w+_\w+_\d+_\d+\s+\d+$/i,   // Patterns génériques avec underscore + nombre
      /^trl_\d+\s+\d+$/i,              // "trl_3 1"
      /^disruptif_\d+\s+\d+$/i         // "disruptif_3 1" 
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(trimmedTitle));
  };

  // Extraire toute la technodiversité de tous les imports
  const allTechnodiversity = useMemo(() => {
    const techMap = new Map<string, ProcessedTechnodiversityWithMeta>();
    
    imports.forEach(importRecord => {
      const cd = importRecord.contexte_data;
      const rawTechData = cd?.technodiversite ?? cd?.technology;
      if (!rawTechData) return;
      
      // Normalize tech data - handle wrapped data under 'donnees' key
      const techData = rawTechData?.donnees ?? rawTechData;
      
      console.debug(`[${importRecord.marche_nom}] Processing technodiversity:`, {
        usedKey: cd?.technodiversite ? 'technodiversite' : cd?.technology ? 'technology' : 'none',
        hasWrappedData: !!rawTechData?.donnees,
        innovations_locales: techData?.innovations_locales?.length || 0,
        technologies_vertes: techData?.technologies_vertes?.length || 0,
        numerique: techData?.numerique?.length || 0
      });

      // Traiter les différentes catégories de technodiversité
      const processTechCategory = (items: any[], categoryName: string, displayCategory: string) => {
        if (!Array.isArray(items)) return;
        
        items.forEach(item => {
          if (!isValidTechItem(item)) {
            console.warn(`[${importRecord.marche_nom}] Rejected invalid tech item in ${categoryName}:`, item);
            return;
          }

          const titre = item.nom || item.titre || item.name;
          const key = `${titre}_${categoryName}_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
          
          if (techMap.has(key)) {
            const existing = techMap.get(key)!;
            existing.marchesCount += 1;
            existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
            if (importRecord.import_date > existing.lastImportDate) {
              existing.lastImportDate = importRecord.import_date;
              existing.importId = importRecord.id;
            }
          } else {
            techMap.set(key, {
              titre,
              description_courte: item.description || item.explication || '',
              type: item.type || item.categorie || categoryName,
              details: item.details || item.usage || item.application || '',
              category: displayCategory,
              metadata: item,
              marchesCount: 1,
              marches: [importRecord.marche_nom || 'Marché inconnu'],
              lastImportDate: importRecord.import_date,
              importId: importRecord.id
            });
          }
        });
      };

      // Traiter chaque catégorie avec mapping vers les catégories demandées
      if (techData.innovations_locales) {
        processTechCategory(techData.innovations_locales, 'innovations_locales', 'Innovations locales');
      }
      if (techData.technologies_vertes) {
        processTechCategory(techData.technologies_vertes, 'technologies_vertes', 'Technologies vertes');
      }
      if (techData.numerique) {
        processTechCategory(techData.numerique, 'numerique', 'Innovations technologiques');
      }
      if (techData.recherche_developpement) {
        processTechCategory(techData.recherche_developpement, 'recherche_developpement', 'Innovations technologiques');
      }

      // Traiter aussi les catégories alternatives ou anciennes
      if (techData.innovations) {
        processTechCategory(techData.innovations, 'innovations', 'Innovations technologiques');
      }
      if (techData.fabrication_locale) {
        processTechCategory(techData.fabrication_locale, 'fabrication_locale', 'Innovations locales');
      }
      if (techData.projets_open_source || techData.open_source_projects) {
        processTechCategory(techData.projets_open_source || techData.open_source_projects, 'open_source', 'Technologies vertes');
      }

      // Fallback pour l'ancien format si aucune donnée structurée
      const hasNewFormatContent = ['innovations_locales', 'technologies_vertes', 'numerique', 'recherche_developpement'].some((key) => {
        const val = (techData as any)?.[key];
        return Array.isArray(val) && val.length > 0;
      });
      
      if (!hasNewFormatContent) {
        const processed = processTechnodiversiteData(techData);
        processed.innovations.forEach(tech => {
          const titre = tech.titre;
          const key = `${titre}_legacy_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
          
          if (!techMap.has(key)) {
            techMap.set(key, {
              titre,
              description_courte: tech.description_courte,
              type: tech.type,
              details: tech.metadata?.details || '',
              category: 'Innovations technologiques',
              metadata: tech.metadata,
              marchesCount: 1,
              marches: [importRecord.marche_nom || 'Marché inconnu'],
              lastImportDate: importRecord.import_date,
              importId: importRecord.id
            });
          }
        });
      }
    });

    console.debug('Total technodiversity processed:', {
      totalItems: Array.from(techMap.values()).length,
      byCategory: {
        innovationsTechnologiques: Array.from(techMap.values()).filter(v => v.category === 'Innovations technologiques').length,
        innovationsLocales: Array.from(techMap.values()).filter(v => v.category === 'Innovations locales').length,
        technologiesVertes: Array.from(techMap.values()).filter(v => v.category === 'Technologies vertes').length
      }
    });

    return Array.from(techMap.values());
  }, [imports]);

  // Filtrer et trier la technodiversité
  const filteredAndSortedTech = useMemo(() => {
    let filtered = allTechnodiversity;

    // Filtre par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tech => 
        tech.titre.toLowerCase().includes(term) ||
        tech.description_courte.toLowerCase().includes(term) ||
        tech.type.toLowerCase().includes(term) ||
        tech.details.toLowerCase().includes(term)
      );
    }

    // Filtre par marché
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(tech => 
        tech.marches.some(marche => marche === selectedMarche)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tech => tech.category === selectedCategory);
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
  }, [allTechnodiversity, searchTerm, selectedMarche, selectedCategory, sortBy]);

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
      'Innovations technologiques': 0,
      'Innovations locales': 0,
      'Technologies vertes': 0
    };
    allTechnodiversity.forEach(tech => {
      if (stats[tech.category as keyof typeof stats] !== undefined) {
        stats[tech.category as keyof typeof stats]++;
      }
    });
    return stats;
  }, [allTechnodiversity]);

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{allTechnodiversity.length}</div>
                <div className="text-sm text-muted-foreground">Total éléments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Innovations technologiques']}</div>
                <div className="text-sm text-muted-foreground">Innovations technologiques</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Innovations locales']}</div>
                <div className="text-sm text-muted-foreground">Innovations locales</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Technologies vertes']}</div>
                <div className="text-sm text-muted-foreground">Technologies vertes</div>
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
                placeholder="Rechercher par nom..."
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
                <SelectItem value="Innovations technologiques">Innovations technologiques</SelectItem>
                <SelectItem value="Innovations locales">Innovations locales</SelectItem>
                <SelectItem value="Technologies vertes">Technologies vertes</SelectItem>
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

      {/* Liste de la technodiversité */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAndSortedTech.map((tech, index) => (
          <div key={`${tech.importId}-${index}`}>
            <InteractiveVignette
              data={{
                titre: tech.titre,
                description_courte: tech.description_courte,
                details: tech.details,
                type: tech.type !== tech.category ? tech.type : undefined,
                category: tech.category,
                metadata: {
                  ...tech.metadata,
                  // Ajouter les métadonnées d'occurrence
                  marchesCount: tech.marchesCount,
                  marches: tech.marches,
                  lastImportDate: tech.lastImportDate
                }
              }}
              importSources={[]}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {filteredAndSortedTech.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aucun élément de technodiversité trouvé
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou de filtrage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};