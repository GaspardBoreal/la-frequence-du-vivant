import { useSyncExternalStore } from 'react';

/**
 * Périmètre courant de l'IA de jardin : propriété entière, ou un ouvrage
 * précis avec un rayon d'écoute autour de lui.
 *
 * Store externe minimal (hors React tree) pour qu'une popup Leaflet, un
 * inspecteur d'ouvrage ou la fiche carotte puissent cadrer l'IA en un clic.
 */
/** Niveau de détail transmis pour les ouvrages sélectionnés. */
export type OuvrageDetailLevel = 'resume' | 'complet' | 'especes';

export interface ProprieteChatFocus {
  objetId: string | null;
  /** Rayon en mètres autour de l'ouvrage (presets partagés avec Mon espace). */
  radiusM: number;
  /** Ouvrages retenus à la carte dans la Console de contextes. */
  selectedObjetIds: string[];
  /** Profondeur de données envoyée pour ces ouvrages. */
  ouvrageDetail: OuvrageDetailLevel;
}

const DEFAULT_FOCUS: ProprieteChatFocus = {
  objetId: null,
  radiusM: 25,
  selectedObjetIds: [],
  ouvrageDetail: 'resume',
};

let focus: ProprieteChatFocus = DEFAULT_FOCUS;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export const proprieteChatFocus = {
  get: () => focus,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setObjet: (objetId: string | null) => {
    if (focus.objetId === objetId) return;
    // Le cadrage carte reste prioritaire : il rejoint la sélection.
    const selectedObjetIds =
      objetId && !focus.selectedObjetIds.includes(objetId)
        ? [...focus.selectedObjetIds, objetId]
        : focus.selectedObjetIds;
    focus = { ...focus, objetId, selectedObjetIds };
    emit();
  },
  setRadius: (radiusM: number) => {
    if (focus.radiusM === radiusM) return;
    focus = { ...focus, radiusM };
    emit();
  },
  toggleObjetSelection: (objetId: string) => {
    const has = focus.selectedObjetIds.includes(objetId);
    focus = {
      ...focus,
      selectedObjetIds: has
        ? focus.selectedObjetIds.filter((id) => id !== objetId)
        : [...focus.selectedObjetIds, objetId],
    };
    emit();
  },
  setSelectedObjets: (ids: string[]) => {
    if (sameIds(focus.selectedObjetIds, ids)) return;
    focus = { ...focus, selectedObjetIds: [...ids] };
    emit();
  },
  clearSelectedObjets: () => {
    if (focus.selectedObjetIds.length === 0) return;
    focus = { ...focus, selectedObjetIds: [] };
    emit();
  },
  setOuvrageDetail: (ouvrageDetail: OuvrageDetailLevel) => {
    if (focus.ouvrageDetail === ouvrageDetail) return;
    focus = { ...focus, ouvrageDetail };
    emit();
  },
  reset: () => {
    focus = DEFAULT_FOCUS;
    emit();
  },
};


/**
 * Contextes auto-activés quand l'IA est cadrée sur un ouvrage.
 * Volontairement compacts (résumés, pas les listes détaillées) : la frugalité
 * reste la règle, l'utilisateur peut désactiver dans la Console.
 */
export const FOCUS_AUTO_CONTEXT_IDS = [
  'ouvrage.focus',
  'ouvrage.especes',
  'sol.synthese',
  'vivant.resume',
] as const;

export function useProprieteChatFocus(): ProprieteChatFocus {
  return useSyncExternalStore(proprieteChatFocus.subscribe, proprieteChatFocus.get, proprieteChatFocus.get);
}

/**
 * Ouvre l'IA de jardin cadrée sur un ouvrage, avec une question pré-remplie.
 * Réutilise l'événement `community-chat:open` déjà géré par le ChatBot.
 */
export function openGardenAi(options: { objetId?: string | null; radiusM?: number; prefill?: string } = {}) {
  if (options.objetId !== undefined) proprieteChatFocus.setObjet(options.objetId);
  if (options.radiusM !== undefined) proprieteChatFocus.setRadius(options.radiusM);
  window.dispatchEvent(
    new CustomEvent('community-chat:open', { detail: { prefill: options.prefill } }),
  );
}
