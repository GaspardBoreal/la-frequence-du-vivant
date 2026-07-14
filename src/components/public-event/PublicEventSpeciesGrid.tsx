import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { PublicSpecies } from '@/hooks/usePublicEvent';
import {
  SpeciesPhotoModeProvider,
  useSpeciesPhotoMode,
} from '@/contexts/SpeciesPhotoModeContext';
import { normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';
import SpeciesPhotoModeToggle from '@/components/biodiversity/SpeciesPhotoModeToggle';
import SpeciesGalleryCard from '@/components/biodiversity/SpeciesGalleryCard';
import SpeciesGalleryDetailModal from '@/components/biodiversity/SpeciesGalleryDetailModal';
import {
  adaptPublicSpeciesToBiodiversity,
  buildPublicFieldPhotosMap,
} from './adaptPublicSpecies';

interface Props {
  species: PublicSpecies[];
  /** Nb total d'espèces (pour la mention "+ X autres…"). */
  totalCount: number;
  /** Nb max d'espèces affichées en grille (défaut 24). */
  limit?: number;
  /** Exploration liée à l'événement : permet de charger les photos terrain
   *  marcheurs pleine résolution via `useExplorationFieldPhotos` (même hook
   *  que Mon Espace → Biodiversité → Taxons observés). */
  explorationId?: string | null;
}

/**
 * Grille des espèces observées sur la page publique d'un événement (`/m/:slug`).
 *
 * Réutilise strictement les composants « Mon Espace → Biodiversité →
 * Taxons observés » (`SpeciesGalleryCard`, `SpeciesPhotoModeToggle`,
 * `SpeciesGalleryDetailModal`) pour garantir une expérience identique.
 *
 * Stratégie photo :
 *  - Si un `explorationId` est disponible, le provider utilise
 *    `useExplorationFieldPhotos` : URLs marcheurs pleine résolution issues
 *    du storage + URLs iNat upgradées de `square` → `medium`.
 *  - Sinon, fallback backward-compat : Map pré-construite depuis les
 *    `PublicSpecies.photo_url` du RPC public.
 */
const InnerGrid: React.FC<{
  displayed: BiodiversitySpecies[];
  totalDisplayedInat: number;
  totalCount: number;
  limit: number;
}> = ({ displayed, totalDisplayedInat, totalCount, limit }) => {
  const { fieldPhotos } = useSpeciesPhotoMode();
  const [selected, setSelected] = useState<BiodiversitySpecies | null>(null);

  const photoModeCounts = useMemo(() => {
    let marcheur = 0;
    for (const sp of displayed) {
      if ((fieldPhotos.get(normalizeSpeciesKey(sp.scientificName)) || []).length > 0) {
        marcheur += 1;
      }
    }
    return { marcheur, inaturalist: totalDisplayedInat };
  }, [displayed, fieldPhotos, totalDisplayedInat]);

  return (
    <>
      <div className="space-y-3">
        <SpeciesPhotoModeToggle counts={photoModeCounts} />

        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
        >
          <AnimatePresence initial={false}>
            {displayed.map((sp, i) => (
              <motion.div
                key={`${sp.scientificName}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              >
                <SpeciesGalleryCard species={sp} onClick={setSelected} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {totalCount > limit && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            + {totalCount - limit} autres espèces observées
          </p>
        )}
      </div>

      <SpeciesGalleryDetailModal
        species={
          selected
            ? {
                name: selected.commonName || selected.scientificName,
                scientificName: selected.scientificName,
                count: selected.observations,
                kingdom: selected.kingdom,
                photos: selected.photoData ? [selected.photoData.url] : undefined,
              }
            : null
        }
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

const PublicEventSpeciesGrid: React.FC<Props> = ({
  species,
  totalCount,
  limit = 24,
  explorationId,
}) => {
  const displayed = useMemo(
    () => species.slice(0, limit).map(adaptPublicSpeciesToBiodiversity),
    [species, limit],
  );

  // Fallback map — utilisée uniquement si aucun explorationId n'est fourni.
  const fallbackFieldPhotos = useMemo(
    () => (explorationId ? undefined : buildPublicFieldPhotosMap(species)),
    [species, explorationId],
  );

  return (
    <SpeciesPhotoModeProvider
      explorationId={explorationId || undefined}
      fieldPhotosOverride={fallbackFieldPhotos}
    >
      <InnerGrid
        displayed={displayed}
        totalDisplayedInat={displayed.length}
        totalCount={totalCount}
        limit={limit}
      />
    </SpeciesPhotoModeProvider>
  );
};

export default PublicEventSpeciesGrid;
