import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { SEARCH_RADIUS_CONFIG, getRadiusDescription, calculateCoverageArea } from '@/utils/searchRadiusConfig';

interface SearchRadiusTooltipProps {
  dataType: keyof typeof SEARCH_RADIUS_CONFIG;
  customRadius?: number;
}

const SearchRadiusTooltip: React.FC<SearchRadiusTooltipProps> = ({ dataType, customRadius }) => {
  const config = SEARCH_RADIUS_CONFIG[dataType];
  const description = getRadiusDescription(dataType, customRadius);
  
  const getTooltipContent = () => {
    switch (dataType) {
      case 'biodiversity':
        if ('default' in config) {
          const radius = customRadius || config.default;
          const area = calculateCoverageArea(radius);
          return (
            <div className="space-y-2 max-w-xs">
              <p className="font-medium">{description}</p>
              <p className="text-sm">Zone couverte: {area.toFixed(2)} km²</p>
              <p className="text-sm">Sources: {config.sources.join(', ')}</p>
              <p className="text-xs text-muted-foreground">
                Limite: {config.min}m - {config.max / 1000}km
              </p>
            </div>
          );
        }
        break;
      
      case 'weather':
        return (
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">{description}</p>
            <p className="text-sm">Sources: {config.sources.join(', ')}</p>
            <p className="text-xs text-muted-foreground">
              Les données proviennent de la station météo la plus proche du point GPS
            </p>
          </div>
        );
      
      case 'realEstate':
        return (
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">{description}</p>
            <p className="text-sm">Sources: {config.sources.join(', ')}</p>
            <p className="text-xs text-muted-foreground">
              Les données concernent uniquement la parcelle cadastrale exacte
            </p>
          </div>
        );
    }
    
    return <div>Configuration inconnue</div>;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SearchRadiusTooltip;