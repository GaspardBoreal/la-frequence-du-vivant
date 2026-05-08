import React, { useEffect, useState } from 'react';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';
import { cn } from '@/lib/utils';

interface Props {
  scientificName: string | null | undefined;
  commonName?: string | null;
  /** Show scientific name as italic subtitle below */
  showScientific?: boolean;
  /** Visual size */
  size?: 'sm' | 'md' | 'lg';
  /** Truncate long names with ellipsis */
  truncate?: boolean;
  className?: string;
  scientificClassName?: string;
}

/**
 * Universal species name renderer.
 *
 * - Always displays the best French name available (via the shared
 *   `useFrenchSpeciesNamesAuto` cache).
 * - Falls back instantly to the original `commonName` (often EN) so the user
 *   never sees a blank.
 * - When the FR name arrives from the background auto-translate, swaps with a
 *   smooth 200ms fade — no layout shift.
 *
 * Use this everywhere in the app to guarantee name consistency.
 */
export const SpeciesName: React.FC<Props> = ({
  scientificName,
  commonName,
  showScientific = false,
  size = 'md',
  truncate = false,
  className,
  scientificClassName,
}) => {
  const sci = (scientificName || '').trim();
  const fallback = (commonName || '').trim() || sci;

  const { data } = useFrenchSpeciesNamesAuto(
    sci ? [{ scientificName: sci, commonName: commonName || null }] : []
  );

  const resolution = sci ? data?.get(sci) : undefined;
  const displayName = resolution?.displayName || fallback;
  const isFresh = resolution?.freshlyResolved && resolution.commonNameFr === displayName;

  // Subtle fade-in on swap
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    if (isFresh) {
      setOpacity(0.4);
      const t = setTimeout(() => setOpacity(1), 30);
      return () => clearTimeout(t);
    }
  }, [isFresh, displayName]);

  const sizeText =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';
  const sizeSci = size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className={cn('min-w-0', className)}>
      <span
        className={cn(
          'block font-medium text-foreground transition-opacity duration-200',
          sizeText,
          truncate && 'truncate'
        )}
        style={{ opacity }}
        title={displayName}
      >
        {displayName || '—'}
      </span>
      {showScientific && sci && sci !== displayName && (
        <span
          className={cn(
            'block italic text-muted-foreground',
            sizeSci,
            truncate && 'truncate',
            scientificClassName
          )}
        >
          {sci}
        </span>
      )}
    </div>
  );
};

export default SpeciesName;
