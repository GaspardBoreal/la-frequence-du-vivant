import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  useExplorationFieldPhotos,
  normalizeSpeciesKey,
} from '@/hooks/useExplorationFieldPhotos';
import type { MarcheurSpeciesPhoto } from '@/hooks/useSpeciesMarcheurPhotos';

export type SpeciesPhotoMode = 'marcheur' | 'inaturalist';

export interface PreferredPhoto {
  url: string;
  /** 'marcheur' / 'citizen' = photo terrain ; 'inat' = référence iNaturalist */
  source: 'marcheur' | 'citizen' | 'inat';
  observerName?: string;
  observationDate?: string;
  marcheName?: string;
  /** true quand le mode actif est 'marcheur' mais qu'aucune photo terrain
   *  n'existe pour cette espèce → fallback iNat. */
  isFallback: boolean;
}

interface Ctx {
  mode: SpeciesPhotoMode;
  setMode: (m: SpeciesPhotoMode) => void;
  toggle: () => void;
  fieldPhotos: Map<string, MarcheurSpeciesPhoto[]>;
  hasFieldPhotos: boolean;
  speciesWithFieldPhotos: number;
  totalFieldPhotos: number;
  isLoading: boolean;
  /** Renvoie la photo à afficher dans la vignette selon le mode actif. */
  getPreferredPhoto: (
    scientificName: string,
    fallbackUrl?: string,
  ) => PreferredPhoto | null;
  /** Liste brute des photos terrain pour une espèce (peut être vide). */
  getFieldPhotos: (scientificName: string) => MarcheurSpeciesPhoto[];
}

const SpeciesPhotoModeContext = createContext<Ctx | null>(null);

const STORAGE_PREFIX = 'species-photo-mode:';

interface ProviderProps {
  explorationId?: string;
  /** Optional pre-built map of field photos indexed by normalized scientific name.
   *  When provided, bypasses the `useExplorationFieldPhotos` query — useful for
   *  contexts (e.g. the public event page `/m/:slug`) that already have the
   *  walker photos loaded via a different RPC/hook. */
  fieldPhotosOverride?: Map<string, MarcheurSpeciesPhoto[]>;
  children: ReactNode;
}

export const SpeciesPhotoModeProvider: React.FC<ProviderProps> = ({
  explorationId,
  fieldPhotosOverride,
  children,
}) => {
  const { data, isLoading: queryLoading } = useExplorationFieldPhotos(
    fieldPhotosOverride ? undefined : explorationId,
  );

  const fieldPhotos = fieldPhotosOverride ?? data?.byScientificName ?? new Map();
  const hasFieldPhotos = fieldPhotosOverride
    ? fieldPhotosOverride.size > 0
    : !!data?.hasAny;
  const isLoading = fieldPhotosOverride ? false : queryLoading;

  const storageKey = explorationId ? `${STORAGE_PREFIX}${explorationId}` : null;

  const [mode, setModeState] = useState<SpeciesPhotoMode>('inaturalist');

  // Init / sync : préférence persistée OU défaut = marcheur si photos terrain.
  useEffect(() => {
    const stored = storageKey
      ? (localStorage.getItem(storageKey) as SpeciesPhotoMode | null)
      : null;
    if (stored === 'marcheur' || stored === 'inaturalist') {
      setModeState(stored);
    } else if (hasFieldPhotos) {
      setModeState('marcheur');
    } else {
      setModeState('inaturalist');
    }
  }, [storageKey, hasFieldPhotos]);

  const setMode = useCallback(
    (m: SpeciesPhotoMode) => {
      setModeState(m);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, m);
        } catch {
          /* noop */
        }
      }
    },
    [storageKey],
  );

  const toggle = useCallback(
    () => setMode(mode === 'marcheur' ? 'inaturalist' : 'marcheur'),
    [mode, setMode],
  );

  const getFieldPhotos = useCallback(
    (sci: string) => fieldPhotos.get(normalizeSpeciesKey(sci)) || [],
    [fieldPhotos],
  );

  const getPreferredPhoto = useCallback(
    (sci: string, fallbackUrl?: string): PreferredPhoto | null => {
      const list = fieldPhotos.get(normalizeSpeciesKey(sci)) || [];
      if (mode === 'marcheur' && list.length > 0) {
        const f = list[0];
        return {
          url: f.url,
          source: f.source === 'citizen' ? 'citizen' : 'marcheur',
          observerName: f.observerName,
          observationDate: f.observationDate,
          marcheName: f.marcheName,
          isFallback: false,
        };
      }
      // mode = inat OU pas de photo terrain disponible
      if (fallbackUrl) {
        return {
          url: fallbackUrl,
          source: 'inat',
          isFallback: mode === 'marcheur',
        };
      }
      return null;
    },
    [fieldPhotos, mode],
  );

  const speciesWithFieldPhotos = fieldPhotos.size;
  const totalFieldPhotos = data?.total ?? 0;

  const value = useMemo<Ctx>(
    () => ({
      mode,
      setMode,
      toggle,
      fieldPhotos,
      hasFieldPhotos,
      speciesWithFieldPhotos,
      totalFieldPhotos,
      isLoading,
      getPreferredPhoto,
      getFieldPhotos,
    }),
    [
      mode,
      setMode,
      toggle,
      fieldPhotos,
      hasFieldPhotos,
      speciesWithFieldPhotos,
      totalFieldPhotos,
      isLoading,
      getPreferredPhoto,
      getFieldPhotos,
    ],
  );

  return (
    <SpeciesPhotoModeContext.Provider value={value}>
      {children}
    </SpeciesPhotoModeContext.Provider>
  );
};

export const useSpeciesPhotoMode = (): Ctx => {
  const ctx = useContext(SpeciesPhotoModeContext);
  if (ctx) return ctx;
  // Fallback no-op : permet d'utiliser les composants hors provider sans crash.
  return {
    mode: 'inaturalist',
    setMode: () => {},
    toggle: () => {},
    fieldPhotos: new Map(),
    hasFieldPhotos: false,
    speciesWithFieldPhotos: 0,
    totalFieldPhotos: 0,
    isLoading: false,
    getPreferredPhoto: (_sci, fallbackUrl) =>
      fallbackUrl
        ? { url: fallbackUrl, source: 'inat', isFallback: false }
        : null,
    getFieldPhotos: () => [],
  };
};
