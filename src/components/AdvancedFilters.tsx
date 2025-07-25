
import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Filter, MapPin, Building, Tag } from 'lucide-react';
import { RegionalTheme } from '../utils/regionalThemes';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

interface FilterState {
  regions: string[];
  departments: string[];
  villes: string[];
  tags: string[];
}

interface AdvancedFiltersProps {
  data: MarcheTechnoSensible[];
  onFilterChange: (filteredData: MarcheTechnoSensible[]) => void;
  theme: RegionalTheme;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  data, 
  onFilterChange, 
  theme 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    regions: [],
    departments: [],
    villes: [],
    tags: []
  });

  const [expandedSections, setExpandedSections] = useState({
    regions: false,
    departments: false,
    villes: false,
    tags: false
  });

  // Extraire les valeurs uniques pour chaque filtre
  const uniqueRegions = [...new Set(data.map(item => item.region).filter(Boolean))].sort();
  const uniqueDepartments = [...new Set(data.map(item => item.departement).filter(Boolean))].sort();
  const uniqueVilles = [...new Set(data.map(item => item.ville).filter(Boolean))].sort();
  const uniqueTags = [...new Set(data.map(item => item.theme).filter(Boolean))].sort();

  // Appliquer les filtres
  useEffect(() => {
    let filteredData = data;

    if (filters.regions.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.regions.includes(item.region)
      );
    }

    if (filters.departments.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.departments.includes(item.departement)
      );
    }

    if (filters.villes.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.villes.includes(item.ville)
      );
    }

    if (filters.tags.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.tags.includes(item.theme)
      );
    }

    onFilterChange(filteredData);
  }, [filters, data, onFilterChange]);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      regions: [],
      departments: [],
      villes: [],
      tags: []
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    return filters.regions.length + filters.departments.length + 
           filters.villes.length + filters.tags.length;
  };

  const removeFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item !== value)
    }));
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    category, 
    items 
  }: {
    title: string;
    icon: React.ElementType;
    category: keyof FilterState;
    items: string[];
  }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(category)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-700">{title}</span>
          {filters[category].length > 0 && (
            <span 
              className="px-2 py-1 text-xs rounded-full text-white font-medium"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {filters[category].length}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform ${
            expandedSections[category] ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {expandedSections[category] && (
        <div className="p-4 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {items.map(item => (
              <label 
                key={item}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters[category].includes(item)}
                  onChange={() => toggleFilter(category, item)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* En-tête avec compteur et bouton de réinitialisation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
          {getActiveFiltersCount() > 0 && (
            <span 
              className="px-2 py-1 text-xs rounded-full text-white font-medium"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        {getActiveFiltersCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Filtres actifs */}
      {getActiveFiltersCount() > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Filtres actifs:</p>
          <div className="flex flex-wrap gap-2">
            {filters.regions.map(region => (
              <span 
                key={region}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                {region}
                <button
                  onClick={() => removeFilter('regions', region)}
                  className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.departments.map(dept => (
              <span 
                key={dept}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                {dept}
                <button
                  onClick={() => removeFilter('departments', dept)}
                  className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.villes.map(ville => (
              <span 
                key={ville}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                {ville}
                <button
                  onClick={() => removeFilter('villes', ville)}
                  className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.tags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                {tag}
                <button
                  onClick={() => removeFilter('tags', tag)}
                  className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sections de filtres */}
      <div className="space-y-3">
        <FilterSection
          title="Régions"
          icon={MapPin}
          category="regions"
          items={uniqueRegions}
        />
        <FilterSection
          title="Départements"
          icon={Building}
          category="departments"
          items={uniqueDepartments}
        />
        <FilterSection
          title="Villes"
          icon={MapPin}
          category="villes"
          items={uniqueVilles}
        />
        <FilterSection
          title="Thèmes"
          icon={Tag}
          category="tags"
          items={uniqueTags}
        />
      </div>
    </div>
  );
};

export default AdvancedFilters;
