
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';

interface AdminFiltersProps {
  marches: MarcheTechnoSensible[];
  onFilterChange: (filteredMarches: MarcheTechnoSensible[]) => void;
}

interface Filters {
  dateDebut: Date | null;
  dateFin: Date | null;
  region: string;
  ville: string;
  tags: string[];
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    dateDebut: null,
    dateFin: null,
    region: '',
    ville: '',
    tags: []
  });

  const [showFilters, setShowFilters] = useState(false);

  // Extraire les valeurs uniques pour les listes déroulantes
  const regions = [...new Set(marches.map(m => m.region).filter(Boolean))].sort();
  
  // Extraire et trier tous les tags disponibles
  const allTags = [...new Set(
    marches.flatMap(m => m.supabaseTags || []).filter(Boolean)
  )].sort();

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...marches];

    // Filtre par date de début
    if (filters.dateDebut) {
      filtered = filtered.filter(marche => {
        if (!marche.date) return false;
        const marcheDate = new Date(marche.date);
        return marcheDate >= filters.dateDebut!;
      });
    }

    // Filtre par date de fin
    if (filters.dateFin) {
      filtered = filtered.filter(marche => {
        if (!marche.date) return false;
        const marcheDate = new Date(marche.date);
        return marcheDate <= filters.dateFin!;
      });
    }

    // Filtre par région
    if (filters.region) {
      filtered = filtered.filter(marche => 
        marche.region?.toLowerCase().includes(filters.region.toLowerCase())
      );
    }

    // Filtre par ville
    if (filters.ville) {
      filtered = filtered.filter(marche =>
        marche.ville?.toLowerCase().includes(filters.ville.toLowerCase())
      );
    }

    // Filtre par tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(marche =>
        filters.tags.some(tag =>
          marche.supabaseTags?.includes(tag)
        )
      );
    }

    onFilterChange(filtered);
  }, [filters, marches, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      dateDebut: null,
      dateFin: null,
      region: '',
      ville: '',
      tags: []
    });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const hasActiveFilters = filters.dateDebut || filters.dateFin || filters.region || filters.ville || filters.tags.length > 0;

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
            className="text-white hover:bg-white/10"
          >
            Effacer tous les filtres
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date début */}
            <div className="space-y-2">
              <Label className="text-white">Date début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white",
                      !filters.dateDebut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateDebut ? format(filters.dateDebut, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateDebut || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateDebut: date || null }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date fin */}
            <div className="space-y-2">
              <Label className="text-white">Date fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white",
                      !filters.dateFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFin ? format(filters.dateFin, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFin || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateFin: date || null }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Région */}
            <div className="space-y-2">
              <Label className="text-white">Région</Label>
              <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="">Toutes les régions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label className="text-white">Ville</Label>
              <Input
                placeholder="Rechercher une ville..."
                value={filters.ville}
                onChange={(e) => setFilters(prev => ({ ...prev, ville: e.target.value }))}
                className="bg-white text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">Tags</Label>
              <Select value="" onValueChange={addTag}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Ajouter un tag" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {allTags
                    .filter(tag => !filters.tags.includes(tag))
                    .map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags sélectionnés */}
          {filters.tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">Tags sélectionnés :</Label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-white text-gray-900">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
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
