import { motion } from 'framer-motion';
import { chatConfig, type ChatContext } from './chatConfig';

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
  context?: ChatContext;
}

export function ChatSuggestions({ onSelect, context = 'dashboard' }: ChatSuggestionsProps) {
  const suggestions = chatConfig.suggestions[context] || chatConfig.suggestions.dashboard;

  return (
    <div className="space-y-2 px-1">
      <p className="text-center text-xs text-muted-foreground">Exemples de questions</p>
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={`${context}-${i}`}
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
