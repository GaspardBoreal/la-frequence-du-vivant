import { useSyncExternalStore } from 'react';

/**
 * Cadrage de l'IA de Jardin dans le poste de commandement IoT.
 *
 * Priorité : sonde sélectionnée > propriété filtrée > parc entier.
 * Store externe minimal (hors React tree) pour que la carte, la fiche sonde
 * ou l'Observatoire puissent cadrer l'IA en un clic.
 */
export interface IotChatFocus {
  capteurId: string | null;
  proprieteId: string | null;
  /** Fenêtre temporelle des agrégats (jours). */
  windowDays: number;
}

export const IOT_WINDOWS = [1, 7, 30] as const;

const DEFAULT: IotChatFocus = { capteurId: null, proprieteId: null, windowDays: 7 };

let focus: IotChatFocus = DEFAULT;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const iotChatFocus = {
  get: () => focus,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setCapteur: (capteurId: string | null, proprieteId?: string | null) => {
    const nextPropriete = proprieteId !== undefined ? proprieteId : focus.proprieteId;
    if (focus.capteurId === capteurId && focus.proprieteId === nextPropriete) return;
    focus = { ...focus, capteurId, proprieteId: nextPropriete };
    emit();
  },
  setPropriete: (proprieteId: string | null) => {
    if (focus.proprieteId === proprieteId && focus.capteurId === null) return;
    // Changer de propriété relâche le cadrage sonde (il appartenait à l'autre).
    focus = { ...focus, proprieteId, capteurId: null };
    emit();
  },
  setWindowDays: (windowDays: number) => {
    if (focus.windowDays === windowDays) return;
    focus = { ...focus, windowDays };
    emit();
  },
  reset: () => {
    focus = DEFAULT;
    emit();
  },
};

export function useIotChatFocus(): IotChatFocus {
  return useSyncExternalStore(iotChatFocus.subscribe, iotChatFocus.get, iotChatFocus.get);
}

/** Contextes auto-activés selon le cadrage (frugalité : les plus compacts). */
export const IOT_AUTO_CONTEXT_IDS = ['iot.sante', 'iot.mesures'] as const;

/** Ouvre l'IA de Jardin cadrée sur une sonde / propriété, question pré-remplie. */
export function openIotAi(
  options: { capteurId?: string | null; proprieteId?: string | null; prefill?: string } = {},
) {
  if (options.capteurId !== undefined || options.proprieteId !== undefined) {
    iotChatFocus.setCapteur(options.capteurId ?? null, options.proprieteId ?? null);
  }
  window.dispatchEvent(new CustomEvent('community-chat:open', { detail: { prefill: options.prefill } }));
}
