import React from 'react';
import { 
  TreePine, 
  Bird, 
  Flower2, 
  Bug, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { BiodiversityMetricCard } from './BiodiversityMetricCard';
import { BiodiversitySummary } from '@/types/biodiversity';

interface BiodiversityMetricGridProps {
  summary: BiodiversitySummary;
  isLoading?: boolean;
  selectedFilter?: string;
  onFilterChange?: (filter: string | null) => void;
}

export const BiodiversityMetricGrid: React.FC<BiodiversityMetricGridProps> = ({ 
  summary, 
  isLoading = false,
  selectedFilter,
  onFilterChange 
}) => {
  
  const handleCardClick = (filterKey: string) => {
    if (!onFilterChange) return;
    
    // Si le filtre cliqué est déjà sélectionné, on le désélectionne
    if (selectedFilter === filterKey) {
      onFilterChange(null);
    } else {
      onFilterChange(filterKey);
    }
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="gaspard-glass p-6 rounded-2xl border border-white/20 backdrop-blur-md bg-white/5"
          >
            <div className="animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="w-4 h-4 bg-white/10 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-8 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total",
      value: summary.totalSpecies,
      icon: TreePine,
      color: "emerald-500",
      delay: 0,
      filterKey: "total"
    },
    {
      title: "Oiseaux",
      value: summary.birds,
      icon: Bird,
      color: "sky-500",
      delay: 0.1,
      filterKey: "birds"
    },
    {
      title: "Plantes",
      value: summary.plants,
      icon: Flower2,
      color: "green-500",
      delay: 0.2,
      filterKey: "plants"
    },
    {
      title: "Champignons",
      value: summary.fungi,
      icon: Bug,
      color: "orange-500",
      delay: 0.3,
      filterKey: "fungi"
    },
    {
      title: "Autres",
      value: summary.others,
      icon: MapPin,
      color: "purple-500",
      delay: 0.4,
      filterKey: "others"
    },
    {
      title: "Avec Audio",
      value: summary.withAudio || 0,
      icon: Calendar,
      color: "amber-500",
      delay: 0.5,
      filterKey: "withAudio"
    },
    {
      title: "Avec Photos",
      value: summary.withPhotos || 0,
      icon: Calendar,
      color: "cyan-500",
      delay: 0.6,
      filterKey: "withPhotos"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {metrics.map((metric, index) => (
        <BiodiversityMetricCard
          key={metric.title}
          {...metric}
          isSelected={selectedFilter === metric.filterKey}
          onClick={onFilterChange ? () => handleCardClick(metric.filterKey) : undefined}
        />
      ))}
    </div>
  );
};