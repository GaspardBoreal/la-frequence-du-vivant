import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import type { SeasonKey } from '@/lib/immersion/silhouettes';

export interface ImmersionSceneProps {
  plantings: Planting[];
  center: { lat: number; lng: number };
  year: number;
  season: SeasonKey;
  photos: ObjetPhoto[];
  /** Le film pilote les scènes : elles ne montrent alors aucun réglage. */
  cinematic?: boolean;
}

export const INK = {
  night: '#0b1512',
  deep: '#10201b',
  gold: '#c8a24a',
  cream: '#f2ece0',
};
