import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Info, ExternalLink } from 'lucide-react';
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
}

export const InteractiveVignette: React.FC<InteractiveVignetteProps> = ({
  data,
  variant = 'default',
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const styles = getVignetteStyles(variant);

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
          </div>
        ) : (
          // Affichage standard pour les autres variants - Contrast-Force Hierarchy
          <>
            <CardTitle className={`text-base leading-tight ${styles.title}`}>
              {data.titre}
            </CardTitle>
            {data.type && (
              <Badge variant="secondary" className={`w-fit text-xs font-semibold ${styles.badge}`}>
                {data.type}
              </Badge>
            )}
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
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className={`text-xl ${getDialogHeaderStyles(variant)}`}>
                  {variant === 'species' ? (
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
                    data.titre
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {data.type && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                      <Badge variant="secondary">{data.type}</Badge>
                    </div>
                  )}
                  
                  {/* Informations spécifiques aux espèces */}
                  {variant === 'species' && (
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
                  )}
                  
                  {(data.description_courte || data.definition) && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
                      <p className="text-sm leading-relaxed">
                        {data.description_courte || data.definition}
                      </p>
                    </div>
                  )}
                  
                  {data.details && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Détails</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {data.details}
                      </p>
                    </div>
                  )}
                  
                  {data.metadata && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Informations supplémentaires</h4>
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(data.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {data.url && (
                    <div className="pt-4 border-t border-border/30">
                      <Button variant="outline" size="sm" onClick={() => window.open(data.url, '_blank')} className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir la source
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