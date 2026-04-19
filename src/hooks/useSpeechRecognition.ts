import { useState, useRef, useCallback, useEffect } from 'react';

type SpeechStatus = 'idle' | 'listening' | 'error';

interface UseSpeechRecognitionOptions {
  onFinalResult?: (text: string) => void;
  onInterruptDetected?: (remainingText: string) => void;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  status: SpeechStatus;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  setInterruptMode: (active: boolean) => void;
  interruptMode: boolean;
  error: string | null;
}

type SpeechRecognitionInstance = any;

const INTERRUPT_REGEX =
  /\b(stop|stoppe|arr[eê]te[rz]?|tais[- ]toi|silence|suffit|assez|c'est bon|non merci|autre chose)\b/i;

function extractInterrupt(text: string): string | null {
  const lower = text.toLowerCase();
  const match = INTERRUPT_REGEX.exec(lower);
  if (!match) return null;
  return text.slice(match.index + match[0].length).trim();
}

export function useSpeechRecognition(
  optionsOrCallback?: UseSpeechRecognitionOptions | ((text: string) => void)
): UseSpeechRecognitionReturn {
  const options: UseSpeechRecognitionOptions =
    typeof optionsOrCallback === 'function'
      ? { onFinalResult: optionsOrCallback }
      : optionsOrCallback ?? {};

  const { onFinalResult, onInterruptDetected } = options;

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [interruptMode, setInterruptModeState] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef('');
  const interruptModeRef = useRef(false);
  const interruptFiredRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const setInterruptMode = useCallback((active: boolean) => {
    interruptModeRef.current = active;
    interruptFiredRef.current = false;
    setInterruptModeState(active);
  }, []);

  const clearAutoSendTimer = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearAutoSendTimer();
    if (recognitionRef.current) recognitionRef.current.stop();
    setStatus('idle');
    setInterimTranscript('');
  }, [clearAutoSendTimer]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedRef.current = '';
    interruptFiredRef.current = false;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }

      if (interruptModeRef.current && !interruptFiredRef.current) {
        const fullText = (finalText + ' ' + interim).trim();
        const remaining = extractInterrupt(fullText);
        if (remaining !== null) {
          interruptFiredRef.current = true;
          clearAutoSendTimer();
          onInterruptDetected?.(remaining);
          return;
        }
      }

      if (finalText) {
        accumulatedRef.current = finalText;
        setTranscript(finalText);
      }
      setInterimTranscript(interim);

      if (!interruptModeRef.current) {
        clearAutoSendTimer();
        if (finalText) {
          autoSendTimerRef.current = setTimeout(() => {
            const text = accumulatedRef.current.trim();
            if (text && onFinalResult) onFinalResult(text);
            stopListening();
          }, 1500);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(`Erreur de reconnaissance : ${event.error}`);
      setStatus('error');
    };

    recognition.onend = () => {
      if (status === 'listening' && recognitionRef.current === recognition) {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onFinalResult, onInterruptDetected, clearAutoSendTimer, stopListening, status]);

  useEffect(() => {
    return () => {
      clearAutoSendTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [clearAutoSendTimer]);

  return {
    isSupported,
    status,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    setInterruptMode,
    interruptMode,
    error,
  };
}
