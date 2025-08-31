import React, { useState } from 'react';
import { X, FileText, Brain, MapPin, Leaf, Users, Zap, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { useOpusContextes } from '@/hooks/useOpus';
import { useExplorations } from '@/hooks/useExplorations';
import { useIsMobile } from '@/hooks/use-mobile';
import { OpusDimensionEditor } from './OpusDimensionEditor';

interface PrefigurerInterfaceProps {
  opusSlug: string;
  onClose: () => void;
}

const DIMENSION_CONFIG = [
  { key: 'contexte_hydrologique', label: 'Contexte Hydrologique', icon: MapPin, color: 'bg-blue-500' },
  { key: 'especes_caracteristiques', label: 'Espèces Caractéristiques', icon: Leaf, color: 'bg-green-500' },
  { key: 'vocabulaire_local', label: 'Vocabulaire Local', icon: FileText, color: 'bg-purple-500' },
  { key: 'empreintes_humaines', label: 'Empreintes Humaines', icon: Users, color: 'bg-orange-500' },
  { key: 'projection_2035_2045', label: 'Projection 2035-2045', icon: Brain, color: 'bg-pink-500' },
  { key: 'leviers_agroecologiques', label: 'Leviers Agroécologiques', icon: Leaf, color: 'bg-emerald-500' },
  { key: 'nouvelles_activites', label: 'Nouvelles Activités', icon: Zap, color: 'bg-yellow-500' },
  { key: 'technodiversite', label: 'Technodiversité', icon: Factory, color: 'bg-indigo-500' },
];

export const PrefigurerInterface: React.FC<PrefigurerInterfaceProps> = ({
  opusSlug,
  onClose
}) => {
  const { data: explorations } = useExplorations();
  const exploration = explorations?.find(exp => exp.slug === opusSlug);
  const { data: opusContextes = [], isLoading } = useOpusContextes(exploration?.id || '');
  const isMobile = useIsMobile();
  
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleViewMarche = (marcheId: string, dimension?: string) => {
    setSelectedMarche(marcheId);
    setSelectedDimension(dimension || null);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedMarche(null);
    setSelectedDimension(null);
  };

  const getDimensionStatus = (contexte: any, dimensionKey: string) => {
    const value = contexte[dimensionKey];
    if (!value) return 'empty';
    if (typeof value === 'object' && Object.keys(value).length === 0) return 'empty';
    if (typeof value === 'string' && value.trim().length === 0) return 'empty';
    return 'complete';
  };

  const renderMarcheCard = (contexte: any) => {
    const completedDimensions = DIMENSION_CONFIG.filter(dim => 
      getDimensionStatus(contexte, dim.key) === 'complete'
    ).length;
    
    const completionRate = Math.round((completedDimensions / DIMENSION_CONFIG.length) * 100);

    return (
      <Card key={contexte.id} className="hover:shadow-lg transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {contexte.marches?.nom_marche || 'Marche'}
            </CardTitle>
            <Badge variant={completionRate > 80 ? 'default' : completionRate > 40 ? 'secondary' : 'destructive'}>
              {completionRate}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {contexte.marches?.ville}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {DIMENSION_CONFIG.map(dimension => {
              const status = getDimensionStatus(contexte, dimension.key);
              const Icon = dimension.icon;
              
              return (
                <Button
                  key={dimension.key}
                  variant="outline"
                  size="sm"
                  className={`h-auto p-2 flex flex-col items-center gap-1 ${
                    status === 'complete' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleViewMarche(contexte.marche_id, dimension.key)}
                >
                  <Icon className={`h-4 w-4 ${status === 'complete' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs text-center leading-tight">
                    {dimension.label}
                  </span>
                </Button>
              );
            })}
          </div>
          
          <Button 
            onClick={() => handleViewMarche(contexte.marche_id)}
            className="w-full"
            variant="secondary"
          >
            Voir tous les contextes
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderEditor = () => {
    if (!selectedMarche) return null;

    const contexte = opusContextes.find(c => c.marche_id === selectedMarche);
    if (!contexte) return null;

    const editor = (
      <OpusDimensionEditor
        marcheId={selectedMarche}
        marcheName={contexte.marches?.nom_marche || 'Marche'}
        dimensionKey={selectedDimension || 'general'}
        onClose={handleCloseEditor}
      />
    );

    if (isMobile) {
      return (
        <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Édition des Contextes</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-auto">
              {editor}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent className="w-full sm:max-w-4xl overflow-auto">
          <SheetHeader>
            <SheetTitle>Édition des Contextes</SheetTitle>
          </SheetHeader>
          {editor}
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Préfigurer • {opusSlug}</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des contextes OPUS...</p>
          </div>
        ) : opusContextes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucun contexte OPUS trouvé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Aucune donnée OPUS n'a été importée pour cette exploration.
              </p>
              <p className="text-sm text-muted-foreground">
                Utilisez l'interface d'animation pour importer des données IA avant de préfigurer.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Contextes Hybrides Disponibles</h2>
              <p className="text-muted-foreground">
                {opusContextes.length} marche{opusContextes.length > 1 ? 's' : ''} avec données OPUS
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opusContextes.map(renderMarcheCard)}
            </div>
          </>
        )}
      </main>
      
      {renderEditor()}
    </div>
  );
};