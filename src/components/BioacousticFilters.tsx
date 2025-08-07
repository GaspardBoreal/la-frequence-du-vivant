import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter, X, Search } from 'lucide-react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface BioacousticFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
  theme: RegionalTheme;
}

const BioacousticFilters: React.FC<BioacousticFiltersProps> = ({ marches, onFilterChange, theme }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [villeFilter, setVilleFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [departementFilter, setDepartementFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Fonction sécurisée pour filtrer les marches
  const applyFilters = (ville: string, region: string, departement: string, tags: string, search: string) => {
    if (!marches || marches.length === 0) {
      onFilterChange([]);
      return;
    }

    let filtered = marches;

    // Filtre par ville
    if (ville.trim()) {
      filtered = filtered.filter(marche => {
        const marcheVille = marche?.ville || '';
        return marcheVille.toLowerCase().includes(ville.toLowerCase());
      });
    }

    // Filtre par région
    if (region && region !== 'all') {
      filtered = filtered.filter(marche => {
        const marcheRegion = marche?.region || '';
        return marcheRegion === region;
      });
    }

    // Filtre par département
    if (departement && departement !== 'all') {
      filtered = filtered.filter(marche => {
        const marcheDepartement = marche?.departement || '';
        return marcheDepartement === departement;
      });
    }

    // Filtre par tags
    if (tags.trim()) {
      filtered = filtered.filter(marche => {
        const marcheTags = marche?.supabaseTags || [];
        return marcheTags.some(tag => 
          tag.toLowerCase().includes(tags.toLowerCase())
        );
      });
    }

    // Recherche textuelle dans les contenus
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(marche => {
        const theme = marche?.theme || '';
        const descriptifCourt = marche?.descriptifCourt || '';
        const descriptifLong = marche?.poeme || '';
        const nomMarche = marche?.nomMarche || '';
        
        return theme.toLowerCase().includes(searchLower) ||
               descriptifCourt.toLowerCase().includes(searchLower) ||
               descriptifLong.toLowerCase().includes(searchLower) ||
               nomMarche.toLowerCase().includes(searchLower);
      });
    }

    onFilterChange(filtered);
  };

  // Gestionnaires d'événements
  const handleVilleChange = (value: string) => {
    setVilleFilter(value);
    applyFilters(value, regionFilter, departementFilter, tagsFilter, searchText);
  };

  const handleRegionChange = (value: string) => {
    setRegionFilter(value);
    applyFilters(villeFilter, value, departementFilter, tagsFilter, searchText);
  };

  const handleDepartementChange = (value: string) => {
    setDepartementFilter(value);
    applyFilters(villeFilter, regionFilter, value, tagsFilter, searchText);
  };

  const handleTagsChange = (value: string) => {
    setTagsFilter(value);
    applyFilters(villeFilter, regionFilter, departementFilter, value, searchText);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    applyFilters(villeFilter, regionFilter, departementFilter, tagsFilter, value);
  };

  const clearFilters = () => {
    setVilleFilter('');
    setRegionFilter('');
    setDepartementFilter('');
    setTagsFilter('');
    setSearchText('');
    onFilterChange(marches);
  };

  // Obtenir les régions uniques
  const getUniqueRegions = () => {
    if (!marches || marches.length === 0) return [];
    
    const regions = marches
      .map(marche => marche?.region)
      .filter(region => region && region.trim() !== '')
      .filter((region, index, arr) => arr.indexOf(region) === index)
      .sort();
    
    return regions;
  };

  // Obtenir les départements uniques
  const getUniqueDepartements = () => {
    if (!marches || marches.length === 0) return [];
    
    const departements = marches
      .map(marche => marche?.departement)
      .filter(dept => dept && dept.trim() !== '')
      .filter((dept, index, arr) => arr.indexOf(dept) === index)
      .sort();
    
    return departements;
  };

  // Obtenir tous les tags uniques avec leur comptage basé sur les marches filtrées
  const getUniqueTagsWithCount = () => {
    if (!marches || marches.length === 0) return [];
    
    // Calculer d'abord les marches filtrées (sans le filtre de tags)
    let filteredForCounting = marches;
    
    // Appliquer tous les filtres sauf celui des tags
    if (villeFilter.trim()) {
      filteredForCounting = filteredForCounting.filter(marche => {
        const marcheVille = marche?.ville || '';
        return marcheVille.toLowerCase().includes(villeFilter.toLowerCase());
      });
    }
    
    if (regionFilter && regionFilter !== 'all') {
      filteredForCounting = filteredForCounting.filter(marche => {
        const marcheRegion = marche?.region || '';
        return marcheRegion === regionFilter;
      });
    }
    
    if (departementFilter && departementFilter !== 'all') {
      filteredForCounting = filteredForCounting.filter(marche => {
        const marcheDepartement = marche?.departement || '';
        return marcheDepartement === departementFilter;
      });
    }
    
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredForCounting = filteredForCounting.filter(marche => {
        const theme = marche?.theme || '';
        const descriptifCourt = marche?.descriptifCourt || '';
        const descriptifLong = marche?.poeme || '';
        const nomMarche = marche?.nomMarche || '';
        
        return theme.toLowerCase().includes(searchLower) ||
               descriptifCourt.toLowerCase().includes(searchLower) ||
               descriptifLong.toLowerCase().includes(searchLower) ||
               nomMarche.toLowerCase().includes(searchLower);
      });
    }
    
    // Compter les tags dans les marches filtrées
    const tagCounts: { [key: string]: number } = {};
    
    filteredForCounting.forEach(marche => {
      const marcheTags = marche?.supabaseTags || [];
      marcheTags.forEach(tag => {
        if (tag && tag.trim() !== '') {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });
    
    // Convertir en tableau et trier
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  };

  const uniqueRegions = getUniqueRegions();
  const uniqueDepartements = getUniqueDepartements();
  const uniqueTagsWithCount = getUniqueTagsWithCount();
  const hasActiveFilters = villeFilter || regionFilter || departementFilter || tagsFilter || searchText;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-foreground border-accent/30 hover:bg-accent/20 hover:text-foreground bg-background/20 backdrop-blur-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-foreground hover:bg-accent/20 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="gaspard-glass rounded-lg p-4 space-y-4">
          {/* Recherche textuelle globale */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Recherche dans les contenus</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher dans thème, description, nom de marche..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-background/20 border-accent/30 text-foreground placeholder:text-muted-foreground pl-10 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtre par ville */}
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Ville</label>
              <Input
                placeholder="Rechercher une ville..."
                value={villeFilter}
                onChange={(e) => handleVilleChange(e.target.value)}
                className="bg-background/20 border-accent/30 text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
              />
            </div>

            {/* Filtre par région */}
            {uniqueRegions.length > 0 && (
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">Région</label>
                <Select value={regionFilter} onValueChange={handleRegionChange}>
                  <SelectTrigger className="bg-background/20 border-accent/30 text-foreground backdrop-blur-sm">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-accent/30 shadow-lg z-50 max-h-60 overflow-y-auto backdrop-blur-sm">
                    <SelectItem value="all" className="text-foreground hover:bg-accent/20">
                      Toutes les régions
                    </SelectItem>
                    {uniqueRegions.map((region) => (
                      <SelectItem key={region} value={region} className="text-foreground hover:bg-accent/20">
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtre par département */}
            {uniqueDepartements.length > 0 && (
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">Département</label>
                <Select value={departementFilter} onValueChange={handleDepartementChange}>
                  <SelectTrigger className="bg-background/20 border-accent/30 text-foreground backdrop-blur-sm">
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-accent/30 shadow-lg z-50 max-h-60 overflow-y-auto backdrop-blur-sm">
                    <SelectItem value="all" className="text-foreground hover:bg-accent/20">
                      Tous les départements
                    </SelectItem>
                    {uniqueDepartements.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-foreground hover:bg-accent/20">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filtre par tags avec comptage */}
          {uniqueTagsWithCount.length > 0 && (
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Tags</label>
              <Input
                placeholder="Rechercher dans les tags..."
                value={tagsFilter}
                onChange={(e) => handleTagsChange(e.target.value)}
                className="bg-background/20 border-accent/30 text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {uniqueTagsWithCount.slice(0, 10).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => handleTagsChange(tag)}
                    className="px-3 py-1 bg-accent/20 hover:bg-accent/30 rounded-full text-foreground text-xs transition-colors flex items-center space-x-1 backdrop-blur-sm"
                  >
                    <span>{tag}</span>
                    <span className="bg-accent/30 px-1.5 py-0.5 rounded-full text-xs font-medium">
                      {count}
                    </span>
                  </button>
                ))}
                {uniqueTagsWithCount.length > 10 && (
                  <span className="text-muted-foreground text-xs">+{uniqueTagsWithCount.length - 10} autres tags</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BioacousticFilters;