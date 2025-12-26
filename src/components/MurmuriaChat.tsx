import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Waves, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMurmuriaChat, MurmuriaMessage } from '@/hooks/useMurmuriaChat';
import { useIsMobile } from '@/hooks/use-mobile';

interface MurmuriaProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessageBubble: React.FC<{ message: MurmuriaMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-cyan-600 text-white rounded-br-sm'
            : 'bg-cyan-900/40 text-cyan-50 border border-cyan-700/30 rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
};

const WelcomeMessage: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3, duration: 0.5 }}
    className="text-center py-8 px-4"
  >
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="inline-block mb-4"
    >
      <Waves className="h-12 w-12 text-cyan-400" />
    </motion.div>
    <h3 className="text-lg font-medium text-cyan-100 mb-2">
      Murmures de la Dordogne
    </h3>
    <p className="text-sm text-cyan-300/80 leading-relaxed max-w-xs mx-auto">
      Je suis Murmuria, l'esprit de la rivière. 
      Posez-moi vos questions sur les eaux vivantes de la Dordogne...
    </p>
  </motion.div>
);

const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-start mb-3"
  >
    <div className="bg-cyan-900/40 border border-cyan-700/30 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

const MurmuriaChat: React.FC<MurmuriaProps> = ({ isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, error, sendMessage, resetSession } = useMurmuriaChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay pour mobile */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />
          )}

          {/* Panneau de chat */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[9999] bg-gradient-to-b from-slate-900 via-cyan-950/90 to-slate-900 border border-cyan-700/40 shadow-2xl shadow-cyan-900/30 flex flex-col overflow-hidden ${
              isMobile
                ? 'inset-4 rounded-2xl'
                : 'bottom-24 right-6 w-96 h-[32rem] rounded-2xl'
            }`}
          >
            {/* Effet d'ondulation de fond */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl"
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl"
                animate={{ 
                  x: [0, -20, 0],
                  y: [0, 30, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-cyan-700/30 bg-cyan-950/50">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Waves className="h-5 w-5 text-cyan-400" />
                </motion.div>
                <div>
                  <h2 className="text-sm font-semibold text-cyan-100">Murmuria</h2>
                  <p className="text-xs text-cyan-400/70">L'esprit de la Dordogne</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetSession}
                  className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-800/30"
                  title="Nouvelle conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-800/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zone des messages */}
            <ScrollArea className="flex-1 relative">
              <div ref={scrollRef} className="p-4">
                {messages.length === 0 && !isLoading && <WelcomeMessage />}
                
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                
                {isLoading && <TypingIndicator />}
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-2 px-4 text-xs text-red-400/80 bg-red-900/20 rounded-lg mx-4"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Zone de saisie */}
            <form onSubmit={handleSubmit} className="relative p-3 border-t border-cyan-700/30 bg-cyan-950/50">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Murmurez à la rivière..."
                  disabled={isLoading}
                  className="flex-1 bg-cyan-900/40 border border-cyan-700/40 rounded-xl px-4 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="h-10 w-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MurmuriaChat;
