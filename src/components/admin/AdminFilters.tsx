
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Filter } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';

interface AdminFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [villeFilter, setVilleFilter] = useState('');

  const handleVilleFilterChange = (value: string) => {
    setVilleFilter(value);
    
    if (!marches) {
      onFilterChange([]);
      return;
    }

    if (!value.trim()) {
      onFilterChange(marches);
      return;
    }

    const filtered = marches.filter(marche => {
      if (!marche || !marche.ville) return false;
      return marche.ville.toLowerCase().includes(value.toLowerCase());
    });

    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setVilleFilter('');
    onFilterChange(marches || []);
  };

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
        
        {villeFilter && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-white hover:bg-white/10"
          >
            Effacer les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Filtrer par ville</label>
            <Input
              placeholder="Rechercher une ville..."
              value={villeFilter}
              onChange={(e) => handleVilleFilterChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFilters;
