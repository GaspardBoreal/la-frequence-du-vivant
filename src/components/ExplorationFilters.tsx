import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Filter, X, Search, Palette, Sparkles } from 'lucide-react';
import { Exploration } from '@/hooks/useExplorations';

interface ExplorationFiltersProps {
  explorations: Exploration[];
  onFilterChange: (filteredExplorations: Exploration[]) => void;
}

const ExplorationFilters: React.FC<ExplorationFiltersProps> = ({ explorations, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  // Fonction sécurisée pour filtrer les explorations
  const applyFilters = (search: string, keyword: string) => {
    if (!explorations || explorations.length === 0) {
      onFilterChange([]);
      return;
    }

    let filtered = explorations;

    // Recherche textuelle dans les contenus
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(exploration => {
        const name = exploration?.name || '';
        const description = exploration?.description || '';
        const metaDescription = exploration?.meta_description || '';
        
        return name.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower) ||
               metaDescription.toLowerCase().includes(searchLower);
      });
    }

    // Filtre par mot-clé dans les meta_keywords
    if (keyword.trim()) {
      filtered = filtered.filter(exploration => {
        const keywords = exploration?.meta_keywords || [];
        return keywords.some(kw => 
          kw.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    }

    onFilterChange(filtered);
  };

  // Gestionnaires d'événements
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    applyFilters(value, keywordFilter);
  };

  const handleKeywordChange = (value: string) => {
    setKeywordFilter(value);
    applyFilters(searchText, value);
  };

  const clearFilters = () => {
    setSearchText('');
    setKeywordFilter('');
    onFilterChange(explorations);
  };

  // Obtenir tous les mots-clés uniques avec leur comptage
  const getUniqueKeywordsWithCount = () => {
    if (!explorations || explorations.length === 0) return [];
    
    // Calculer d'abord les explorations filtrées (sans le filtre de mots-clés)
    let filteredForCounting = explorations;
    
    // Appliquer le filtre de recherche textuelle seulement
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredForCounting = filteredForCounting.filter(exploration => {
        const name = exploration?.name || '';
        const description = exploration?.description || '';
        const metaDescription = exploration?.meta_description || '';
        
        return name.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower) ||
               metaDescription.toLowerCase().includes(searchLower);
      });
    }
    
    // Compter les mots-clés dans les explorations filtrées
    const keywordCounts: { [key: string]: number } = {};
    
    filteredForCounting.forEach(exploration => {
      const keywords = exploration?.meta_keywords || [];
      keywords.forEach(keyword => {
        if (keyword && keyword.trim() !== '') {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });
    
    // Convertir en tableau et trier par ordre décroissant de count
    return Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count);
  };

  const uniqueKeywordsWithCount = getUniqueKeywordsWithCount();
  const hasActiveFilters = searchText || keywordFilter;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-gaspard-primary border-gaspard-primary/30 hover:bg-gaspard-primary/10 hover:text-gaspard-primary bg-background/60 backdrop-blur-sm rounded-2xl transition-all duration-500 hover:shadow-lg hover:shadow-gaspard-primary/20"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Masquer les filtres' : 'Révéler les filtres'}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-gaspard-muted hover:bg-gaspard-accent/10 hover:text-gaspard-accent flex items-center rounded-2xl transition-all duration-500"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-background/60 backdrop-blur-sm rounded-3xl p-6 space-y-6 border border-gaspard-primary/20 shadow-lg shadow-gaspard-primary/10">
          {/* Recherche textuelle globale avec style poétique */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-gaspard-accent" />
              <label className="text-gaspard-primary text-sm font-medium">Recherche narrative</label>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gaspard-muted/60 h-4 w-4 group-hover:text-gaspard-primary group-focus-within:text-gaspard-accent transition-all duration-500" />
              <Input
                placeholder="Chercher dans les titres, descriptions, essences..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-background/40 border-gaspard-primary/20 text-gaspard-foreground placeholder:text-gaspard-muted/60 pl-12 backdrop-blur-sm rounded-2xl focus:border-gaspard-primary/50 transition-all duration-500 hover:bg-background/60 focus:bg-background/80 hover:shadow-md hover:shadow-gaspard-primary/10"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gaspard-primary/5 via-transparent to-gaspard-accent/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-50 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>

          {/* Filtre par mots-clés avec comptage et style poétique */}
          {uniqueKeywordsWithCount.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-gaspard-secondary" />
                <label className="text-gaspard-primary text-sm font-medium">Essences thématiques</label>
              </div>
              <Input
                placeholder="Rechercher une essence..."
                value={keywordFilter}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="bg-background/40 border-gaspard-primary/20 text-gaspard-foreground placeholder:text-gaspard-muted/60 backdrop-blur-sm rounded-2xl focus:border-gaspard-primary/50 transition-all duration-500 hover:bg-background/60 focus:bg-background/80"
              />
              <div className="flex flex-wrap gap-3 mt-4">
                {uniqueKeywordsWithCount.slice(0, 12).map(({ keyword, count }) => (
                  <button
                    key={keyword}
                    onClick={() => handleKeywordChange(keyword)}
                    className="group px-4 py-2 bg-gradient-to-r from-gaspard-primary/10 to-gaspard-accent/10 hover:from-gaspard-primary/20 hover:to-gaspard-accent/20 rounded-2xl text-gaspard-foreground text-sm transition-all duration-500 flex items-center space-x-2 backdrop-blur-sm border border-gaspard-primary/20 hover:border-gaspard-primary/40 hover:shadow-md hover:shadow-gaspard-primary/10"
                  >
                    <span className="font-light">{keyword}</span>
                    <span className="bg-gaspard-primary/20 px-2 py-0.5 rounded-full text-xs font-medium text-gaspard-primary group-hover:bg-gaspard-accent/30 group-hover:text-gaspard-accent transition-all duration-300">
                      {count}
                    </span>
                  </button>
                ))}
                {uniqueKeywordsWithCount.length > 12 && (
                  <div className="flex items-center px-4 py-2 text-gaspard-muted/60 text-sm font-light">
                    <Sparkles className="h-3 w-3 mr-1 opacity-50" />
                    +{uniqueKeywordsWithCount.length - 12} autres essences
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorationFilters;