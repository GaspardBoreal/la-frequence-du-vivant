
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, X } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';

interface AdminFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [villeFilter, setVilleFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Fonction sécurisée pour filtrer les marches
  const applyFilters = (ville: string, region: string) => {
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

    onFilterChange(filtered);
  };

  // Gestionnaires d'événements
  const handleVilleChange = (value: string) => {
    setVilleFilter(value);
    applyFilters(value, regionFilter);
  };

  const handleRegionChange = (value: string) => {
    setRegionFilter(value);
    applyFilters(villeFilter, value);
  };

  const clearFilters = () => {
    setVilleFilter('');
    setRegionFilter('');
    onFilterChange(marches);
  };

  // Obtenir les régions uniques (en s'assurant qu'elles ne sont pas vides)
  const getUniqueRegions = () => {
    if (!marches || marches.length === 0) return [];
    
    const regions = marches
      .map(marche => marche?.region)
      .filter(region => region && region.trim() !== '') // Filtrer les valeurs vides
      .filter((region, index, arr) => arr.indexOf(region) === index) // Unique values
      .sort();
    
    return regions;
  };

  const uniqueRegions = getUniqueRegions();
  const hasActiveFilters = villeFilter || regionFilter;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-white border-white hover:bg-white hover:text-slate-900"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-white hover:bg-white/10 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4">
          {/* Filtre par ville */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Filtrer par ville</label>
            <Input
              placeholder="Rechercher une ville..."
              value={villeFilter}
              onChange={(e) => handleVilleChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>

          {/* Filtre par région - seulement si nous avons des régions */}
          {uniqueRegions.length > 0 && (
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Filtrer par région</label>
              <Select value={regionFilter} onValueChange={handleRegionChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
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
        </div>
      )}
    </div>
  );
};

export default AdminFilters;
