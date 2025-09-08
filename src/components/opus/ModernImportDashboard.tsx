import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Filter,
  Eye,
  Trash2
} from 'lucide-react';
import { useSupabaseMarches } from '@/hooks/useSupabaseMarches';
import { useExplorations } from '@/hooks/useExplorations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ModernImportCard } from './ModernImportCard';
import { ModernImportFilters } from './ModernImportFilters';
import { ModernImportDetailModal } from './ModernImportDetailModal';
import { DataInsightsDashboard } from './DataInsightsDashboard';
import { OpusImportInterface } from './OpusImportInterface';
import { ExplorationSpeciesView } from './ExplorationSpeciesView';
import { ExplorationVocabularyView } from './ExplorationVocabularyView';
import { TechnodiversiteVignetteGrid } from './TechnodiversiteVignetteGrid';
import { InfrastructureVignetteGrid } from './InfrastructureVignetteGrid';
import SEOHead from '@/components/SEOHead';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { getProcessedSpeciesCount } from '@/utils/speciesDataUtils';
import { getVocabularyTermsCount } from '@/utils/vocabularyDataUtils';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';
import { processEmpreintesHumainesData } from '@/utils/empreintesHumainesDataUtils';
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
  contexte_data: {
    especes_caracteristiques?: any;
    vocabulaire_local?: any;
    contexte_hydrologique?: any;
    empreintes_humaines?: any;
    infrastructures_techniques?: any;
    leviers_agroecologiques?: any;
    nouvelles_activites?: any;
    technodiversite?: any;
    projection_2035_2045?: any;
    sources?: any[];
  };
  fables_data: any[];
  sources: any[];
  completude_score: number;
  marche_nom?: string;
  marche_ville?: string;
}

interface ImportRunRecord {
  id: string;
  created_at: string;
  mode: 'preview' | 'import';
  status: 'success' | 'error';
  opus_id: string;
  marche_id: string;
  completude_score?: number;
  validation?: any;
  error_message?: string;
  marche_nom?: string;
  marche_ville?: string;
  contexte_data: {
    especes_caracteristiques?: any;
    vocabulaire_local?: any;
    contexte_hydrologique?: any;
    empreintes_humaines?: any;
    infrastructures_techniques?: any;
    leviers_agroecologiques?: any;
    nouvelles_activites?: any;
    technodiversite?: any;
    projection_2035_2045?: any;
    sources?: any[];
  };
  sources: any[];
  fables_data: any[];
  import_date: string;
}

