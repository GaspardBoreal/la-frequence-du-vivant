import React from 'react';
import {
  Bird, TreePine, Leaf, Bug, Fish, Rabbit, Sprout, Shell, Squirrel, Flower2, PawPrint,
} from 'lucide-react';
import { useSpeciesThumb } from '@/hooks/useSpeciesThumb';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Mapping iconic_taxon (iNat) → pictogramme Lucide cohérent
type IconCfg = { Icon: React.ComponentType<{ className?: string }>; cls: string };

function iconicConfig(iconic?: string | null, kingdom?: string | null): IconCfg {
  const k = (iconic || '').toLowerCase();
  switch (k) {
    case 'aves':
      return { Icon: Bird, cls: 'text-sky-600 dark:text-sky-400 bg-sky-500/10' };
    case 'mammalia':
      return { Icon: Rabbit, cls: 'text-amber-700 dark:text-amber-400 bg-amber-500/10' };
    case 'insecta':
      return { Icon: Bug, cls: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' };
    case 'arachnida':
      return { Icon: Bug, cls: 'text-rose-700 dark:text-rose-400 bg-rose-500/10' };
    case 'reptilia':
      return { Icon: Squirrel, cls: 'text-lime-700 dark:text-lime-400 bg-lime-500/10' };
    case 'amphibia':
      return { Icon: PawPrint, cls: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' };
    case 'actinopterygii':
    case 'chondrichthyes':
      return { Icon: Fish, cls: 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10' };
    case 'mollusca':
      return { Icon: Shell, cls: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' };
    case 'plantae':
      return { Icon: TreePine, cls: 'text-green-700 dark:text-green-400 bg-green-500/10' };
    case 'fungi':
      return { Icon: Sprout, cls: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10' };
  }
  // Fallback sur kingdom si iconic_taxon inconnu
  switch ((kingdom || '').toLowerCase()) {
    case 'plantae':
      return { Icon: Flower2, cls: 'text-green-700 dark:text-green-400 bg-green-500/10' };
    case 'fungi':
      return { Icon: Sprout, cls: 'text-yellow-700 dark:text-yellow-400 bg-yellow-500/10' };
    case 'animalia':
      return { Icon: PawPrint, cls: 'text-purple-700 dark:text-purple-400 bg-purple-500/10' };
  }
  return { Icon: Leaf, cls: 'text-muted-foreground bg-muted/40' };
}

const SIZES = {
  sm: { box: 'w-10 h-10 rounded-lg', icon: 'w-4 h-4', badge: 'text-[8px] px-1 py-0' },
  md: { box: 'w-14 h-14 rounded-lg', icon: 'w-5 h-5', badge: 'text-[9px] px-1 py-0.5' },
  lg: { box: 'w-20 h-20 rounded-xl', icon: 'w-7 h-7', badge: 'text-[10px] px-1.5 py-0.5' },
} as const;

interface Props {
  scientificName?: string | null;
  commonName?: string | null;
  /** Hint pour le picto fallback si pas encore en cache */
  kingdom?: string | null;
  /** Photo terrain prioritaire — désactive le fallback iNat si présente */
  localPhoto?: string | null;
  size?: keyof typeof SIZES;
  showInatBadge?: boolean;
  className?: string;
}

/**
 * Vignette espèce unifiée — alimentée par species_thumb_cache (serveur).
 * Cascade :
 *  1. localPhoto (photo terrain) si dispo
 *  2. photo_url de la cache (iNat ou GBIF, résolue côté serveur)
 *  3. Pictogramme iconic_taxon (Bug pour papillon, Bird pour oiseau, etc.)
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

  // Une URL iNaturalist d'observation n'est pas fiable comme illustration espèce
  const isInatObsUrl = !!localPhoto && /inaturalist(-open-data|\.org|\.com)/i.test(localPhoto);
  const trustedLocal = localPhoto && !isInatObsUrl ? localPhoto : null;
  const shouldFetch = !trustedLocal && !!scientificName;

  const { data, isLoading } = useSpeciesThumb(shouldFetch ? scientificName! : undefined);

  const cachePhoto = data?.photo_url || null;
  const photo = trustedLocal || cachePhoto || null;
  const isExternal = !trustedLocal && !!cachePhoto;
  const sourceLabel = data?.source === 'gbif'
    ? 'GBIF'
    : data?.source === 'manual' ? 'Manuel' : 'iNat';
  const attribution = data?.photo_attribution || 'Photo de référence';
  const cfg = iconicConfig(data?.iconic_taxon, data?.kingdom || kingdom);
  const Icon = cfg.Icon;
  const alt = commonName || scientificName || 'espèce';

  return (
    <div className={cn('relative flex-shrink-0 overflow-hidden', sz.box, className)}>
      {photo ? (
        <>
          <img
            src={photo}
            alt={alt}
            loading="lazy"
            className={cn('w-full h-full object-cover bg-muted', sz.box)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {isExternal && showInatBadge && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'absolute bottom-0.5 right-0.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 text-muted-foreground font-medium leading-none',
                      sz.badge,
                    )}
                  >
                    {sourceLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[260px]">
                  {attribution}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      ) : isLoading && shouldFetch ? (
        <div className={cn('w-full h-full bg-muted animate-pulse', sz.box)} />
      ) : (
        <div className={cn('w-full h-full flex items-center justify-center', sz.box, cfg.cls)}>
          <Icon className={sz.icon} />
        </div>
      )}
    </div>
  );
};

export default SpeciesThumb;
