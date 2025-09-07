import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Info, ExternalLink } from 'lucide-react';

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
  variant?: 'default' | 'species' | 'vocabulary' | 'infrastructure' | 'agro' | 'technology';
  className?: string;
}

export const InteractiveVignette: React.FC<InteractiveVignetteProps> = ({ 
  data, 
  variant = 'default',
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'species':
        return 'border-success/30 bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10';
      case 'vocabulary':
        return 'border-info/30 bg-gradient-to-br from-info/10 to-info/5 hover:from-info/20 hover:to-info/10';
      case 'infrastructure':
        return 'border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/20 hover:to-warning/10';
      case 'agro':
        return 'border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10';
      case 'technology':
        return 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10';
      default:
        return 'border-border/50 bg-gradient-to-br from-background/80 to-background/40 hover:from-background/90 hover:to-background/50';
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'species': return 'text-success';
      case 'vocabulary': return 'text-info';
      case 'infrastructure': return 'text-warning';
      case 'agro': return 'text-accent';
      case 'technology': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${getVariantStyles()} ${className}`}>
      <CardHeader className="pb-3">
        {variant === 'species' ? (
          // Affichage spécial pour les espèces
          <div className="space-y-2">
            {/* Nom commun en gras */}
            <CardTitle className={`text-base font-bold leading-tight ${getVariantColor()}`}>
              {data.nom_commun || data.titre}
            </CardTitle>
            
            {/* Nom scientifique et statut de conservation */}
            <div className="space-y-1">
              {data.nom_scientifique && (
                <p className="text-sm font-normal text-white italic">
                  {data.nom_scientifique}
                </p>
              )}
              {data.statut_conservation && (
                <p className="text-sm font-bold text-slate-900">
                  {data.statut_conservation}
                </p>
              )}
            </div>
            
            {data.type && (
              <Badge variant="secondary" className="w-fit text-xs mt-2 bg-slate-200 text-slate-900 border-slate-300 font-semibold">
                {data.type}
              </Badge>
            )}
          </div>
        ) : (
          // Affichage standard pour les autres variants
          <>
            <CardTitle className={`text-base leading-tight ${getVariantColor()}`}>
              {data.titre}
            </CardTitle>
            {data.type && (
              <Badge variant="secondary" className="w-fit text-xs bg-slate-200 text-slate-900 border-slate-300 font-semibold">
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs hover:bg-background/50 group-hover:translate-x-1 transition-transform"
              >
                <Info className="w-3 h-3 mr-1" />
                Détails
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className={`text-xl ${getVariantColor()}`}>
                  {variant === 'species' ? (
                    <div className="space-y-2">
                      <div className="text-xl font-bold">
                        {data.nom_commun || data.titre}
                      </div>
                      {data.nom_scientifique && (
                        <div className="text-base font-normal italic text-slate-800">
                          {data.nom_scientifique}
                        </div>
                      )}
                      {data.statut_conservation && (
                        <div className="text-sm font-medium text-emerald-700">
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(data.url, '_blank')}
                        className="w-full"
                      >
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