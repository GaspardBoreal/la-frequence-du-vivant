import { useState, useRef, useCallback, useEffect } from 'react';

function cleanMarkdownForSpeech(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitIntoChunks(text: string, maxLength = 180): string[] {
  const sentences = text.split(/(?<=[.!?:;])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

interface SpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  speakElevenLabs: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  unlock: () => void;
  unlockAudio: () => void;
}

export function useSpeechSynthesis(): SpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chunksRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);
  const unlockedRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioUnlockedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const getFrenchVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    const french = voices.find((v) => v.lang.startsWith('fr') && v.localService);
    return french || voices.find((v) => v.lang.startsWith('fr')) || null;
  }, [isSupported]);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      return audioContextRef.current;
    }
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;
    audioContextRef.current = new AudioCtx();
    return audioContextRef.current;
  }, []);

  const stopAudioSource = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch { /* already stopped */ }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    try {
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(ctx.destination);
      source.start(0);
      audioUnlockedRef.current = true;
    } catch (e) {
      console.warn('[TTS] Failed to unlock AudioContext:', e);
    }
  }, [getAudioContext]);

  const speakChunk = useCallback(
    (index: number) => {
      if (cancelledRef.current || index >= chunksRef.current.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voice = getFrenchVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'not-allowed') {
          console.warn('[TTS] Speech synthesis error:', e.error);
        }
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    },
    [getFrenchVoice]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      stopAudioSource();
      const cleaned = cleanMarkdownForSpeech(text);
      if (!cleaned) return;
      chunksRef.current = splitIntoChunks(cleaned);
      cancelledRef.current = false;
      setIsSpeaking(true);
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => speakChunk(0);
      } else {
        speakChunk(0);
      }
    },
    [isSupported, speakChunk, stopAudioSource]
  );

  const speakElevenLabs = useCallback(
    async (text: string) => {
      cancelledRef.current = true;
      if (isSupported) window.speechSynthesis.cancel();
      stopAudioSource();
      const cleaned = cleanMarkdownForSpeech(text);
      if (!cleaned) return;
      setIsSpeaking(true);

      try {
        const ctx = getAudioContext();
        if (!ctx) throw new Error('AudioContext not available');
        if (ctx.state === 'suspended') await ctx.resume();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: cleaned }),
          }
        );

        if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          audioSourceRef.current = null;
          setIsSpeaking(false);
        };
        audioSourceRef.current = source;
        source.start(0);
      } catch (error) {
        console.warn('[TTS] ElevenLabs TTS failed, falling back to Web Speech API:', error);
        setIsSpeaking(false);
        speak(text);
      }
    },
    [isSupported, stopAudioSource, speak, getAudioContext]
  );

  const stopSpeaking = useCallback(() => {
    cancelledRef.current = true;
    if (isSupported) window.speechSynthesis.cancel();
    stopAudioSource();
    setIsSpeaking(false);
  }, [isSupported, stopAudioSource]);

  const unlock = useCallback(() => {
    if (unlockedRef.current || !isSupported) return;
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
    unlockedRef.current = true;
  }, [isSupported]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (isSupported) window.speechSynthesis.cancel();
      stopAudioSource();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isSupported, stopAudioSource]);

  return { isSupported, isSpeaking, speak, speakElevenLabs, stopSpeaking, unlock, unlockAudio };
}
