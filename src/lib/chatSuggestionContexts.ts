import { chatPageContext, contextSliceKey, type ContextProvider } from '@/hooks/useChatPageContext';

/**
 * Pré-chargement de contextes déclenché par une suggestion du chat.
 *
 * Principe de frugalité conservé : on n'active QUE les contextes strictement
 * nécessaires à la question posée, on n'écrase jamais ce que l'utilisateur
 * avait déjà activé, et l'utilisateur peut tout désactiver dans la Console 📎.
 */
export function activateContextsForSuggestion(ids: readonly string[]): ContextProvider[] {
  const providers = chatPageContext.getState().pageState.availableAttachments?.providers ?? [];
  const activated: ContextProvider[] = [];
  for (const id of ids) {
    const p = providers.find((x) => x.id === id);
    if (!p) continue; // contexte indisponible (ex. aucune carotte posée) → on ignore
    chatPageContext.setVisibleSlice(contextSliceKey(p.id), p.payload);
    activated.push(p);
  }
  return activated;
}

export const describeActivatedContexts = (providers: ContextProvider[]): string =>
  providers.map((p) => `${p.emoji} ${p.label}`).join(' · ');
