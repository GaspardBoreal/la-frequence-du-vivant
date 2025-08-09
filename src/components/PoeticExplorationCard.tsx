import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Settings, Download, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PoeticExplorationCardProps {
  exploration: {
    id: string;
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
  
  // Animation délayée basée sur l'index pour effet cascade
  const animationDelay = `animation-delay-${(index * 100) % 2000}`;
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden animate-fade-in",
        animationDelay
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Carte principale avec forme organique */}
      <div className="relative bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-xl border border-gaspard-primary/20 rounded-3xl p-8 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-gaspard-primary/20 hover:border-gaspard-primary/40">
        
        {/* Particules décoratives au hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
          <div className="absolute top-4 right-4 w-1 h-1 bg-gaspard-accent/60 rounded-full animate-gentle-float"></div>
          <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-gaspard-secondary/40 rounded-full animate-gentle-float animation-delay-500"></div>
          <div className="absolute top-1/2 left-4 w-0.5 h-0.5 bg-gaspard-primary/50 rounded-full animate-gentle-float animation-delay-1000"></div>
        </div>

        {/* Header avec titre poétique */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-gaspard-accent animate-soft-pulse" />
              <h3 className="gaspard-main-title text-xl font-bold bg-gradient-to-r from-gaspard-primary to-gaspard-accent bg-clip-text text-transparent">
                {exploration.name}
              </h3>
            </div>
            
            {/* Badge de statut poétique */}
            <div className="mb-4">
              <Badge 
                variant={exploration.published ? "default" : "secondary"}
                className={cn(
                  "rounded-full px-4 py-1 text-xs font-medium transition-all duration-300",
                  exploration.published 
                    ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 border-emerald-300/30 hover:from-emerald-500/30 hover:to-green-500/30" 
                    : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-300/30 hover:from-amber-500/30 hover:to-orange-500/30"
                )}
              >
                {exploration.published ? "✨ Révélé au monde" : "🌱 Germe créatif"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description poétique */}
        {exploration.description && (
          <div className="mb-6">
            <p className="text-gaspard-muted leading-relaxed font-light text-justify hyphens-auto">
              {exploration.description}
            </p>
          </div>
        )}

        {/* Mots-clés comme pétales */}
        <div className="flex flex-wrap gap-2 mb-6">
          {exploration.meta_keywords.slice(0, 5).map((keyword, index) => (
            <span
              key={index}
              className="inline-block bg-gaspard-primary/10 hover:bg-gaspard-primary/20 text-gaspard-primary text-xs px-3 py-1.5 rounded-full border border-gaspard-primary/20 transition-all duration-300 hover:scale-105 cursor-default"
              style={{ animationDelay: `${index * 100}ms` }}
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

        {/* Actions organiques */}
        <div className="flex flex-wrap gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
          {exploration.published && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full bg-gaspard-primary/10 hover:bg-gaspard-primary/20 text-gaspard-primary border border-gaspard-primary/20 hover:border-gaspard-primary/40 transition-all duration-300 hover:scale-105"
              title="Contempler en ligne"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              Contempler
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-gaspard-secondary/10 hover:bg-gaspard-secondary/20 text-gaspard-secondary border border-gaspard-secondary/20 hover:border-gaspard-secondary/40 transition-all duration-300 hover:scale-105"
            title="Orchestrer les paysages"
            onClick={() => navigate(`/admin/explorations/${exploration.id}/marches`)}
          >
            <Settings className="h-3 w-3 mr-1.5" />
            Orchestrer
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-gaspard-accent/10 hover:bg-gaspard-accent/20 text-gaspard-accent border border-gaspard-accent/20 hover:border-gaspard-accent/40 transition-all duration-300 hover:scale-105"
            title="Archiver l'essence"
          >
            <Download className="h-3 w-3 mr-1.5" />
            Archiver
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105"
            title="Sculpter l'essence"
            onClick={() => navigate(`/admin/explorations/${exploration.id}/edit`)}
          >
            <Edit className="h-3 w-3 mr-1.5" />
            Sculpter
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:scale-105"
            title="Transmuter en néant"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Transmuter
          </Button>
        </div>

        {/* Forme décorative organique en arrière-plan */}
        <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-soft-pulse">
            <path 
              d="M20,50 Q50,20 80,50 Q50,80 20,50" 
              fill="url(#cardGradient)" 
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