import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { X, Search } from 'lucide-react';
import { MarcheTechnoSensible } from '../../../utils/googleSheetsApi';

interface MarcheFiltersMobileProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
  onViewResults: () => void;
  resultsCount: number;
}

const MarcheFiltersMobile: React.FC<MarcheFiltersMobileProps> = ({ 
  marches, 
  onFilterChange, 
  onViewResults,
  resultsCount 
}) => {
  const [villeFilter, setVilleFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [searchText, setSearchText] = useState('');

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

  const applyFilters = (ville: string, region: string, search: string) => {
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

    // Recherche textuelle
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(marche => {
        const theme = marche?.theme || '';
        const descriptifCourt = marche?.descriptifCourt || '';
        const nomMarche = marche?.nomMarche || '';
        
        return theme.toLowerCase().includes(searchLower) ||
               descriptifCourt.toLowerCase().includes(searchLower) ||
               nomMarche.toLowerCase().includes(searchLower);
      });
    }

    onFilterChange(filtered);
  };

  const handleVilleChange = (value: string) => {
    setVilleFilter(value);
    applyFilters(value, regionFilter, searchText);
  };

  const handleRegionChange = (value: string) => {
    setRegionFilter(value);
    applyFilters(villeFilter, value, searchText);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    applyFilters(villeFilter, regionFilter, value);
  };

  const clearFilters = () => {
    setVilleFilter('');
    setRegionFilter('');
    setSearchText('');
    onFilterChange(marches);
  };

  const hasActiveFilters = villeFilter || regionFilter || searchText;
  const uniqueRegions = getUniqueRegions();

  return (
    <div className="space-y-6">
      {/* Recherche textuelle */}
      <div className="space-y-3">
        <Label>Recherche globale</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher dans nom, description..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtre par ville */}
      <div className="space-y-3">
        <Label>Ville</Label>
        <Input
          placeholder="Rechercher une ville..."
          value={villeFilter}
          onChange={(e) => handleVilleChange(e.target.value)}
        />
      </div>

      {/* Filtre par région */}
      {uniqueRegions.length > 0 && (
        <div className="space-y-3">
          <Label>Région</Label>
          <Select value={regionFilter} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les régions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {uniqueRegions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-6">
        <Button 
          onClick={onViewResults} 
          className="w-full"
          disabled={resultsCount === 0}
        >
          Voir {resultsCount} résultat{resultsCount > 1 ? 's' : ''}
        </Button>

        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Résumé des filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Filtres actifs :</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            {villeFilter && <p>• Ville : "{villeFilter}"</p>}
            {regionFilter && regionFilter !== 'all' && <p>• Région : {regionFilter}</p>}
            {searchText && <p>• Recherche : "{searchText}"</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarcheFiltersMobile;