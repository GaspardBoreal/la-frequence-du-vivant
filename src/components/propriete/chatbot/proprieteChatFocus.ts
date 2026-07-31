import { useSyncExternalStore } from 'react';

/**
 * Périmètre courant de l'IA de jardin : propriété entière, ou un ouvrage
 * précis avec un rayon d'écoute autour de lui.
 *
 * Store externe minimal (hors React tree) pour qu'une popup Leaflet, un
 * inspecteur d'ouvrage ou la fiche carotte puissent cadrer l'IA en un clic.
 */
export interface ProprieteChatFocus {
  objetId: string | null;
  /** Rayon en mètres autour de l'ouvrage (presets partagés avec Mon espace). */
  radiusM: number;
}

const DEFAULT_FOCUS: ProprieteChatFocus = { objetId: null, radiusM: 25 };

let focus: ProprieteChatFocus = DEFAULT_FOCUS;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const proprieteChatFocus = {
  get: () => focus,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setObjet: (objetId: string | null) => {
    if (focus.objetId === objetId) return;
    focus = { ...focus, objetId };
    emit();
  },
  setRadius: (radiusM: number) => {
    if (focus.radiusM === radiusM) return;
    focus = { ...focus, radiusM };
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
export const FOCUS_AUTO_CONTEXT_IDS = ['ouvrage.focus', 'sol.synthese', 'vivant.resume'] as const;

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
