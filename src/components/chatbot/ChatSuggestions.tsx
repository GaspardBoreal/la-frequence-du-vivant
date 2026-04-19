import { motion } from 'framer-motion';
import { chatConfig, type ChatContext } from './chatConfig';
import { useChatPageContextStore, type ChatEntity } from '@/hooks/useChatPageContext';

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
  context?: ChatContext;
}

const ENTITY_SUGGESTIONS: Record<ChatEntity['type'], { emoji: string; text: string }[]> = {
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
};

export function ChatSuggestions({ onSelect, context = 'dashboard' }: ChatSuggestionsProps) {
  const focalEntity = useChatPageContextStore((s) => s.entity);

  const suggestions = focalEntity
    ? ENTITY_SUGGESTIONS[focalEntity.type] ?? chatConfig.suggestions[context]
    : (chatConfig.suggestions[context] || chatConfig.suggestions.dashboard);

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
            onClick={() => onSelect(s.text)}
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

