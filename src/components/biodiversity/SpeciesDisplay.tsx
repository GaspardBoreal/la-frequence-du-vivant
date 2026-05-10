import React from 'react';
import { BiodiversitySpecies } from '@/types/biodiversity';
import { useSpeciesTranslation } from '@/hooks/useSpeciesTranslation';

interface SpeciesDisplayProps {
  species: BiodiversitySpecies;
  className?: string;
}

export const SpeciesDisplay: React.FC<SpeciesDisplayProps> = ({
  species,
  className = "",
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

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {displayName}
        </h3>
        <p className="text-sm text-muted-foreground italic truncate">
          {species.scientificName}
        </p>
      </div>
    </div>
  );
};

export default SpeciesDisplay;
