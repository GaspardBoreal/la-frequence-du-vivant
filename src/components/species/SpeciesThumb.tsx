import React from 'react';
import { Bird, TreePine, Leaf, Bug } from 'lucide-react';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const kingdomIcon = (k?: string | null) => {
  switch (k) {
    case 'Animalia': return Bird;
    case 'Plantae': return TreePine;
    case 'Fungi': return Leaf;
    default: return Bug;
  }
};

const kingdomColor = (k?: string | null) => {
  switch (k) {
    case 'Animalia': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10';
    case 'Plantae': return 'text-green-600 dark:text-green-400 bg-green-500/10';
    case 'Fungi': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
    default: return 'text-purple-600 dark:text-purple-400 bg-purple-500/10';
  }
};

const SIZES = {
  sm: { box: 'w-10 h-10 rounded-lg', icon: 'w-4 h-4', badge: 'text-[8px] px-1 py-0' },
  md: { box: 'w-14 h-14 rounded-lg', icon: 'w-5 h-5', badge: 'text-[9px] px-1 py-0.5' },
  lg: { box: 'w-20 h-20 rounded-xl', icon: 'w-7 h-7', badge: 'text-[10px] px-1.5 py-0.5' },
} as const;

interface Props {
  scientificName?: string | null;
  commonName?: string | null;
  kingdom?: string | null;
  /** Photo terrain prioritaire — désactive le fallback iNat si présente */
  localPhoto?: string | null;
  size?: keyof typeof SIZES;
  showInatBadge?: boolean;
  className?: string;
}

/**
 * Vignette espèce unifiée :
 * 1. localPhoto (photo terrain) si dispo
 * 2. Photo iNaturalist via useSpeciesPhoto (+ pastille discrète « iNat »)
 * 3. Pictogramme kingdom en fallback final
 */
export const SpeciesThumb: React.FC<Props> = ({
  scientificName,
  commonName,
  kingdom,
  localPhoto,
  size = 'sm',
  showInatBadge = true,
  className,
}) => {
  const sz = SIZES[size];
  // Une URL iNaturalist brute (observation) n'est PAS fiable comme illustration
  // d'espèce — on la rejette et on tombe sur la ref taxon iNat.
  const isInatObsUrl = !!localPhoto && /inaturalist(-open-data|\.org|\.com)/i.test(localPhoto);
  const trustedLocal = localPhoto && !isInatObsUrl ? localPhoto : null;
  const shouldFetch = !trustedLocal && !!scientificName;
  const { data, isLoading } = useSpeciesPhoto(shouldFetch ? scientificName! : undefined);

  const inatPhoto = data?.photos?.[0];
  const photo = trustedLocal || inatPhoto || null;
  const isInat = !trustedLocal && !!inatPhoto;
  const Icon = kingdomIcon(kingdom);
  const alt = commonName || scientificName || 'espèce';

  return (
    <div className={cn('relative flex-shrink-0', sz.box, className)}>
      {photo ? (
        <>
          <img
            src={photo}
            alt={alt}
            loading="lazy"
            className={cn('w-full h-full object-cover bg-muted', sz.box)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {isInat && showInatBadge && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'absolute bottom-0.5 right-0.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-muted-foreground font-medium leading-none',
                      sz.badge
                    )}
                  >
                    iNat
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Photo de référence iNaturalist
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      ) : isLoading ? (
        <div className={cn('w-full h-full bg-muted animate-pulse', sz.box)} />
      ) : (
        <div className={cn('w-full h-full flex items-center justify-center', sz.box, kingdomColor(kingdom))}>
          <Icon className={sz.icon} />
        </div>
      )}
    </div>
  );
};

export default SpeciesThumb;
