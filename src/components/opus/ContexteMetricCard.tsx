import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Droplets, 
  Thermometer, 
  Activity, 
  Eye, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  Waves,
  Beaker,
  Ruler,
  AlertCircle,
  Database,
  Gauge,
  Calendar,
  Filter
} from 'lucide-react';
import { formatComplexData, getDataAvailability, ContexteMetricData } from '@/utils/contexteDataMapper';
import { 
  normalizeYearFromSource, 
  collectAvailableYears, 
  generateShortName, 
  formatSourcesSummary,
  type SourceWithYear 
} from '@/utils/sourceDateUtils';
import { getVignetteStyles } from '@/utils/vignetteStyleUtils';

interface ContexteMetricProps extends ContexteMetricData {
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ContexteMetricCard: React.FC<ContexteMetricProps> = ({
  title,
  data,
  icon: Icon,
  variant = 'default',
  metricType = 'description',
  unit,
  className = ''
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  const availability = getDataAvailability(data);
  const formattedData = formatComplexData(data);
  
  // Console log for debugging
  console.log(`ContexteMetricCard ${title}:`, { data, formattedData, availability });

  // Process sources for source_ids metric type using scientific utility
  const processedSources = useMemo(() => {
    if (metricType !== 'source_ids' || !Array.isArray(data)) {
      return [];
    }
    
    const normalizedSources = data.map(source => normalizeYearFromSource(source));
    
    // Filter by selected year
    if (selectedYear === 'all') {
      return normalizedSources;
    } else if (selectedYear === 'inconnue') {
      return normalizedSources.filter(source => !source.year);
    } else {
      return normalizedSources.filter(source => source.year && source.year.toString() === selectedYear);
    }
  }, [data, selectedYear, metricType]);

  // Extract available years for filtering using scientific utility
  const availableYears = useMemo(() => {
    if (metricType !== 'source_ids') return [];
    
    const normalizedSources = Array.isArray(data) ? data.map(source => normalizeYearFromSource(source)) : [];
    return collectAvailableYears(normalizedSources);
  }, [data, metricType]);

  // Map availability to vignette variant for Contrast-Force Hierarchy
  const getVariantFromAvailability = () => {
    switch (availability) {
      case 'available':
        return 'species'; // Green variant for available data
      case 'partial':
        return 'infrastructure'; // Orange variant for partial data  
      case 'missing':
        return 'technology'; // Purple variant for missing data
      default:
        return 'default';
    }
  };

  const vignetteVariant = getVariantFromAvailability();
  const styles = getVignetteStyles(vignetteVariant);

  const getQualityBadge = () => {
    switch (availability) {
      case 'available':
        return <Badge className={`font-semibold text-xs ${styles.badge}`}>LIVE DATA</Badge>;
      case 'partial':
        return <Badge className="bg-warning/10 text-warning border-warning/30 font-semibold text-xs">PARTIEL</Badge>;
      case 'missing':
        return <Badge className="bg-primary/10 text-primary border-primary/30 font-semibold text-xs">MANQUANT</Badge>;
    }
  };

  const getMetricIcon = () => {
    if (Icon) return <Icon className="w-4 h-4" />;
    
    switch (metricType) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'ph':
        return <Beaker className="w-4 h-4" />;
      case 'flow':
        return <Waves className="w-4 h-4" />;
      case 'quality':
        return <Activity className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getStatusIndicator = () => {
    switch (availability) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogTrigger asChild>
        <Card className={`group cursor-pointer ${styles.container} ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getMetricIcon()}
                <span className={`text-sm leading-tight font-bold text-white`}>{title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIndicator()}
                {getQualityBadge()}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Affichage de la donnée - Contrast-Force Hierarchy amélioré */}
            <div className="p-4 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-white/10 shadow-lg">
              <div className="space-y-2">
                <div className="text-base font-medium text-white leading-relaxed">
                  {metricType === 'source_ids' ? formatSourcesSummary(processedSources) : formattedData}
                </div>
                {unit && (
                  <div className="text-sm font-medium text-slate-300">
                    {unit}
                  </div>
                )}
                
                {/* Indicateur de qualité - adapté au variant */}
                <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden mt-3">
                  <div 
                    className={`h-full transition-all duration-1000 group-hover:opacity-90 ${
                      availability === 'available' ? 'bg-gradient-to-r from-success to-success-light' :
                      availability === 'partial' ? 'bg-gradient-to-r from-warning to-orange-200' :
                      'bg-gradient-to-r from-primary to-violet-200'
                    }`}
                    style={{ 
                      width: availability === 'available' ? '100%' : 
                             availability === 'partial' ? '60%' : '20%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Indicateur d'action */}
            <div className="flex items-center justify-center text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Eye className="w-3 h-3 mr-1" />
              <span>Cliquer pour les détails</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-slate-900 text-white border-slate-700">
        <DialogHeader className="border-b border-slate-700/50 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                availability === 'available' ? 'bg-emerald-100 text-emerald-700' :
                availability === 'partial' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {getMetricIcon()}
              </div>
               <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-sm text-white">Analyse détaillée des données</p>
              </div>
            </div>
            {getQualityBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-1">
          <div className="space-y-6 py-4">
            {/* Valeur principale - Version élégante */}
            <div className={`p-6 rounded-xl border-2 ${
              availability === 'available' ? 'bg-emerald-50/80 border-emerald-200' :
              availability === 'partial' ? 'bg-amber-50/80 border-amber-200' :
              'bg-red-50/80 border-red-200'
            }`}>
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {getStatusIndicator()}
                  <span className="text-sm font-medium text-slate-600">Valeur actuelle</span>
                </div>
                
                <div className={`text-3xl font-bold ${
                  availability === 'available' ? 'text-emerald-800' :
                  availability === 'partial' ? 'text-amber-800' :
                  'text-red-800'
                }`}>
                  {metricType === 'source_ids' ? formatSourcesSummary(processedSources) : formattedData}
                  {unit && <span className="text-lg text-slate-600 ml-2">{unit}</span>}
                </div>

                {/* Barre de progression élégante */}
                <div className="flex items-center justify-center mt-4">
                  <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        availability === 'available' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                        availability === 'partial' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ 
                        width: availability === 'available' ? '100%' : 
                               availability === 'partial' ? '60%' : '20%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Affichage spécialisé pour les sources avec filtres et scrolling */}
            {metricType === 'source_ids' && Array.isArray(data) && data.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-white" />
                    Sources détaillées ({processedSources.length})
                  </h3>
                  
                  {/* Filtre par année */}
                  {availableYears.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year === 'inconnue' ? 'Année inconnue' : year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Zone scrollable pour les sources */}
                <ScrollArea className="h-96 w-full rounded-lg border border-slate-600 bg-slate-800/50 p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                    {processedSources.map((source, index) => (
                      <div key={source.id || index} className="p-4 bg-slate-800 rounded-lg border border-slate-600 shadow-sm hover:bg-slate-750 transition-colors">
                        <div className="space-y-3">
                          {/* En-tête avec nom court et badge ID */}
                          <div className="flex items-start justify-between">
                            <div className="text-sm font-bold text-white">
                              {generateShortName(source)}
                            </div>
                            <Badge variant="outline" className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                              {source.id}
                            </Badge>
                          </div>

                          {/* Date de la source */}
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>Année: {source.yearDisplay}</span>
                          </div>

                          {/* URL cliquable */}
                          {source.url && source.url !== 'URL non disponible' && (
                            <div className="text-xs text-slate-400">
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline break-all line-clamp-2"
                                title={source.url}
                              >
                                {source.url}
                              </a>
                            </div>
                          )}

                          {/* Description (si disponible) */}
                          {source.description && source.description !== 'Détails non disponibles' && (
                            <div className="text-xs text-slate-300">
                              <span className="font-medium text-slate-400">Description:</span>
                              <p className="mt-1 line-clamp-3">
                                {source.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message si aucune source après filtrage */}
                  {processedSources.length === 0 && selectedYear !== 'all' && (
                    <div className="text-center py-8 text-slate-400">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune source trouvée pour {selectedYear === 'inconnue' ? 'les années inconnues' : `l'année ${selectedYear}`}</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Contenu de la donnée si c'est du texte long */}
            {typeof data === 'string' && data.length > 50 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-white" />
                  Description complète
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-700 leading-relaxed">{data}</p>
                </div>
              </div>
            )}

            {/* Données structurées pour les objets (sauf pour source_ids qui a son propre affichage) */}
            {typeof data === 'object' && data && metricType !== 'source_ids' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Données structurées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(data).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 break-words">
                        {String(value).slice(0, 100)}{String(value).length > 100 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(data).length > 6 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      +{Object.keys(data).length - 6} autres propriétés
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Interprétation contextuelle - Version améliorée */}
            {metricType === 'ph' && data && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Beaker className="w-4 h-4" />
                  Interprétation pH
                </h4>
                <p className="text-sm text-blue-700">
                  {parseFloat(data) < 6.5 ? '🔴 Eau acide - peut affecter la biodiversité aquatique' : 
                   parseFloat(data) > 8.5 ? '🔴 Eau basique - surveillance environnementale recommandée' : 
                   '🟢 pH optimal pour la vie aquatique et l\'écosystème'}
                </p>
              </div>
            )}

            {metricType === 'temperature' && data && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Analyse thermique
                </h4>
                <p className="text-sm text-orange-700">
                  {parseFloat(data) < 10 ? '🔵 Eau froide - caractéristique des sources naturelles et zones montagneuses' : 
                   parseFloat(data) > 25 ? '🔴 Eau chaude - possible pollution thermique ou influence climatique' : 
                   '🟢 Température modérée et favorable à la biodiversité aquatique'}
                </p>
              </div>
            )}

            {/* Section données brutes - En accordéon ou cachée par défaut */}
            <details className="group">
              <summary className="cursor-pointer p-3 bg-slate-100 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Données brutes (développeurs)
                  <span className="text-xs text-slate-500 ml-auto">Cliquer pour afficher</span>
                </span>
              </summary>
              <div className="mt-3 p-4 bg-slate-900 rounded-lg border">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-auto max-h-40">
{typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};