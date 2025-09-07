import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InteractiveVignette } from './InteractiveVignette';
import { SpeciesVignetteGrid } from './SpeciesVignetteGrid';
import { VignetteGrid } from './VignetteGrid';
import { ContexteMetricCard } from './ContexteMetricCard';
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
}

export const ModernImportDetailModal: React.FC<ModernImportDetailModalProps> = ({
  importRecord,
  open,
  onClose
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
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
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
                      {importRecord.contexte_data?.especes_caracteristiques ? 
                        Object.keys(importRecord.contexte_data.especes_caracteristiques).length : 0}
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
                        Object.keys(importRecord.contexte_data.vocabulaire_local).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">termes locaux</p>
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
                      {importRecord.contexte_data?.empreintes_humaines ? 
                        Object.keys(importRecord.contexte_data.empreintes_humaines).length : 0}
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
                        Object.keys(importRecord.contexte_data.technodiversite).length : 0}
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

            {/* Contexte Tab - Design UX Premium */}
            <TabsContent value="contexte" className="space-y-8">
              {importRecord.contexte_data ? (
                <>
                  {/* Section Hero avec statistiques globales */}
                  <Card className="bg-gradient-to-br from-background/90 to-background/40 backdrop-blur-xl border-border/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
                    <CardHeader className="relative">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Droplets className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">Contexte Environnemental</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Analyse complète des paramètres hydrographiques et écologiques
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">
                          {Object.keys(importRecord.contexte_data).length} paramètres
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Métriques principales organisées en grille responsive */}
                  <div className="space-y-8">
                    {/* Paramètres physico-chimiques */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-info/70 flex items-center justify-center">
                          <Beaker className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold">Paramètres Physico-Chimiques</h4>
                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ContexteMetricCard
                          title="Qualité de l'eau"
                          data={importRecord.contexte_data.qualite_eau}
                          icon={<Droplets className="w-4 h-4" />}
                          variant="info"
                          metricType="quality"
                        />
                        
                        <ContexteMetricCard
                          title="Température"
                          data={importRecord.contexte_data.temperature_eau}
                          icon={<Thermometer className="w-4 h-4" />}
                          variant="warning"
                          metricType="temperature"
                        />
                        
                        <ContexteMetricCard
                          title="pH"
                          data={importRecord.contexte_data.ph}
                          icon={<Beaker className="w-4 h-4" />}
                          variant="success"
                          metricType="ph"
                        />
                      </div>
                    </div>

                    {/* Paramètres hydrologiques */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <Waves className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold">Paramètres Hydrologiques</h4>
                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ContexteMetricCard
                          title="Débit moyen"
                          data={importRecord.contexte_data.debit_moyen}
                          icon={<Waves className="w-4 h-4" />}
                          variant="primary"
                          metricType="flow"
                        />
                        
                        <ContexteMetricCard
                          title="Profondeur moyenne"
                          data={importRecord.contexte_data.profondeur_moyenne}
                          icon={<Target className="w-4 h-4" />}
                          variant="info"
                          metricType="numeric"
                          unit=" m"
                        />
                        
                        <ContexteMetricCard
                          title="Phénomènes particuliers"
                          data={importRecord.contexte_data.phenomenes_particuliers}
                          icon={<AlertTriangle className="w-4 h-4" />}
                          variant="warning"
                          metricType="text"
                        />
                      </div>
                    </div>

                    {/* Informations générales */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold">Informations Générales</h4>
                        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ContexteMetricCard
                          title="Description"
                          data={importRecord.contexte_data.description}
                          icon={<FileText className="w-4 h-4" />}
                          variant="neutral"
                          metricType="text"
                        />
                        
                        <ContexteMetricCard
                          title="Sources note"
                          data={importRecord.contexte_data.sources_note}
                          icon={<Database className="w-4 h-4" />}
                          variant="info"
                          metricType="text"
                        />
                        
                        <ContexteMetricCard
                          title="Source IDs"
                          data={importRecord.contexte_data.source_ids}
                          icon={<Users className="w-4 h-4" />}
                          variant="primary"
                          metricType="text"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Synthèse visuelle */}
                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/10 to-transparent rounded-bl-full" />
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-success">Synthèse Contextuelle</h4>
                          <p className="text-sm text-muted-foreground max-w-2xl">
                            L'ensemble des paramètres environnementaux ont été collectés et analysés pour 
                            fournir une vision complète de l'écosystème aquatique étudié.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-success/10 border-success/30 text-success hover:bg-success/20"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Rapport complet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                  <CardContent className="p-12 text-center">
                    <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée de contexte</h3>
                    <p className="text-muted-foreground">
                      Les données contextuelles n'ont pas encore été importées pour ce marché.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Espèces Caractéristiques Tab */}
            <TabsContent value="species" className="space-y-6">
              <SpeciesVignetteGrid 
                speciesData={importRecord.contexte_data?.especes_caracteristiques}
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
              />
            </TabsContent>

            {/* Infrastructures Tab */}
            <TabsContent value="infrastructure" className="space-y-6">
              <VignetteGrid
                title="Infrastructures Caractéristiques"
                data={importRecord.contexte_data?.empreintes_humaines}
                variant="infrastructure"
                icon={<Building className="w-5 h-5" />}
                emptyMessage="Aucune infrastructure caractéristique n'a été identifiée"
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
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};