import { useEffect, useMemo } from 'react';
import { ChatBot } from '@/components/chatbot/ChatBot';
import { chatPageContext, contextSliceKey } from '@/hooks/useChatPageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProprieteChatProviders } from '@/hooks/propriete/useProprieteChatProviders';
import GardenFocusBanner from './GardenFocusBanner';
import OuvragesContextPicker from './OuvragesContextPicker';
import { useProprieteChatFocus, FOCUS_AUTO_CONTEXT_IDS } from './proprieteChatFocus';


interface Props {
  proprieteId?: string;
  proprieteNom?: string | null;
}

/**
 * IA de jardin — chatbot factorisé monté dans l'écosystème Propriété.
 * Les contextes (vivant, sol, ouvrages, portrait…) sont proposés dans la
 * Console de contextes. Quand un ouvrage est cadré depuis l'Atelier, les
 * contextes essentiels sont activés automatiquement (l'utilisateur garde la
 * main pour les désactiver).
 */
export function ProprieteChatBotMount({ proprieteId, proprieteNom }: Props) {
  const isMobile = useIsMobile();
  const { providers, providersTitle } = useProprieteChatProviders(proprieteId);
  const { objets } = useProprieteObjets(proprieteId);
  const focus = useProprieteChatFocus();

  const ouvrageIds = useMemo(() => (objets ?? []).map((o) => o.id), [objets]);
  const ouvrageIdsKey = ouvrageIds.join(',');

  useEffect(() => {
    if (!proprieteId || providers.length === 0) {
      chatPageContext.setAvailableAttachments(null);
      return;
    }
    chatPageContext.setAvailableAttachments({
      providers,
      providersTitle,
      ouvrageIds,
      providerGroupExtras: {
        Ouvrages: <OuvragesContextPicker proprieteId={proprieteId} />,
      },
    });
    return () => chatPageContext.setAvailableAttachments(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proprieteId, providers, providersTitle, ouvrageIdsKey]);


  // Rafraîchit les slices déjà actives quand leur payload change
  // (sélection d'ouvrages, profondeur de données, rayon d'écoute).
  useEffect(() => {
    const active = new Set(
      Object.keys((chatPageContext.getState().pageState.visibleData as Record<string, unknown>) ?? {}),
    );
    providers.forEach((p) => {
      const key = contextSliceKey(p.id);
      if (active.has(key)) chatPageContext.setVisibleSlice(key, p.payload);
    });
  }, [providers]);

  // Sélectionner un ouvrage dans le Plateau doit avoir un effet immédiat :
  // la slice correspondante est posée dès qu'il y a une sélection, et retirée
  // quand l'utilisateur remet le plateau à zéro.
  useEffect(() => {
    const key = contextSliceKey('ouvrages.selection');
    const p = providers.find((x) => x.id === 'ouvrages.selection');
    if (focus.selectedObjetIds.length === 0 || !p) {
      chatPageContext.setVisibleSlice(key, undefined);
      return;
    }
    chatPageContext.setVisibleSlice(key, p.payload);
  }, [providers, focus.selectedObjetIds]);

  /** Contextes réellement transmis quand un ouvrage est cadré. */
  const autoProviders = useMemo(
    () =>
      focus.objetId
        ? providers.filter((p) => (FOCUS_AUTO_CONTEXT_IDS as readonly string[]).includes(p.id))
        : [],
    [providers, focus.objetId],
  );

  // Auto-activation : republie les slices à chaque changement d'ouvrage /
  // rayon (les payloads sont recalculés au périmètre courant).
  useEffect(() => {
    if (!proprieteId) return;
    if (autoProviders.length === 0) return;
    autoProviders.forEach((p) => chatPageContext.setVisibleSlice(contextSliceKey(p.id), p.payload));
    chatPageContext.setPageState({
      filters: {
        ouvrageCadre: true,
        rayonEcouteM: focus.radiusM,
      },
    });
    return () => {
      autoProviders.forEach((p) => chatPageContext.setVisibleSlice(contextSliceKey(p.id), undefined));
      chatPageContext.setPageState({ filters: { ouvrageCadre: false, rayonEcouteM: null } });
    };
  }, [proprieteId, autoProviders, focus.radiusM]);

  if (!proprieteId) return null;

  return (
    <ChatBot
      key={`propriete-${proprieteId}`}
      currentContext="propriete"
      urlEntity={{ type: 'propriete', id: proprieteId } as any}
      edgeFunctionPath="propriete-chat"
      assistantNameOverride="IA de Jardin"
      roleBadge={proprieteNom ?? null}
      hideFab={isMobile}
      fabId={`ia-jardin-${proprieteId}`}
      fabLabel="IA de Jardin"
      focusBanner={<GardenFocusBanner proprieteId={proprieteId} activeProviders={autoProviders} />}
    />
  );
}
