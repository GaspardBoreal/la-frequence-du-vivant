import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  EyeOff,
  TrendingUp,
  Activity,
  Clock,
  Globe,
  ChevronRight
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

  // Extract years from sources for filtering
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

  const getStatusColor = () => {
    const hasContexte = !!importRecord.contexte_data;
    const hasFables = !!importRecord.fables_data?.length;
    
    if (hasContexte && hasFables) return 'text-green-500';
    if (hasContexte || hasFables) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderContexteSection = (title: string, data: any, icon: React.ReactNode, color: string) => {
    if (!data) return null;

    const dataCount = Array.isArray(data) ? data.length : Object.keys(data || {}).length;

    return (
      <Card className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <span>{title}</span>
              <Badge variant="secondary" className="ml-2">
                {dataCount} {dataCount === 1 ? 'élément' : 'éléments'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 ${showJsonView ? 'font-mono text-xs' : ''}`}>
            {showJsonView ? (
              <pre className="bg-muted/20 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              typeof data === 'object' ? (
                Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <div className="text-sm font-medium text-success capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground pl-4 border-l-2 border-border/30">
                      {Array.isArray(value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((item, idx) => (
                            <li key={idx} className="text-xs">
                              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                            </li>
                          ))}
                        </ul>
                      ) : typeof value === 'object' ? (
                        <div className="bg-muted/10 p-2 rounded text-xs">
                          {JSON.stringify(value, null, 2)}
                        </div>
                      ) : (
                        <span className="text-sm">{String(value)}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{String(data)}</p>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
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
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-background/50 backdrop-blur-sm border border-border/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="contexte" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Contexte
            </TabsTrigger>
            <TabsTrigger value="fables" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Fables
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Sources
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] pr-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Complétude
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success">
                      {importRecord.completude_score}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${importRecord.completude_score}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Contexte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getStatusColor()}`}>
                      {importRecord.contexte_data ? '✓' : '✗'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {importRecord.contexte_data ? 'Disponible' : 'Manquant'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Fables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning">
                      {importRecord.fables_data?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      narratives créées
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-info">
                      {importRecord.sources.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      références collectées
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* General Information */}
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Marché:</span>
                        <span className="text-muted-foreground">
                          {importRecord.marche_nom}
                        </span>
                      </div>
                      {importRecord.marche_ville && (
                        <div className="flex justify-between">
                          <span className="font-medium">Ville:</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {importRecord.marche_ville}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">ID Marché:</span>
                        <span className="text-muted-foreground font-mono text-sm">
                          {importRecord.marche_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">ID OPUS:</span>
                        <span className="text-muted-foreground font-mono text-sm">
                          {importRecord.opus_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contexte Tab */}
            <TabsContent value="contexte" className="space-y-6">
              {importRecord.contexte_data ? (
                <>
                  {renderContexteSection(
                    "Contexte Hydrologique", 
                    importRecord.contexte_data.contexte_hydrologique,
                    <Droplets className="w-5 h-5 text-white" />,
                    "bg-blue-500/20"
                  )}
                  {renderContexteSection(
                    "Espèces Caractéristiques", 
                    importRecord.contexte_data.especes_caracteristiques,
                    <Leaf className="w-5 h-5 text-white" />,
                    "bg-green-500/20"
                  )}
                  {renderContexteSection(
                    "Vocabulaire Local", 
                    importRecord.contexte_data.vocabulaire_local,
                    <Users className="w-5 h-5 text-white" />,
                    "bg-purple-500/20"
                  )}
                  {renderContexteSection(
                    "Empreintes Humaines", 
                    importRecord.contexte_data.empreintes_humaines,
                    <Users className="w-5 h-5 text-white" />,
                    "bg-orange-500/20"
                  )}
                  {renderContexteSection(
                    "Technodiversité", 
                    importRecord.contexte_data.technodiversite,
                    <Zap className="w-5 h-5 text-white" />,
                    "bg-yellow-500/20"
                  )}
                  {renderContexteSection(
                    "Projections 2035-2045", 
                    importRecord.contexte_data.projection_2035_2045,
                    <Target className="w-5 h-5 text-white" />,
                    "bg-red-500/20"
                  )}
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

            {/* Fables Tab */}
            <TabsContent value="fables" className="space-y-6">
              {importRecord.fables_data?.length > 0 ? (
                importRecord.fables_data.map((fable, index) => (
                  <Card key={index} className="bg-background/50 backdrop-blur-sm border-border/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span>{fable.titre}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{fable.statut}</Badge>
                            {fable.version && (
                              <Badge variant="secondary">v{fable.version}</Badge>
                            )}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-4 pr-4">
                          {fable.resume && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" />
                                Résumé
                              </h4>
                              <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                                {fable.resume}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <ChevronRight className="w-4 h-4" />
                              Contenu principal
                            </h4>
                            <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg leading-relaxed">
                              {fable.contenu_principal}
                            </p>
                          </div>

                          {fable.variations && Object.keys(fable.variations).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" />
                                Variations
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(fable.variations).map(([type, content]) => (
                                  <div key={type} className="bg-muted/10 border border-border/30 rounded-lg p-3">
                                    <Badge variant="secondary" className="mb-3">{type}</Badge>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                      {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {fable.dimensions_associees?.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" />
                                Dimensions associées
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {fable.dimensions_associees.map((dim: string) => (
                                  <Badge key={dim} variant="outline" className="text-xs">
                                    {dim}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Aucune fable disponible</h3>
                    <p className="text-muted-foreground">
                      Les narratives n'ont pas encore été générées pour ce marché.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sources Tab */}
            <TabsContent value="sources" className="space-y-6">
              {sourcesByYear.size > 0 && (
                <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Filtrer par année</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedYear === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYear(null)}
                        className="bg-background/50 border-border/50"
                      >
                        Toutes ({importRecord.sources.length})
                      </Button>
                      {[...sourcesByYear.entries()].map(([year, sources]) => (
                        <Button
                          key={year}
                          variant={selectedYear === year ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedYear(year)}
                          className="bg-background/50 border-border/50"
                        >
                          {year} ({sources.length})
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {filteredSources.length > 0 ? (
                <div className="space-y-4">
                  {filteredSources.map((source, index) => (
                    <Card key={index} className="bg-background/50 backdrop-blur-sm border-border/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-white" />
                          </div>
                          <span>{source.titre || `Source ${index + 1}`}</span>
                          {source.type && (
                            <Badge variant="outline">{source.type}</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {source.auteur && (
                            <div>
                              <span className="font-medium text-sm">Auteur:</span>
                              <p className="text-sm text-muted-foreground mt-1">{source.auteur}</p>
                            </div>
                          )}
                          {(source.date || source.date_publication) && (
                            <div>
                              <span className="font-medium text-sm">Date:</span>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {source.date || source.date_publication}
                              </p>
                            </div>
                          )}
                          {(source.url || source.lien || source.link) && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-sm">URL:</span>
                              <a 
                                href={source.url || source.lien || source.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block text-sm text-accent hover:text-accent/80 underline mt-1 break-all"
                              >
                                {source.url || source.lien || source.link}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                  <CardContent className="p-12 text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">
                      {selectedYear ? `Aucune source pour ${selectedYear}` : "Aucune source disponible"}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedYear 
                        ? "Aucune source n'a été référencée pour cette année."
                        : "Aucune source n'a été référencée pour cet import."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};