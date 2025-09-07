import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Eye, 
  Calendar,
  Filter,
  BookOpen,
  Link
} from 'lucide-react';
import { 
  normalizeYearFromSource, 
  collectAvailableYears, 
  generateShortName, 
  formatSourcesSummary,
  type SourceWithYear 
} from '@/utils/sourceDateUtils';
import { getVignetteStyles } from '@/utils/vignetteStyleUtils';

interface VocabularySourcesCardProps {
  sources: any[];
  className?: string;
}

export const VocabularySourcesCard: React.FC<VocabularySourcesCardProps> = ({
  sources,
  className = ''
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Process sources using the same scientific utility as ContexteMetricCard
  const normalizedSources = useMemo(() => {
    return sources.map(source => normalizeYearFromSource(source));
  }, [sources]);

  // Filter sources by selected year
  const filteredSources = useMemo(() => {
    if (selectedYear === 'all') {
      return normalizedSources;
    } else if (selectedYear === 'inconnue') {
      return normalizedSources.filter(source => !source.year);
    } else {
      return normalizedSources.filter(source => source.year && source.year.toString() === selectedYear);
    }
  }, [normalizedSources, selectedYear]);

  // Extract available years for filtering
  const availableYears = useMemo(() => {
    return collectAvailableYears(normalizedSources);
  }, [normalizedSources]);

  // Use vocabulary variant styling
  const variant = 'vocabulary';
  const styles = getVignetteStyles(variant);
  
  // Generate compact summary for card display
  const sourcesSummary = formatSourcesSummary(normalizedSources, 2);

  return (
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogTrigger asChild>
        <Card className={`group cursor-pointer ${styles.container} ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm leading-tight font-bold text-white">Sources bibliographiques</span>
              </div>
              <Badge className={`font-semibold text-xs ${styles.badge}`}>
                {normalizedSources.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Affichage compact des sources */}
            <div className="p-4 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-white/10 shadow-lg">
              <div className="space-y-2">
                <div className="text-base font-medium text-white leading-relaxed">
                  {sourcesSummary}
                </div>
                <div className="text-sm font-medium text-slate-300">
                  {normalizedSources.length} source{normalizedSources.length > 1 ? 's' : ''} référencée{normalizedSources.length > 1 ? 's' : ''}
                </div>
                
                {/* Indicateur de progression */}
                <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden mt-3">
                  <div 
                    className="h-full transition-all duration-1000 group-hover:opacity-90 bg-gradient-to-r from-vocabulary to-vocabulary-light"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Indicateur d'action */}
            <div className="flex items-center justify-center text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Eye className="w-3 h-3 mr-1" />
              <span>Cliquer pour voir les détails</span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-slate-900 text-white border-slate-700">
        <DialogHeader className="border-b border-slate-700/50 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-vocabulary/20 text-vocabulary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sources bibliographiques</h2>
                <p className="text-sm text-white">Documentation et références du vocabulaire local</p>
              </div>
            </div>
            <Badge className={`font-semibold text-xs ${styles.badge}`}>
              {filteredSources.length} / {normalizedSources.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-1">
          <div className="space-y-6 py-4">
            {/* Résumé principal */}
            <div className="p-6 rounded-xl border-2 bg-vocabulary/10 border-vocabulary/30">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-vocabulary" />
                  <span className="text-sm font-medium text-slate-300">Sources disponibles</span>
                </div>
                
                <div className="text-3xl font-bold text-vocabulary">
                  {filteredSources.length}
                  <span className="text-lg text-slate-400 ml-2">source{filteredSources.length > 1 ? 's' : ''}</span>
                </div>

                {/* Barre de progression */}
                <div className="flex items-center justify-center mt-4">
                  <div className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 bg-gradient-to-r from-vocabulary to-vocabulary-light"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres et liste des sources */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Link className="w-5 h-5 text-white" />
                  Sources détaillées ({filteredSources.length})
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
                  {filteredSources.map((source, index) => (
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
                {filteredSources.length === 0 && selectedYear !== 'all' && (
                  <div className="text-center py-8 text-slate-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune source trouvée pour {selectedYear === 'inconnue' ? 'les années inconnues' : `l'année ${selectedYear}`}</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};