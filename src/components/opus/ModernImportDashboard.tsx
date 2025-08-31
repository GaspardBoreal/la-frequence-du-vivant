import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Home, 
  Database, 
  TrendingUp, 
  Activity,
  Zap,
  Leaf,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  BarChart3,
  Brain,
  RefreshCw,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { useExplorations } from '@/hooks/useExplorations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModernImportCard } from './ModernImportCard';
import { ModernImportFilters } from './ModernImportFilters';
import { ModernImportDetailModal } from './ModernImportDetailModal';
import { DataInsightsDashboard } from './DataInsightsDashboard';
import { OpusImportInterface } from './OpusImportInterface';
import SEOHead from '@/components/SEOHead';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

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

export const ModernImportDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [filteredImports, setFilteredImports] = useState<ImportRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: explorations } = useExplorations();
  const { data: marches } = useSupabaseMarches();
  
  const exploration = explorations?.find(exp => exp.slug === slug);

  // Animated counters for statistics
  const totalImports = useAnimatedCounter(filteredImports.length, 1000);
  const totalSpecies = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      const species = imp.contexte_data?.especes_caracteristiques;
      return acc + (Array.isArray(species) ? species.length : Object.keys(species || {}).length);
    }, 0), 
    1500
  );
  const totalVocabulary = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      const vocab = imp.contexte_data?.vocabulaire_local;
      return acc + (Array.isArray(vocab) ? vocab.length : Object.keys(vocab || {}).length);
    }, 0), 
    1200
  );
  const avgCompleteness = useAnimatedCounter(
    filteredImports.length > 0 
      ? Math.round(filteredImports.reduce((acc, imp) => acc + imp.completude_score, 0) / filteredImports.length)
      : 0, 
    1800
  );

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

      const importsList = Array.from(importsByMarche.values());
      setImports(importsList);
      setFilteredImports(importsList);
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

  const handleFilterChange = (filtered: ImportRecord[]) => {
    setFilteredImports(filtered);
  };

  const handleImportClick = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setDetailModalOpen(true);
  };

  const handleHomeClick = () => {
    navigate('/galerie-fleuve');
  };

  const handlePrefigurerClick = () => {
    window.open(`/galerie-fleuve/exploration/${slug}/prefigurer`, '_blank');
  };

  useEffect(() => {
    loadImports();
  }, [exploration?.id, marches]);

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-background">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-lg text-muted-foreground">Exploration non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`IA Dashboard - ${exploration.name} - La Fréquence du Vivant`}
        description={`Interface moderne de gestion des imports IA pour l'exploration ${exploration.name}`}
        keywords="IA, dashboard, exploration, données, analyse, moderne"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        {/* Header Premium */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleHomeClick}
                  className="hover:bg-primary/10 transition-all duration-300"
                >
                  <Home className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      IA Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {exploration.name}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handlePrefigurerClick}
                  variant="outline"
                  className="bg-gradient-to-r from-accent/10 to-accent/20 border-accent/30 hover:from-accent/20 hover:to-accent/30 transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Préfigurer
                </Button>
                <Button 
                  onClick={() => setImportModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Import
                </Button>
                <Button 
                  onClick={loadImports} 
                  disabled={loading} 
                  variant="outline"
                  className="hover:bg-secondary/50 transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-background/50 backdrop-blur-sm border border-border/30">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Database className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="imports" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Activity className="w-4 h-4" />
                Imports ({filteredImports.length})
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                Data Insights
              </TabsTrigger>
            </TabsList>

            {/* Statistics Dashboard */}
            <TabsContent value="dashboard" className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Total Imports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {totalImports}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      imports collectés
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Espèces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent-foreground">
                      {totalSpecies}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      espèces référencées
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Vocabulaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary-foreground">
                      {totalVocabulary}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      termes locaux
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Complétude
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {avgCompleteness}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      moyenne générale
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Imports Preview */}
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Imports Récents
                  </CardTitle>
                  <CardDescription>
                    Aperçu des derniers imports collectés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {filteredImports.slice(0, 4).map((importRecord) => (
                      <ModernImportCard
                        key={importRecord.id}
                        importRecord={importRecord}
                        onClick={() => handleImportClick(importRecord)}
                        compact={true}
                      />
                    ))}
                  </div>
                  {filteredImports.length > 4 && (
                    <div className="mt-6 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('imports')}
                        className="hover:bg-primary/10 transition-all duration-300"
                      >
                        Voir tous les imports
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Imports List */}
            <TabsContent value="imports" className="space-y-6">
              <ModernImportFilters
                imports={imports}
                onFilterChange={handleFilterChange}
                loading={loading}
              />
              
              {loading ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredImports.length === 0 ? (
                <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                  <CardContent className="p-12 text-center">
                    <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-medium mb-2">
                      Aucun import trouvé
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Modifiez vos critères de recherche ou créez un nouveau import
                    </p>
                    <Button 
                      onClick={() => setImportModalOpen(true)}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un import
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {filteredImports.map((importRecord) => (
                    <ModernImportCard
                      key={importRecord.id}
                      importRecord={importRecord}
                      onClick={() => handleImportClick(importRecord)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Data Insights */}
            <TabsContent value="insights" className="space-y-6">
              <DataInsightsDashboard imports={filteredImports} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        {selectedImport && (
          <ModernImportDetailModal
            importRecord={selectedImport}
            open={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedImport(null);
            }}
          />
        )}

        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
            <OpusImportInterface
              explorationId={exploration.id}
              onImportComplete={() => {
                setImportModalOpen(false);
                loadImports();
              }}
              onCancel={() => setImportModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};