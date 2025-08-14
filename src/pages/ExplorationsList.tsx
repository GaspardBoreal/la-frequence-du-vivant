import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExplorations, Exploration } from '@/hooks/useExplorations';
import { Sparkles, Palette, Wind, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import DecorativeParticles from '@/components/DecorativeParticles';
import PoeticExplorationCard from '@/components/PoeticExplorationCard';
import ExplorationFilters from '@/components/ExplorationFilters';

const ExplorationsList = () => {
  const { data: explorations, isLoading, error } = useExplorations();
  const [filteredExplorations, setFilteredExplorations] = useState<Exploration[]>([]);

  // Initialize filtered explorations when data loads
  React.useEffect(() => {
    if (explorations) {
      setFilteredExplorations(explorations);
    }
  }, [explorations]);

  const handleFilterChange = (filtered: Exploration[]) => {
    setFilteredExplorations(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <DecorativeParticles />
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3">
              <div className="w-2 h-2 bg-gaspard-primary rounded-full animate-gentle-float"></div>
              <div className="w-2 h-2 bg-gaspard-secondary rounded-full animate-gentle-float animation-delay-300"></div>
              <div className="w-2 h-2 bg-gaspard-accent rounded-full animate-gentle-float animation-delay-600"></div>
            </div>
            <p className="text-gaspard-muted mt-4 font-light">
              Révélation des essences créatives...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <DecorativeParticles />
        <div className="relative z-10 container mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold text-gaspard-primary mb-4">Erreur</h1>
          <p className="text-gaspard-muted">Impossible de charger les explorations.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Explorations - La Fréquence du Vivant"
        description="Découvrez les explorations thématiques de Gaspard à travers ses marches poétiques et sensorielles."
        keywords="explorations, marches, poésie, nature, biodiversité"
      />
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Arrière-plan composé avec dégradés organiques */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-primary/5 via-transparent to-gaspard-accent/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--gaspard-secondary-rgb)/0.1,transparent_70%)]"></div>
        
        {/* Particules décoratives */}
        <DecorativeParticles />
        
        {/* Contenu principal */}
        <div className="relative z-10 container mx-auto px-6 py-12">
          
          {/* En-tête poétique */}
          <header className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Palette className="h-8 w-8 text-gaspard-accent animate-soft-pulse" />
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gaspard-primary to-transparent rounded-full"></div>
              <Sparkles className="h-6 w-6 text-gaspard-secondary animate-gentle-float" />
            </div>
            
            <h1 className="gaspard-main-title text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gaspard-primary via-gaspard-secondary to-gaspard-accent bg-clip-text text-transparent">
              Explorations
            </h1>
            
            <p className="gaspard-category text-xl text-gaspard-muted max-w-3xl mx-auto leading-relaxed font-light">
              Plongez dans les univers thématiques de "La Fréquence du Vivant" à travers 
              des explorations qui révèlent la poésie du monde vivant.
            </p>
            
            {/* Ligne décorative animée */}
            <div className="mt-8 w-24 h-0.5 bg-gradient-to-r from-gaspard-primary to-gaspard-accent mx-auto rounded-full opacity-60"></div>
            
            {/* Bouton révolutionnaire vers la Galerie-Fleuve */}
            <div className="mt-12 flex justify-center">
              <Link to="/galerie-fleuve">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 px-8 py-4"
                >
                  <Wind className="h-5 w-5 mr-3 animate-pulse" />
                  <span className="text-lg font-medium">Découvrir la Galerie-Fleuve</span>
                  <Camera className="h-5 w-5 ml-3" />
                </Button>
              </Link>
            </div>
            
            <p className="text-center mt-4 text-sm text-muted-foreground italic">
              Une expérience révolutionnaire pour explorer toutes les photos dans leur diversité
            </p>
          </header>

          {/* Filtres avancés */}
          {explorations && (
            <div className="animate-fade-in animation-delay-300">
              <ExplorationFilters 
                explorations={explorations}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}

          {/* Galerie d'explorations en masonry */}
          <section className="animate-fade-in animation-delay-600">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="gaspard-main-title text-2xl font-bold text-gaspard-primary">
                Paysages Narratifs
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gaspard-primary/30 via-gaspard-primary/10 to-transparent"></div>
              <span className="text-sm text-gaspard-muted/60 font-light">
                {filteredExplorations?.length || 0} univers révélés
              </span>
            </div>

            {filteredExplorations.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <Sparkles className="h-16 w-16 text-gaspard-accent/40 mx-auto mb-6 animate-soft-pulse" />
                  <h3 className="gaspard-main-title text-xl font-semibold text-gaspard-primary mb-4">
                    {explorations?.length === 0 ? 'Aucune exploration disponible' : 'Aucune résonance trouvée'}
                  </h3>
                  <p className="text-gaspard-muted mb-8 font-light leading-relaxed">
                    {explorations?.length === 0 
                      ? 'Les explorations seront bientôt révélées.'
                      : 'Explorez d\'autres termes pour révéler les essences cachées'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredExplorations.map((exploration, index) => (
                  <div key={exploration.id} className="break-inside-avoid">
                    <PoeticExplorationCard 
                      exploration={exploration} 
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Texture de fond subtile */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
      </div>
    </>
  );
};

export default ExplorationsList;