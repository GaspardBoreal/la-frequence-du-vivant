import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { chatConfig } from '@/components/chatbot/chatConfig';
import type { ChatContext } from '@/components/chatbot/chatConfig';
import { useChatPageContextStore } from '@/hooks/useChatPageContext';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${chatConfig.edgeFunctionPath}`;

export function useChatStream(currentContext: ChatContext = 'dashboard') {
  const pageEntity = useChatPageContextStore((s) => s.entity);
  const pageState = useChatPageContextStore((s) => s.pageState);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (input: string, voiceMode = false, documentContext?: { fileName: string; text: string }) => {
      let apiContent = input;
      if (documentContext) {
        apiContent = `[DOCUMENT JOINT : ${documentContext.fileName}]\n--- DÉBUT DU CONTENU ---\n${documentContext.text}\n--- FIN DU CONTENU ---\n\nQuestion de l'utilisateur : ${input}`;
      }

      const userMsg: Msg = { role: 'user', content: input };
      const apiMsg: Msg = { role: 'user', content: apiContent };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setWasStopped(false);

      let assistantSoFar = '';
      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Récupérer le JWT de la session admin pour l'envoyer à la edge function
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error('Session expirée — reconnectez-vous.');
        }

        const allMessages = [...messages.map((m) => ({ ...m })), apiMsg];
        const resp = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: allMessages,
            voiceMode,
            scope: currentContext,
            entity: pageEntity ?? undefined,
            pageState: pageEntity ? pageState : undefined,
          }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          const errorData = await resp.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur de connexion');
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Chat error:', e);
          upsertAssistant(`\n\n⚠️ ${e.message || 'Erreur de connexion au service IA'}`);
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, currentContext, pageEntity, pageState]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setWasStopped(true);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, wasStopped, send, stop, reset };
}
