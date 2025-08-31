import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  MapPin,
  X,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportRecord {
  id: string;
  opus_id: string;
  marche_id: string;
  import_date: string;
  contexte_data: any;
  fables_data: any[];
  sources: any[];
  completude_score: number;
  marche_nom?: string;
  marche_ville?: string;
}

interface ModernImportFiltersProps {
  imports: ImportRecord[];
  onFilterChange: (filteredImports: ImportRecord[]) => void;
  loading?: boolean;
}

export const ModernImportFilters: React.FC<ModernImportFiltersProps> = ({
  imports,
  onFilterChange,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [creativeModeOnly, setCreativeModeOnly] = useState(false);
  const [minCompleteness, setMinCompleteness] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get unique marches for filter
  const uniqueMarches = useMemo(() => {
    const marches = new Map();
    imports.forEach(imp => {
      if (imp.marche_nom && !marches.has(imp.marche_id)) {
        marches.set(imp.marche_id, {
          id: imp.marche_id,
          nom: imp.marche_nom,
          ville: imp.marche_ville
        });
      }
    });
    return Array.from(marches.values());
  }, [imports]);

  // Deep search function
  const searchInObject = (obj: any, searchTerms: string[]): boolean => {
    if (!obj || typeof obj === 'function') return false;
    
    if (typeof obj === 'string') {
      const normalizedText = obj.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      return searchTerms.some(term => {
        const normalizedTerm = term.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedText.includes(normalizedTerm);
      });
    }
    
    if (typeof obj === 'number') {
      return searchTerms.some(term => 
        obj.toString().toLowerCase().includes(term.toLowerCase())
      );
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => searchInObject(item, searchTerms));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => searchInObject(value, searchTerms));
    }
    
    return false;
  };

  // Filter logic
  const filteredImports = useMemo(() => {
    return imports.filter(importRecord => {
      // Search filter
      if (searchTerm.trim()) {
        const searchTerms = searchTerm.trim().split(/\s+/).filter(term => term.length > 0);
        const matchesBasicInfo = 
          importRecord.marche_nom && searchInObject(importRecord.marche_nom, searchTerms) ||
          importRecord.marche_ville && searchInObject(importRecord.marche_ville, searchTerms);
        
        const matchesContexte = importRecord.contexte_data && 
          searchInObject(importRecord.contexte_data, searchTerms);
        
        const matchesFables = importRecord.fables_data?.length > 0 && 
          searchInObject(importRecord.fables_data, searchTerms);
        
        const matchesSources = importRecord.sources?.length > 0 && 
          searchInObject(importRecord.sources, searchTerms);
        
        const matchesSearch = matchesBasicInfo || matchesContexte || matchesFables || matchesSources;
        if (!matchesSearch) return false;
      }

      // Marche filter
      if (selectedMarche !== 'all' && importRecord.marche_id !== selectedMarche) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const importDate = new Date(importRecord.import_date);
        if (dateRange.from && importDate < dateRange.from) return false;
        if (dateRange.to && importDate > dateRange.to) return false;
      }

      // Creative mode filter (assuming this is based on some criteria)
      if (creativeModeOnly) {
        // Define creative mode criteria - could be based on completeness, fables, etc.
        const hasRichContent = importRecord.completude_score > 70 && 
          importRecord.fables_data?.length > 0 &&
          importRecord.contexte_data;
        if (!hasRichContent) return false;
      }

      // Completeness filter
      if (importRecord.completude_score < minCompleteness) {
        return false;
      }

      return true;
    });
  }, [imports, searchTerm, selectedMarche, dateRange, creativeModeOnly, minCompleteness]);

  // Update parent when filters change
  useEffect(() => {
    onFilterChange(filteredImports);
  }, [filteredImports, onFilterChange]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedMarche('all');
    setDateRange({});
    setCreativeModeOnly(false);
    setMinCompleteness(0);
  };

  const activeFiltersCount = [
    searchTerm.trim(),
    selectedMarche !== 'all',
    dateRange.from || dateRange.to,
    creativeModeOnly,
    minCompleteness > 0
  ].filter(Boolean).length;

  return (
    <Card className="bg-background/50 backdrop-blur-sm border-border/30 mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher dans tous les contenus (marché, contexte, espèces, technodiversité, fables, sources)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-12 text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-300"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Marche Filter */}
            <Select value={selectedMarche} onValueChange={setSelectedMarche}>
              <SelectTrigger className="w-auto min-w-[160px] bg-background/50 border-border/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="Toutes les marches" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marches</SelectItem>
                {uniqueMarches.map((marche) => (
                  <SelectItem key={marche.id} value={marche.id}>
                    {marche.nom} {marche.ville && `(${marche.ville})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-background/50 border-border/50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM", { locale: fr })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: fr })
                    )
                  ) : (
                    "Période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || {})}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Creative Mode Toggle */}
            <div className="flex items-center space-x-2 bg-background/50 border border-border/50 rounded-md px-3 py-2">
              <Switch
                id="creative-mode"
                checked={creativeModeOnly}
                onCheckedChange={setCreativeModeOnly}
              />
              <Label htmlFor="creative-mode" className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" />
                Mode créatif
              </Label>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="bg-background/50 border-border/50"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Avancé
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Effacer tout
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <Card className="bg-muted/20 border-border/30 p-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Filtres avancés</h4>
                
                {/* Completeness Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Complétude minimale: {minCompleteness}%
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={minCompleteness}
                      onChange={(e) => setMinCompleteness(Number(e.target.value))}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="min-w-[60px] justify-center">
                      {minCompleteness}%
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/30">
            <span>
              {loading ? (
                "Chargement..."
              ) : (
                `${filteredImports.length} import${filteredImports.length !== 1 ? 's' : ''} trouvé${filteredImports.length !== 1 ? 's' : ''}`
              )}
            </span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {activeFiltersCount} filtres actifs
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};