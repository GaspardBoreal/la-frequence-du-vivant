import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Settings, Trash2, Sparkles, Footprints } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useExplorationMarchesCount } from '@/hooks/useExplorations';

interface PoeticExplorationCardProps {
  exploration: {
    id: string;
    slug: string;
    name: string;
    description?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    meta_keywords: string[];
  };
  index: number;
}

const PoeticExplorationCard: React.FC<PoeticExplorationCardProps> = ({ exploration, index }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Récupérer le nombre de marches associées
  const { data: marchesCount = 0 } = useExplorationMarchesCount(exploration.id);
  
  // Animation délayée basée sur l'index pour effet cascade
  const animationDelay = `animation-delay-${(index * 100) % 2000}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('explorations')
        .delete()
        .eq('id', exploration.id);

      if (error) throw error;
      
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['admin-explorations'] });
      
      toast.success(`Exploration "${exploration.name}" supprimée avec succès`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'exploration');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden animate-fade-in",
        animationDelay
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Carte principale avec fond clair et contrastes améliorés */}
      <div className="relative bg-card/95 backdrop-blur-sm border-2 border-border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-gaspard-gold hover:shadow-gaspard-gold/20 cursor-pointer"
           onClick={() => navigate(`/admin/explorations/${exploration.id}/edit`)}>
        
        {/* Effet de lumière interne discret */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-transparent group-hover:from-gaspard-gold/5 group-hover:to-gaspard-gold/10 transition-all duration-300 pointer-events-none"></div>

        {/* Header avec titre lisible */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-primary group-hover:text-gaspard-gold transition-colors duration-300" />
              <h3 className="text-xl font-bold text-foreground group-hover:text-gaspard-gold transition-colors duration-300 line-clamp-2">
                {exploration.name}
              </h3>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge 
                variant={exploration.published ? "default" : "secondary"}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300",
                  exploration.published 
                    ? "bg-primary text-primary-foreground shadow-sm group-hover:bg-gaspard-gold group-hover:text-foreground group-hover:shadow-gaspard-gold/30" 
                    : "bg-secondary text-secondary-foreground group-hover:bg-gaspard-gold/20 group-hover:text-gaspard-gold group-hover:border-gaspard-gold"
                )}
              >
                {exploration.published ? "✨ Révélé au monde" : "🌱 Germe créatif"}
              </Badge>
              
              {/* Badge compteur de marches */}
              <Badge 
                variant="outline"
                className="rounded-full px-3 py-1.5 text-sm font-medium bg-background border-2 border-primary/30 text-foreground group-hover:border-gaspard-gold group-hover:bg-gaspard-gold/10 group-hover:text-gaspard-gold transition-all duration-300"
              >
                <Footprints className="h-3 w-3 mr-1.5" />
                {marchesCount === 0 ? 'Aucune marche' : 
                 marchesCount === 1 ? '1 marche' : 
                 `${marchesCount} marches`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description avec contraste amélioré */}
        {exploration.description && (
          <div className="mb-5">
            <p className="text-foreground/80 leading-relaxed text-sm text-justify hyphens-auto group-hover:text-gaspard-gold/90 transition-colors duration-300">
              {exploration.description}
            </p>
          </div>
        )}

        {/* Mots-clés avec meilleure visibilité */}
        <div className="flex flex-wrap gap-2 mb-5">
          {exploration.meta_keywords.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="inline-block bg-primary/15 text-primary text-xs px-3 py-1.5 rounded-full border border-primary/30 font-medium group-hover:bg-gaspard-gold/15 group-hover:border-gaspard-gold/40 group-hover:text-gaspard-gold transition-all duration-300"
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Métadonnées temporelles lisibles */}
        <div className="text-sm text-foreground/60 mb-5 group-hover:text-gaspard-gold/70 transition-colors duration-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full group-hover:bg-gaspard-gold transition-colors duration-300"></span>
            Créé le {new Date(exploration.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
          {exploration.updated_at !== exploration.created_at && (
            <span className="ml-4 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full group-hover:bg-gaspard-gold transition-colors duration-300"></span>
              Modifié le {new Date(exploration.updated_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          )}
        </div>

        {/* Actions ultra-interactives avec bordures et effets renforcés */}
        <div className="flex flex-wrap gap-3">
          {exploration.published && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full bg-gaspard-emerald/30 hover:bg-gaspard-emerald/50 text-gaspard-cream border border-gaspard-emerald/50 transition-colors duration-200"
              title="Contempler en ligne"
              onClick={(e) => { e.stopPropagation(); navigate(`/explorations/${exploration.slug}`); }}
            >
              <Eye className="h-4 w-4 mr-2" />
              ✨ Contempler
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-gaspard-forest/30 hover:bg-gaspard-forest/50 text-gaspard-cream border border-gaspard-forest/50 transition-colors duration-200"
            title="Orchestrer les paysages"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/explorations/${exploration.id}/marches`); }}
          >
            <Settings className="h-4 w-4 mr-2" />
            🎼 Orchestrer
          </Button>
          
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-primary/30 hover:bg-primary/50 text-primary-foreground border border-primary/50 transition-colors duration-200"
            title="Sculpter l'essence"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/explorations/${exploration.id}/edit`); }}
          >
            <Edit className="h-4 w-4 mr-2" />
            🗿 Sculpter
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full bg-destructive/30 hover:bg-destructive/50 text-destructive-foreground border border-destructive/50 transition-colors duration-200"
                title="Supprimer définitivement"
                disabled={isDeleting}
                onClick={(e) => { e.stopPropagation(); }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer définitivement l'exploration "{exploration.name}" ?
                  Cette action est irréversible et supprimera également tous les paysages narratifs et associations de marches.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Forme décorative simple */}
        <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path 
              d="M20,50 Q50,20 80,50 Q50,80 20,50" 
              fill="url(#cardGradient)" 
              className="transition-all duration-1000 group-hover:d-[M15,50 Q50,15 85,50 Q50,85 15,50]"
            />
            <defs>
              <radialGradient id="cardGradient">
                <stop offset="0%" stopColor="hsl(var(--gaspard-primary))" />
                <stop offset="100%" stopColor="hsl(var(--gaspard-accent))" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PoeticExplorationCard;