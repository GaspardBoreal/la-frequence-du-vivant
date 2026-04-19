import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isExpanded?: boolean;
}

export function ChatMessage({ role, content, isExpanded }: ChatMessageProps) {
  const isUser = role === 'user';
  const { isSupported, isSpeaking, speak, stopSpeaking } = useSpeechSynthesis();
  const [copied, setCopied] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) stopSpeaking();
    else speak(content);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className={`group/msg flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/20 text-secondary-foreground'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`${isExpanded ? 'max-w-[75%]' : 'max-w-[80%]'} flex flex-col gap-1`}>
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted text-foreground rounded-tl-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={`absolute -bottom-1 ${
              isUser ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
            } flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all duration-200 ${
              copied
                ? 'opacity-100 scale-100 text-primary'
                : 'opacity-0 scale-90 text-muted-foreground hover:text-foreground group-hover/msg:opacity-100 group-hover/msg:scale-100'
            }`}
            title={copied ? 'Copié !' : 'Copier le message'}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        {!isUser && isSupported && (
          <button
            onClick={handleSpeak}
            className={`self-start flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              isSpeaking
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={isSpeaking ? 'Arrêter la lecture' : 'Écouter'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-3 w-3" />
                <span>Arrêter</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3" />
                <span>Écouter</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
