import type { BiodiversitySpecies } from '@/types/biodiversity';
import type { PublicSpecies } from '@/hooks/usePublicEvent';
import type { MarcheurSpeciesPhoto } from '@/hooks/useSpeciesMarcheurPhotos';
import { normalizeSpeciesKey } from '@/hooks/useExplorationFieldPhotos';

const kingdomFromIconic = (
  iconic: string | null | undefined,
): BiodiversitySpecies['kingdom'] => {
  if (!iconic) return 'Other';
  const t = iconic.toLowerCase();
  if (t.includes('plant')) return 'Plantae';
  if (t.includes('fung')) return 'Fungi';
  if (
    t.includes('aves') ||
    t.includes('mamm') ||
    t.includes('rept') ||
    t.includes('amph') ||
    t.includes('insect') ||
    t.includes('arachn') ||
    t.includes('mollus') ||
    t.includes('actinop') ||
    t.includes('animal')
  )
    return 'Animalia';
  return 'Other';
};

/**
 * Convertit la forme légère renvoyée par `usePublicEventBiodiversity`
 * (`PublicSpecies`) vers la forme riche `BiodiversitySpecies` attendue
 * par `SpeciesGalleryCard` / `SpeciesGalleryDetailModal`.
 *
 * Aucune donnée n'est inventée : les champs manquants restent vides,
 * les composants gèrent déjà les cas où `attributions`, `family`, etc.
 * sont absents.
 */
const upgradeInatUrl = (url: string): string =>
  url.replace('/square.', '/medium.').replace('/square.jpg', '/medium.jpg');

export const adaptPublicSpeciesToBiodiversity = (
  sp: PublicSpecies,
): BiodiversitySpecies => {
  const upgraded = sp.photo_url ? upgradeInatUrl(sp.photo_url) : undefined;
  return {
  id: sp.scientific_name,
  scientificName: sp.scientific_name,
  commonName: sp.common_name || '',
  family: '',
  kingdom: kingdomFromIconic(sp.iconic_taxon),
  iconicTaxon: sp.iconic_taxon || undefined,
  observations: sp.observations_count,
  lastSeen: '',
  photos: upgraded ? [upgraded] : undefined,
  photoData: upgraded ? { url: upgraded, source: 'inaturalist' } : undefined,
  source: 'inaturalist',
  attributions: [],
  };
};

/**
 * Construit la Map de photos terrain « marcheurs » attendue par
 * `SpeciesPhotoModeProvider` à partir des espèces publiques.
 *
 * On ne dispose côté public que d'une seule photo par espèce et du drapeau
 * `has_walker_observation` : on l'expose donc en tant que `MarcheurSpeciesPhoto`
 * unique pour les espèces marquées comme observées par un marcheur.
 */
export const buildPublicFieldPhotosMap = (
  species: PublicSpecies[],
): Map<string, MarcheurSpeciesPhoto[]> => {
  const map = new Map<string, MarcheurSpeciesPhoto[]>();
  for (const sp of species) {
    if (!sp.has_walker_observation || !sp.photo_url) continue;
    const key = normalizeSpeciesKey(sp.scientific_name);
    map.set(key, [
      {
        id: `public-${sp.scientific_name}`,
        url: sp.photo_url,
        source: 'marcheur',
        observerName: '',
      },
    ]);
  }
  return map;
};
