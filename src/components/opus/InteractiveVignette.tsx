import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Info, ExternalLink, BookOpen, Globe, Calendar, Zap, DollarSign, MapPin } from 'lucide-react';
import { getVignetteStyles, getDialogHeaderStyles, type VignetteVariant } from '@/utils/vignetteStyleUtils';
import { getTechTypeIcon, getTechTypeBadgeColor, getTechMetadata, type TechnodiversiteItem } from '@/utils/technodiversiteDataUtils';

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

  // Résolution des sources pour toutes vignettes (espèces, vocabulaire, techno)
  const sourceIndex = React.useMemo(() => {
    const map = new Map<string, any>();
    (importSources || []).forEach((s: any) => {
      const possible = [s?.id, s?.source_id, s?.key, s?.nom, s?.name, s?.url?.split('/')?.pop?.()]
        .filter(Boolean)
        .map((x: any) => String(x).toLowerCase());
      possible.forEach(id => map.set(id, s));
    });
    return map;
  }, [importSources]);

  const resolvedSources = React.useMemo(() => {
    const meta = data.metadata || {};
    const idsRaw = meta.source_ids || meta.sources || meta.sources_ids || [];
    const ids: string[] = Array.isArray(idsRaw) ? idsRaw : [idsRaw];
    const normalized = ids
      .map((x: any) => (typeof x === 'string' ? x : (x?.id || x?.key || x)))
      .filter(Boolean)
      .map((x: any) => String(x).toLowerCase());

    const resolved = normalized
      .map((id: string) => sourceIndex.get(id))
      .filter(Boolean);

    return resolved;
  }, [data.metadata, sourceIndex]);

  // Données spécialisées pour la technodiversité
  const techMetadata = React.useMemo(() => {
    if (variant === 'technology' && data.metadata) {
      return getTechMetadata(data as TechnodiversiteItem);
    }
    return [];
  }, [variant, data.metadata]);

  const TechIcon = variant === 'technology' && data.type ? getTechTypeIcon(data.type) : null;

  return (
    <Card className={`group cursor-pointer ${styles.container} ${className}`}>
      <CardHeader className="pb-3">
        {variant === 'species' ? (
          // Affichage spécial pour les espèces
          <div className="space-y-2">
            <CardTitle className={`text-base leading-tight ${styles.title}`}>
              {data.nom_commun || data.titre}
            </CardTitle>
            
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
            
            {resolvedSources.length > 0 && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {resolvedSources.length} source{resolvedSources.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ) : variant === 'technology' ? (
          // Affichage spécialisé pour les technologies
          <div className="space-y-3">
            <CardTitle className={`text-base leading-tight flex items-center gap-2 text-emerald-400 font-semibold`}>
              {TechIcon && <TechIcon className="w-5 h-5" />}
              {data.titre}
            </CardTitle>
            
            {data.type && (
              <Badge 
                variant="outline" 
                className="w-fit rounded-full border bg-white text-emerald-600 border-emerald-200"
              >
                {data.type}
              </Badge>
            )}
            
            {techMetadata.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {techMetadata.slice(0, 2).map((meta, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 rounded-full px-3 py-1.5 border border-slate-200">
                    <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    <span className="font-semibold">{meta.label}:</span>
                    <span className="font-medium">{meta.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Affichage standard pour les autres variants
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
      
      <CardContent className="space-y-4">
        {(data.description_courte || data.definition) && (
          <CardDescription className="text-sm line-clamp-3 text-slate-600 leading-relaxed font-medium">
            {data.description_courte || data.definition}
          </CardDescription>
        )}

        <div className="flex items-center justify-between">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-sm font-semibold bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 group-hover:translate-x-1 transition-all px-4 py-2">
                <Info className="w-4 h-4 mr-1.5" />
                Voir les détails
                <ChevronRight className="w-4 h-4 ml-1.5" />
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
                  ) : variant === 'technology' ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        {TechIcon ? <TechIcon className="w-6 h-6 text-primary" /> : <BookOpen className="w-6 h-6 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-foreground leading-tight">
                          {data.titre}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {data.type && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs font-semibold ${getTechTypeBadgeColor(data.type)}`}
                            >
                              {data.type}
                            </Badge>
                          )}
                          {data.category && (
                            <Badge variant="outline" className="text-xs">
                              {data.category}
                            </Badge>
                          )}
                        </div>
                      </div>
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

                  {/* Informations spécifiques à la technodiversité */}
                  {variant === 'technology' && (
                    <div className="space-y-4">
                      {/* Caractéristiques techniques */}
                      {techMetadata.length > 0 && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-base text-primary">
                              Caractéristiques Techniques
                            </h3>
                          </div>
                          <div className="grid gap-3">
                            {techMetadata.map((meta, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                                <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0`}>
                                  <meta.icon className={`w-4 h-4 ${meta.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium text-sm text-foreground">
                                      {meta.label}
                                    </h5>
                                    <span className={`text-sm font-bold ${meta.color}`}>
                                      {meta.value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Impact territorial pour les technologies */}
                      {data.metadata?.impact_territorial && (
                        <div className="p-4 rounded-lg bg-success/5 border border-success/10">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-success" />
                            <h4 className="font-medium text-sm text-success">Impact Territorial</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.metadata.impact_territorial}
                          </p>
                        </div>
                      )}

                      {/* Liens de documentation */}
                      {data.metadata?.liens && Array.isArray(data.metadata.liens) && data.metadata.liens.length > 0 && (
                        <div className="p-6 rounded-xl bg-gradient-to-br from-info/5 to-info/5 border border-info/20">
                          <div className="flex items-center gap-2 mb-4">
                            <ExternalLink className="w-5 h-5 text-info" />
                            <h3 className="font-semibold text-base text-info">
                              Documentation & Ressources
                            </h3>
                          </div>
                          <div className="grid gap-3">
                            {data.metadata.liens.map((lien: string, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-info">{index + 1}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  {lien.startsWith('http') ? (
                                    <a 
                                      href={lien} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-info hover:text-info/80 underline truncate block"
                                      title={lien}
                                    >
                                      {lien.length > 60 ? `${lien.substring(0, 60)}...` : lien}
                                    </a>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      {lien}
                                    </p>
                                  )}
                                </div>
                                {lien.startsWith('http') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(lien, '_blank')}
                                    className="w-8 h-8 p-0 text-info hover:text-info hover:bg-info/10"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informations spécifiques au vocabulaire */}
                  {variant === 'vocabulary' && data.metadata && (
                    <div className="grid gap-4">
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
                              const href = source?.url;
                              const title = source?.titre;
                              const shortName = href && /^https?:\/\//i.test(href) 
                                ? new URL(href).hostname.replace('www.', '').split('.')[0] 
                                : 'Source';
                              const displayTitle = title || shortName || `Source ${index + 1}`;
                              const date = source?.date_acces;

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
                                    {href && /^https?:\/\//i.test(href) ? (
                                      <a 
                                        href={href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-success hover:text-success/80 underline truncate block mt-1"
                                        title={href}
                                      >
                                        {href.length > 50 ? `${href.substring(0, 50)}...` : href}
                                      </a>
                                    ) : (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        URL non disponible
                                      </p>
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

                  {/* Section Sources pour le vocabulaire */}
                  {Array.isArray(data.metadata?.resolved_sources) && data.metadata.resolved_sources.length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-info/5 to-info/5 border border-info/20">
                      <div className="flex items-center gap-2 mb-4">
                        <ExternalLink className="w-5 h-5 text-info" />
                        <h3 className="font-semibold text-base text-info">
                          Sources ({data.metadata.resolved_sources.length})
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {data.metadata.resolved_sources.map((source: any, index: number) => {
                          const href = source?.url || source?.lien || source?.link;
                          const title = source?.titre || source?.nom;
                          const shortName = href && /^https?:\/\//i.test(href) 
                            ? new URL(href).hostname.replace('www.', '').split('.')[0] 
                            : 'Source';
                          const displayTitle = title || shortName || `Source ${index + 1}`;
                          const date = source?.date_acces;

                          return (
                            <div key={source?.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-info">{index + 1}</span>
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
                                {href && /^https?:\/\//i.test(href) ? (
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-info hover:text-info/80 underline truncate block mt-1"
                                    title={href}
                                  >
                                    {href.length > 50 ? `${href.substring(0, 50)}...` : href}
                                  </a>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    URL non disponible
                                  </p>
                                )}
                              </div>
                              {href && /^https?:\/\//i.test(href) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(href, '_blank')}
                                  className="w-8 h-8 p-0 text-info hover:text-info hover:bg-info/10"
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
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          {/* Lien externe si disponible */}
          {data.url && /^https?:\/\//i.test(data.url) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(data.url, '_blank')}
              className="text-xs hover:bg-background/50"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Lien
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};