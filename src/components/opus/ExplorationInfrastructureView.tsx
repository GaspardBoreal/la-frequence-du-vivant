import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Building, 
  Factory,
  Navigation,
  Home,
  SortAsc,
  SortDesc,
  Calendar,
  Hash
} from 'lucide-react';
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

interface ProcessedInfrastructureWithMeta {
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

interface ExplorationInfrastructureViewProps {
  imports: ImportRecord[];
}

export const ExplorationInfrastructureView: React.FC<ExplorationInfrastructureViewProps> = ({ imports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'date-desc'>('name-asc');

  // Validation function to check if an infrastructure item is valid
  const isValidInfrastructureItem = (item: any): boolean => {
    const titre = item?.nom || item?.titre || item?.name;
    return titre && 
           typeof titre === 'string' && 
           titre.trim().length > 0 && 
           titre.trim() !== 'Infrastructure sans nom';
  };

  // Extraire toutes les infrastructures de tous les imports
  const allInfrastructures = useMemo(() => {
    const infraMap = new Map<string, ProcessedInfrastructureWithMeta>();
    
    imports.forEach(importRecord => {
      const cd = importRecord.contexte_data;
      const rawInfraData = cd?.empreintes_humaines ?? cd?.human_footprints;
      if (!rawInfraData) return;
      
      // Normalize infrastructure data - handle wrapped data under 'donnees' key
      const infraData = rawInfraData?.donnees ?? rawInfraData;
      
      console.debug(`[${importRecord.marche_nom}] Processing infrastructures:`, {
        usedKey: cd?.empreintes_humaines ? 'empreintes_humaines' : cd?.human_footprints ? 'human_footprints' : 'none',
        hasWrappedData: !!rawInfraData?.donnees,
        patrimoniales: infraData?.patrimoniales?.length || 0,
        industrielles: infraData?.industrielles?.length || 0,
        transport: infraData?.transport?.length || 0,
        urbaines: infraData?.urbaines?.length || 0
      });

      // Traiter les différentes catégories d'infrastructures
      const processInfraCategory = (items: any[], categoryName: string, displayCategory: string) => {
        if (!Array.isArray(items)) return;
        
        items.forEach(item => {
          if (!isValidInfrastructureItem(item)) {
            console.warn(`[${importRecord.marche_nom}] Rejected invalid infrastructure item in ${categoryName}:`, item);
            return;
          }

          const titre = item.nom || item.titre || item.name;
          const key = `${titre}_${categoryName}_${importRecord.marche_id}`.toLowerCase().replace(/\s+/g, '_');
          
          if (infraMap.has(key)) {
            const existing = infraMap.get(key)!;
            existing.marchesCount += 1;
            existing.marches.push(importRecord.marche_nom || 'Marché inconnu');
            if (importRecord.import_date > existing.lastImportDate) {
              existing.lastImportDate = importRecord.import_date;
              existing.importId = importRecord.id;
            }
          } else {
            infraMap.set(key, {
              titre,
              description_courte: item.description || item.explication || '',
              type: item.type || item.categorie || categoryName,
              details: item.details || item.usage || item.impact || '',
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
      if (infraData.patrimoniales) {
        processInfraCategory(infraData.patrimoniales, 'patrimoniales', 'Patrimoines et architectures');
      }
      if (infraData.industrielles) {
        processInfraCategory(infraData.industrielles, 'industrielles', 'Infrastructures industrielles');
      }
      if (infraData.transport) {
        processInfraCategory(infraData.transport, 'transport', 'Infrastructures de transport');
      }
      if (infraData.urbaines) {
        processInfraCategory(infraData.urbaines, 'urbaines', 'Développements urbains');
      }

      // Traiter l'ancien format si nécessaire (fallback)
      const hasNewFormatContent = ['patrimoniales', 'industrielles', 'transport', 'urbaines'].some((key) => {
        const val = (infraData as any)?.[key];
        return Array.isArray(val) && val.length > 0;
      });
      
      if (!hasNewFormatContent && infraData) {
        // Fallback pour traiter d'autres formats possibles
        Object.entries(infraData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            let displayCategory = 'Développements urbains'; // Catégorie par défaut
            
            // Essayer de deviner la catégorie basée sur le nom de la clé
            if (key.toLowerCase().includes('patrimoin') || key.toLowerCase().includes('architect')) {
              displayCategory = 'Patrimoines et architectures';
            } else if (key.toLowerCase().includes('industrie') || key.toLowerCase().includes('usine')) {
              displayCategory = 'Infrastructures industrielles';
            } else if (key.toLowerCase().includes('transport') || key.toLowerCase().includes('route') || key.toLowerCase().includes('rail')) {
              displayCategory = 'Infrastructures de transport';
            }
            
            processInfraCategory(value, key, displayCategory);
          }
        });
      }
    });

    console.debug('Total infrastructures processed:', {
      totalItems: Array.from(infraMap.values()).length,
      byCategory: {
        patrimoines: Array.from(infraMap.values()).filter(v => v.category === 'Patrimoines et architectures').length,
        industrielles: Array.from(infraMap.values()).filter(v => v.category === 'Infrastructures industrielles').length,
        transport: Array.from(infraMap.values()).filter(v => v.category === 'Infrastructures de transport').length,
        urbaines: Array.from(infraMap.values()).filter(v => v.category === 'Développements urbains').length
      }
    });

    return Array.from(infraMap.values());
  }, [imports]);

  // Filtrer et trier les infrastructures
  const filteredAndSortedInfra = useMemo(() => {
    let filtered = allInfrastructures;

    // Filtre par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(infra => 
        infra.titre.toLowerCase().includes(term) ||
        infra.description_courte.toLowerCase().includes(term) ||
        infra.type.toLowerCase().includes(term) ||
        infra.details.toLowerCase().includes(term)
      );
    }

    // Filtre par marché
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(infra => 
        infra.marches.some(marche => marche === selectedMarche)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(infra => infra.category === selectedCategory);
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
  }, [allInfrastructures, searchTerm, selectedMarche, selectedCategory, sortBy]);

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
      'Patrimoines et architectures': 0,
      'Infrastructures industrielles': 0,
      'Infrastructures de transport': 0,
      'Développements urbains': 0
    };
    allInfrastructures.forEach(infra => {
      if (stats[infra.category as keyof typeof stats] !== undefined) {
        stats[infra.category as keyof typeof stats]++;
      }
    });
    return stats;
  }, [allInfrastructures]);

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{allInfrastructures.length}</div>
                <div className="text-sm text-muted-foreground">Total éléments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Patrimoines et architectures']}</div>
                <div className="text-sm text-muted-foreground">Patrimoines et architectures</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Infrastructures industrielles']}</div>
                <div className="text-sm text-muted-foreground">Infrastructures industrielles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-accent" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Infrastructures de transport']}</div>
                <div className="text-sm text-muted-foreground">Infrastructures de transport</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{categoryStats['Développements urbains']}</div>
                <div className="text-sm text-muted-foreground">Développements urbains</div>
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
                <SelectItem value="Patrimoines et architectures">Patrimoines et architectures</SelectItem>
                <SelectItem value="Infrastructures industrielles">Infrastructures industrielles</SelectItem>
                <SelectItem value="Infrastructures de transport">Infrastructures de transport</SelectItem>
                <SelectItem value="Développements urbains">Développements urbains</SelectItem>
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

      {/* Liste des infrastructures */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAndSortedInfra.map((infra, index) => (
          <div key={`${infra.importId}-${index}`} className="space-y-2">
            <InteractiveVignette
              data={{
                titre: infra.titre,
                description_courte: infra.description_courte,
                details: infra.details,
                type: infra.type !== infra.category ? infra.type : undefined,
                category: infra.category,
                metadata: infra.metadata
              }}
              importSources={[]}
              className="h-full"
            />
            
            {/* Metadata d'occurrence */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {infra.marchesCount} marché{infra.marchesCount > 1 ? 's' : ''}
              </Badge>
              <span>•</span>
              <span>Dernière maj: {new Date(infra.lastImportDate).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedInfra.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Aucune infrastructure trouvée
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