import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database,
  Leaf,
  Users,
  Zap,
  Globe,
  Calendar,
  MapPin,
  Target,
  Sparkles,
  Brain,
  PieChart
} from 'lucide-react';
import { getProcessedSpeciesCount, processSpeciesData } from '@/utils/speciesDataUtils';
import { getVocabularyTermsCount } from '@/utils/vocabularyDataUtils';
import { processTechnodiversiteData } from '@/utils/technodiversiteDataUtils';

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

interface DataInsightsDashboardProps {
  imports: ImportRecord[];
}

export const DataInsightsDashboard: React.FC<DataInsightsDashboardProps> = ({ imports }) => {
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const totalImports = imports.length;
    const completeImports = imports.filter(imp => 
      imp.contexte_data && imp.fables_data?.length > 0
    ).length;
    const partialImports = imports.filter(imp => 
      (imp.contexte_data && !imp.fables_data?.length) || 
      (!imp.contexte_data && imp.fables_data?.length > 0)
    ).length;
    const emptyImports = totalImports - completeImports - partialImports;

    // Biodiversity metrics (use normalized processing for strict consistency)
    const totalSpecies = imports.reduce((acc, imp) => {
      return acc + getProcessedSpeciesCount(imp.contexte_data?.especes_caracteristiques);
    }, 0);

    const uniqueSpecies = new Set<string>();
    imports.forEach(imp => {
      const processed = processSpeciesData(imp.contexte_data?.especes_caracteristiques);
      const addKey = (s: any) => {
        const key = `${(s.nom_commun || s.titre || '').toLowerCase()}|${(s.nom_scientifique || '').toLowerCase()}`;
        uniqueSpecies.add(key);
      };
      processed.flore.forEach(addKey);
      Object.values(processed.faune).forEach((list) => list.forEach(addKey));
    });

    // Vocabulary metrics
    const totalVocabulary = imports.reduce((acc, imp) => {
      return acc + getVocabularyTermsCount(imp.contexte_data?.vocabulaire_local);
    }, 0);

    // Technology metrics
    const totalTechnology = imports.reduce((acc, imp) => {
      const tech = imp.contexte_data?.technodiversite;
      return acc + processTechnodiversiteData(tech).totalCount;
    }, 0);

    // Temporal analysis
    const importsByMonth = imports.reduce((acc, imp) => {
      const month = new Date(imp.import_date).toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Geographic analysis
    const importsByCity = imports.reduce((acc, imp) => {
      const city = imp.marche_ville || 'Non spécifié';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Completeness analysis
    const avgCompleteness = totalImports > 0 
      ? Math.min(Math.round(imports.reduce((acc, imp) => acc + Math.min(imp.completude_score || 0, 100), 0) / totalImports), 100)
      : 0;

    const completenessDistribution = {
      excellent: imports.filter(imp => Math.min(imp.completude_score || 0, 100) >= 80).length,
      good: imports.filter(imp => Math.min(imp.completude_score || 0, 100) >= 60 && Math.min(imp.completude_score || 0, 100) < 80).length,
      average: imports.filter(imp => Math.min(imp.completude_score || 0, 100) >= 40 && Math.min(imp.completude_score || 0, 100) < 60).length,
      poor: imports.filter(imp => Math.min(imp.completude_score || 0, 100) < 40).length,
    };

    // Sources analysis
    const totalSources = imports.reduce((acc, imp) => acc + imp.sources.length, 0);
    const avgSourcesPerImport = totalImports > 0 ? Math.round(totalSources / totalImports) : 0;

    return {
      totalImports,
      completeImports,
      partialImports,
      emptyImports,
      totalSpecies,
      uniqueSpeciesCount: uniqueSpecies.size,
      totalVocabulary,
      totalTechnology,
      totalSources,
      avgSourcesPerImport,
      avgCompleteness,
      completenessDistribution,
      importsByMonth,
      importsByCity
    };
  }, [imports]);

  const completionRate = imports.length > 0 
    ? Math.round((analytics.completeImports / imports.length) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          Data Insights Dashboard
        </h2>
        <p className="text-muted-foreground">
          Analyse complète des données collectées et traitées par l'IA
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Taux de Complétion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info mb-2">
              {completionRate}%
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {analytics.completeImports} sur {analytics.totalImports} imports complets
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Biodiversité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-1">
              {analytics.uniqueSpeciesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              espèces uniques sur {analytics.totalSpecies} références
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {analytics.totalSpecies} entrées totales
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patrimoine Linguistique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning mb-1">
              {analytics.totalVocabulary}
            </div>
             <p className="text-xs text-muted-foreground">
               éléments de vocabulaire collectés
             </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Patrimoine vivant
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Innovation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent mb-1">
              {analytics.totalTechnology}
            </div>
            <p className="text-xs text-muted-foreground">
              solutions technodiversité identifiées
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Futurs possibles
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Analysis */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Analyse de Qualité des Données
          </CardTitle>
          <CardDescription>
            Distribution de la complétude et qualité des imports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics.completenessDistribution.excellent}
              </div>
              <p className="text-xs text-muted-foreground">Excellent (80%+)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analytics.completenessDistribution.good}
              </div>
              <p className="text-xs text-muted-foreground">Bon (60-79%)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {analytics.completenessDistribution.average}
              </div>
              <p className="text-xs text-muted-foreground">Moyen (40-59%)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {analytics.completenessDistribution.poor}
              </div>
              <p className="text-xs text-muted-foreground">Faible (&lt;40%)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Complétude moyenne</span>
                <span className="text-sm text-muted-foreground">{analytics.avgCompleteness}%</span>
              </div>
              <Progress value={analytics.avgCompleteness} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temporal and Geographic Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal Analysis */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Évolution Temporelle
            </CardTitle>
            <CardDescription>
              Distribution des imports par période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.importsByMonth)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium">{month}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    <div className="w-20">
                      <Progress 
                        value={(count / Math.max(...Object.values(analytics.importsByMonth))) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Analysis */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Répartition Géographique
            </CardTitle>
            <CardDescription>
              Distribution des imports par localité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.importsByCity)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {city}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    <div className="w-20">
                      <Progress 
                        value={(count / Math.max(...Object.values(analytics.importsByCity))) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources and Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4" />
              Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-info">
                {analytics.totalSources}
              </div>
              <p className="text-xs text-muted-foreground">
                sources total collectées
              </p>
              <Badge variant="outline" className="text-xs">
                ~{analytics.avgSourcesPerImport} par import
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4" />
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Complets</span>
                <Badge variant="default" className="bg-green-500">
                  {analytics.completeImports}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Partiels</span>
                <Badge variant="default" className="bg-yellow-500">
                  {analytics.partialImports}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Vides</span>
                <Badge variant="default" className="bg-red-500">
                  {analytics.emptyImports}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-4 h-4" />
              IA Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-accent">
                {analytics.avgCompleteness}%
              </div>
              <p className="text-xs text-muted-foreground">
                performance moyenne IA
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  analytics.avgCompleteness >= 80 ? 'text-green-600 border-green-600' :
                  analytics.avgCompleteness >= 60 ? 'text-yellow-600 border-yellow-600' :
                  'text-red-600 border-red-600'
                }`}
              >
                {analytics.avgCompleteness >= 80 ? 'Excellent' :
                 analytics.avgCompleteness >= 60 ? 'Bon' : 'À améliorer'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {analytics.totalImports > 0 && (
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recommandations Stratégiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.avgCompleteness < 70 && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Améliorer la Complétude
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    La complétude moyenne est de {analytics.avgCompleteness}%. 
                    Considérez optimiser les prompts IA ou enrichir les sources.
                  </p>
                </div>
              )}
              
              {analytics.emptyImports > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Traiter les Imports Vides
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {analytics.emptyImports} import{analytics.emptyImports > 1 ? 's' : ''} 
                    sans données. Relancer les processus d'import IA.
                  </p>
                </div>
              )}

              {analytics.uniqueSpeciesCount > 50 && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Richesse Écologique
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Excellente diversité avec {analytics.uniqueSpeciesCount} espèces uniques. 
                    Idéal pour analyses de biodiversité approfondies.
                  </p>
                </div>
              )}

              {analytics.totalVocabulary > 100 && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Patrimoine Linguistique Riche
                  </h4>
                   <p className="text-sm text-muted-foreground">
                     {analytics.totalVocabulary} éléments de vocabulaire collectés. 
                     Excellent potentiel pour préservation culturelle.
                   </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};