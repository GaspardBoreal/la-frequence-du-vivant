import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Square,
  RotateCcw,
  Download,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Paperclip,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStream } from '@/hooks/useChatStream';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocumentExtractor } from '@/hooks/useDocumentExtractor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { ChatMessage } from './ChatMessage';
import { ChatSuggestions } from './ChatSuggestions';
import { useChatExport } from './useChatExport';
import { ChatExportDrawer } from './ChatExportDrawer';
import { chatConfig, type ChatContext } from './chatConfig';
import { chatPageContext, useChatPageContextStore, type ChatEntity } from '@/hooks/useChatPageContext';

interface ChatBotProps {
  currentContext?: ChatContext;
  /** Entité détectée via l'URL — fallback si aucune page n'a posé de contexte explicite */
  urlEntity?: ChatEntity | null;
  /** Edge function à appeler (admin-chat par défaut, community-chat pour pages publiques) */
  edgeFunctionPath?: string;
  /** Override du nom affiché (ex: "Compagnon du Vivant" sur pages publiques) */
  assistantNameOverride?: string;
  /** Badge rôle affiché dans le header (ex: "Ambassadeur") */
  roleBadge?: string | null;
}

export function ChatBot({
  currentContext = 'dashboard',
  urlEntity = null,
  edgeFunctionPath,
  assistantNameOverride,
  roleBadge = null,
}: ChatBotProps) {
  // Si l'URL contient une entité et qu'aucune page n'en a posé d'explicite, on l'enregistre.
  useEffect(() => {
    if (urlEntity && !chatPageContext.getState().entity) {
      chatPageContext.setContext(urlEntity, {});
    }
  }, [urlEntity]);

  const focalEntity = useChatPageContextStore((s) => s.entity);
  const focalState = useChatPageContextStore((s) => s.pageState);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [interruptBanner, setInterruptBanner] = useState(false);
  const { messages, isLoading, wasStopped, send, stop, reset } = useChatStream(currentContext, edgeFunctionPath);
  const { exportPrint } = useChatExport(messages);
  const isMobile = useIsMobile();
  const {
    document: attachedDoc,
    isExtracting,
    error: docError,
    fileInputRef,
    processFile,
    removeDocument,
    openFilePicker,
    acceptedFormats,
  } = useDocumentExtractor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);

  const {
    isSupported: ttsSupported,
    isSpeaking,
    speak,
    speakElevenLabs,
    stopSpeaking,
    unlock: unlockTts,
    unlockAudio,
  } = useSpeechSynthesis();

  const handleVoiceInterrupt = useCallback(
    (remainingText: string) => {
      stop();
      stopSpeaking();
      setInterruptBanner(true);
      setTimeout(() => setInterruptBanner(false), 2500);
      if (remainingText.trim()) {
        setTimeout(() => send(remainingText.trim(), true), 200);
      }
    },
    [stop, stopSpeaking, send]
  );

  const onFinalSpeech = useCallback(
    (text: string) => {
      setInput('');
      send(text, true);
    },
    [send]
  );

  const {
    isSupported: sttSupported,
    status: sttStatus,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    setInterruptMode,
    interruptMode,
  } = useSpeechRecognition({
    onFinalResult: onFinalSpeech,
    onInterruptDetected: handleVoiceInterrupt,
  });

  const isListening = sttStatus === 'listening';

  useEffect(() => {
    if (isLoading && voiceMode && isListening) setInterruptMode(true);
    else setInterruptMode(false);
  }, [isLoading, voiceMode, isListening, setInterruptMode]);

  useEffect(() => {
    if (isLoading && voiceMode && !isListening && sttSupported) startListening();
  }, [isLoading, voiceMode, isListening, sttSupported, startListening]);

  useEffect(() => {
    if (isListening && !interruptMode) {
      const display = transcript + (interimTranscript ? ' ' + interimTranscript : '');
      setInput(display);
    }
  }, [transcript, interimTranscript, isListening, interruptMode]);

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && voiceMode && ttsSupported) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') speakElevenLabs(lastMsg.content);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, voiceMode, ttsSupported, messages, speakElevenLabs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isExpanded]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    send(trimmed, voiceMode, attachedDoc ?? undefined);
    removeDocument();
  };

  const handleSuggestion = (question: string) => send(question);

  const toggleMic = () => {
    if (isListening) {
      stopListening();
      setInput('');
    } else {
      if (isMobile && !voiceMode) setVoiceMode(true);
      unlockTts();
      unlockAudio();
      stopSpeaking();
      startListening();
    }
  };

  const toggleVoiceMode = () => {
    if (voiceMode) stopSpeaking();
    setVoiceMode(!voiceMode);
  };

  const handleReset = () => {
    stopSpeaking();
    stopListening();
    setInput('');
    removeDocument();
    reset();
    setInterruptBanner(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  const panelClasses = isExpanded
    ? 'fixed inset-0 z-[60] flex items-center justify-center'
    : 'fixed bottom-6 right-6 z-50';

  const chatClasses = isExpanded
    ? 'flex h-[90vh] w-[80vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300'
    : 'flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl';

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              aria-label={`Ouvrir ${chatConfig.assistantName}`}
              className="h-14 w-14 rounded-full bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-secondary" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={panelClasses}
          >
            <motion.div
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={chatClasses}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
                    <span className="text-lg">{chatConfig.assistantEmoji}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary-foreground flex items-center gap-1.5">
                      {assistantNameOverride ?? chatConfig.assistantName}
                      {roleBadge && (
                        <Badge
                          variant="secondary"
                          className="bg-primary-foreground/15 text-primary-foreground text-[9px] border-0 px-1.5 py-0"
                        >
                          {roleBadge}
                        </Badge>
                      )}
                    </h3>
                    <p className="text-[10px] text-primary-foreground/70 truncate max-w-[220px]">
                      {voiceMode
                        ? '🎙️ Mode vocal actif'
                        : focalEntity && focalState?.label
                          ? `${chatConfig.contextLabels[currentContext]} › ${focalState.label}`
                          : focalEntity
                            ? `${chatConfig.contextLabels[currentContext]} › fiche en cours`
                            : `Contexte : ${chatConfig.contextLabels[currentContext]}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isExpanded && (
                    <Badge
                      variant="secondary"
                      className="mr-2 bg-primary-foreground/15 text-primary-foreground text-[10px] border-0"
                    >
                      {chatConfig.contextLabels[currentContext]}
                    </Badge>
                  )}
                  {ttsSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleVoiceMode}
                      className={`h-8 w-8 transition-colors ${
                        voiceMode
                          ? 'text-primary-foreground bg-primary-foreground/20'
                          : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                      }`}
                      title={voiceMode ? 'Désactiver la lecture auto' : 'Activer la lecture auto'}
                    >
                      {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  )}
                  {messages.length > 0 && !isLoading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => (isMobile ? setDrawerOpen(true) : exportPrint())}
                      className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      title="Exporter la conversation"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReset}
                      className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      title="Nouvelle conversation"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleExpanded}
                      className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      title={isExpanded ? 'Réduire' : 'Ouvrir en grand'}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsOpen(false);
                      setIsExpanded(false);
                    }}
                    className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 min-h-0">
                <div className="flex flex-1 min-w-0 flex-col">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
                          <span className="text-3xl">{chatConfig.botEmoji}</span>
                        </div>
                        <div className="text-center">
                          <p className={`font-medium text-foreground ${isExpanded ? 'text-base' : 'text-sm'}`}>
                            {chatConfig.welcomeMessage}
                          </p>
                          <p className={`mt-1 text-muted-foreground ${isExpanded ? 'text-sm' : 'text-xs'}`}>
                            {sttSupported ? chatConfig.welcomeSubtitleVoice : chatConfig.welcomeSubtitle}
                          </p>
                        </div>
                        <ChatSuggestions onSelect={handleSuggestion} context={currentContext} />
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <ChatMessage key={i} role={msg.role} content={msg.content} isExpanded={isExpanded} />
                      ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-secondary" />
                        </div>
                        <span className="text-xs">Réflexion en cours…</span>
                      </div>
                    )}

                    {isLoading && voiceMode && isListening && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                        </span>
                        🎙️ Dites « stop » ou « arrête » pour interrompre
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {interruptBanner && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                        >
                          ⏹ Réponse interrompue par commande vocale
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {wasStopped && !interruptBanner && !isLoading && (
                      <div className="text-[11px] text-muted-foreground italic">⏹ Réponse interrompue</div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border bg-card p-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={acceptedFormats}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {(attachedDoc || isExtracting || docError) && (
                      <div className="mb-2 px-1">
                        {isExtracting && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                            </div>
                            Extraction du texte…
                          </div>
                        )}
                        {docError && <div className="text-xs text-destructive">{docError}</div>}
                        {attachedDoc && !isExtracting && (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[200px]">{attachedDoc.fileName}</span>
                            <button
                              onClick={removeDocument}
                              className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                              title="Retirer le document"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isListening && !interruptMode && (
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                        </span>
                        <span className="text-[11px] text-muted-foreground">Écoute en cours…</span>
                      </div>
                    )}
                    {isListening && interruptMode && (
                      <div className="flex items-center gap-2 mb-2 px-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          🎙️ Micro actif — dites « stop » pour interrompre
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {!isLoading && (
                        <Button
                          onClick={openFilePicker}
                          size="icon"
                          variant="outline"
                          disabled={isExtracting}
                          className="h-10 w-10 shrink-0 rounded-xl"
                          title="Joindre un document (PDF, TXT, CSV, MD)"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      )}
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={
                          attachedDoc
                            ? 'Posez une question sur le document…'
                            : isListening
                            ? 'Parlez maintenant…'
                            : chatConfig.placeholderInput
                        }
                        className={`flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          isExpanded ? 'py-3' : 'py-2.5'
                        }`}
                        disabled={isLoading || isListening}
                      />
                      {sttSupported && !isLoading && (
                        <Button
                          onClick={toggleMic}
                          size="icon"
                          variant={isListening ? 'destructive' : 'outline'}
                          className={`h-10 w-10 shrink-0 rounded-xl transition-all ${
                            isListening ? 'animate-pulse' : ''
                          }`}
                          title={isListening ? 'Arrêter le micro' : 'Dictée vocale'}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                      {isLoading ? (
                        <Button onClick={stop} size="icon" variant="outline" className="h-10 w-10 shrink-0 rounded-xl">
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSend}
                          size="icon"
                          disabled={!input.trim() || isListening}
                          className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatExportDrawer open={drawerOpen} onOpenChange={setDrawerOpen} messages={messages} />
    </>
  );
}
