import { useState, useRef, useCallback } from 'react';
import { LocalBiodiversityData } from '@/contexts/BiodiversityContext';

const DORDONIA_WEBHOOK_URL = 'https://gaspard-boreal.app.n8n.cloud/webhook/3d02e00f-964a-413f-a036-5f05211f92bc/chat';

export interface DordoniaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const getOrCreateSessionId = (): string => {
  const storageKey = 'dordonia_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `dordonia_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

export const useDordoniaChat = () => {
  const [messages, setMessages] = useState<DordoniaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(getOrCreateSessionId());

  const sendMessage = useCallback(async (chatInput: string, biodiversityContext?: LocalBiodiversityData | null) => {
    if (!chatInput.trim()) return;

    const userMessage: DordoniaMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build payload with optional biodiversity context
      const payload: Record<string, unknown> = {
        action: 'sendMessage',
        sessionId: sessionId.current,
        chatInput: chatInput.trim(),
      };

      // Add biodiversity context if available and fresh (< 10 minutes old)
      if (biodiversityContext && (Date.now() - biodiversityContext.timestamp) < 600000) {
        payload.localBiodiversity = {
          location: biodiversityContext.location,
          summary: biodiversityContext.summary,
          species: biodiversityContext.species.slice(0, 25).map(sp => ({
            commonName: sp.commonName,
            scientificName: sp.scientificName,
            kingdom: sp.kingdom,
            observations: sp.observations,
            family: sp.family,
          })),
        };
      }

      const response = await fetch(DORDONIA_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur de communication avec Dordonia (${response.status})`);
      }

      const data = await response.json();
      
      // Parser la réponse de n8n - adapter selon le format réel
      const assistantContent = typeof data === 'string' 
        ? data 
        : data.output || data.text || data.response || data.message || JSON.stringify(data);

      const assistantMessage: DordoniaMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Dordonia chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const resetSession = useCallback(() => {
    localStorage.removeItem('dordonia_session_id');
    sessionId.current = getOrCreateSessionId();
    clearMessages();
  }, [clearMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    resetSession,
  };
};
