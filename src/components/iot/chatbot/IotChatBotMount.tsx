import { useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ChatBot } from '@/components/chatbot/ChatBot';
import { chatPageContext, contextSliceKey } from '@/hooks/useChatPageContext';
import { useIotChatProviders } from '@/hooks/iot/useIotChatProviders';
import { useRefreshIotAiCredit, type IotAiCredit } from '@/hooks/iot/useIotAiCredit';
import { useIotChatFocus, IOT_AUTO_CONTEXT_IDS } from './iotChatFocus';
import IotFocusBanner from './IotFocusBanner';

interface Props {
  /** Fabricant cadré (console partenaire) — pilote les crédits de messages. */
  fournisseurId?: string | null;
  credit?: IotAiCredit | null;
}

/**
 * IA de Jardin montée dans le poste de commandement IoT.
 * Le cadrage suit ce que l'administrateur regarde (sonde > propriété > parc) ;
 * les contextes essentiels sont activés d'office, la Console 📎 garde la main.
 */
export function IotChatBotMount({ fournisseurId = null, credit = null }: Props) {
  const focus = useIotChatFocus();
  const { providers, providersTitle, scope } = useIotChatProviders();
  const refreshCredit = useRefreshIotAiCredit();

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
        iotFournisseurId: fournisseurId,
        iotPerimetre: scope.label,
        iotNiveau: scope.level,
        fenetreJours: focus.windowDays,
      },
    });
  }, [providers, scope.label, scope.level, scope.proprieteId, focus.windowDays, fournisseurId]);

  // Nettoyage au démontage de la page.
  useEffect(
    () => () => {
      providers.forEach((p) => chatPageContext.setVisibleSlice(contextSliceKey(p.id), undefined));
      chatPageContext.setPageState({ filters: { iotAdmin: false } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // La jauge se rafraîchit dès qu'une réponse s'achève.
  useEffect(() => {
    if (!fournisseurId) return;
    const onDone = () => refreshCredit();
    window.addEventListener('community-chat:answer-done', onDone);
    return () => window.removeEventListener('community-chat:answer-done', onDone);
  }, [fournisseurId, refreshCredit]);

  const exhausted = !!credit && !credit.admin && credit.remaining === 0;

  return (
    <ChatBot
      key="admin-iot"
      currentContext="propriete"
      edgeFunctionPath="propriete-chat"
      assistantNameOverride="IA de Jardin"
      roleBadge="Sondes"
      fabId="ia-jardin-iot"
      fabLabel="IA de Jardin"
      focusBanner={<IotFocusBanner scope={scope} activeProviders={autoProviders} credit={credit} />}
      composerLock={
        exhausted ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">Vos crédits IA du mois sont épuisés</p>
              <p className="mt-0.5 text-muted-foreground">
                {credit?.quota} messages accordés, tous consommés. Demandez une recharge à
                La Fréquence du Vivant — le compteur se renouvelle automatiquement le 1er du mois.
              </p>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}

export default IotChatBotMount;
