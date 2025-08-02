import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface SourceTooltipProps {
  source: string;
  url?: string;
}

export const SourceTooltip: React.FC<SourceTooltipProps> = ({ source, url }) => {
  const getSourceInfo = (source: string) => {
    switch (source) {
      case 'gbif':
        return {
          name: 'GBIF',
          description: 'Global Biodiversity Information Facility',
          url: url || 'https://www.gbif.org'
        };
      case 'inaturalist':
        return {
          name: 'iNaturalist',
          description: 'Plateforme collaborative de sciences participatives',
          url: url || 'https://www.inaturalist.org'
        };
      case 'ebird':
        return {
          name: 'eBird',
          description: 'Base de données ornithologique collaborative',
          url: url || 'https://ebird.org'
        };
      default:
        return {
          name: source,
          description: 'Source de données biodiversité',
          url: url || '#'
        };
    }
  };

  const sourceInfo = getSourceInfo(source);

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="
            opacity-60 hover:opacity-100 transition-opacity duration-200
            p-1 rounded-full hover:bg-white/10
          ">
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-64 gaspard-glass backdrop-blur-md bg-background/90 border border-white/20"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{sourceInfo.name}</span>
              {sourceInfo.url && sourceInfo.url !== '#' && (
                <a
                  href={sourceInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {sourceInfo.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};