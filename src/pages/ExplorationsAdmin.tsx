import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Sparkles, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminExplorations } from '@/hooks/useExplorations';
import SEOHead from '@/components/SEOHead';
import DecorativeParticles from '@/components/DecorativeParticles';
import PoeticExplorationCard from '@/components/PoeticExplorationCard';
import PoeticStatsGrid, { FilterType } from '@/components/PoeticStatsGrid';

const ExplorationsAdmin = () => {
  const navigate = useNavigate();
  const { data: explorations, isLoading } = useAdminExplorations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const filteredExplorations = explorations?.filter(exploration => {
    // Apply text search filter
    const matchesSearch = exploration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exploration.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'published' && exploration.published) ||
      (selectedFilter === 'draft' && !exploration.published);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <SEOHead 
        title="Atelier de Création Poétique - La Fréquence du Vivant"
        description="Atelier sensible pour orchestrer les explorations techno-poétiques du vivant"
        keywords="création, poésie, techno-sensible, explorations, narratifs"
      />
      
      {/* Univers immersif principal */}
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
              Atelier de Création
            </h1>
            
            <p className="gaspard-category text-xl text-gaspard-muted max-w-2xl mx-auto leading-relaxed font-light">
              Orchestrez les paysages narratifs et les explorations techno-sensibles du vivant
            </p>
            
            {/* Ligne décorative animée */}
            <div className="mt-8 w-24 h-0.5 bg-gradient-to-r from-gaspard-primary to-gaspard-accent mx-auto rounded-full opacity-60"></div>
          </header>

          {/* Barre d'actions organiques */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center animate-fade-in animation-delay-300">
            {/* Recherche poétique enrichie */}
            <div className="flex-1 max-w-lg relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gaspard-muted/60 group-hover:text-gaspard-primary group-focus-within:text-gaspard-accent transition-all duration-500 group-hover:scale-110" />
                <Input
                  type="search"
                  placeholder="Filtrer les créations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="pl-12 pr-4 py-3 bg-background/60 backdrop-blur-sm border-gaspard-primary/20 rounded-2xl focus:border-gaspard-primary/50 transition-all duration-500 hover:bg-background/80 focus:bg-background/90 hover:shadow-lg hover:shadow-gaspard-primary/10 focus:shadow-xl focus:shadow-gaspard-accent/20"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gaspard-primary/10 via-transparent to-gaspard-accent/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-50 transition-opacity duration-500 pointer-events-none"></div>
                
                {/* Particules de recherche */}
                <div className="absolute top-2 right-4 w-1 h-1 bg-gaspard-accent/0 rounded-full group-focus-within:bg-gaspard-accent/60 group-focus-within:animate-gentle-float transition-all duration-500"></div>
              </div>
            </div>
            
            {/* Bouton de création morphique */}
            <Button 
              size="lg"
              className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90 text-white rounded-2xl px-8 py-3 shadow-lg shadow-gaspard-primary/20 hover:shadow-2xl hover:shadow-gaspard-primary/40 transition-all duration-500 hover:scale-110 hover:-translate-y-1 border-0 group"
              onClick={() => navigate('/admin/explorations/new')}
            >
              <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
              <span className="group-hover:tracking-wide transition-all duration-300">Tisser une Nouvelle Exploration</span>
            </Button>
          </div>

          {/* Métriques poétiques */}
          {!isLoading && explorations && (
            <PoeticStatsGrid 
              explorations={explorations} 
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
          )}

          {/* Galerie d'explorations en masonry */}
          <section className="animate-fade-in animation-delay-600">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="gaspard-main-title text-2xl font-bold text-gaspard-primary">
                Paysages Narratifs
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gaspard-primary/30 via-gaspard-primary/10 to-transparent"></div>
              <span className="text-sm text-gaspard-muted/60 font-light">
                {filteredExplorations?.length || 0} univers tissés
              </span>
            </div>

            {isLoading ? (
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
            ) : filteredExplorations?.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <Sparkles className="h-16 w-16 text-gaspard-accent/40 mx-auto mb-6 animate-soft-pulse" />
                  <h3 className="gaspard-main-title text-xl font-semibold text-gaspard-primary mb-4">
                    {searchTerm ? 'Aucune résonance trouvée' : 'L\'atelier attend votre première création'}
                  </h3>
                  <p className="text-gaspard-muted mb-8 font-light leading-relaxed">
                    {searchTerm 
                      ? 'Explorez d\'autres termes pour révéler les essences cachées'
                      : 'Donnez naissance au premier paysage narratif de cette collection poétique'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90 text-white rounded-2xl px-8 py-3 shadow-lg shadow-gaspard-primary/20 hover:shadow-xl hover:shadow-gaspard-primary/30 transition-all duration-300 hover:scale-105 border-0"
                      onClick={() => navigate('/admin/explorations/new')}
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      Éveiller la Première Essence
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredExplorations?.map((exploration, index) => (
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

export default ExplorationsAdmin;