import React from 'react';
import { Filter, Calendar, MapPin, Database } from 'lucide-react';
import { MarcheFilter } from './MarcheFilter';
import { ExplorationFilter } from './ExplorationFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface InsightsFiltersProps {
  filters: {
    dateRange: string;
    regions: string[];
    dataTypes: string[];
    marches: string[];
    explorations: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export const InsightsFilters: React.FC<InsightsFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const dateRanges = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '3 derniers mois' },
    { value: 'all', label: 'Toutes les données' }
  ];

  const regions = [
    'NOUVELLE-AQUITAINE',
    'OCCITANIE', 
    'PROVENCE-ALPES-CÔTE D\'AZUR',
    'AUVERGNE-RHÔNE-ALPES'
  ];

  const dataTypes = [
    { value: 'biodiversity', label: 'Biodiversité', icon: '🌿' },
    { value: 'weather', label: 'Météo', icon: '🌤️' },
    { value: 'real_estate', label: 'Immobilier', icon: '🏠' }
  ];

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleRegion = (region: string) => {
    const newRegions = filters.regions.includes(region)
      ? filters.regions.filter(r => r !== region)
      : [...filters.regions, region];
    updateFilter('regions', newRegions);
  };

  const toggleDataType = (dataType: string) => {
    const newDataTypes = filters.dataTypes.includes(dataType)
      ? filters.dataTypes.filter(dt => dt !== dataType)
      : [...filters.dataTypes, dataType];
    updateFilter('dataTypes', newDataTypes);
  };

  const activeFiltersCount = 
    (filters.dateRange !== 'all' ? 1 : 0) +
    filters.regions.length +
    filters.marches.length +
    filters.explorations.length +
    (filters.dataTypes.length < 3 ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Date Range Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            {dateRanges.find(dr => dr.value === filters.dateRange)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Période</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {dateRanges.map(range => (
            <DropdownMenuCheckboxItem
              key={range.value}
              checked={filters.dateRange === range.value}
              onCheckedChange={() => updateFilter('dateRange', range.value)}
            >
              {range.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Marches Filter */}
      <MarcheFilter
        selectedMarches={filters.marches}
        onMarchesChange={(marches) => updateFilter('marches', marches)}
      />

      {/* Explorations Filter */}
      <ExplorationFilter
        selectedExplorations={filters.explorations}
        onExplorationsChange={(explorations) => updateFilter('explorations', explorations)}
      />

      {/* Regions Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MapPin className="w-4 h-4" />
            Régions
            {filters.regions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filters.regions.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Régions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {regions.map(region => (
            <DropdownMenuCheckboxItem
              key={region}
              checked={filters.regions.includes(region)}
              onCheckedChange={() => toggleRegion(region)}
            >
              {region}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Data Types Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Database className="w-4 h-4" />
            Types de données
            {filters.dataTypes.length < 3 && (
              <Badge variant="secondary" className="ml-1">
                {filters.dataTypes.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Types de données</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {dataTypes.map(dataType => (
            <DropdownMenuCheckboxItem
              key={dataType.value}
              checked={filters.dataTypes.includes(dataType.value)}
              onCheckedChange={() => toggleDataType(dataType.value)}
            >
              <span className="flex items-center gap-2">
                <span>{dataType.icon}</span>
                {dataType.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Main Filter Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onFiltersChange({
              dateRange: 'all',
              regions: [],
              dataTypes: ['biodiversity', 'weather', 'real_estate'],
              marches: [],
              explorations: []
            })}
          >
            Réinitialiser les filtres
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};