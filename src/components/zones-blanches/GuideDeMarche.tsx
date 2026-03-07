import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, RotateCcw, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { useGuideDeMarche, ChatMessage } from '@/hooks/useGuideDeMarche';
import { DetectionResult } from '@/hooks/useDetecteurZonesBlanches';
import { exportGuidePdf } from './GuideDeMarchePdf';

const SUGGESTIONS = [
  'Où se garer pour cette marche ?',
  'Propose un parcours de découverte',
  'Organise une marche de 2h avec 4 séquences pédagogiques',
  'Quelles espèces observer en priorité ?',
];

interface GuideProps {
  zonesContext: DetectionResult;
}

const GuideDeMarche: React.FC<GuideProps> = ({ zonesContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, resetSession } = useGuideDeMarche(zonesContext);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    sendMessage(msg);
    setInput('');
  };

  const handleExportPdf = async () => {
    if (messages.length === 0) return;
    await exportGuidePdf(messages, zonesContext);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center print:hidden"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
            title="Guide de Marche IA"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:hidden"
            style={{ background: '#fefdfb', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/60" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(13,148,136,0.05))' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Guide de Marche</h3>
                  <p className="text-[10px] text-stone-400">Assistant IA · {zonesContext.total_scanned} zones analysées</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <>
                    <button onClick={handleExportPdf} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-emerald-600" title="Exporter en PDF">
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button onClick={resetSession} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600" title="Nouvelle conversation">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(13,148,136,0.08))' }}>
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-stone-700 mb-1">Prêt à organiser votre marche</p>
                  <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                    Posez vos questions sur le parcours, le stationnement, l'organisation pédagogique…
                  </p>
                  <div className="space-y-2 w-full">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: '#047857' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="italic">Le guide réfléchit…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-stone-200/60">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question…"
                  disabled={isLoading}
                  className="flex-1 text-sm h-9 rounded-lg border-stone-200 focus-visible:ring-emerald-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'text-stone-700 rounded-bl-sm border border-stone-100'
        }`}
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #10b981, #0d9488)' }
            : { background: 'rgba(245,245,244,0.6)' }
        }
      >
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-stone max-w-none [&_p]:mb-1.5 [&_p]:leading-relaxed [&_ul]:mb-1.5 [&_ol]:mb-1.5 [&_li]:mb-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold [&_h2]:mt-2 [&_h3]:mt-2 [&_table]:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideDeMarche;
