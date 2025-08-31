import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMarcheContextes, useContexteCompletude } from '@/hooks/useOpus';
import { OpusDimensionEditor } from './OpusDimensionEditor';
import type { MarcheContexteHybrid } from '@/types/opus';
import { 
  Waves, 
  Leaf, 
  MessageSquare, 
  Factory, 
  Calendar, 
  Sprout, 
  Lightbulb, 
  Cpu,
  BarChart3,
  Eye,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Database,
  ArrowRight
} from 'lucide-react';

interface OpusDataDashboardProps {
  marcheId: string;
  marcheName: string;
  onClose?: () => void;
}

const DIMENSIONS_CONFIG = [
  { 
    key: 'contexte_hydrologique', 
    label: 'Contexte Hydrologique', 
    icon: Waves, 
    color: 'hsl(var(--chart-1))',
    description: 'Caractéristiques hydrologiques du territoire'
  },
  { 
    key: 'especes_caracteristiques', 
    label: 'Espèces Caractéristiques', 
    icon: Leaf, 
    color: 'hsl(var(--chart-2))',
    description: 'Biodiversité locale remarquable'
  },
  { 
    key: 'vocabulaire_local', 
    label: 'Vocabulaire Local', 
    icon: MessageSquare, 
    color: 'hsl(var(--chart-3))',
    description: 'Terminologie et expressions du territoire'
  },
  { 
    key: 'empreintes_humaines', 
    label: 'Empreintes Humaines', 
    icon: Factory, 
    color: 'hsl(var(--chart-4))',
    description: 'Infrastructures et activités anthropiques'
  },
  { 
    key: 'projection_2035_2045', 
    label: 'Projection 2035-2045', 
    icon: Calendar, 
    color: 'hsl(var(--chart-5))',
    description: 'Évolutions climatiques et territoriales anticipées'
  },
  { 
    key: 'leviers_agroecologiques', 
    label: 'Leviers Agroécologiques', 
    icon: Sprout, 
    color: 'hsl(var(--primary))',
    description: 'Solutions de transition écologique'
  },
  { 
    key: 'nouvelles_activites', 
    label: 'Nouvelles Activités', 
    icon: Lightbulb, 
    color: 'hsl(var(--secondary))',
    description: 'Innovations et développements territoriaux'
  },
  { 
    key: 'technodiversite', 
    label: 'Technodiversité', 
    icon: Cpu, 
    color: 'hsl(var(--accent))',
    description: 'Technologies appropriées et innovation frugale'
  }
];

export const OpusDataDashboard: React.FC<OpusDataDashboardProps> = ({
  marcheId,
  marcheName,
  onClose
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: contexte, isLoading } = useMarcheContextes(marcheId);
  const completude = useContexteCompletude(contexte);
  
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleDimensionClick = (dimensionKey: string) => {
    setSelectedDimension(dimensionKey);
    setEditorOpen(true);
  };

  const getDimensionStatus = (dimension: any) => {
    if (!contexte) return 'empty';
    
    const data = contexte[dimension.key as keyof MarcheContexteHybrid];
    const isEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0);
    
    if (isEmpty) return 'empty';
    
    // Analyser la richesse des données
    if (typeof data === 'object') {
      const entries = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length >= 3) return 'complete';
      if (entries.length >= 1) return 'partial';
    }
    
    return 'partial';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return <Badge className="bg-green-100 text-green-700 border-green-200">Complet</Badge>;
      case 'partial': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partiel</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">À créer</Badge>;
    }
  };

  const renderDimensionCard = (dimension: any) => {
    const status = getDimensionStatus(dimension);
    
    return (
      <Card 
        key={dimension.key} 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 hover:border-l-primary"
        style={{ borderLeftColor: dimension.color }}
        onClick={() => handleDimensionClick(dimension.key)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div 
                className="p-3 rounded-xl bg-muted/50 group-hover:scale-105 transition-transform"
                style={{ color: dimension.color }}
              >
                <dimension.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{dimension.label}</CardTitle>
                  {getStatusIcon(status)}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{dimension.description}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {getStatusBadge(status)}
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              {status === 'empty' ? 'Créer' : 'Modifier'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverviewStats = () => {
    const completes = DIMENSIONS_CONFIG.filter(d => getDimensionStatus(d) === 'complete').length;
    const partials = DIMENSIONS_CONFIG.filter(d => getDimensionStatus(d) === 'partial').length;
    const empties = DIMENSIONS_CONFIG.filter(d => getDimensionStatus(d) === 'empty').length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{completude}%</div>
                <div className="text-sm text-muted-foreground">Complétude</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completes}</div>
                <div className="text-sm text-muted-foreground">Complètes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <div className="text-2xl font-bold">{partials}</div>
                <div className="text-sm text-muted-foreground">Partielles</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{empties}</div>
                <div className="text-sm text-muted-foreground">À créer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDashboardContent = () => (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Données OPUS
          </h1>
          <p className="text-muted-foreground mt-1">{marcheName}</p>
        </div>
        <div className="text-right">
          <Progress value={completude} className="w-32 mb-2" />
          <div className="text-sm text-muted-foreground">Progression générale</div>
        </div>
      </div>

      {renderOverviewStats()}

      {/* Grille des dimensions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dimensions du Contexte Hybride</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIMENSIONS_CONFIG.map(renderDimensionCard)}
        </div>
      </div>
    </div>
  );

  const renderEditor = () => {
    if (!selectedDimension) return null;

    return (
      <OpusDimensionEditor
        marcheId={marcheId}
        marcheName={marcheName}
        dimensionKey={selectedDimension}
        onClose={() => {
          setEditorOpen(false);
          setSelectedDimension(null);
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Interface mobile avec Drawer
  if (isMobile) {
    return (
      <>
        {renderDashboardContent()}
        
        <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
          <DrawerContent className="h-[95vh]">
            <DrawerHeader>
              <DrawerTitle>
                {selectedDimension && DIMENSIONS_CONFIG.find(d => d.key === selectedDimension)?.label}
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-auto p-4">
              {renderEditor()}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Interface desktop avec Sheet
  return (
    <>
      {renderDashboardContent()}
      
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="w-[900px] max-w-[90vw] overflow-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDimension && DIMENSIONS_CONFIG.find(d => d.key === selectedDimension)?.label}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {renderEditor()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};