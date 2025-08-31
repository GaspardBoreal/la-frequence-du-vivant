import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Database, FileText, MapPin, Droplets, Leaf, Users, Zap, Target } from 'lucide-react';

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
}

interface OpusImportDetailProps {
  importRecord: ImportRecord;
  onClose: () => void;
}

export const OpusImportDetail: React.FC<OpusImportDetailProps> = ({
  importRecord,
  onClose
}) => {
  const renderContexteSection = (title: string, data: any, icon: React.ReactNode) => {
    if (!data) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {typeof data === 'object' ? (
              Object.entries(data).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium capitalize">
                    {key.replace(/_/g, ' ')}:
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {Array.isArray(value) ? value.join(', ') : 
                     typeof value === 'object' ? JSON.stringify(value, null, 2) :
                     String(value)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{String(data)}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Détails de l'import - {importRecord.marche_nom}
          </DialogTitle>
          <DialogDescription>
            Import effectué le {formatDate(importRecord.import_date)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="contexte">Contexte</TabsTrigger>
            <TabsTrigger value="fables">Fables</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          <ScrollArea className="mt-4 h-[60vh]">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Complétude</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {importRecord.completude_score}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Contexte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {importRecord.contexte_data ? '✓' : '✗'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Fables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {importRecord.fables_data?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {importRecord.sources.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">ID Marche:</span>
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
                  <div className="flex justify-between">
                    <span className="font-medium">Date d'import:</span>
                    <span className="text-muted-foreground">
                      {formatDate(importRecord.import_date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contexte" className="space-y-4">
              {importRecord.contexte_data ? (
                <div>
                  {renderContexteSection(
                    "Contexte Hydrologique", 
                    importRecord.contexte_data.contexte_hydrologique,
                    <Droplets className="w-4 h-4" />
                  )}
                  {renderContexteSection(
                    "Espèces Caractéristiques", 
                    importRecord.contexte_data.especes_caracteristiques,
                    <Leaf className="w-4 h-4" />
                  )}
                  {renderContexteSection(
                    "Empreintes Humaines", 
                    importRecord.contexte_data.empreintes_humaines,
                    <Users className="w-4 h-4" />
                  )}
                  {renderContexteSection(
                    "Technodiversité", 
                    importRecord.contexte_data.technodiversite,
                    <Zap className="w-4 h-4" />
                  )}
                  {renderContexteSection(
                    "Projections 2035-2045", 
                    importRecord.contexte_data.projection_2035_2045,
                    <Target className="w-4 h-4" />
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucune donnée de contexte importée</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="fables" className="space-y-4">
              {importRecord.fables_data?.length > 0 ? (
                importRecord.fables_data.map((fable, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {fable.titre}
                      </CardTitle>
                      <CardDescription>
                        Statut: <Badge variant="outline">{fable.statut}</Badge>
                        {fable.version && <span className="ml-2">Version: {fable.version}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {fable.resume && (
                          <div>
                            <h4 className="font-medium mb-1">Résumé</h4>
                            <p className="text-sm text-muted-foreground">{fable.resume}</p>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium mb-1">Contenu principal</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {fable.contenu_principal}
                          </p>
                        </div>

                        {fable.variations && (
                          <div>
                            <h4 className="font-medium mb-1">Variations</h4>
                            <div className="flex gap-2">
                              {Object.keys(fable.variations).map(type => (
                                <Badge key={type} variant="secondary">{type}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {fable.dimensions_associees?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-1">Dimensions associées</h4>
                            <div className="flex flex-wrap gap-1">
                              {fable.dimensions_associees.map((dim: string) => (
                                <Badge key={dim} variant="outline" className="text-xs">
                                  {dim}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucune fable importée</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              {importRecord.sources.length > 0 ? (
                importRecord.sources.map((source, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{source.titre || `Source ${index + 1}`}</CardTitle>
                      {source.type && (
                        <CardDescription>
                          <Badge variant="outline">{source.type}</Badge>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {source.auteur && (
                          <div className="flex justify-between">
                            <span className="font-medium">Auteur:</span>
                            <span className="text-muted-foreground">{source.auteur}</span>
                          </div>
                        )}
                        {(source.date || source.date_publication) && (
                          <div className="flex justify-between">
                            <span className="font-medium">Date:</span>
                            <span className="text-muted-foreground">{source.date || source.date_publication}</span>
                          </div>
                        )}
                        {(source.url || source.lien || source.link) && (
                          <div className="flex justify-between">
                            <span className="font-medium">URL:</span>
                            <a 
                              href={source.url || source.lien || source.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-white underline break-all text-sm hover:text-white/80"
                            >
                              {source.url || source.lien || source.link}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucune source référencée</p>
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