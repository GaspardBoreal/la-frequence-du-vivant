import React, { useState } from 'react';
import { X, FileText, Brain, MapPin, Leaf, Users, Zap, Factory, ChevronRight, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpusContextes, useOpusExplorations } from '@/hooks/useOpus';
import { useExplorations } from '@/hooks/useExplorations';
import { OpusDimensionEditor } from './OpusDimensionEditor';

interface PrefigurerInterfaceProps {
  opusSlug: string;
  onClose: () => void;
}

const DIMENSION_CONFIG = [
  { key: 'contexte_hydrologique', label: 'Contexte Hydrologique', icon: MapPin, color: 'text-blue-600' },
  { key: 'especes_caracteristiques', label: 'Espèces Caractéristiques', icon: Leaf, color: 'text-green-600' },
  { key: 'vocabulaire_local', label: 'Vocabulaire Local', icon: FileText, color: 'text-purple-600' },
  { key: 'empreintes_humaines', label: 'Empreintes Humaines', icon: Users, color: 'text-orange-600' },
  { key: 'projection_2035_2045', label: 'Projection 2035-2045', icon: Brain, color: 'text-pink-600' },
  { key: 'leviers_agroecologiques', label: 'Leviers Agroécologiques', icon: Leaf, color: 'text-emerald-600' },
  { key: 'nouvelles_activites', label: 'Nouvelles Activités', icon: Zap, color: 'text-yellow-600' },
  { key: 'technodiversite', label: 'Technodiversité', icon: Factory, color: 'text-indigo-600' },
];

export const PrefigurerInterface: React.FC<PrefigurerInterfaceProps> = ({
  opusSlug,
  onClose
}) => {
  // Try to get OPUS exploration first, then fallback to regular exploration
  const { data: opusExplorations } = useOpusExplorations();
  const { data: explorations } = useExplorations();
  
  const opusExploration = opusExplorations?.find(exp => exp.slug === opusSlug);
  const exploration = explorations?.find(exp => exp.slug === opusSlug);
  
  // Use OPUS exploration ID if available, otherwise fallback to exploration ID
  const targetId = opusExploration?.id || exploration?.id || '';
  
  const { data: opusContextes = [], isLoading, error } = useOpusContextes(targetId);
  
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  const getDimensionStatus = (contexte: any, dimensionKey: string) => {
    const value = contexte[dimensionKey];
    if (!value) return 'empty';
    if (typeof value === 'object' && Object.keys(value).length === 0) return 'empty';
    if (typeof value === 'string' && value.trim().length === 0) return 'empty';
    return 'complete';
  };

  const selectedContexte = opusContextes.find(c => c.marche_id === selectedMarche);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar à gauche */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header du sidebar */}
        <div className="p-4 border-b bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold">Préfigurer</h1>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground truncate">{opusSlug}</p>
        </div>

        {/* Contenu du sidebar */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-2">Erreur de chargement</p>
                <Button size="sm" onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            ) : opusContextes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">
                  Aucun contexte OPUS trouvé
                </p>
                <p className="text-xs text-muted-foreground">
                  Importez des données depuis l'interface d'animation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium">Contextes Hybrides Disponibles</h2>
                  <Badge variant="secondary">{opusContextes.length} marche{opusContextes.length > 1 ? 's' : ''}</Badge>
                </div>
                
                {opusContextes.map((contexte) => {
                  const completedDimensions = DIMENSION_CONFIG.filter(dim => 
                    getDimensionStatus(contexte, dim.key) === 'complete'
                  ).length;
                  const completionRate = Math.round((completedDimensions / DIMENSION_CONFIG.length) * 100);
                  
                  return (
                    <Card 
                      key={contexte.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMarche === contexte.marche_id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedMarche(contexte.marche_id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm leading-tight">
                            {contexte.marches?.nom_marche || 'Marche inconnue'}
                          </CardTitle>
                          <Badge variant={completionRate > 80 ? 'default' : completionRate > 40 ? 'secondary' : 'outline'}>
                            {completionRate}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contexte.marches?.ville}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-4 gap-1">
                          {DIMENSION_CONFIG.map(dimension => {
                            const status = getDimensionStatus(contexte, dimension.key);
                            const Icon = dimension.icon;
                            
                            return (
                              <div
                                key={dimension.key}
                                className={`p-1 rounded text-center ${
                                  status === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                                }`}
                                title={dimension.label}
                              >
                                <Icon className={`h-3 w-3 mx-auto ${
                                  status === 'complete' ? 'text-green-600' : 'text-gray-400'
                                }`} />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Panneau principal à droite */}
      <div className="flex-1 flex flex-col">
        {selectedMarche && selectedContexte ? (
          <>
            {/* Header du panneau principal */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedContexte.marches?.nom_marche}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedContexte.marches?.ville}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMarche(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>

            {/* Navigation des dimensions */}
            <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
              <div className="flex flex-wrap gap-2">
                {DIMENSION_CONFIG.map(dimension => {
                  const status = getDimensionStatus(selectedContexte, dimension.key);
                  const Icon = dimension.icon;
                  const isSelected = selectedDimension === dimension.key;
                  
                  return (
                    <Button
                      key={dimension.key}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto px-3 py-2 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : status === 'complete' 
                            ? 'border-green-500 bg-green-50 hover:bg-green-100 text-green-800 shadow-sm' 
                            : 'bg-background/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground text-foreground'
                      }`}
                      onClick={() => setSelectedDimension(dimension.key)}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${
                        isSelected 
                          ? 'text-primary-foreground' 
                          : status === 'complete' 
                            ? 'text-green-600' 
                            : 'text-muted-foreground'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isSelected 
                          ? 'text-primary-foreground' 
                          : status === 'complete' 
                            ? 'text-green-800' 
                            : 'text-foreground'
                      }`}>
                        {dimension.label}
                      </span>
                      {status === 'complete' && !isSelected && (
                        <div className="ml-2 w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Contenu de l'éditeur */}
            <div className="flex-1 overflow-hidden">
              {selectedDimension ? (
                <OpusDimensionEditor
                  marcheId={selectedMarche}
                  marcheName={selectedContexte.marches?.nom_marche || 'Marche inconnue'}
                  dimensionKey={selectedDimension}
                  onClose={() => setSelectedDimension(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sélectionnez une dimension</h3>
                    <p className="text-sm text-muted-foreground">
                      Choisissez une dimension à éditer parmi celles disponibles ci-dessus
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ChevronRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sélectionnez un marché</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez un marché dans la liste de gauche pour commencer l'édition
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};