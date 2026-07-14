import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { PublicSpecies } from '@/hooks/usePublicEvent';
import { SpeciesPhotoModeProvider } from '@/contexts/SpeciesPhotoModeContext';
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
}

/**
 * Grille des espèces observées sur la page publique d'un événement (`/m/:slug`).
 *
 * Réutilise strictement les composants « Mon Espace → Biodiversité →
 * Taxons observés » (`SpeciesGalleryCard`, `SpeciesPhotoModeToggle`,
 * `SpeciesGalleryDetailModal`) pour garantir une expérience identique :
 *  - photo terrain marcheur prioritaire, fallback iNaturalist,
 *  - toggle « Photos marcheurs ↔ iNaturalist »,
 *  - overlay au survol, badge source, gestion loading/erreur,
 *  - clic → fiche espèce détaillée (photo + trophie + audio).
 *
 * Le provider `SpeciesPhotoModeProvider` reçoit ici une Map pré-construite
 * (`fieldPhotosOverride`) au lieu de charger via `exploration_id`, ce qui
 * évite toute dépendance à une session authentifiée.
 */
const PublicEventSpeciesGrid: React.FC<Props> = ({
  species,
  totalCount,
  limit = 24,
}) => {
  const fieldPhotosMap = useMemo(() => buildPublicFieldPhotosMap(species), [species]);

  const displayed = useMemo(
    () => species.slice(0, limit).map(adaptPublicSpeciesToBiodiversity),
    [species, limit],
  );

  const photoModeCounts = useMemo(
    () => ({
      marcheur: species
        .slice(0, limit)
        .filter((s) => s.has_walker_observation && !!s.photo_url).length,
      inaturalist: displayed.length,
    }),
    [species, limit, displayed.length],
  );

  const [selected, setSelected] = useState<BiodiversitySpecies | null>(null);

  return (
    <SpeciesPhotoModeProvider fieldPhotosOverride={fieldPhotosMap}>
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
    </SpeciesPhotoModeProvider>
  );
};

export default PublicEventSpeciesGrid;
