
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { cn } from '../../lib/utils';

interface AdminFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
}

interface FilterState {
  dateDebut: Date | undefined;
  dateFin: Date | undefined;
  region: string;
  departement: string;
  ville: string;
  selectedTags: string[];
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    dateDebut: undefined,
    dateFin: undefined,
    region: '',
    departement: '',
    ville: '',
    selectedTags: []
  });

  // Extraire les valeurs uniques pour les selects
  const uniqueRegions = [...new Set(marches.map(m => m.region).filter(Boolean))].sort();
  const uniqueDepartements = [...new Set(marches.map(m => m.departement).filter(Boolean))].sort();
  const uniqueVilles = [...new Set(marches.map(m => m.ville).filter(Boolean))].sort();
  const uniqueTags = [...new Set(marches.flatMap(m => 
    m.tags ? m.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
  ))].sort();

  // Appliquer les filtres
  useEffect(() => {
    let filteredMarches = marches;

    // Filtre par date de début
    if (filters.dateDebut) {
      filteredMarches = filteredMarches.filter(marche => {
        if (!marche.date) return false;
        const marcheDate = new Date(marche.date);
        return marcheDate >= filters.dateDebut!;
      });
    }

    // Filtre par date de fin
    if (filters.dateFin) {
      filteredMarches = filteredMarches.filter(marche => {
        if (!marche.date) return false;
        const marcheDate = new Date(marche.date);
        return marcheDate <= filters.dateFin!;
      });
    }

    // Filtre par région
    if (filters.region) {
      filteredMarches = filteredMarches.filter(marche => marche.region === filters.region);
    }

    // Filtre par département
    if (filters.departement) {
      filteredMarches = filteredMarches.filter(marche => marche.departement === filters.departement);
    }

    // Filtre par ville
    if (filters.ville) {
      filteredMarches = filteredMarches.filter(marche => marche.ville === filters.ville);
    }

    // Filtre par tags
    if (filters.selectedTags.length > 0) {
      filteredMarches = filteredMarches.filter(marche => {
        if (!marche.tags) return false;
        const marcheTags = marche.tags.split(',').map(tag => tag.trim());
        return filters.selectedTags.some(selectedTag => marcheTags.includes(selectedTag));
      });
    }

    onFilterChange(filteredMarches);
  }, [filters, marches, onFilterChange]);

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateDebut: undefined,
      dateFin: undefined,
      region: '',
      departement: '',
      ville: '',
      selectedTags: []
    });
  };

  const hasActiveFilters = filters.dateDebut || filters.dateFin || filters.region || 
                         filters.departement || filters.ville || filters.selectedTags.length > 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filtres</h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-white border-white/30 hover:bg-white/10"
          >
            Effacer les filtres
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        {/* Date début */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Date début</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-white border-white/30",
                  !filters.dateDebut && "text-white/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateDebut ? format(filters.dateDebut, "PPP", { locale: fr }) : "Sélectionner"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateDebut}
                onSelect={(date) => setFilters(prev => ({ ...prev, dateDebut: date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date fin */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Date fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-white border-white/30",
                  !filters.dateFin && "text-white/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFin ? format(filters.dateFin, "PPP", { locale: fr }) : "Sélectionner"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFin}
                onSelect={(date) => setFilters(prev => ({ ...prev, dateFin: date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Région */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Région</label>
          <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
            <SelectTrigger className="text-white border-white/30">
              <SelectValue placeholder="Toutes les régions" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="">Toutes les régions</SelectItem>
              {uniqueRegions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Département */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Département</label>
          <Select value={filters.departement} onValueChange={(value) => setFilters(prev => ({ ...prev, departement: value }))}>
            <SelectTrigger className="text-white border-white/30">
              <SelectValue placeholder="Tous les départements" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="">Tous les départements</SelectItem>
              {uniqueDepartements.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Ville</label>
          <Select value={filters.ville} onValueChange={(value) => setFilters(prev => ({ ...prev, ville: value }))}>
            <SelectTrigger className="text-white border-white/30">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="">Toutes les villes</SelectItem>
              {uniqueVilles.map(ville => (
                <SelectItem key={ville} value={ville}>{ville}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      {uniqueTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Tags</label>
          <div className="flex flex-wrap gap-2">
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-colors",
                  filters.selectedTags.includes(tag)
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {tag}
                {filters.selectedTags.includes(tag) && (
                  <X className="inline ml-1 h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFilters;
