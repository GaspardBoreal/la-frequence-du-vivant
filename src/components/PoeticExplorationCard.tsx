import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Settings, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
      {/* Carte principale avec bordures ultra-visibles et effets renforcés */}
      <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-4 border-gaspard-emerald/40 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:shadow-gaspard-gold/40 hover:border-gaspard-gold/80 hover:ring-4 hover:ring-gaspard-gold/30 hover:bg-gradient-to-br hover:from-card/90 hover:via-card/70 hover:to-card/50 group-hover:backdrop-blur-2xl cursor-pointer"
           onClick={() => navigate(`/admin/explorations/${exploration.id}/edit`)}>
        
        {/* Effet de lumière interne renforcé au hover */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/20 group-hover:via-accent/15 group-hover:to-secondary/20 transition-all duration-700 pointer-events-none group-hover:animate-pulse"></div>
        
        {/* Lueur externe ultra-visible */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-gaspard-gold/0 via-gaspard-gold/0 to-gaspard-gold/0 group-hover:from-gaspard-gold/20 group-hover:via-gaspard-gold/40 group-hover:to-gaspard-gold/20 blur-xl transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100"></div>
        
        {/* Particules décoratives ultra-animées au hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
          <div className="absolute top-4 right-4 w-2 h-2 bg-gaspard-gold/80 rounded-full animate-bounce group-hover:w-3 group-hover:h-3 transition-all duration-500"></div>
          <div className="absolute bottom-6 left-6 w-2.5 h-2.5 bg-accent/60 rounded-full animate-bounce group-hover:w-4 group-hover:h-4 transition-all duration-700" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute top-1/2 left-4 w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce group-hover:w-2.5 group-hover:h-2.5 transition-all duration-600" style={{ animationDelay: '0.4s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gaspard-gold/50 rounded-full animate-bounce group-hover:w-2.5 group-hover:h-2.5 transition-all duration-800" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute top-1/4 left-1/2 w-1 h-1 bg-accent/60 rounded-full animate-ping group-hover:w-2 group-hover:h-2 transition-all duration-500"></div>
          
          {/* Effet de vague lumineuse renforcé */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gaspard-gold/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1200 ease-out"></div>
        </div>

        {/* Header avec titre poétique */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 group-hover:gap-5 transition-all duration-500 group-hover:scale-105 transform-gpu">
              <Sparkles className="h-6 w-6 text-accent animate-pulse group-hover:text-gaspard-gold group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
              <h3 className="gaspard-main-title text-xl font-bold bg-gradient-to-r from-foreground via-gaspard-gold to-accent bg-clip-text text-transparent group-hover:from-gaspard-gold group-hover:via-accent group-hover:to-foreground group-hover:scale-105 transition-all duration-700 transform-gpu">
                {exploration.name}
              </h3>
            </div>
            
            <div className="mb-4 group-hover:mb-5 transition-all duration-300">
              <Badge 
                variant={exploration.published ? "default" : "secondary"}
                className={cn(
                  "rounded-full px-4 py-1 text-xs font-medium transition-all duration-500 group-hover:px-5 group-hover:py-1.5 group-hover:scale-105",
                  exploration.published 
                    ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 border-emerald-300/30 hover:from-emerald-500/40 hover:to-green-500/40 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20" 
                    : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-300/30 hover:from-amber-500/40 hover:to-orange-500/40 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20"
                )}
              >
                {exploration.published ? "✨ Révélé au monde" : "🌱 Germe créatif"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description poétique avec effet de révélation */}
        {exploration.description && (
          <div className="mb-6 group-hover:mb-7 transition-all duration-300">
            <p className={cn(
              "leading-relaxed font-light text-justify hyphens-auto transition-colors duration-500",
              exploration.published 
                ? "text-white font-bold group-hover:text-white/90" 
                : "text-gaspard-muted group-hover:text-gaspard-primary/90"
            )}>
              {exploration.description}
            </p>
          </div>
        )}

        {/* Mots-clés comme pétales flottants */}
        <div className="flex flex-wrap gap-2 mb-6 group-hover:gap-3 transition-all duration-500">
          {exploration.meta_keywords.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="inline-block bg-gaspard-primary/10 hover:bg-gaspard-primary/25 text-gaspard-primary text-xs px-3 py-1.5 rounded-full border border-gaspard-primary/20 transition-all duration-500 hover:scale-110 hover:shadow-lg hover:shadow-gaspard-primary/20 hover:border-gaspard-primary/40 hover:-translate-y-0.5 cursor-default group-hover:bg-gaspard-primary/15"
              style={{ 
                animationDelay: `${index * 100}ms`,
                transitionDelay: `${index * 50}ms`
              }}
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Métadonnées temporelles */}
        <div className="text-xs text-gaspard-muted/70 mb-6 font-light">
          <span className="inline-flex items-center gap-1">
            <span className="w-1 h-1 bg-gaspard-secondary/40 rounded-full"></span>
            Né le {new Date(exploration.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
          {exploration.updated_at !== exploration.created_at && (
            <span className="ml-3 inline-flex items-center gap-1">
              <span className="w-1 h-1 bg-gaspard-accent/40 rounded-full"></span>
              Métamorphosé le {new Date(exploration.updated_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
          )}
        </div>

        {/* Actions ultra-interactives avec bordures et effets renforcés */}
        <div className="flex flex-wrap gap-3 opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:gap-4 group-hover:scale-105 transform-gpu">
          {exploration.published && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full bg-gaspard-emerald/30 hover:bg-gaspard-emerald/60 text-gaspard-cream border-2 border-gaspard-emerald/50 hover:border-gaspard-gold/80 transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-gaspard-emerald/40 hover:-translate-y-2 transform-gpu hover:rotate-2"
              title="Contempler en ligne"
              onClick={(e) => { e.stopPropagation(); navigate(`/explorations/${exploration.slug}`); }}
            >
              <Eye className="h-4 w-4 mr-2 transition-transform duration-300 hover:scale-150 hover:rotate-12" />
              ✨ Contempler
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-gaspard-forest/30 hover:bg-gaspard-forest/60 text-gaspard-cream border-2 border-gaspard-forest/50 hover:border-gaspard-gold/80 transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-gaspard-forest/40 hover:-translate-y-2 transform-gpu hover:-rotate-2"
            title="Orchestrer les paysages"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/explorations/${exploration.id}/marches`); }}
          >
            <Settings className="h-4 w-4 mr-2 transition-transform duration-300 hover:rotate-180" />
            🎼 Orchestrer
          </Button>
          
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-primary/30 hover:bg-primary/60 text-primary-foreground border-2 border-primary/50 hover:border-gaspard-gold/80 transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-2 transform-gpu hover:-rotate-1"
            title="Sculpter l'essence"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/explorations/${exploration.id}/edit`); }}
          >
            <Edit className="h-4 w-4 mr-2 transition-transform duration-300 hover:rotate-45 hover:scale-125" />
            🗿 Sculpter
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full bg-destructive/30 hover:bg-destructive/60 text-destructive-foreground border-2 border-destructive/50 hover:border-gaspard-gold/80 transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-destructive/40 hover:-translate-y-2 transform-gpu hover:rotate-2"
                title="Supprimer définitivement"
                disabled={isDeleting}
                onClick={(e) => { e.stopPropagation(); }}
              >
                <Trash2 className="h-4 w-4 mr-2 transition-transform duration-300 hover:scale-150 hover:rotate-12" />
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

        {/* Forme décorative organique évolutive en arrière-plan */}
        <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 pointer-events-none transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-soft-pulse group-hover:animate-gentle-float">
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