import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InteractiveVignette } from './InteractiveVignette';
import { SpeciesVignetteGrid } from './SpeciesVignetteGrid';
import { VignetteGrid } from './VignetteGrid';
import { InfrastructureVignetteGrid } from './InfrastructureVignetteGrid';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';
import { processEmpreintesHumainesData } from '@/utils/empreintesHumainesDataUtils';
import { ContexteMetricCard } from './ContexteMetricCard';
import { mapContexteData } from '@/utils/contexteDataMapper';
import { getVocabularyTermsCount } from '@/utils/vocabularyDataUtils';
import { getProcessedSpeciesCount } from '@/utils/speciesDataUtils';
import { 
  Calendar, 
  Database, 
  FileText, 
  MapPin, 
  Droplets, 
  Leaf, 
  Users, 
  Zap, 
  Target, 
  ExternalLink,
  Code,
  EyeOff,
  TrendingUp,
  Activity,
  Globe,
  ChevronRight,
  Building,
  Wheat,
  Wrench,
  BookOpen,
  Beaker,
  Waves,
  Thermometer,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface ImportRecord {
  id: string;
  opus_id: string;
  marche_id: string;
  import_date: string;
  contexte_data: any;
  fables_data: any[];
  sources: any[];
  completude_score: number;
  marche_nom?: string;
  marche_ville?: string;
}

interface ModernImportDetailModalProps {
  importRecord: ImportRecord;
  open: boolean;
  onClose: () => void;
  defaultTab?: string; // Nouvel prop pour spécifier l'onglet par défaut
}

export const ModernImportDetailModal: React.FC<ModernImportDetailModalProps> = ({
  importRecord,
  open,
  onClose,
  defaultTab = "overview" // Par défaut sur "Vue d'ensemble"
}) => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showJsonView, setShowJsonView] = useState(false);

  const sourcesByYear = useMemo(() => {
    const yearMap = new Map<string, any[]>();
    
    importRecord.sources.forEach(source => {
      const dateStr = source.date || source.date_publication;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear().toString();
        if (!yearMap.has(year)) {
          yearMap.set(year, []);
        }
        yearMap.get(year)!.push(source);
      }
    });
    
    return new Map([...yearMap.entries()].sort((a, b) => parseInt(b[0]) - parseInt(a[0])));
  }, [importRecord.sources]);

  const filteredSources = selectedYear ? sourcesByYear.get(selectedYear) || [] : importRecord.sources;

  const handlePrefigurerClick = () => {
    window.open(`/galerie-fleuve/exploration/remontee-dordogne-atlas-eaux-vivantes-2025-2045/prefigurer`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContexteMetric = (title: string, data: any, icon: React.ReactNode) => {
    if (!data) return null;
    
    return (
      <Card className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div className="text-success">
              {icon}
            </div>
            <span className="text-success">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {typeof data === 'object' ? (
              <pre className="bg-muted/20 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              <span>{String(data)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Database className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl">Import IA - {importRecord.marche_nom}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(importRecord.import_date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJsonView(!showJsonView)}
                className="bg-background/50 border-border/50"
              >
                {showJsonView ? <EyeOff className="w-4 h-4 mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                {showJsonView ? 'Vue normale' : 'Vue JSON'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrefigurerClick}
                className="bg-gradient-to-r from-accent/10 to-accent/20 border-accent/30 hover:from-accent/20 hover:to-accent/30"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Préfigurer
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails de l’import IA et des dimensions analysées pour {importRecord.marche_nom}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="flex-1">
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-7 mb-6 bg-background/50 backdrop-blur-sm border border-border/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="contexte" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Contexte
              </TabsTrigger>
              <TabsTrigger value="species" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Espèces
              </TabsTrigger>
              <TabsTrigger value="vocabulary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Vocabulaire
              </TabsTrigger>
              <TabsTrigger value="infrastructure" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Infrastructures
              </TabsTrigger>
              <TabsTrigger value="agro" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Agroécologie
              </TabsTrigger>
              <TabsTrigger value="technology" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                Technodiversité
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[75vh] pr-4">
            {/* Vue d'ensemble Tab - Refonte avec les 6 métriques */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. Nb Espèces */}
                <Card className="bg-gradient-to-br from-success/20 to-success/10 border-success/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-success" />
                      Espèces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success mb-1">
                      {getProcessedSpeciesCount(importRecord.contexte_data?.especes_caracteristiques)}
                    </div>
                    <p className="text-xs text-muted-foreground">identifiées</p>
                  </CardContent>
                </Card>

                {/* 2. Vocabulaire Local */}
                <Card className="bg-gradient-to-br from-info/20 to-info/10 border-info/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-info" />
                      Vocabulaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-info mb-1">
                      {importRecord.contexte_data?.vocabulaire_local ? 
                        getVocabularyTermsCount(importRecord.contexte_data.vocabulaire_local) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">éléments de vocabulaire</p>
                  </CardContent>
                </Card>

                {/* 3. Infrastructures */}
                <Card className="bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-warning" />
                      Infrastructures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-2xl font-bold text-warning mb-1">
                         {(() => {
                           // Essayer différents chemins pour trouver les données d'infrastructure
                           const contextData = importRecord.contexte_data as any;
                           const infra = contextData?.dimensions?.infrastructures_techniques
                             || contextData?.infrastructures_techniques
                             || contextData?.empreintes_humaines?.dimensions?.infrastructures_techniques
                             || contextData?.empreintes_humaines?.infrastructures_techniques
                             || contextData?.empreintes_humaines 
                             || contextData?.infrastructures 
                             || contextData?.donnees?.empreintes_humaines 
                             || contextData?.empreintesHumaines 
                             || null;
                           return infra ? processEmpreintesHumainesData(infra).totalCount : 0;
                         })()}
                     </div>
                    <p className="text-xs text-muted-foreground">caractéristiques</p>
                  </CardContent>
                </Card>

                {/* 4. Leviers Agroécologiques */}
                <Card className="bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-accent" />
                      Agroécologie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent mb-1">
                      {importRecord.contexte_data?.projection_2035_2045?.leviers_agroecologiques ? 
                        Object.keys(importRecord.contexte_data.projection_2035_2045.leviers_agroecologiques).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">leviers</p>
                  </CardContent>
                </Card>

                {/* 5. Nouvelles Activités */}
                <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      Activités
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500 mb-1">
                      {importRecord.contexte_data?.projection_2035_2045?.nouvelles_activites ? 
                        Object.keys(importRecord.contexte_data.projection_2035_2045.nouvelles_activites).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">à développer</p>
                  </CardContent>
                </Card>

                {/* 6. Technodiversité */}
                <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-purple-500" />
                      Technodiversité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500 mb-1">
                      {importRecord.contexte_data?.technodiversite ? 
                        (() => {
                          const processed = processTechnodiversiteData(importRecord.contexte_data.technodiversite);
                          return processed.totalCount;
                        })() : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">technologies</p>
                  </CardContent>
                </Card>
              </div>

              {/* Informations générales compactes */}
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">Marché:</span>
                      <p>{importRecord.marche_nom}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">Complétude:</span>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-success">{importRecord.completude_score}%</div>
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${importRecord.completude_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-muted-foreground">Sources:</span>
                      <p className="text-info font-medium">{importRecord.sources.length} références</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* Contexte Tab */}
          <TabsContent value="contexte" className="space-y-6">
            <div className="space-y-6">
              {/* En-tête de section */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Données Contextuelles Hydrologiques
                </h3>
                <p className="text-sm text-muted-foreground">
                  Métriques environnementales et caractéristiques du site
                </p>
              </div>

              {/* Debug info */}
              <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
                <strong>Debug:</strong> {importRecord.contexte_data ? 'Données disponibles' : 'Aucune donnée contexte'}
                {importRecord.contexte_data && (
                  <div>Clés: {Object.keys(importRecord.contexte_data).join(', ')}</div>
                )}
              </div>

              {/* Métriques contextuelles dans l'ordre demandé */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mapContexteData(importRecord.contexte_data).map((metric, index) => (
                  <ContexteMetricCard
                    key={index}
                    title={metric.title}
                    data={metric.data}
                    unit={metric.unit}
                    metricType={metric.metricType}
                  />
                ))}
              </div>
            </div>
            </TabsContent>

            {/* Espèces Caractéristiques Tab */}
            <TabsContent value="species" className="space-y-6">
              <SpeciesVignetteGrid 
                speciesData={importRecord.contexte_data?.especes_caracteristiques}
                importSources={importRecord.sources}
              />
            </TabsContent>

            {/* Vocabulaire Local Tab */}
            <TabsContent value="vocabulary" className="space-y-6">
              <VignetteGrid
                title="Vocabulaire Local"
                data={importRecord.contexte_data?.vocabulaire_local}
                variant="vocabulary"
                icon={<BookOpen className="w-5 h-5" />}
                emptyMessage="Aucun terme de vocabulaire local n'a été identifié"
                specialProcessing="vocabulary"
                importSources={importRecord.sources}
              />
            </TabsContent>

            {/* Infrastructures Tab */}
            <TabsContent value="infrastructure" className="space-y-6">
              <InfrastructureVignetteGrid 
                empreintesHumainesData={(() => {
                  const contextData = importRecord.contexte_data as any;
                  const infra = contextData?.dimensions?.infrastructures_techniques 
                    || contextData?.infrastructures_techniques 
                    || contextData?.empreintes_humaines?.dimensions?.infrastructures_techniques 
                    || contextData?.empreintes_humaines?.infrastructures_techniques 
                    || contextData?.empreintes_humaines 
                    || null;
                  console.info('Infra debug (modal): keys=', contextData ? Object.keys(contextData) : null, 'resolved=', infra ? Object.keys(infra) : infra);
                  return infra;
                })()}
                importSources={importRecord.sources}
              />
            </TabsContent>

            {/* Leviers Agroécologiques Tab */}
            <TabsContent value="agro" className="space-y-6">
              <VignetteGrid
                title="Leviers Agroécologiques"
                data={importRecord.contexte_data?.projection_2035_2045?.leviers_agroecologiques}
                variant="agro"
                icon={<Wheat className="w-5 h-5" />}
                emptyMessage="Aucun levier agroécologique n'a été identifié"
              />
            </TabsContent>

            {/* Technodiversité Tab */}
            <TabsContent value="technology" className="space-y-6">
              <VignetteGrid
                title="Technodiversité"
                data={importRecord.contexte_data?.technodiversite}
                variant="technology"
                icon={<Wrench className="w-5 h-5" />}
                emptyMessage="Aucune technologie n'a été identifiée"
                specialProcessing="technodiversite"
                importSources={importRecord.sources}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};