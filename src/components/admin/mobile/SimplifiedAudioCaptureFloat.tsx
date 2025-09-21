import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Mic, Upload, Square, Play, Pause, Trash2, FileAudio, Waves, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Switch } from '../../ui/switch';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Progress } from '../../ui/progress';
import { toast } from 'sonner';
import { saveAudio, validateAudioFile, getAudioDuration, AudioUploadProgress, AudioToUpload } from '../../../utils/supabaseAudioOperations';
import { useTranscriptionModels } from '../../../hooks/useTranscriptionModels';
import { transcribeAudio } from '../../../utils/audioTranscription';
import { supabase } from '../../../integrations/supabase/client';

interface SimplifiedAudioCaptureFloatProps {
  marcheId: string;
  onAudioUploaded?: (audioId: string) => void;
  embedded?: boolean;
  onRequestClose?: () => void;
}

interface RecordedAudio {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  name: string;
}

type Step = 'choose-action' | 'configure' | 'recording' | 'finalize';

const SimplifiedAudioCaptureFloat: React.FC<SimplifiedAudioCaptureFloatProps> = ({ 
  marcheId, 
  onAudioUploaded,
  embedded = false,
  onRequestClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('choose-action');
  const [actionType, setActionType] = useState<'record' | 'import' | null>(null);
  
  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Transcription states - simplified
  const [withTranscription, setWithTranscription] = useState(false);
  const [realtimeTranscription, setRealtimeTranscription] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Real-time transcription WebSocket and HTTP fallback
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [chunkCounter, setChunkCounter] = useState(0);
  const [isFinalizingTranscription, setIsFinalizingTranscription] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  
  const { data: transcriptionModels = [] } = useTranscriptionModels();
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wsRetriesRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChunksRef = useRef<any[]>([]);
  const recordingMimeTypeRef = useRef<string>('audio/webm');
  // New refs for robust realtime WS handling
  const wsRef = useRef<WebSocket | null>(null);
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalizationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMimeTypeRef = useRef<string>('audio/webm');
  const startTimeRef = useRef<number>(0);
  const timerAnimationRef = useRef<number>(0);

  // Auto-select best transcription model
  const getBestTranscriptionModel = () => {
    if (!transcriptionModels.length) return null;
    // Sélectionne automatiquement le premier modèle actif
    return transcriptionModels.find(m => m.is_active) || transcriptionModels[0];
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (finalizationTimeoutRef.current) clearTimeout(finalizationTimeoutRef.current);
      if (timerAnimationRef.current) cancelAnimationFrame(timerAnimationRef.current);
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
      if (wsRef.current) wsRef.current.close();
      if (wsConnection) wsConnection.close();
    };
  }, [recordedAudio, wsConnection]);

  // Real-time transcription setup
  const setupRealtimeTranscription = () => {
    if (!realtimeTranscription) return;

    const projectRef = 'xzbunrtgbfbhinkzkzhf';
    const url = `wss://${projectRef}.functions.supabase.co/functions/v1/realtime-transcription`;

    const connect = () => {
      try {
        console.log('🎤 Connecting to realtime transcription WebSocket:', url);
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          wsRetriesRef.current = 0;
          wsRef.current = ws;
          setWsConnection(ws);
          setIsTranscribing(true);
          toast.success('Transcription temps réel activée');
          
          // Flush any buffered chunks immediately
          flushPending();
          
          // Setup periodic flush and ping while connected
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 15000);
          flushIntervalRef.current = setInterval(() => {
            flushPending();
          }, 1000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📥 Received WebSocket message:', message.type, message.text?.substring(0, 50));
            
            if (message.type === 'transcription_result' && message.text?.trim()) {
              const text = message.text.trim();
              
              // Filter out incremental results that are only punctuation or too short
              const isPunctuationOnly = /^[.,!?;:\-\s]*$/.test(text);
              const isTooShort = text.length < 3;
              
              if (!message.isFinal && (isPunctuationOnly || isTooShort)) {
                console.log('⏭️ Skipping incremental result (punctuation/short):', text);
                return;
              }
              
              console.log('📝 Adding transcription text:', text, 'isFinal:', message.isFinal);
              setTranscriptionText(prev => {
                if (message.isFinal) {
                  // For final results, replace everything to ensure accuracy
                  console.log('🏁 Final transcription received, replacing text');
                  setIsFinalizingTranscription(false);
                  return text;
                } else {
                  // For incremental results, append
                  const newText = prev + (prev ? ' ' : '') + text;
                  console.log('📄 Updated transcription text length:', newText.length);
                  return newText;
                }
              });
            } else if (message.type === 'finalized') {
              console.log('🎯 Finalization complete message received');
              setIsFinalizingTranscription(false);
            } else if (message.type === 'error') {
              console.error('❌ Realtime transcription error:', message.message);
              toast.error(`Erreur transcription: ${message.message}`);
              setIsFinalizingTranscription(false);
            } else if (message.type === 'connection') {
              console.log('🔗 Connection status:', message.status);
            }
          } catch (e) {
            console.error('❌ Invalid message from websocket:', e);
          }
        };

        ws.onclose = (evt) => {
          console.log('🔌 WebSocket closed:', evt.code, evt.reason);
          setIsTranscribing(false);
          setIsFinalizingTranscription(false);
          wsRef.current = null;
          setWsConnection(null);
          
          // Clear ping/flush intervals and finalization timeout
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (flushIntervalRef.current) {
            clearInterval(flushIntervalRef.current);
            flushIntervalRef.current = null;
          }
          if (finalizationTimeoutRef.current) {
            clearTimeout(finalizationTimeoutRef.current);
            finalizationTimeoutRef.current = null;
          }
          
          // Switch to HTTP fallback if WebSocket fails early or repeatedly
          if (realtimeTranscription && isRecording && (!fallbackActive)) {
            if (evt.code === 1006 || wsRetriesRef.current >= 1) {
              console.warn('🔄 WebSocket unstable, switching to HTTP fallback');
              setFallbackActive(true);
              toast.info('Basculement vers transcription semi-temps réel');
              return;
            }
            
            // One retry attempt before fallback
            if (wsRetriesRef.current < 1) {
              wsRetriesRef.current += 1;
              console.warn(`🔄 WS closed abnormally (${evt.code}), retrying once before fallback`);
              setTimeout(() => {
                if (realtimeTranscription && isRecording && !fallbackActive) {
                  connect();
                }
              }, 2000);
            }
          }
        };

        ws.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          toast.error('Erreur de connexion transcription temps réel');
        };

        setWsConnection(ws);
      } catch (error) {
        console.error('❌ Failed to open realtime transcription WS:', error);
        toast.error('Impossible de démarrer la transcription temps réel');
        throw error; // Re-throw to be caught by caller
      }
    };

    connect();
  };

  const detectMimeType = (audioData: Uint8Array): string => {
    // WebM signature: 0x1A, 0x45, 0xDF, 0xA3
    if (audioData.length >= 4 && 
        audioData[0] === 0x1A && audioData[1] === 0x45 && 
        audioData[2] === 0xDF && audioData[3] === 0xA3) {
      return 'audio/webm';
    }
    
    // MP4 signature: ftyp at offset 4
    if (audioData.length >= 8) {
      const ftypCheck = String.fromCharCode.apply(null, Array.from(audioData.slice(4, 8)));
      if (ftypCheck === 'ftyp') {
        return 'audio/mp4';
      }
    }
    
    // Default to webm for MediaRecorder or use recorded type
    return recordingMimeTypeRef.current;
  };

  // Flush any buffered messages when WS is open
  const flushPending = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && pendingChunksRef.current.length) {
      console.log('📤 Flushing buffered chunks:', pendingChunksRef.current.length);
      for (const msg of pendingChunksRef.current) {
        ws.send(JSON.stringify(msg));
      }
      pendingChunksRef.current = [];
    }
  };

  // Send immediately if possible, otherwise buffer (with cap)
  const sendOrBuffer = (msg: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      if (pendingChunksRef.current.length > 200) {
        pendingChunksRef.current.shift();
      }
      pendingChunksRef.current.push(msg);
    }
  };

  // HTTP fallback for transcription
  const sendAudioChunkViaHTTP = async (audioBlob: Blob, chunkNumber: number, isFinal = false) => {
    try {
      console.log('🌐 Sending audio chunk via HTTP, size:', audioBlob.size, 'chunk:', chunkNumber, 'isFinal:', isFinal);
      
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const mimeType = detectMimeType(uint8Array);
      
      let binaryString = '';
      const chunkSize = 32768;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binaryString);
      
      const { data, error } = await supabase.functions.invoke('realtime-transcription-http', {
        body: { audioData: base64Audio, mimeType, chunkNumber, isFinal }
      });
      
      if (error) throw error;
      
      if (data?.success && data.text?.trim()) {
        const text = data.text.trim();
        console.log('📝 HTTP transcription result:', text.substring(0, 50), 'isFinal:', data.isFinal);
        
        setTranscriptionText(prev => {
          if (data.isFinal) {
            console.log('🏁 Final HTTP transcription received, replacing text');
            return text;
          } else {
            const newText = prev + (prev ? ' ' : '') + text;
            console.log('📄 Updated HTTP transcription text length:', newText.length);
            return newText;
          }
        });
      }
      
    } catch (error) {
      console.error('❌ HTTP transcription error:', error);
      if (!isFinal) {
        // Don't show error toast for incremental failures
        console.warn('⚠️ Non-fatal HTTP transcription error for chunk:', chunkNumber);
      }
    }
  };

  const sendAudioChunkForTranscription = async (audioBlob: Blob, chunkNumber: number) => {
    try {
      console.log('🎵 Processing audio chunk for transcription, size:', audioBlob.size, 'chunk:', chunkNumber);
      
      if (fallbackActive) {
        // Use HTTP fallback
        await sendAudioChunkViaHTTP(audioBlob, chunkNumber, false);
        return;
      }
      
      // Convert Blob to Uint8Array for MIME type detection
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Detect MIME type from actual audio data
      const mimeType = detectMimeType(uint8Array);
      lastMimeTypeRef.current = mimeType;
      console.log('🔍 Detected MIME type:', mimeType, 'for chunk:', chunkNumber);
      
      // Convert to base64 in chunks for better memory handling
      let binaryString = '';
      const chunkSize = 32768;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binaryString);
      
      const message = {
        type: 'audio_chunk_individual',
        audioData: base64Audio,
        chunkNumber,
        mimeType
      };

      const wsState = wsRef.current?.readyState;
      if (wsState === WebSocket.OPEN) {
        console.log('📤 Sending individual audio chunk:', chunkNumber, 'type:', mimeType);
      } else {
        console.log('📦 Buffering chunk (WebSocket not ready):', chunkNumber, 'state:', wsState);
      }
      sendOrBuffer(message);
      
      console.log('✅ Audio chunk processed successfully');
    } catch (error) {
      console.error('❌ Error processing audio chunk:', error);
    }
  };

  // Smooth timer animation
  const updateTimer = () => {
    if (isRecording && startTimeRef.current > 0) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setRecordingTime(elapsed);
      timerAnimationRef.current = requestAnimationFrame(updateTimer);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording with transcription:', withTranscription, 'realtime:', realtimeTranscription);
      
      // Reset states at the start of recording
      setChunkCounter(0);
      pendingChunksRef.current = [];
      setFallbackActive(false);
      startTimeRef.current = Date.now();
      setRecordingTime(0);
      
      // Reset transcription text for real-time mode
      if (withTranscription && realtimeTranscription) {
        console.log('📝 Resetting transcription text for new recording');
        setTranscriptionText('');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000 // OpenAI préfère 24kHz pour la transcription
        }
      });

      // Setup real-time transcription WebSocket (don't let it block timer)
      if (withTranscription && realtimeTranscription) {
        console.log('🔗 Setting up real-time transcription');
        try {
          setupRealtimeTranscription();
        } catch (error) {
          console.error('❌ Real-time transcription setup failed, but continuing with recording:', error);
        }
      }

      // Setup MediaRecorder for final file with longer intervals for better quality
      const mimeType = 'audio/webm;codecs=opus';
      recordingMimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      console.log('🎵 MediaRecorder created with MIME type:', mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup AudioContext for visualization
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255 * 100);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      // Start smooth timer animation
      timerAnimationRef.current = requestAnimationFrame(updateTimer);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📦 MediaRecorder chunk received, size:', event.data.size, 'type:', event.data.type);
          audioChunksRef.current.push(event.data);
          
          // Send chunk for real-time transcription (timer is now handled by requestAnimationFrame)
          if (withTranscription && realtimeTranscription) {
            setChunkCounter(prev => {
              const next = prev + 1;
              console.log('🚀 Sending chunk for transcription:', next);
              void sendAudioChunkForTranscription(event.data, next);
              return next;
            });
          }
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, finalizing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Finalize real-time transcription with proper timeout handling
        if (fallbackActive) {
          // Use HTTP fallback for final transcription
          console.log('🏁 Finalizing transcription via HTTP fallback');
          setIsFinalizingTranscription(true);
          
          setTimeout(async () => {
            try {
              await sendAudioChunkViaHTTP(audioBlob, 999, true); // Final chunk
              setIsFinalizingTranscription(false);
            } catch (error) {
              console.error('❌ Final HTTP transcription failed:', error);
              setIsFinalizingTranscription(false);
            }
          }, 500);
        } else {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('🏁 Finalizing real-time transcription via WebSocket');
            setIsFinalizingTranscription(true);
            
            // Send finalize signal
            ws.send(JSON.stringify({
              type: 'finalize',
              lastMimeType: lastMimeTypeRef.current
            }));
            
            // Set timeout to close WS after giving time for final transcription (12 seconds)
            finalizationTimeoutRef.current = setTimeout(() => {
              console.log('⏰ Finalization timeout reached, cleaning up WebSocket');
              setIsFinalizingTranscription(false);
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              setWsConnection(null);
            }, 12000);
          } else {
            console.log('⚠️ WebSocket not available for finalization');
          }
        }
        
        const timestamp = new Date().toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const audioData: RecordedAudio = {
          id: `recorded-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          name: `Enregistrement ${timestamp}`
        };

        setRecordedAudio(audioData);
        setCurrentStep('finalize');
      };

      setIsRecording(true);
      setAudioLevel(0);
      setCurrentStep('recording');

      // Start the MediaRecorder with 2.5 second intervals for more stable chunks
      mediaRecorder.start(2500);
      updateAudioLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping MediaRecorder...');
      setIsRecording(false);
      
      // Stop timer animation
      if (timerAnimationRef.current) {
        cancelAnimationFrame(timerAnimationRef.current);
        timerAnimationRef.current = 0;
      }
      
      mediaRecorderRef.current.stop();
      
      // Clean up audio context and analyzers
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Handle file import
  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate the file
      const validationResult = await validateAudioFile(file);
      if (!validationResult.valid) {
        toast.error(validationResult.errors?.[0] || 'Fichier audio invalide');
        return;
      }

      // Get duration
      const duration = await getAudioDuration(file);
      
      const audioUrl = URL.createObjectURL(file);
      const audioData: RecordedAudio = {
        id: `imported-${Date.now()}`,
        blob: file,
        url: audioUrl,
        duration,
        name: file.name.replace(/\.[^/.]+$/, '')
      };

      setRecordedAudio(audioData);
      setTitle(audioData.name);
      setCurrentStep('finalize');

    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Erreur lors de l\'importation du fichier');
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (!recordedAudio) return;

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(recordedAudio.url);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        audioElementRef.current = null;
      };
      
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      
      audio.play();
      setIsPlaying(true);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!recordedAudio) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Convert Blob to File for upload
      const audioFile = new File([recordedAudio.blob], title || recordedAudio.name, {
        type: recordedAudio.blob.type
      });

      const audioToUpload: AudioToUpload = {
        file: audioFile,
        title: title || recordedAudio.name,
        description,
        tags: [],
        duration: recordedAudio.duration,
        source: actionType === 'record' ? 'recording' : 'import'
      };

      const progressCallback = (progress: AudioUploadProgress) => {
        if (typeof progress === 'number') {
          setUploadProgress(progress);
        }
      };

      const audioId = await saveAudio(marcheId, audioToUpload, progressCallback);

      // Handle transcription for uploaded audio
      if (withTranscription) {
        const bestModel = getBestTranscriptionModel();
        if (bestModel) {
          console.log('🎯 Starting post-upload transcription with model:', bestModel.name);
          
          toast.success('Audio sauvegardé et transcription en cours');
        } else {
          toast.success('Audio sauvegardé avec succès !');
        }
      } else {
        toast.success('Audio sauvegardé avec succès !');
      }

      onAudioUploaded?.(audioId);
      
      // Reset everything
      resetState();
      
      if (embedded) {
        onRequestClose?.();
      } else {
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setCurrentStep('choose-action');
    setActionType(null);
    setRecordedAudio(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setAudioLevel(0);
    setWithTranscription(false);
    setRealtimeTranscription(false);
    setTranscriptionText('');
    setIsTranscribing(false);
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setUploadProgress(0);
    setChunkCounter(0);
    setIsFinalizingTranscription(false);
    setFallbackActive(false);
    audioChunksRef.current = [];
    pendingChunksRef.current = [];
    startTimeRef.current = 0;
    
    // Stop timer animation
    if (timerAnimationRef.current) {
      cancelAnimationFrame(timerAnimationRef.current);
      timerAnimationRef.current = 0;
    }
    
    // Close WebSocket if still open
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnection(null);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (finalizationTimeoutRef.current) {
      clearTimeout(finalizationTimeoutRef.current);
      finalizationTimeoutRef.current = null;
    }
    
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
    }
  };

  // Format time in mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === 'recording') {
      stopRecording();
      setCurrentStep('configure');
    } else if (currentStep === 'finalize') {
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio.url);
        setRecordedAudio(null);
      }
      setCurrentStep('configure');
    } else if (currentStep === 'configure') {
      setCurrentStep('choose-action');
      setActionType(null);
    }
  };

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 'choose-action':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nouvelle capture audio</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez comment ajouter un fichier audio
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setActionType('record');
                  setCurrentStep('configure');
                }}
                className="h-auto p-6 flex flex-col items-center gap-3"
              >
                <Mic className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-semibold">Enregistrer</div>
                  <div className="text-sm text-muted-foreground">
                    Nouveau enregistrement audio
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setActionType('import');
                  setCurrentStep('configure');
                }}
                className="h-auto p-6 flex flex-col items-center gap-3"
              >
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-semibold">Importer</div>
                  <div className="text-sm text-muted-foreground">
                    Fichier audio existant
                  </div>
                </div>
              </Button>
            </div>
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <h3 className="text-lg font-semibold">
                {actionType === 'record' ? 'Enregistrement' : 'Import'}
              </h3>
              <div></div>
            </div>

            {/* Transcription Options */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Transcription automatique</div>
                  <div className="text-sm text-muted-foreground">
                    Convertir l'audio en texte
                  </div>
                </div>
                <Switch
                  checked={withTranscription}
                  onCheckedChange={setWithTranscription}
                />
              </div>

              {withTranscription && actionType === 'record' && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                  <div>
                    <div className="font-medium">Transcription temps réel</div>
                    <div className="text-sm text-muted-foreground">
                      Voir le texte pendant l'enregistrement
                    </div>
                  </div>
                  <Switch
                    checked={realtimeTranscription}
                    onCheckedChange={setRealtimeTranscription}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {actionType === 'record' ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="w-full h-12"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Démarrer l'enregistrement
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleFileImport}
                    size="lg"
                    className="w-full h-12"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Sélectionner un fichier
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
        );

      case 'recording':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                  <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-3xl font-mono font-bold mb-2">
                {formatTime(recordingTime)}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Waves className="h-4 w-4 text-muted-foreground" />
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                  />
                </div>
              </div>

              {/* Real-time transcription display */}
              {withTranscription && realtimeTranscription && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Transcription temps réel</span>
                    {isFinalizingTranscription && (
                      <span className="text-xs text-muted-foreground animate-pulse">
                        (Consolidation du texte...)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-left min-h-[60px] max-h-32 overflow-y-auto">
                    {transcriptionText || (
                      <span className="text-muted-foreground italic">
                        {fallbackActive ? 'Mode semi-temps réel activé...' : 'En attente de transcription...'}
                      </span>
                    )}
                  </div>
                  {wsConnection && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      {fallbackActive ? 'HTTP semi-temps réel' : 'WebSocket connecté'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="w-full h-12"
            >
              <Square className="h-5 w-5 mr-2 fill-current" />
              Arrêter l'enregistrement
            </Button>
          </div>
        );

      case 'finalize':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <h3 className="text-lg font-semibold">Finalisation</h3>
              <div></div>
            </div>

            {recordedAudio && (
              <div className="space-y-4">
                {/* Audio player */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayback}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{recordedAudio.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(recordedAudio.duration)}
                    </div>
                  </div>
                  
                  <FileAudio className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={recordedAudio.name}
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description (optionnelle)</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description de l'enregistrement..."
                      disabled={isUploading}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Transcription preview */}
                {withTranscription && transcriptionText && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Transcription</span>
                      {isFinalizingTranscription && (
                        <span className="text-xs text-muted-foreground animate-pulse">
                          (Finalisation en cours...)
                        </span>
                      )}
                    </div>
                    <div className="text-sm max-h-32 overflow-y-auto">
                      {transcriptionText}
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <div className="space-y-3">
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sauvegarde en cours...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (recordedAudio) {
                          URL.revokeObjectURL(recordedAudio.url);
                          setRecordedAudio(null);
                        }
                        resetState();
                      }}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Annuler
                    </Button>

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || !title.trim()}
                      className="flex-1 flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (embedded) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        {renderContent()}
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Audio
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Capture Audio</SheetTitle>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default SimplifiedAudioCaptureFloat;