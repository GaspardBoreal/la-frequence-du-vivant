import React from 'react';
import { useProprieteParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { buildGeofence, type Geofence } from '@/lib/geofence';

/**
 * Portée d'affichage des observations du vivant sur une propriété.
 *
 *  - `cadastre` (défaut) : uniquement les points strictement compris dans le
 *    plan cadastral de la propriété (ray casting strict, sans tampon).
 *  - `all` : toutes les observations rattachées aux marches liées.
 *
 * Réglage GLOBAL : une seule source de vérité pour toutes les cartes, listes,
 * compteurs, synthèses et impressions de la fiche propriété. La console de
 * Contrôle GPS reste volontairement hors portée (elle sert justement à
 * rapatrier les points hors emprise).
 */
export type VivantScope = 'cadastre' | 'all';

interface VivantScopeValue {
  /** Propriété couverte par ce provider (null hors fiche propriété). */
  proprieteId: string | null;
  /** Choix utilisateur brut. */
  scope: VivantScope;
  /** Portée réellement appliquée (repli sur `all` sans parcelle cadastrale). */
  effectiveScope: VivantScope;
  setScope: (s: VivantScope) => void;
  /** false = aucune parcelle cadastrale renseignée. */
  cadastreAvailable: boolean;
  fence: Geofence;
}

const EMPTY_FENCE: Geofence = { rings: [], empty: true };

const DEFAULT_VALUE: VivantScopeValue = {
  proprieteId: null,
  scope: 'all',
  effectiveScope: 'all',
  setScope: () => {},
  cadastreAvailable: false,
  fence: EMPTY_FENCE,
};

const Ctx = React.createContext<VivantScopeValue>(DEFAULT_VALUE);

const storageKey = (id: string) => `propriete:${id}:vivant-scope`;

export const ProprieteVivantScopeProvider: React.FC<{
  proprieteId: string;
  children: React.ReactNode;
}> = ({ proprieteId, children }) => {
  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const fence = React.useMemo(() => buildGeofence(parcelles ?? []), [parcelles]);
  const cadastreAvailable = !fence.empty;

  const [scope, setScopeState] = React.useState<VivantScope>(() => {
    try {
      const raw = localStorage.getItem(storageKey(proprieteId));
      return raw === 'all' || raw === 'cadastre' ? raw : 'cadastre';
    } catch {
      return 'cadastre';
    }
  });

  const setScope = React.useCallback(
    (s: VivantScope) => {
      setScopeState(s);
      try {
        localStorage.setItem(storageKey(proprieteId), s);
      } catch {
        /* stockage indisponible : le choix reste valable pour la session */
      }
    },
    [proprieteId],
  );

  const value = React.useMemo<VivantScopeValue>(
    () => ({
      proprieteId,
      scope,
      effectiveScope: cadastreAvailable ? scope : 'all',
      setScope,
      cadastreAvailable,
      fence,
    }),
    [proprieteId, scope, setScope, cadastreAvailable, fence],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** Portée courante. Hors provider : `all` (aucun filtrage). */
export const useVivantScope = (): VivantScopeValue => React.useContext(Ctx);

/**
 * Portée applicable à une propriété donnée : neutre (`all`) si le provider
 * couvre une autre propriété, pour ne jamais filtrer par erreur.
 */
export const useVivantScopeFor = (proprieteId: string | undefined): VivantScopeValue => {
  const ctx = useVivantScope();
  if (!proprieteId || ctx.proprieteId !== proprieteId) return DEFAULT_VALUE;
  return ctx;
};

export default ProprieteVivantScopeProvider;