export const ModernImportDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [filteredImports, setFilteredImports] = useState<ImportRecord[]>([]);
  const [importRuns, setImportRuns] = useState<ImportRunRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [selectedImportForSpecies, setSelectedImportForSpecies] = useState<ImportRecord | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalDefaultTab, setDetailModalDefaultTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [importToDelete, setImportToDelete] = useState<ImportRecord | null>(null);
  
  const { data: explorations } = useExplorations();
  const { data: marches } = useSupabaseMarches();
  
  const exploration = explorations?.find(exp => exp.slug === slug);

  // Animated counters for statistics
  const totalImports = useAnimatedCounter(filteredImports.length, 1000);
  const totalSpecies = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      return acc + getProcessedSpeciesCount(imp.contexte_data?.especes_caracteristiques);
    }, 0), 
    1500
  );
  const totalVocabulary = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      return acc + getVocabularyTermsCount(imp.contexte_data?.vocabulaire_local);
    }, 0), 
    1500
  );
  const totalTechnodiversity = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      const techno = imp.contexte_data?.technodiversite;
      if (techno) {
        try {
          return acc + processTechnodiversiteData(techno).totalCount;
        } catch {
          return acc;
        }
      }
      return acc;
    }, 0), 
    2000
  );
  const totalInfrastructure = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      // Essayer différents chemins pour trouver les données d'infrastructure
      const contextData = imp.contexte_data as any;
      const infrastructures = contextData?.dimensions?.infrastructures_techniques ||
                            contextData?.infrastructures_techniques || 
                            contextData?.empreintes_humaines?.dimensions?.infrastructures_techniques ||
                            contextData?.empreintes_humaines?.infrastructures_techniques ||
                            contextData?.empreintes_humaines;
      if (infrastructures) {
        try {
          return acc + processEmpreintesHumainesData(infrastructures).totalCount;
        } catch {
          return acc;
        }
      }
      return acc;
    }, 0), 
    2500
  );
  const totalTechnology = useAnimatedCounter(
    filteredImports.reduce((acc, imp) => {
      if (imp.contexte_data?.technodiversite) {
        try {
          return acc + processTechnodiversiteData(imp.contexte_data.technodiversite).totalCount;
        } catch {
          return acc;
        }
      }
      return acc;
    }, 0), 
    1400
  );
  const avgCompleteness = useAnimatedCounter(
    filteredImports.length > 0 
      ? Math.round(filteredImports.reduce((acc, imp) => acc + imp.completude_score, 0) / filteredImports.length)
      : 0, 
    1800
  );

  const loadImports = async () => {
    if (!exploration) return;
    
    console.log('🔄 loadImports appelé pour exploration:', exploration.id);
    setLoading(true);
    
    try {
      // Invalider les caches React Query AVANT de recharger
      await queryClient.invalidateQueries({ 
        queryKey: ['marche-contextes'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['opus-contextes'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['opus-import-runs'] 
      });
      
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
            contexte_data: {
              especes_caracteristiques: contexte.especes_caracteristiques,
              vocabulaire_local: contexte.vocabulaire_local,
              contexte_hydrologique: contexte.contexte_hydrologique,
              empreintes_humaines: contexte.empreintes_humaines,
              infrastructures_techniques: (contexte as any)?.infrastructures_techniques,
              leviers_agroecologiques: contexte.leviers_agroecologiques,
              nouvelles_activites: contexte.nouvelles_activites,
              technodiversite: contexte.technodiversite,
              projection_2035_2045: contexte.projection_2035_2045,
              sources: Array.isArray(contexte.sources) ? contexte.sources : []
            },
            fables_data: [],
            sources: Array.isArray(contexte.sources) ? contexte.sources : [],
            completude_score: contexte.completude_score || 0,
            marche_nom: marcheInfo?.nomMarche || 'Marche inconnue',
            marche_ville: marcheInfo?.ville || ''
          });
        } else {
          const existing = importsByMarche.get(marcheId)!;
          existing.contexte_data = {
            especes_caracteristiques: contexte.especes_caracteristiques,
            vocabulaire_local: contexte.vocabulaire_local,
            contexte_hydrologique: contexte.contexte_hydrologique,
            empreintes_humaines: contexte.empreintes_humaines,
            infrastructures_techniques: (contexte as any)?.infrastructures_techniques,
            leviers_agroecologiques: contexte.leviers_agroecologiques,
            nouvelles_activites: contexte.nouvelles_activites,
            technodiversite: contexte.technodiversite,
            projection_2035_2045: contexte.projection_2035_2045,
            sources: Array.isArray(contexte.sources) ? contexte.sources : []
          };
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
    setDetailModalDefaultTab("overview");
    setDetailModalOpen(true);
  };

  const handleSpeciesClick = () => {
    setActiveTab('species');
  };

  const handleVocabularyClick = () => {
    setActiveTab('vocabulary');
  };

  const handleHomeClick = () => {
    navigate('/galerie-fleuve');
  };

  const handlePrefigurerClick = () => {
    window.open(`/galerie-fleuve/exploration/${slug}/prefigurer`, '_blank');
  };

  const loadImportHistory = async () => {
    if (!exploration) return;
    
    console.log('🔄 loadImportHistory appelé pour exploration:', exploration.id);
    setHistoryLoading(true);
    
    try {
      // Récupérer les runs
      const { data: runs, error: runsError } = await supabase
        .from('opus_import_runs')
        .select('*')
        .eq('opus_id', exploration.id)
        .order('created_at', { ascending: false });

      if (runsError) throw runsError;

      // Récupérer les données contextuelles pour chaque run
      const enrichedRuns: ImportRunRecord[] = [];
      
      for (const run of runs || []) {
        const marcheInfo = marches?.find(m => m.id === run.marche_id);
        
        // Récupérer les données contextuelles
        const { data: contexteData } = await supabase
          .from('marche_contextes_hybrids')
          .select('*')
          .eq('marche_id', run.marche_id)
          .eq('opus_id', run.opus_id)
          .single();
        
        enrichedRuns.push({
          id: run.id,
          created_at: run.created_at,
          mode: run.mode as 'preview' | 'import',
          status: run.status as 'success' | 'error',
          opus_id: run.opus_id,
          marche_id: run.marche_id,
          import_date: run.created_at,
          completude_score: run.completude_score || 0,
          marche_nom: marcheInfo?.nomMarche || 'Marché inconnu',
          marche_ville: marcheInfo?.ville || '',
          contexte_data: {
            especes_caracteristiques: contexteData?.especes_caracteristiques,
            vocabulaire_local: contexteData?.vocabulaire_local,
            contexte_hydrologique: contexteData?.contexte_hydrologique,
            empreintes_humaines: contexteData?.empreintes_humaines,
            infrastructures_techniques: (contexteData as any)?.infrastructures_techniques,
            leviers_agroecologiques: contexteData?.leviers_agroecologiques,
            nouvelles_activites: contexteData?.nouvelles_activites,
            technodiversite: contexteData?.technodiversite,
            projection_2035_2045: contexteData?.projection_2035_2045,
            sources: contexteData?.sources as any[]
          },
          sources: contexteData?.sources as any[] || [],
          fables_data: []
        });
      }

      setImportRuns(enrichedRuns);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des imports",
        variant: "destructive"
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDeleteImport = async () => {
    if (!importToDelete || !exploration) return;

    try {
      if (importToDelete.contexte_data) {
        await supabase
          .from('marche_contextes_hybrids')
          .delete()
          .eq('marche_id', importToDelete.marche_id)
          .eq('opus_id', exploration.id);
      }

      if (importToDelete.fables_data?.length > 0) {
        await supabase
          .from('fables_narratives')
          .delete()
          .eq('marche_id', importToDelete.marche_id)
          .eq('opus_id', exploration.id);
      }

      toast({
        title: 'Import supprimé',
        description: `L'import pour ${importToDelete.marche_nom} a été supprimé`
      });

      setImportToDelete(null);
      await loadImports();
      if (activeTab === 'history') await loadImportHistory();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'import",
        variant: 'destructive'
      });
    }
  };
  useEffect(() => {
    loadImports();
  }, [exploration?.id, marches]);

  useEffect(() => {
    if (activeTab === 'history' && exploration?.id && marches) {
      loadImportHistory();
    }
  }, [activeTab, exploration?.id, marches]);

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
            <TabsList className="grid w-full grid-cols-8 mb-8 bg-background/50 backdrop-blur-sm border border-border/30">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Database className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="species" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Leaf className="w-4 h-4" />
                Espèces ({totalSpecies})
              </TabsTrigger>
              <TabsTrigger 
                value="vocabulary" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Users className="w-4 h-4" />
                Vocabulaire ({totalVocabulary})
              </TabsTrigger>
              <TabsTrigger 
                value="technodiversity" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Zap className="w-4 h-4" />
                Technodiversité ({totalTechnodiversity})
              </TabsTrigger>
              <TabsTrigger 
                value="infrastructure" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <MapPin className="w-4 h-4" />
                Infrastructure ({totalInfrastructure})
              </TabsTrigger>
              <TabsTrigger 
                value="imports" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Activity className="w-4 h-4" />
                Imports ({filteredImports.length})
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                Historique
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Statistics Dashboard */}
            <TabsContent value="dashboard" className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Total Imports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-success">
                       {totalImports}
                     </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      imports collectés
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer"
                  onClick={handleSpeciesClick}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Espèces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-info">
                       {totalSpecies}
                     </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      espèces référencées
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300 cursor-pointer"
                  onClick={handleVocabularyClick}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Vocabulaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-warning">
                       {totalVocabulary}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       éléments de vocabulaire
                     </p>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Technodiversité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold text-purple-500">
                       {totalTechnology}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       technologies
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
                     <div className="text-3xl font-bold text-success">
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

            {/* Species View */}
            <TabsContent value="species" className="space-y-6">
              <ExplorationSpeciesView imports={filteredImports} />
            </TabsContent>

            {/* Vocabulary View */}
            <TabsContent value="vocabulary" className="space-y-6">
              <ExplorationVocabularyView imports={filteredImports} />
            </TabsContent>

            {/* Technodiversity View */}
            <TabsContent value="technodiversity" className="space-y-6">
              <div className="space-y-6">
                {filteredImports.length > 0 ? (
                  filteredImports.map((importRecord) => (
                    importRecord.contexte_data?.technodiversite && (
                      <div key={importRecord.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{importRecord.marche_nom}</h3>
                            <p className="text-sm text-muted-foreground">{importRecord.marche_ville}</p>
                          </div>
                        </div>
                        <TechnodiversiteVignetteGrid
                          technodiversiteData={importRecord.contexte_data.technodiversite}
                          importSources={importRecord.sources}
                        />
                      </div>
                    )
                  ))
                ) : (
                  <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50">🔧</div>
                      <h3 className="text-lg font-medium mb-2">Aucune technodiversité disponible</h3>
                      <p className="text-muted-foreground">
                        Aucune technologie n'a été identifiée dans les imports de cette exploration.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Infrastructure View */}
            <TabsContent value="infrastructure" className="space-y-6">
              <div className="space-y-6">
                {filteredImports.length > 0 ? (
                  filteredImports.map((importRecord) => {
                    const contextData = importRecord.contexte_data as any;
                    const infra = contextData?.dimensions?.infrastructures_techniques 
                      || contextData?.infrastructures_techniques 
                      || contextData?.empreintes_humaines 
                      || null;
                    if (!infra) return null;
                    return (
                      <div key={importRecord.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{importRecord.marche_nom}</h3>
                            <p className="text-sm text-muted-foreground">{importRecord.marche_ville}</p>
                          </div>
                        </div>
                        <InfrastructureVignetteGrid
                          empreintesHumainesData={infra}
                          importSources={importRecord.sources}
                        />
                      </div>
                    );
                  })
                ) : (
                  <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50">🏗️</div>
                      <h3 className="text-lg font-medium mb-2">Aucune infrastructure identifiée</h3>
                      <p className="text-muted-foreground">
                        Aucune empreinte humaine n'a été recensée dans les imports de cette exploration.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
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

            {/* Import History */}
            <TabsContent value="history" className="space-y-6">
              <Card className="bg-background/50 backdrop-blur-sm border-border/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Historique complet des imports
                      </CardTitle>
                      <CardDescription>
                        Tous les imports et previews exécutés pour cette exploration
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={loadImportHistory} 
                      disabled={historyLoading} 
                      variant="outline"
                      size="sm"
                      className="hover:bg-secondary/50 transition-all duration-300"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                          <div className="w-12 h-12 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                          <div className="w-20 h-6 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredImports.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-medium mb-2">
                        Aucun historique
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Effectuez un import pour voir l'historique s'afficher ici
                      </p>
                      <Button 
                        onClick={() => setImportModalOpen(true)}
                        className="bg-gradient-to-r from-primary to-primary/80"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Premier import
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredImports.map((importRecord) => {
                        const speciesCount = getProcessedSpeciesCount(importRecord.contexte_data?.especes_caracteristiques);
                        const vocabularyCount = getVocabularyTermsCount(importRecord.contexte_data?.vocabulaire_local);
                        const technologyCount = importRecord.contexte_data?.technodiversite 
                          ? (() => {
                              try {
                                return processTechnodiversiteData(importRecord.contexte_data.technodiversite).totalCount;
                              } catch {
                                return 0;
                              }
                            })()
                          : 0;
                        const infrastructureCount = importRecord.contexte_data?.empreintes_humaines 
                          ? (() => {
                              try {
                                return processEmpreintesHumainesData(importRecord.contexte_data.empreintes_humaines).totalCount;
                              } catch {
                                return 0;
                              }
                            })()
                          : 0;
                        const sourcesCount = importRecord.sources?.length || 0;
                        const completudeScore = importRecord.completude_score || 0;
                        
                        // Déterminer le statut basé sur le score de complétude
                        const getStatus = (score: number) => {
                          if (score >= 80) return { label: 'Complet', variant: 'default' as const, color: 'bg-green-100 text-green-600' };
                          if (score >= 40) return { label: 'Partiel', variant: 'secondary' as const, color: 'bg-orange-100 text-orange-600' };
                          return { label: 'Vide', variant: 'outline' as const, color: 'bg-gray-100 text-gray-600' };
                        };
                        
                        const status = getStatus(completudeScore);
                        
                        return (
                          <div 
                            key={importRecord.id} 
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                                <Database className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {importRecord.marche_nom} ({importRecord.marche_ville})
                                  </p>
                                  <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(importRecord.import_date).toLocaleString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {speciesCount > 0 && (
                                    <span className="ml-2 text-accent">
                                      • {speciesCount} espèce{speciesCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {vocabularyCount > 0 && (
                                    <span className="ml-2 text-secondary-foreground">
                                      • {vocabularyCount} terme{vocabularyCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {technologyCount > 0 && (
                                    <span className="ml-2 text-purple-500">
                                      • {technologyCount} technodiversité{technologyCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {infrastructureCount > 0 && (
                                    <span className="ml-2 text-amber-500">
                                      • {infrastructureCount} infrastructure{infrastructureCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </p>
                                {sourcesCount > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="text-blue-500">
                                      {sourcesCount} source{sourcesCount > 1 ? 's' : ''}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {Math.round(completudeScore)}%
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedImport(importRecord);
                                  setDetailModalOpen(true);
                                }}
                                className="transition-opacity"
                              >
                                <Eye className="w-4 h-4" />
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Insights */}
            <TabsContent value="insights" className="space-y-6">
              <DataInsightsDashboard imports={filteredImports} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        {(selectedImport || selectedImportForSpecies) && (
          <ModernImportDetailModal
            importRecord={(selectedImportForSpecies || selectedImport)!}
            open={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedImport(null);
              setSelectedImportForSpecies(null);
            }}
            defaultTab={detailModalDefaultTab}
          />
        )}

        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
            <DialogHeader className="sr-only">
              <DialogTitle>Interface d'import</DialogTitle>
              <DialogDescription>Interface pour importer des données dans l'exploration</DialogDescription>
            </DialogHeader>
            <OpusImportInterface
              marcheId=""
              marcheName=""
              explorationId={exploration.id}
              onSuccess={() => {
                console.log('🎉 Import terminé - Fermeture modal et rechargement');
                setImportModalOpen(false);
                
                // Toast informatif pour l'utilisateur
                toast({
                  title: "✅ Import terminé !",
                  description: "Actualisation des données...",
                  variant: "default"
                });
                
                // Recharger les données avec un léger délai pour laisser le temps à la DB de se mettre à jour
                setTimeout(() => {
                  loadImports();
                  // Recharger aussi l'historique si on est sur cet onglet
                  if (activeTab === 'history') {
                    loadImportHistory();
                  }
                }, 500);
              }}
              onClose={() => setImportModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

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
    </>
  );
};