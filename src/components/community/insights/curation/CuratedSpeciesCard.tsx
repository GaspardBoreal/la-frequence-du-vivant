import React, { useState } from 'react';
import { ImageOff, Star, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import type { SpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import PinToggle from './PinToggle';
import type { ExplorationCuration } from '@/hooks/useExplorationCurations';
import { CategoryBadgeCluster } from './CategoryBadge';
import AttribuerObservationDialog from './AttribuerObservationDialog';

export interface CuratedSpeciesItem {
  key: string;
  scientificName: string | null;
  commonName: string | null;
  /** French translation if available (resolved at the source by useExplorationSpeciesPool) */
  commonNameFr?: string | null;
  /** Best display name: FR > original commonName > scientificName */
  displayName?: string;
  group: string | null;
  count: number;
  imageUrl: string | null;
}

interface Props {
  species: CuratedSpeciesItem;
  curation?: ExplorationCuration;
  isCurator: boolean;
  explorationId: string;
  translation?: SpeciesTranslation;
  showAiBadges?: boolean;
  /**
   * Click on the vignette. Receives the species, its display name (FR if known)
   * and the resolved photo list so the detail modal can open instantly with the
   * exact same image as the thumbnail.
   */
  onClick?: (species: CuratedSpeciesItem, displayName: string, photos: string[]) => void;
  /** Slot rendered under the title (e.g. editable category control) */
  footer?: React.ReactNode;
  /** Open the classification evidence sheet for this curation */
  onOpenEvidence?: (curation: ExplorationCuration, displayName: string) => void;
}

const scoreToStars = (score?: number | null) => {
  if (score == null) return 0;
  return Math.max(1, Math.min(5, Math.round(score / 20)));
};

const CuratedSpeciesCard: React.FC<Props> = ({
  species,
  curation,
  isCurator,
  explorationId,
  translation,
  showAiBadges,
  onClick,
  footer,
  onOpenEvidence,
}) => {
  const [attributeOpen, setAttributeOpen] = useState(false);
  // Only fetch a remote photo when we don't already have a usable one
  const shouldFetchPhoto = !species.imageUrl && !!species.scientificName;
  const { data: photoData, isLoading: photoLoading } = useSpeciesPhoto(
    shouldFetchPhoto ? species.scientificName! : undefined
  );

  // Build the full photo list passed to the detail modal:
  // local thumbnail first (already loaded), then iNaturalist extras
  const photos: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (species.imageUrl) list.push(species.imageUrl);
    (photoData?.photos || []).forEach(p => {
      if (p && !list.includes(p)) list.push(p);
    });
    return list;
  }, [species.imageUrl, photoData]);

  const photoUrl = photos[0] || null;
  const isPinned = !!curation && curation.display_order < 9999;
  const stars = scoreToStars(curation?.ai_score);
  const category = curation?.category || null;
  const secondaries = (curation?.secondary_categories ?? []) as string[];
  const evidence = (curation?.classification_evidence ?? []) as any[];
  const needsReview = !!curation?.needs_review;
  const hasEvidence = evidence.length > 0 || !!curation?.classification_source;

  const displayName =
    species.displayName ||
    translation?.commonName ||
    species.commonName ||
    species.scientificName ||
    '';

  const handleImgClick = () => {
    if (onClick) onClick(species, displayName, photos);
  };

  const chatBadges = [
    category ? `Catégorie:${category}` : null,
    ...secondaries.map(s => `Cat:${s}`),
    `${species.count} obs.`,
    isPinned ? 'Épinglée' : null,
  ].filter(Boolean).join(',');

  return (
    <div
      className={`relative rounded-xl border overflow-hidden bg-card group transition ${
        isPinned ? 'border-amber-500/50 shadow-sm' : 'border-border'
      }`}
      data-chat-card
      data-chat-title={displayName}
      data-chat-subtitle={species.scientificName || undefined}
      data-chat-badges={chatBadges}
    >
      <div
        className="aspect-square bg-muted relative cursor-zoom-in"
        onClick={handleImgClick}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : photoLoading ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <ImageOff className="w-8 h-8" />
          </div>
        )}

        {isCurator && (
          <div
            className="absolute top-2 right-2 flex flex-col items-end gap-2.5 pointer-events-auto opacity-60 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 focus-within:opacity-100 focus-within:translate-x-0 transition-all duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {species.scientificName && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAttributeOpen(true); }}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-white/20 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary/40 transition"
                    aria-label="Attribuer à un marcheur"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Attribuer à un marcheur</p>
                </TooltipContent>
              </Tooltip>
            )}
            <div className="-mr-1">
              <PinToggle
                explorationId={explorationId}
                sense="oeil"
                entityType="species"
                entityId={species.scientificName || species.key}
                existing={curation}
                category={curation?.category}
                size="md"
              />
            </div>
          </div>
        )}

        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
          {species.count} obs.
        </div>

        {needsReview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/95 text-white text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1 cursor-help"
                onClick={(e) => {
                  e.stopPropagation();
                  if (curation && onOpenEvidence) onOpenEvidence(curation, displayName);
                }}
              >
                <AlertCircle className="w-2.5 h-2.5" />
                <span>à réviser</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Classification automatique à confirmer.</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showAiBadges && stars > 0 && !needsReview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/95 text-white text-[10px] font-semibold backdrop-blur-sm flex items-center gap-0.5 cursor-help"
                onClick={(e) => e.stopPropagation()}
              >
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs italic">{curation?.ai_reason || 'Suggestion IA'}</p>
              {curation?.ai_criteria && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(curation.ai_criteria as any).map(([k, v]) => (
                    <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="p-2 space-y-1">
        <p className="text-xs font-semibold text-foreground line-clamp-1">
          {displayName}
        </p>
        {species.scientificName && displayName !== species.scientificName && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-1">
            {species.scientificName}
          </p>
        )}

        {/* Cluster catégories — badges cliquables qui ouvrent la sheet d'évidences.
            Le footer (édition curateur sur cartes épinglées) le remplace si fourni. */}
        {!footer && (category || secondaries.length > 0 || needsReview) && (
          <CategoryBadgeCluster
            primary={category}
            secondary={secondaries}
            hasEvidence={hasEvidence}
            needsReview={needsReview}
            onOpen={
              curation && onOpenEvidence
                ? () => onOpenEvidence(curation, displayName)
                : undefined
            }
          />
        )}

        {footer}
      </div>

      {isCurator && species.scientificName && (
        <AttribuerObservationDialog
          open={attributeOpen}
          onOpenChange={setAttributeOpen}
          explorationId={explorationId}
          speciesScientificName={species.scientificName}
          speciesDisplayName={displayName}
        />
      )}
    </div>
  );
};

export default CuratedSpeciesCard;
