import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InteractiveVignette } from './InteractiveVignette';
import { 
  Leaf, 
  Fish, 
  Bird, 
  Bug, 
  Rabbit,
  Database,
  Filter,
  RefreshCw
} from 'lucide-react';

interface SpeciesData {
  [key: string]: any;
}

interface SpeciesVignetteGridProps {
  speciesData: SpeciesData;
  className?: string;
}

export const SpeciesVignetteGrid: React.FC<SpeciesVignetteGridProps> = ({ 
  speciesData, 
  className = '' 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Process and categorize species data
  const processedSpecies = useMemo(() => {
    if (!speciesData) return { flore: [], faune: {} };

    const flore: any[] = [];
    const faune: { [key: string]: any[] } = {
      poissons: [],
      oiseaux: [],
      insectes: [],
      reptiles: [],
      mammiferes: [],
      autres: []
    };

    // Extract species from various data structures
    Object.entries(speciesData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object' && item !== null) {
        const species = {
          titre: item.nom || item.espece || item.titre || key,
          nom_commun: item.nom_commun || item.nom || item.espece || item.titre || key,
          nom_scientifique: item.nom_scientifique || item.nom_latin || item.scientific_name || '',
          statut_conservation: item.statut_conservation || item.statut || item.conservation_status || item.protection || 'Non renseigné',
          description_courte: item.description || item.caracteristiques || '',
          type: item.type || 'Non classé',
          category: key,
          metadata: item
        };

            // Categorization logic based on type or characteristics
            const type = (item.type || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            
            if (type.includes('plante') || type.includes('flore') || key.toLowerCase().includes('flore')) {
              flore.push({ ...species, category: 'Flore' });
            } else if (type.includes('poisson') || description.includes('poisson')) {
              faune.poissons.push({ ...species, category: 'Poissons' });
            } else if (type.includes('oiseau') || description.includes('oiseau') || description.includes('volatile')) {
              faune.oiseaux.push({ ...species, category: 'Oiseaux' });
            } else if (type.includes('insecte') || description.includes('insecte') || description.includes('arthropode')) {
              faune.insectes.push({ ...species, category: 'Insectes' });
            } else if (type.includes('reptile') || description.includes('reptile') || description.includes('serpent')) {
              faune.reptiles.push({ ...species, category: 'Reptiles' });
            } else if (type.includes('mammifère') || description.includes('mammifère') || type.includes('mammifere')) {
              faune.mammiferes.push({ ...species, category: 'Mammifères' });
            } else {
              faune.autres.push({ ...species, category: 'Autres' });
            }
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        const species = {
          titre: value.nom || value.espece || key,
          nom_commun: value.nom_commun || value.nom || value.espece || key,
          nom_scientifique: value.nom_scientifique || value.nom_latin || value.scientific_name || '',
          statut_conservation: value.statut_conservation || value.statut || value.conservation_status || value.protection || 'Non renseigné',
          description_courte: value.description || value.caracteristiques || '',
          type: value.type || 'Non classé',
          category: key,
          metadata: value
        };
        
        flore.push({ ...species, category: 'Flore' });
      }
    });

    return { flore, faune };
  }, [speciesData]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'poissons': return <Fish className="w-4 h-4" />;
      case 'oiseaux': return <Bird className="w-4 h-4" />;
      case 'insectes': return <Bug className="w-4 h-4" />;
      case 'mammiferes': return <Rabbit className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const getTotalCount = () => {
    return processedSpecies.flore.length + 
           Object.values(processedSpecies.faune).reduce((sum, arr) => sum + arr.length, 0);
  };

  if (!speciesData) {
    return (
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardContent className="p-12 text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucune donnée d'espèces</h3>
          <p className="text-muted-foreground">
            Les données d'espèces caractéristiques n'ont pas encore été importées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Description générale et actions */}
      <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="w-5 h-5 text-success" />
              <div>
                <span>Espèces Caractéristiques</span>
                <Badge variant="secondary" className="ml-2">
                  {getTotalCount()} espèces identifiées
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-success/10 border-success/30 hover:bg-success/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchro Open Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette section présente les espèces caractéristiques identifiées lors de l'exploration du marché. 
            Les espèces sont organisées par catégories (Flore/Faune) et sous-catégories pour faciliter la navigation 
            et l'analyse de la biodiversité locale.
          </p>
        </CardContent>
      </Card>

      {/* Navigation par catégories */}
      <Tabs defaultValue="flore" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="flore" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Flore ({processedSpecies.flore.length})
          </TabsTrigger>
          <TabsTrigger value="faune" className="flex items-center gap-2">
            <Fish className="w-4 h-4" />
            Faune ({Object.values(processedSpecies.faune).reduce((sum, arr) => sum + arr.length, 0)})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Flore */}
        <TabsContent value="flore" className="space-y-4">
          {processedSpecies.flore.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {processedSpecies.flore.map((species, index) => (
                <InteractiveVignette
                  key={`flore-${index}`}
                  data={species}
                  variant="species"
                />
              ))}
            </div>
          ) : (
            <Card className="bg-background/30 border-dashed border-border/50">
              <CardContent className="p-8 text-center">
                <Leaf className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune espèce de flore identifiée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Faune */}
        <TabsContent value="faune" className="space-y-6">
          {Object.entries(processedSpecies.faune).map(([category, species]) => {
            if (species.length === 0) return null;
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                  {getCategoryIcon(category)}
                  <h4 className="font-medium text-lg capitalize">{category}</h4>
                  <Badge variant="outline" className="text-xs">
                    {species.length} espèce{species.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {species.map((animal, index) => (
                    <InteractiveVignette
                      key={`${category}-${index}`}
                      data={animal}
                      variant="species"
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {Object.values(processedSpecies.faune).every(arr => arr.length === 0) && (
            <Card className="bg-background/30 border-dashed border-border/50">
              <CardContent className="p-8 text-center">
                <Fish className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune espèce de faune identifiée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};