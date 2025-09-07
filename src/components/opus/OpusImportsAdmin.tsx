import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Calendar, Database, AlertTriangle } from 'lucide-react';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OpusImportDetail } from './OpusImportDetail';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface OpusImportsAdminProps {
  explorationId: string;
  explorationName: string;
}

export const OpusImportsAdmin: React.FC<OpusImportsAdminProps> = ({
  explorationId,
  explorationName
}) => {
  const { toast } = useToast();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [importToDelete, setImportToDelete] = useState<ImportRecord | null>(null);
  const { data: marches } = useSupabaseMarches();

  const loadImports = async () => {
    setLoading(true);
    try {
      // Récupérer les contextes
      const { data: contextes, error: contextError } = await supabase
        .from('marche_contextes_hybrids')
        .select('*')
        .eq('opus_id', explorationId);

      if (contextError) throw contextError;

      // Récupérer les fables
      const { data: fables, error: fablesError } = await supabase
        .from('fables_narratives')
        .select('*')
        .eq('opus_id', explorationId);

      if (fablesError) throw fablesError;

      // Organiser par marche
      const importsByMarche = new Map<string, ImportRecord>();

      // Traiter les contextes
      contextes?.forEach(contexte => {
        const marcheId = contexte.marche_id;
        const marcheInfo = marches?.find(m => m.id === marcheId);
        
        if (!importsByMarche.has(marcheId)) {
          importsByMarche.set(marcheId, {
            id: contexte.id,
            opus_id: explorationId,
            marche_id: marcheId,
            import_date: contexte.created_at,
            contexte_data: contexte,
            fables_data: [],
            sources: Array.isArray(contexte.sources) ? contexte.sources : [],
            completude_score: contexte.completude_score || 0,
            marche_nom: marcheInfo?.nomMarche || 'Marche inconnue'
          });
        } else {
          const existing = importsByMarche.get(marcheId)!;
          existing.contexte_data = contexte;
          const existingSources = Array.isArray(existing.sources) ? existing.sources : [];
          const newSources = Array.isArray(contexte.sources) ? contexte.sources : [];
          existing.sources = [...existingSources, ...newSources];
          existing.completude_score = Math.max(existing.completude_score, contexte.completude_score || 0);
        }
      });

      // Traiter les fables
      fables?.forEach(fable => {
        const marcheId = fable.marche_id;
        const marcheInfo = marches?.find(m => m.id === marcheId);
        
        if (!importsByMarche.has(marcheId)) {
          importsByMarche.set(marcheId, {
            id: fable.id,
            opus_id: explorationId,
            marche_id: marcheId,
            import_date: fable.created_at,
            contexte_data: null,
            fables_data: [fable],
            sources: [],
            completude_score: 0,
            marche_nom: marcheInfo?.nomMarche || 'Marche inconnue'
          });
        } else {
          const existing = importsByMarche.get(marcheId)!;
          existing.fables_data = existing.fables_data ? [...existing.fables_data, fable] : [fable];
        }
      });

      setImports(Array.from(importsByMarche.values()));
    } catch (error) {
      console.error('Erreur lors du chargement des imports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les imports IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteImport = async () => {
    if (!importToDelete) return;

    try {
      // Supprimer les contextes
      if (importToDelete.contexte_data) {
        await supabase
          .from('marche_contextes_hybrids')
          .delete()
          .eq('marche_id', importToDelete.marche_id)
          .eq('opus_id', explorationId);
      }

      // Supprimer les fables
      if (importToDelete.fables_data?.length > 0) {
        await supabase
          .from('fables_narratives')
          .delete()
          .eq('marche_id', importToDelete.marche_id)
          .eq('opus_id', explorationId);
      }

      toast({
        title: "Import supprimé",
        description: `L'import pour ${importToDelete.marche_nom} a été supprimé`
      });

      setImportToDelete(null);
      loadImports(); // Recalculer les indicateurs totaux
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'import",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    loadImports();
  }, [explorationId]);

  const getImportStatus = (importRecord: ImportRecord) => {
    const hasContexte = !!importRecord.contexte_data;
    const hasFables = !!importRecord.fables_data?.length;
    
    if (hasContexte && hasFables) return { status: 'complete', label: 'Complet', color: 'bg-green-500' };
    if (hasContexte || hasFables) return { status: 'partial', label: 'Partiel', color: 'bg-yellow-500' };
    return { status: 'empty', label: 'Vide', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Administration des Imports IA</h2>
          <p className="text-muted-foreground">
            Gestion des imports pour {explorationName}
          </p>
        </div>
        <Button onClick={loadImports} disabled={loading}>
          <Database className="w-4 h-4 mr-2" />
          {loading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </div>

      <Tabs defaultValue="imports" className="w-full">
        <TabsList>
          <TabsTrigger value="imports">
            Imports ({imports.length})
          </TabsTrigger>
          <TabsTrigger value="statistics">
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="imports" className="space-y-4">
          {imports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Aucun import trouvé</p>
                <p className="text-muted-foreground">
                  Utilisez l'interface d'import IA pour ajouter des données
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {imports.map((importRecord) => {
                const status = getImportStatus(importRecord);
                return (
                  <Card key={importRecord.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {importRecord.marche_nom}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            Importé le {new Date(importRecord.import_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <Badge variant="outline">{status.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {importRecord.completude_score}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Complétude
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {importRecord.contexte_data ? '✓' : '✗'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Contexte
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {importRecord.fables_data?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Fables
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {importRecord.sources.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sources
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImport(importRecord)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setImportToDelete(importRecord)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{imports.length}</div>
                <p className="text-muted-foreground">marches importées</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Imports Complets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {imports.filter(i => getImportStatus(i).status === 'complete').length}
                </div>
                <p className="text-muted-foreground">contexte + fables</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Complétude Moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {imports.length > 0 
                    ? Math.round(imports.reduce((acc, i) => acc + i.completude_score, 0) / imports.length)
                    : 0}%
                </div>
                <p className="text-muted-foreground">score global</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedImport && (
        <OpusImportDetail
          importRecord={selectedImport}
          onClose={() => setSelectedImport(null)}
        />
      )}

      <AlertDialog open={!!importToDelete} onOpenChange={() => setImportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'import pour <strong>{importToDelete?.marche_nom}</strong> ?
              <br />
              Cette action supprimera définitivement :
              <ul className="list-disc list-inside mt-2">
                <li>Les données de contexte associées</li>
                <li>Les fables narratives ({importToDelete?.fables_data?.length || 0})</li>
                <li>Les sources référencées ({importToDelete?.sources?.length || 0})</li>
              </ul>
              <br />
              <strong>Cette action est irréversible.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteImport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};