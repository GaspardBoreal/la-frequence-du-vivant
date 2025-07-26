
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
  departement: string;
  ville: string;
  tags: string[];
}

const AdminFilters: React.FC<AdminFiltersProps> = ({ marches, onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    dateDebut: null,
    dateFin: null,
    region: '',
    departement: '',
    ville: '',
    tags: []
  });

  const [showFilters, setShowFilters] = useState(false);

  // Extraire les valeurs uniques pour les listes déroulantes de manière sécurisée
  const regions = React.useMemo(() => {
    const uniqueRegions = new Set<string>();
    marches.forEach(marche => {
      if (marche.region && typeof marche.region === 'string') {
        uniqueRegions.add(marche.region);
      }
    });
    return Array.from(uniqueRegions).sort();
  }, [marches]);

  const departements = React.useMemo(() => {
    const uniqueDepartements = new Set<string>();
    marches.forEach(marche => {
      if (marche.departement && typeof marche.departement === 'string') {
        uniqueDepartements.add(marche.departement);
      }
    });
    return Array.from(uniqueDepartements).sort();
  }, [marches]);

  const allTags = React.useMemo(() => {
    const uniqueTags = new Set<string>();
    marches.forEach(marche => {
      // Gérer les tags Supabase
      if (marche.supabaseTags && Array.isArray(marche.supabaseTags)) {
        marche.supabaseTags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            uniqueTags.add(tag);
          }
        });
      }
      // Gérer les tags legacy (format string avec virgules)
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

  // Appliquer les filtres de manière sécurisée
  useEffect(() => {
    if (!marches || marches.length === 0) {
      onFilterChange([]);
      return;
    }

    let filtered = [...marches];

    // Filtre par date de début
    if (filters.dateDebut) {
      filtered = filtered.filter(marche => {
        if (!marche.date) return false;
        try {
          const marcheDate = new Date(marche.date);
          return marcheDate >= filters.dateDebut!;
        } catch {
          return false;
        }
      });
    }

    // Filtre par date de fin
    if (filters.dateFin) {
      filtered = filtered.filter(marche => {
        if (!marche.date) return false;
        try {
          const marcheDate = new Date(marche.date);
          return marcheDate <= filters.dateFin!;
        } catch {
          return false;
        }
      });
    }

    // Filtre par région
    if (filters.region) {
      filtered = filtered.filter(marche => 
        marche.region && marche.region.toLowerCase().includes(filters.region.toLowerCase())
      );
    }

    // Filtre par département
    if (filters.departement) {
      filtered = filtered.filter(marche =>
        marche.departement && marche.departement.toLowerCase().includes(filters.departement.toLowerCase())
      );
    }

    // Filtre par ville
    if (filters.ville) {
      filtered = filtered.filter(marche =>
        marche.ville && marche.ville.toLowerCase().includes(filters.ville.toLowerCase())
      );
    }

    // Filtre par tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(marche => {
        // Vérifier les tags Supabase
        if (marche.supabaseTags && Array.isArray(marche.supabaseTags)) {
          return filters.tags.some(tag => marche.supabaseTags!.includes(tag));
        }
        // Vérifier les tags legacy
        if (marche.tags && typeof marche.tags === 'string') {
          const marcheTags = marche.tags.split(',').map(tag => tag.trim());
          return filters.tags.some(tag => marcheTags.includes(tag));
        }
        return false;
      });
    }

    onFilterChange(filtered);
  }, [filters, marches, onFilterChange]);

  const clearFilters = () => {
    setFilters({
      dateDebut: null,
      dateFin: null,
      region: '',
      departement: '',
      ville: '',
      tags: []
    });
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
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

  const hasActiveFilters = filters.dateDebut || filters.dateFin || filters.region || filters.departement || filters.ville || filters.tags.length > 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateDebut || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateDebut: date || null }))}
                    initialFocus
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFin || undefined}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateFin: date || null }))}
                    initialFocus
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
                <SelectContent>
                  <SelectItem value="">Toutes les régions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Département */}
            <div className="space-y-2">
              <Label className="text-white">Département</Label>
              <Select value={filters.departement} onValueChange={(value) => setFilters(prev => ({ ...prev, departement: value }))}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les départements</SelectItem>
                  {departements.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                className="bg-white"
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
                <SelectContent>
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
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
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
