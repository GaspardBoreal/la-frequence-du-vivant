import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Database, 
  AlertTriangle, 
  Filter,
  Download,
  RefreshCw,
  Plus 
} from 'lucide-react';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { useExplorations } from '@/hooks/useExplorations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OpusImportDetail } from '@/components/opus/OpusImportDetail';
import { OpusImportInterface } from '@/components/opus/OpusImportInterface';
import SEOHead from '@/components/SEOHead';

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

const ExplorationImports: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const { data: explorations } = useExplorations();
  const { data: marches } = useSupabaseMarches();
  
  const exploration = explorations?.find(exp => exp.slug === slug);

  const loadImports = async () => {
    if (!exploration) return;
    
    setLoading(true);
    try {
      // Récupérer les contextes
      const { data: contextes, error: contextError } = await supabase
        .from('marche_contextes_hybrids')
        .select('*')
        .eq('opus_id', exploration.id);

      if (contextError) throw contextError;

      // Récupérer les fables
      const { data: fables, error: fablesError } = await supabase
        .from('fables_narratives')
        .select('*')
        .eq('opus_id', exploration.id);

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
            opus_id: exploration.id,
            marche_id: marcheId,
            import_date: contexte.created_at,
            contexte_data: contexte,
            fables_data: [],
            sources: Array.isArray(contexte.sources) ? contexte.sources : [],
            completude_score: contexte.completude_score || 0,
            marche_nom: marcheInfo?.nomMarche || 'Marche inconnue',
            marche_ville: marcheInfo?.ville || ''
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
            opus_id: exploration.id,
            marche_id: marcheId,
            import_date: fable.created_at,
            contexte_data: null,
            fables_data: [fable],
            sources: [],
            completude_score: 0,
            marche_nom: marcheInfo?.nomMarche || 'Marche inconnue',
            marche_ville: marcheInfo?.ville || ''
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

  const deleteImport = async (importRecord: ImportRecord) => {
    if (!confirm(`Confirmer la suppression de l'import pour ${importRecord.marche_nom} ?`)) {
      return;
    }

    try {
      // Supprimer les contextes
      if (importRecord.contexte_data) {
        await supabase
          .from('marche_contextes_hybrids')
          .delete()
          .eq('marche_id', importRecord.marche_id)
          .eq('opus_id', exploration?.id);
      }

      // Supprimer les fables
      if (importRecord.fables_data?.length > 0) {
        await supabase
          .from('fables_narratives')
          .delete()
          .eq('marche_id', importRecord.marche_id)
          .eq('opus_id', exploration?.id);
      }

      toast({
        title: "Import supprimé",
        description: `L'import pour ${importRecord.marche_nom} a été supprimé`
      });

      loadImports(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'import",
        variant: "destructive"
      });
    }
  };

  const getImportStatus = (importRecord: ImportRecord) => {
    const hasContexte = !!importRecord.contexte_data;
    const hasFables = !!importRecord.fables_data?.length;
    
    if (hasContexte && hasFables) return { status: 'complete', label: 'Complet', color: 'bg-green-500' };
    if (hasContexte || hasFables) return { status: 'partial', label: 'Partiel', color: 'bg-yellow-500' };
    return { status: 'empty', label: 'Vide', color: 'bg-red-500' };
  };

  // Fonction de recherche récursive dans les objets et tableaux
  const searchInObject = (obj: any, searchTerms: string[]): boolean => {
    if (!obj || typeof obj === 'function') return false;
    
    // Recherche dans les chaînes de caractères
    if (typeof obj === 'string') {
      const normalizedText = obj.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
      
      return searchTerms.some(term => {
        const normalizedTerm = term.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedText.includes(normalizedTerm);
      });
    }
    
    // Recherche dans les nombres convertis en chaîne
    if (typeof obj === 'number') {
      return searchTerms.some(term => 
        obj.toString().toLowerCase().includes(term.toLowerCase())
      );
    }
    
    // Recherche récursive dans les tableaux
    if (Array.isArray(obj)) {
      return obj.some(item => searchInObject(item, searchTerms));
    }
    
    // Recherche récursive dans les objets
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => searchInObject(value, searchTerms));
    }
    
    return false;
  };

  // Filtrage des imports avec recherche approfondie
  const filteredImports = imports.filter(importRecord => {
    // Filtrage par date
    const matchesDate = !dateFilter || 
      importRecord.import_date.startsWith(dateFilter);
    
    // Si pas de terme de recherche, on filtre seulement par date
    if (!searchTerm.trim()) {
      return matchesDate;
    }
    
    // Découpage du terme de recherche en mots individuels
    const searchTerms = searchTerm.trim().split(/\s+/).filter(term => term.length > 0);
    
    // Recherche dans les informations de base du marché
    const matchesBasicInfo = 
      importRecord.marche_nom && searchInObject(importRecord.marche_nom, searchTerms) ||
      importRecord.marche_ville && searchInObject(importRecord.marche_ville, searchTerms);
    
    // Recherche dans les données de contexte
    const matchesContexte = importRecord.contexte_data && 
      searchInObject(importRecord.contexte_data, searchTerms);
    
    // Recherche dans les fables
    const matchesFables = importRecord.fables_data?.length > 0 && 
      searchInObject(importRecord.fables_data, searchTerms);
    
    // Recherche dans les sources
    const matchesSources = importRecord.sources?.length > 0 && 
      searchInObject(importRecord.sources, searchTerms);
    
    const matchesSearch = matchesBasicInfo || matchesContexte || matchesFables || matchesSources;
    
    return matchesSearch && matchesDate;
  });

  useEffect(() => {
    loadImports();
  }, [exploration?.id]);

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Exploration non trouvée</p>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Imports IA - ${exploration.name} - La Fréquence du Vivant`}
        description={`Gestion des imports IA pour l'exploration ${exploration.name}`}
        keywords="imports, IA, exploration, gestion"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
        <div className="container mx-auto max-w-7xl">
          {/* En-tête */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/explorations')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Imports IA</h1>
                <p className="text-muted-foreground">
                  {exploration.name}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setImportModalOpen(true)}
                className="bg-gradient-to-r from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Import
              </Button>
              <Button onClick={loadImports} disabled={loading} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Chargement...' : 'Actualiser'}
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher dans tous les contenus (marché, contexte, fables, sources)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto"
                    placeholder="Filtrer par date"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {setSearchTerm(''); setDateFilter('');}}
                    disabled={!searchTerm && !dateFilter}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Effacer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenu principal */}
          <Tabs defaultValue="imports" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="imports" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Imports ({filteredImports.length})
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                📊 Statistiques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="imports" className="space-y-4">
              {filteredImports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-medium mb-2">
                      {searchTerm || dateFilter ? 'Aucun import trouvé' : 'Aucun import disponible'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || dateFilter 
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Utilisez l\'interface d\'import IA pour ajouter des données'
                      }
                    </p>
                    {searchTerm || dateFilter ? (
                      <Button 
                        variant="outline" 
                        onClick={() => {setSearchTerm(''); setDateFilter('');}}
                      >
                        Afficher tous les imports
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredImports.map((importRecord) => {
                    const status = getImportStatus(importRecord);
                    return (
                      <Card key={importRecord.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {importRecord.marche_nom}
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                              </CardTitle>
                              <CardDescription className="flex flex-col gap-1 mt-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(importRecord.import_date).toLocaleDateString('fr-FR')}
                                </div>
                                {importRecord.marche_ville && (
                                  <span className="text-sm text-muted-foreground">
                                    📍 {importRecord.marche_ville}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">{status.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4 mb-4 text-center">
                            <div>
                              <div className="text-xl font-bold text-primary">
                                {importRecord.completude_score}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Complétude
                              </div>
                            </div>
                            <div>
                              <div className="text-xl font-bold">
                                {importRecord.contexte_data ? '✅' : '❌'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Contexte
                              </div>
                            </div>
                            <div>
                              <div className="text-xl font-bold">
                                {importRecord.fables_data?.length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Fables
                              </div>
                            </div>
                            <div>
                              <div className="text-xl font-bold">
                                {importRecord.sources.length}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Sources
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedImport(importRecord)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteImport(importRecord)}
                            >
                              <Trash2 className="w-4 h-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Total Imports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{imports.length}</div>
                    <p className="text-sm text-muted-foreground">marchés importés</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Imports Complets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {imports.filter(i => getImportStatus(i).status === 'complete').length}
                    </div>
                    <p className="text-sm text-muted-foreground">contexte + fables</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Imports Partiels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {imports.filter(i => getImportStatus(i).status === 'partial').length}
                    </div>
                    <p className="text-sm text-muted-foreground">incomplets</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Complétude Moyenne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {imports.length > 0 
                        ? Math.round(imports.reduce((acc, i) => acc + i.completude_score, 0) / imports.length)
                        : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">score global</p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphique de répartition */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['complete', 'partial', 'empty'].map(status => {
                      const count = imports.filter(i => getImportStatus(i).status === status).length;
                      const percentage = imports.length > 0 ? (count / imports.length) * 100 : 0;
                      const statusInfo = status === 'complete' ? 
                        { label: 'Complets', color: 'bg-green-500' } :
                        status === 'partial' ? 
                        { label: 'Partiels', color: 'bg-yellow-500' } :
                        { label: 'Vides', color: 'bg-red-500' };
                      
                      return (
                        <div key={status} className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded ${statusInfo.color}`} />
                          <span className="min-w-[80px] text-sm">{statusInfo.label}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${statusInfo.color} transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[60px] text-right">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modal détails */}
          {selectedImport && (
            <OpusImportDetail
              importRecord={selectedImport}
              onClose={() => setSelectedImport(null)}
            />
          )}

          {/* Modal Import IA */}
          <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import des données IA</DialogTitle>
              </DialogHeader>
              {exploration && (
                <OpusImportInterface 
                  marcheId=""
                  marcheName=""
                  explorationId={exploration.id}
                  onSuccess={() => {
                    setImportModalOpen(false);
                    toast({
                      title: "Données importées avec succès",
                      description: "Les nouvelles données IA ont été importées"
                    });
                    loadImports(); // Recharger la liste
                  }}
                  onClose={() => setImportModalOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ExplorationImports;