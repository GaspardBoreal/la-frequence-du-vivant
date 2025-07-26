
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Filter, X } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';

interface AdminFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extraire les régions uniques de manière sécurisée
  const regions = useMemo(() => {
    if (!marches || marches.length === 0) return [];
    
    const uniqueRegions = new Set<string>();
    marches.forEach(marche => {
      if (marche.region && typeof marche.region === 'string' && marche.region.trim()) {
        uniqueRegions.add(marche.region.trim());
      }
    });
    return Array.from(uniqueRegions).sort();
  }, [marches]);

  // Extraire tous les tags disponibles
  const allTags = useMemo(() => {
    if (!marches || marches.length === 0) return [];
    
    const uniqueTags = new Set<string>();
    marches.forEach(marche => {
      // Tags Supabase (array)
      if (marche.supabaseTags && Array.isArray(marche.supabaseTags)) {
        marche.supabaseTags.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            uniqueTags.add(tag.trim());
          }
        });
      }
      // Tags legacy (string)
      if (marche.tags && typeof marche.tags === 'string') {
        marche.tags.split(',').forEach(tag => {
          const cleanTag = tag.trim();
          if (cleanTag) {
            uniqueTags.add(cleanTag);
          }
        });
      }
    });
    return Array.from(uniqueTags).sort();
  }, [marches]);

  // Appliquer les filtres
  useEffect(() => {
    if (!marches || marches.length === 0) {
      onFilterChange([]);
      return;
    }

    let filtered = [...marches];

    // Filtre par région
    if (regionFilter) {
      filtered = filtered.filter(marche => 
        marche.region && marche.region === regionFilter
      );
    }

    // Filtre par ville
    if (villeFilter) {
      filtered = filtered.filter(marche =>
        marche.ville && marche.ville.toLowerCase().includes(villeFilter.toLowerCase())
      );
    }

    // Filtre par tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(marche => {
        // Vérifier les tags Supabase
        if (marche.supabaseTags && Array.isArray(marche.supabaseTags)) {
          return selectedTags.some(tag => marche.supabaseTags!.includes(tag));
        }
        // Vérifier les tags legacy
        if (marche.tags && typeof marche.tags === 'string') {
          const marcheTags = marche.tags.split(',').map(tag => tag.trim());
          return selectedTags.some(tag => marcheTags.includes(tag));
        }
        return false;
      });
    }

    onFilterChange(filtered);
  }, [marches, regionFilter, villeFilter, selectedTags, onFilterChange]);

  const clearAllFilters = () => {
    setRegionFilter('');
    setVilleFilter('');
    setSelectedTags([]);
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const hasActiveFilters = regionFilter || villeFilter || selectedTags.length > 0;

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
            onClick={clearAllFilters}
            className="text-white hover:bg-white/10"
          >
            Effacer tous les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Région */}
            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Région</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les régions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Ville</Label>
              <Input
                placeholder="Rechercher une ville..."
                value={villeFilter}
                onChange={(e) => setVilleFilter(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white text-sm font-medium">Ajouter un tag</Label>
                <Select value="" onValueChange={addTag}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionner un tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTags
                      .filter(tag => !selectedTags.includes(tag))
                      .map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tags sélectionnés */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Tags sélectionnés:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFilters;
