/**
 * Palier natif réellement servi par le fond courant.
 *
 * Le zoom natif annoncé par un fournisseur (IGN : z21) n'est pas garanti sur
 * tout le territoire : certaines communes s'arrêtent à z19. Pire, Esri sert une
 * tuile valide « Map data not yet available » là où il n'a pas d'imagerie. On
 * mesure donc le palier effectif (sonde de couverture + dégradation à l'usage)
 * et on le publie ici pour que le badge d'échelle dise la vérité.
 */
export interface TileNativeState {
  /** Zoom natif effectif du fond principal. */
  nativeMaxZoom: number;
  /** Source réellement lisible au zoom courant. */
  source: string;
  /** Le relais mondial prend le relais au-delà du natif. */
  relayed: boolean;
  /** Fournisseur réellement affiché ('IGN', 'Esri', …). */
  activeSource?: string;
  /** La couverture a été mesurée (et non simplement déclarée). */
  coverageProbed?: boolean;
}

let state: TileNativeState = {
  nativeMaxZoom: 19,
  source: '',
  relayed: false,
  activeSource: '',
  coverageProbed: false,
};
const listeners = new Set<(s: TileNativeState) => void>();

export const getTileNativeState = () => state;

export const setTileNativeState = (patch: Partial<TileNativeState>) => {
  const next = { ...state, ...patch };
  if (
    next.nativeMaxZoom === state.nativeMaxZoom &&
    next.source === state.source &&
    next.relayed === state.relayed &&
    next.activeSource === state.activeSource &&
    next.coverageProbed === state.coverageProbed
  )
    return;
  state = next;
  listeners.forEach((l) => l(state));
};

export const subscribeTileNative = (l: (s: TileNativeState) => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
