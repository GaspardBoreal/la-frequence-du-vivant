import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Music, PenLine, Send, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuizCompanion } from '@/hooks/useQuizCompanion';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  { icon: Leaf, label: 'Identifier les espèces en marchant', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20', prompt: 'Comment puis-je apprendre à identifier les espèces végétales et animales pendant mes marches ? Donne-moi des techniques concrètes pour un débutant.' },
  { icon: Music, label: 'Reconnaître les chants d\'oiseaux', color: 'text-sky-400 bg-sky-500/15 border-sky-500/20', prompt: 'Je veux apprendre à reconnaître les chants d\'oiseaux sur le terrain. Par quelles espèces commencer et quelles techniques d\'écoute utiliser ?' },
  { icon: PenLine, label: 'Écrire en marchant', color: 'text-amber-400 bg-amber-500/15 border-amber-500/20', prompt: 'Comment pratiquer l\'écriture géopoétique pendant une marche ? Donne-moi un exercice sensoriel que je peux essayer lors de ma prochaine sortie.' },
];

const QuizCompanion: React.FC = () => {
  const { messages, isLoading, sendMessage, resetSession } = useQuizCompanion();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestion = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-sm font-medium">Compagnon d'éveil</span>
        </div>
        {messages.length > 0 && (
          <button onClick={resetSession} className="text-white/40 hover:text-white/70 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Suggestions — only show when no conversation */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-emerald-200/60 text-xs">Que souhaitez-vous explorer ?</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s.prompt)}
                disabled={isLoading}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all hover:scale-[1.01] ${s.color}`}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {messages.length > 0 && (
          <div ref={scrollRef} className="max-h-64 overflow-y-auto space-y-3 scrollbar-thin">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/15 text-emerald-100 rounded-lg px-3 py-2 ml-6'
                      : 'text-emerald-200/80 prose prose-sm prose-invert max-w-none'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-1.5 text-emerald-300/50 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-pulse delay-150" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 animate-pulse delay-300" />
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question…"
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 w-8 p-0 rounded-lg"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizCompanion;
