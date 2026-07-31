import { useEffect } from 'react';
import { ChatBot } from '@/components/chatbot/ChatBot';
import { chatPageContext } from '@/hooks/useChatPageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProprieteChatProviders } from '@/hooks/propriete/useProprieteChatProviders';
import GardenFocusBanner from './GardenFocusBanner';


interface Props {
  proprieteId?: string;
  proprieteNom?: string | null;
}

/**
 * IA de jardin — chatbot factorisé monté dans l'écosystème Propriété.
 * Les contextes (vivant, sol, ouvrages, portrait…) sont proposés dans la
 * Console de contextes et ne partent au modèle que si l'utilisateur les active.
 */
export function ProprieteChatBotMount({ proprieteId, proprieteNom }: Props) {
  const isMobile = useIsMobile();
  const { providers, providersTitle } = useProprieteChatProviders(proprieteId);

  useEffect(() => {
    if (!proprieteId || providers.length === 0) {
      chatPageContext.setAvailableAttachments(null);
      return;
    }
    chatPageContext.setAvailableAttachments({ providers, providersTitle });
    return () => chatPageContext.setAvailableAttachments(null);
  }, [proprieteId, providers, providersTitle]);

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
      focusBanner={<GardenFocusBanner proprieteId={proprieteId} />}
    />
  );
}

