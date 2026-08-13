import { useEffect, useMemo } from 'react';
import { ChatBot } from '@/components/chatbot/ChatBot';
import { chatPageContext, contextSliceKey } from '@/hooks/useChatPageContext';
import { useIotChatProviders } from '@/hooks/iot/useIotChatProviders';
import { useIotChatFocus, IOT_AUTO_CONTEXT_IDS } from './iotChatFocus';
import IotFocusBanner from './IotFocusBanner';

/**
 * IA de Jardin montée dans le poste de commandement IoT.
 * Le cadrage suit ce que l'administrateur regarde (sonde > propriété > parc) ;
 * les contextes essentiels sont activés d'office, la Console 📎 garde la main.
 */
export function IotChatBotMount() {
  const focus = useIotChatFocus();
  const { providers, providersTitle, scope } = useIotChatProviders();

  // Inventaire des contextes activables (Console 📎).
  useEffect(() => {
    if (providers.length === 0) {
      chatPageContext.setAvailableAttachments(null);
      return;
    }
    chatPageContext.setAvailableAttachments({ providers, providersTitle });
    return () => chatPageContext.setAvailableAttachments(null);
  }, [providers, providersTitle]);

  /** Contextes réellement transmis (santé + dernières mesures). */
  const autoProviders = useMemo(
    () => providers.filter((p) => (IOT_AUTO_CONTEXT_IDS as readonly string[]).includes(p.id)),
    [providers],
  );

  // Republie les slices actives à chaque changement de cadrage / fenêtre,
  // et rafraîchit celles que l'utilisateur a activées à la main.
  useEffect(() => {
    const active = new Set(
      Object.keys((chatPageContext.getState().pageState.visibleData as Record<string, unknown>) ?? {}),
    );
    // L'entité suit le périmètre : propriété cadrée, ou parc entier (aucune entité).
    chatPageContext.setContext(
      scope.proprieteId ? ({ type: 'propriete', id: scope.proprieteId } as any) : null,
      chatPageContext.getState().pageState,
    );
    providers.forEach((p) => {
      const key = contextSliceKey(p.id);
      const auto = (IOT_AUTO_CONTEXT_IDS as readonly string[]).includes(p.id);
      if (auto || active.has(key)) chatPageContext.setVisibleSlice(key, p.payload);
    });
    chatPageContext.setPageState({
      label: `Poste IoT — ${scope.label}`,
      filters: {
        iotAdmin: true,
        iotPerimetre: scope.label,
        iotNiveau: scope.level,
        fenetreJours: focus.windowDays,
      },
    });
  }, [providers, scope.label, scope.level, scope.proprieteId, focus.windowDays]);

  // Nettoyage au démontage de la page.
  useEffect(
    () => () => {
      providers.forEach((p) => chatPageContext.setVisibleSlice(contextSliceKey(p.id), undefined));
      chatPageContext.setPageState({ filters: { iotAdmin: false } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <ChatBot
      key="admin-iot"
      currentContext="propriete"
      edgeFunctionPath="propriete-chat"
      assistantNameOverride="IA de Jardin"
      roleBadge="Sondes"
      fabId="ia-jardin-iot"
      fabLabel="IA de Jardin"
      focusBanner={<IotFocusBanner scope={scope} activeProviders={autoProviders} />}
    />
  );
}

export default IotChatBotMount;
