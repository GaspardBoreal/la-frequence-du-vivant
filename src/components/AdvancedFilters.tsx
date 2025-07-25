
import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface AdvancedFiltersProps {
  data: MarcheTechnoSensible[];
  onFilterChange: (filteredData: MarcheTechnoSensible[]) => void;
  theme: RegionalTheme;
}

interface FilterState {
  regions: string[];
  departments: string[];
  cities: string[];
  tags: string[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ data, onFilterChange, theme }) => {
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    regions: [],
    departments: [],
    cities: [],
    tags: []
  });

  const uniqueRegions = [...new Set(data.map(item => item.region).filter(Boolean))];
  const uniqueDepartments = [...new Set(data.map(item => item.departement).filter(Boolean))];
  const uniqueCities = [...new Set(data.map(item => item.ville).filter(Boolean))];
  const uniqueTags = [...new Set(data.flatMap(item => 
    item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
  ))];

  useEffect(() => {
    // Apply filters
    const filteredData = data.filter(item => {
      const regionMatch = activeFilters.regions.length === 0 || activeFilters.regions.includes(item.region);
      const departmentMatch = activeFilters.departments.length === 0 || activeFilters.departments.includes(item.departement);
      const cityMatch = activeFilters.cities.length === 0 || activeFilters.cities.includes(item.ville);
      const tagsMatch = activeFilters.tags.length === 0 || 
        (item.tags && item.tags.split(',').map(tag => tag.trim()).some(tag => activeFilters.tags.includes(tag)));

      return regionMatch && departmentMatch && cityMatch && tagsMatch;
    });

    onFilterChange(filteredData);
  }, [activeFilters, data, onFilterChange]);

  const handleFilterToggle = (category: keyof FilterState, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      regions: [],
      departments: [],
      cities: [],
      tags: []
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, filterArray) => count + filterArray.length, 0);
  };

  const FilterSection: React.FC<{ 
    title: string; 
    category: keyof FilterState; 
    options: string[] 
  }> = ({ title, category, options }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 text-sm">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters[category].includes(option)}
              onChange={() => handleFilterToggle(category, option)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 truncate flex-1">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Accordion type="multiple">
        <AccordionItem value="regions">
          <AccordionTrigger>Régions</AccordionTrigger>
          <AccordionContent>
            <FilterSection 
              title="Régions" 
              category="regions" 
              options={uniqueRegions} 
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="departments">
          <AccordionTrigger>Départements</AccordionTrigger>
          <AccordionContent>
            <FilterSection
              title="Départements"
              category="departments"
              options={uniqueDepartments}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cities">
          <AccordionTrigger>Villes</AccordionTrigger>
          <AccordionContent>
            <FilterSection
              title="Villes"
              category="cities"
              options={uniqueCities}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tags">
          <AccordionTrigger>Tags</AccordionTrigger>
          <AccordionContent>
            <FilterSection 
              title="Tags" 
              category="tags" 
              options={uniqueTags} 
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center justify-between">
        <button 
          onClick={clearFilters}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Effacer les filtres
        </button>
        {getActiveFilterCount() > 0 && (
          <Badge variant="secondary">
            {getActiveFilterCount()} filtre(s) actif(s)
          </Badge>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;
