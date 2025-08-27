import React from 'react';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import { Badge } from '@/components/ui/badge';
import { LanguageToggleCompact } from '@/components/ui/language-toggle';

interface SpeciesDisplayProps {
  species: BiodiversitySpecies;
  showLanguageToggle?: boolean;
  className?: string;
}

export const SpeciesDisplay: React.FC<SpeciesDisplayProps> = ({ 
  species, 
  showLanguageToggle = false,
  className = "" 
}) => {
  const { data: translation, isLoading } = useSpeciesTranslation(
    species.scientificName, 
    species.commonName
  );

  if (isLoading) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted/30 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  const displayName = translation?.commonName || species.commonName;
  const isTranslated = translation?.source !== 'fallback';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {displayName}
          </h3>
          <p className="text-sm text-muted-foreground italic truncate">
            {species.scientificName}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicateur de qualité de traduction */}
          {isTranslated && translation && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                translation.confidence === 'high' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : translation.confidence === 'medium'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
              title={`Traduction ${translation.confidence} - Source: ${translation.source}`}
            >
              {translation.source === 'local' ? '🇫🇷' : translation.source === 'api' ? '📡' : 'AI'}
            </Badge>
          )}
          
          {/* Toggle de langue si demandé */}
          {showLanguageToggle && (
            <LanguageToggleCompact className="text-xs" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeciesDisplay;