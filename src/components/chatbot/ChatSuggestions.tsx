import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { chatConfig, type ChatContext } from './chatConfig';
import { useChatPageContextStore, chatPageContext, type ChatEntity } from '@/hooks/useChatPageContext';
import { activateContextsForSuggestion, describeActivatedContexts } from '@/lib/chatSuggestionContexts';
import { proprieteChatFocus } from '@/components/propriete/chatbot/proprieteChatFocus';

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
  context?: ChatContext;
}

interface EntitySuggestion {
  emoji: string;
  text: string;
  /** Contextes à activer d'office pour que la réponse soit documentée. */
  contexts?: readonly string[];
  /** Charge tout le Plateau des ouvrages en profondeur « Complet ». */
  allOuvragesComplet?: boolean;
}

/** Socle propriété : espèces + prélèvements + portrait du site. */
const PROP_BASE = ['vivant.liste', 'sol.carottes', 'site.portrait'] as const;

const ENTITY_SUGGESTIONS: Record<ChatEntity['type'], EntitySuggestion[]> = {
  marche_event: [
    { emoji: '📋', text: 'Fais-moi une synthèse de cet événement' },
    { emoji: '👥', text: 'Qui sont les marcheurs inscrits ?' },
    { emoji: '🌿', text: 'Quelle est l\'empreinte biodiversité ?' },
    { emoji: '✉️', text: 'Génère un compte-rendu prêt à envoyer' },
  ],
  marcheur: [
    { emoji: '🪪', text: 'Profil et progression de ce marcheur' },
    { emoji: '🗓️', text: 'Quelles marches a-t-il faites ?' },
    { emoji: '📸', text: 'Quelles sont ses contributions ?' },
    { emoji: '🤝', text: 'Combien de filleuls a-t-il amenés ?' },
  ],
  exploration: [
    { emoji: '📖', text: 'Synthèse de cette exploration' },
    { emoji: '🗺️', text: 'Quelles marches y sont rattachées ?' },
    { emoji: '🌿', text: 'Biodiversité agrégée de l\'exploration' },
    { emoji: '🌐', text: 'Statut de publication et visibilité' },
  ],
  propriete: [
    {
      emoji: '🌱',
      text: 'Propose une palette végétale pour cette propriété',
      contexts: PROP_BASE,
    },
    { emoji: '🧪', text: 'Que disent les analyses de sol ?', contexts: ['sol.carottes', 'site.portrait'] },
    { emoji: '🌿', text: 'Quelles espèces indigènes privilégier ici ?', contexts: PROP_BASE },
    {
      emoji: '🏗️',
      text: 'Quelles précautions pour cette propriété ?',
      contexts: PROP_BASE,
      allOuvragesComplet: true,
    },
  ],
};


export function ChatSuggestions({ onSelect, context = 'dashboard' }: ChatSuggestionsProps) {
  const focalEntity = useChatPageContextStore((s) => s.entity);

  const suggestions: EntitySuggestion[] = focalEntity
    ? ENTITY_SUGGESTIONS[focalEntity.type] ?? chatConfig.suggestions[context]
    : (chatConfig.suggestions[context] || chatConfig.suggestions.dashboard);

  const handleSelect = (s: EntitySuggestion) => {
    if (!s.contexts?.length && !s.allOuvragesComplet) {
      onSelect(s.text);
      return;
    }

    const activated = activateContextsForSuggestion(s.contexts ?? []);
    const labels = [describeActivatedContexts(activated)].filter(Boolean);

    if (s.allOuvragesComplet) {
      const ids = chatPageContext.getState().pageState.availableAttachments?.ouvrageIds ?? [];
      if (ids.length > 0) {
        proprieteChatFocus.setOuvrageDetail('complet');
        proprieteChatFocus.setSelectedObjets(ids);
        labels.push(`🧭 Tous les ouvrages (${ids.length}) · dossier complet`);
      }
    }

    if (labels.length > 0) {
      toast.success('Contextes activés', { description: labels.join(' · ') });
    }

    // Laisse un tick de rendu : la slice « ouvrages.selection » est republiée
    // par le mount de l'IA de jardin dès que la sélection change.
    if (s.allOuvragesComplet) {
      setTimeout(() => onSelect(s.text), 80);
    } else {
      onSelect(s.text);
    }
  };


  return (
    <div className="space-y-2 px-1">
      <p className="text-center text-xs text-muted-foreground">
        {focalEntity ? 'Suggestions pour cette fiche' : 'Exemples de questions'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={`${context}-${focalEntity?.id ?? 'g'}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => handleSelect(s)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
          >
            <span className="mr-1.5">{s.emoji}</span>
            {s.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

