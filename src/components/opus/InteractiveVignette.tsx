import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Info, ExternalLink, BookOpen, Globe, Calendar } from 'lucide-react';
import { getVignetteStyles, getDialogHeaderStyles, type VignetteVariant } from '@/utils/vignetteStyleUtils';

interface VignetteData {
  titre: string;
  description_courte?: string;
  definition?: string;
  details?: string;
  type?: string;
  category?: string;
  url?: string;
  metadata?: any;
  // Propriétés spécifiques aux espèces
  nom_commun?: string;
  nom_scientifique?: string;
  statut_conservation?: string;
}

interface InteractiveVignetteProps {
  data: VignetteData;
  variant?: VignetteVariant;
  className?: string;
  importSources?: any[]; // Sources de l'import pour résoudre les source_ids
}

export const InteractiveVignette: React.FC<InteractiveVignetteProps> = ({
  data,
  variant = 'default',
  className = '',
  importSources = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const styles = getVignetteStyles(variant);

  // Résolution des sources pour les espèces
  const resolvedSources = React.useMemo(() => {
    if (!data.metadata?.source_ids || !importSources.length) return [];
    
    const sourceIds = Array.isArray(data.metadata.source_ids) 
      ? data.metadata.source_ids 
      : [data.metadata.source_ids];
    
    return sourceIds
      .map(id => importSources.find(source => 
        source.id === id || 
        source.key === id || 
        String(source.id) === String(id)
      ))
      .filter(Boolean);
  }, [data.metadata?.source_ids, importSources]);

  return (
    <Card className={`group cursor-pointer ${styles.container} ${className}`}>
      <CardHeader className="pb-3">
        {variant === 'species' ? (
          // Affichage spécial pour les espèces - Contrast-Force Hierarchy
          <div className="space-y-2">
            {/* Nom commun - Thematic color + bold */}
            <CardTitle className={`text-base leading-tight ${styles.title}`}>
              {data.nom_commun || data.titre}
            </CardTitle>
            
            {/* Nom scientifique et statut de conservation */}
            <div className="space-y-1">
              {data.nom_scientifique && (
                <p className={`text-sm ${styles.secondary}`}>
                  {data.nom_scientifique}
                </p>
              )}
              {data.statut_conservation && (
                <p className={`text-sm ${styles.status}`}>
                  {data.statut_conservation}
                </p>
              )}
            </div>
            
            {data.type && (
              <Badge variant="secondary" className={`w-fit text-xs mt-2 font-semibold ${styles.badge}`}>
                {data.type}
              </Badge>
            )}
            
            {/* Indicateur de sources pour les espèces */}
            {resolvedSources.length > 0 && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {resolvedSources.length} source{resolvedSources.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ) : (
          // Affichage standard pour les autres variants - Contrast-Force Hierarchy
          <>
            <CardTitle className={`text-base leading-tight ${styles.title}`}>
              {data.titre}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {data.type && (
                <Badge variant="secondary" className={`w-fit text-xs font-semibold ${styles.badge}`}>
                  {data.type}
                </Badge>
              )}
              {variant === 'vocabulary' && (
                <Badge variant="outline" className="text-[10px]">
                  {(data.metadata?.resolved_sources?.length || 0)} source{(data.metadata?.resolved_sources?.length || 0) > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {(data.description_courte || data.definition) && (
          <CardDescription className="text-sm line-clamp-3">
            {data.description_courte || data.definition}
          </CardDescription>
        )}

        <div className="flex items-center justify-between">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs hover:bg-background/50 group-hover:translate-x-1 transition-transform">
                <Info className="w-3 h-3 mr-1" />
                Détails
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-xl border-border/30">
              <DialogHeader className="border-b border-border/20 pb-4">
                <DialogTitle className="flex items-center gap-3">
                  {variant === 'vocabulary' ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-info/20 to-info/10 border border-info/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-info" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-foreground leading-tight">
                          {data.titre}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {data.type || 'terme'}
                          </Badge>
                          {data.metadata?.resolved_sources?.length && (
                            <Badge variant="outline" className="text-xs text-info border-info/30">
                              {data.metadata.resolved_sources.length} source{data.metadata.resolved_sources.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : variant === 'species' ? (
                    <div className="space-y-2">
                      <div className="text-xl font-bold">
                        {data.nom_commun || data.titre}
                      </div>
                      {data.nom_scientifique && (
                        <div className="text-base font-normal italic text-slate-600">
                          {data.nom_scientifique}
                        </div>
                      )}
                      {data.statut_conservation && (
                        <div className="text-sm font-medium text-muted-foreground">
                          {data.statut_conservation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold">{data.titre}</h2>
                      {data.type && (
                        <Badge variant="secondary" className="text-xs">
                          {data.type}
                        </Badge>
                      )}
                    </div>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  {/* Section principale - Description */}
                  {(data.description_courte || data.definition) && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Info className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base mb-2 text-foreground">Définition</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {data.description_courte || data.definition}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations spécifiques au vocabulaire */}
                  {variant === 'vocabulary' && data.metadata && (
                    <div className="grid gap-4">
                      {/* Origine/Étymologie */}
                      {(data.metadata.origine || data.metadata.etymologie) && (
                        <div className="p-4 rounded-lg bg-info/5 border border-info/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-info" />
                            <h4 className="font-medium text-sm text-info">Origine</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.metadata.origine || data.metadata.etymologie}
                          </p>
                        </div>
                      )}

                      {/* Contexte d'usage */}
                      {data.metadata.usage_context && (
                        <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <h4 className="font-medium text-sm text-accent">Contexte d'usage</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.metadata.usage_context}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informations spécifiques aux espèces */}
                  {variant === 'species' && (
                    <div className="space-y-4">
                      {/* Informations biologiques */}
                      <div className="space-y-4 p-5 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                        {data.nom_commun && (
                          <div>
                            <h4 className="font-semibold text-sm text-slate-600 mb-2">Nom commun</h4>
                            <p className="font-bold text-lg text-emerald-800">{data.nom_commun}</p>
                          </div>
                        )}
                        {data.nom_scientifique && (
                          <div>
                            <h4 className="font-semibold text-sm text-slate-600 mb-2">Nom scientifique</h4>
                            <p className="italic text-base text-slate-800 font-medium">{data.nom_scientifique}</p>
                          </div>
                        )}
                        {data.statut_conservation && (
                          <div>
                            <h4 className="font-semibold text-sm text-slate-600 mb-2">Statut de conservation</h4>
                            <div className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-100 border border-emerald-300">
                              <p className="text-emerald-800 font-semibold">{data.statut_conservation}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sources d'identification de l'espèce */}
                      {resolvedSources.length > 0 && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-success/5 to-success/5 border border-success/20">
                          <div className="flex items-center gap-2 mb-4">
                            <ExternalLink className="w-5 h-5 text-success" />
                            <h3 className="font-semibold text-base text-success">
                              Sources d'identification ({resolvedSources.length})
                            </h3>
                          </div>
                          <div className="grid gap-3">
                            {resolvedSources.map((source: any, index: number) => {
                              const href = source?.url || source?.lien || source?.link;
                              const title = source?.nom || source?.name || source?.titre;
                              const shortName = href && /^https?:\/\//i.test(href) 
                                ? new URL(href).hostname.replace('www.', '').split('.')[0] 
                                : 'Source';
                              const displayTitle = title || shortName;
                              const date = source?.date || source?.date_publication || source?.annee;

                              return (
                                <div key={source?.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors">
                                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-success">{index + 1}</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-medium text-sm text-foreground truncate">
                                        {displayTitle}
                                      </h5>
                                      {date && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="w-3 h-3" />
                                          {date}
                                        </div>
                                      )}
                                    </div>
                                    {href && /^https?:\/\//i.test(href) && (
                                      <a 
                                        href={href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-success hover:text-success/80 underline truncate block mt-1"
                                        title={href}
                                      >
                                        {href.length > 50 ? `${href.substring(0, 50)}...` : href}
                                      </a>
                                    )}
                                  </div>
                                  {href && /^https?:\/\//i.test(href) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(href, '_blank')}
                                      className="w-8 h-8 p-0 text-success hover:text-success hover:bg-success/10"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Détails supplémentaires */}
                  {data.details && (
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/20">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Détails complémentaires</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {data.details}
                      </p>
                    </div>
                  )}

                  {/* Section Sources - Redesignée */}
                  {Array.isArray(data.metadata?.resolved_sources) && data.metadata.resolved_sources.length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-success/5 to-success/5 border border-success/20">
                      <div className="flex items-center gap-2 mb-4">
                        <ExternalLink className="w-5 h-5 text-success" />
                        <h3 className="font-semibold text-base text-success">
                          Sources documentaires ({data.metadata.resolved_sources.length})
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {data.metadata.resolved_sources.map((source: any, index: number) => {
                          const href = source?.url || source?.lien || source?.link;
                          const title = source?.nom || source?.name || source?.titre;
                          const shortName = href && /^https?:\/\//i.test(href) 
                            ? new URL(href).hostname.replace('www.', '').split('.')[0] 
                            : 'Source';
                          const displayTitle = title || shortName;

                          return (
                            <div key={source?.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-success">{index + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm text-foreground truncate">
                                    {displayTitle}
                                  </h5>
                                  {source?.annee && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {source.annee}
                                    </div>
                                  )}
                                </div>
                                {href && /^https?:\/\//i.test(href) && (
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-success hover:text-success/80 underline truncate block mt-1"
                                    title={href}
                                  >
                                    {href.length > 50 ? `${href.substring(0, 50)}...` : href}
                                  </a>
                                )}
                              </div>
                              {href && /^https?:\/\//i.test(href) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(href, '_blank')}
                                  className="w-8 h-8 p-0 text-success hover:text-success hover:bg-success/10"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* URL principal du terme */}
                  {data.url && (
                    <div className="pt-4 border-t border-border/20">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(data.url, '_blank')} 
                        className="w-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Consulter la source principale
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {data.category && (
            <Badge variant="outline" className="text-xs opacity-70">
              {data.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};