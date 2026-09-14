import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatTableBlock from './ChatTableBlock';
import { repairChatMarkdown } from '@/lib/chatMarkdownRepair';
import { Bot, User, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isExpanded?: boolean;
  /** Vrai tant que la réponse est en cours de streaming (répare sans casser). */
  isStreaming?: boolean;
  /** Image jointe par l'utilisateur (affichée dans le message utilisateur). */
  image?: string;
}

const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return '';
};

const NumberedHeading = ({ level, children }: { level: 1 | 2 | 3; children: React.ReactNode }) => {
  const label = getNodeText(children);
  const match = label.match(/^\s*(\d{1,2})[.)]\s+(.+)$/);
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const headingClass = level === 1
    ? 'mt-7 mb-3 text-lg font-semibold leading-snug text-foreground'
    : level === 2
      ? 'mt-6 mb-3 text-base font-semibold leading-snug text-foreground'
      : 'mt-5 mb-2 text-sm font-semibold leading-snug text-foreground';

  if (!match) return <Tag className={headingClass}>{children}</Tag>;

  return (
    <Tag className={`${headingClass} flex items-start gap-2.5`}>
      <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
        {match[1]}
      </span>
      <span className="pt-1">{match[2]}</span>
    </Tag>
  );
};

export function ChatMessage({ role, content, isExpanded, isStreaming, image }: ChatMessageProps) {
  const isUser = role === 'user';
  const { isSupported, isSpeaking, speak, stopSpeaking } = useSpeechSynthesis();
  const [copied, setCopied] = useState(false);

  /** Markdown normalisé : les tableaux dégradés redeviennent des tableaux GFM. */
  const markdown = useMemo(
    () => (isUser ? content : repairChatMarkdown(content, isStreaming)),
    [content, isUser, isStreaming],
  );


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
    <Message from={role} className={`group/msg ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/20 text-secondary-foreground'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`${isExpanded ? 'max-w-[78%]' : 'max-w-[88%]'} min-w-0 flex flex-col gap-1 sm:max-w-[80%]`}>
        <div className="relative">
          <MessageContent
            className={`rounded-2xl px-4 py-3 text-sm ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'w-full bg-transparent px-1 py-1 text-foreground'
            }`}
          >
            {isUser ? (
              <div className="space-y-2">
                {image && (
                  <img
                    src={image}
                    alt="Photo de test de sol jointe"
                    className="max-w-[200px] max-h-[160px] rounded-lg object-cover border border-primary-foreground/20"
                    loading="lazy"
                  />
                )}
                <p className="whitespace-pre-wrap">{content}</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none break-words text-foreground dark:prose-invert [&_p]:my-3 [&_p]:leading-6 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ol]:my-3 [&_ol]:space-y-1.5 [&_li]:pl-1 [&_li]:leading-6 [&_blockquote]:my-4 [&_blockquote]:border-l-primary [&_blockquote]:py-1 [&_hr]:my-5 [&_strong]:font-semibold [&_strong]:text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => <ChatTableBlock>{children}</ChatTableBlock>,
                    h1: ({ children }) => <NumberedHeading level={1}>{children}</NumberedHeading>,
                    h2: ({ children }) => <NumberedHeading level={2}>{children}</NumberedHeading>,
                    h3: ({ children }) => <NumberedHeading level={3}>{children}</NumberedHeading>,
                  }}
                >
                  {markdown}
                </ReactMarkdown>

              </div>
            )}
          </MessageContent>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className={`absolute -bottom-1 ${
              isUser ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
            } flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all duration-200 ${
              copied
                ? 'opacity-100 scale-100 text-primary'
                : 'opacity-0 scale-90 text-muted-foreground hover:text-foreground group-hover/msg:opacity-100 group-hover/msg:scale-100'
            }`}
            aria-label={copied ? 'Message copié' : 'Copier le message'}
            title={copied ? 'Copié !' : 'Copier le message'}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {!isUser && isSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
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
          </Button>
        )}
      </div>
      </div>
    </Message>
  );
}
