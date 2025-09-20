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
  
  // Real-time transcription WebSocket
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  
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
  const lastChunkSentRef = useRef<number>(0);

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
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
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
        console.log('Connecting to realtime transcription WebSocket:', url);
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          wsRetriesRef.current = 0;
          setIsTranscribing(true);
          toast.success('Transcription temps réel activée');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            if (message.type === 'transcription_result') {
              setTranscriptionText(prev => message.isFinal ? message.text : prev + message.text);
            } else if (message.type === 'error') {
              console.error('Realtime transcription error:', message.message);
              toast.error(`Erreur transcription: ${message.message}`);
            }
          } catch (e) {
            console.error('Invalid message from websocket:', e);
          }
        };

        ws.onclose = (evt) => {
          console.log('WebSocket closed:', evt.code, evt.reason);
          setIsTranscribing(false);
          // Auto-retry a few times if user still wants realtime
          if (realtimeTranscription && wsRetriesRef.current < 3) {
            wsRetriesRef.current += 1;
            const delay = 500 * wsRetriesRef.current; // simple backoff
            console.warn(`WS closed, retrying in ${delay}ms (attempt ${wsRetriesRef.current})`);
            setTimeout(connect, delay);
          } else if (evt.code !== 1000) {
            toast.error('Connexion transcription temps réel fermée');
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          toast.error('Erreur de connexion transcription temps réel');
        };

        setWsConnection(ws);
      } catch (error) {
        console.error('Failed to open realtime transcription WS:', error);
        toast.error('Impossible de démarrer la transcription temps réel');
        throw error; // Re-throw to be caught by caller
      }
    };

    connect();
  };

  const sendAudioChunkForTranscription = async (audioData: Float32Array) => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready for chunk sending');
      return;
    }
    
    // Éviter d'envoyer trop fréquemment (max 1 chunk par seconde)
    const now = Date.now();
    if (now - lastChunkSentRef.current < 1000) return;
    lastChunkSentRef.current = now;
    
    try {
      console.log('Sending audio chunk for transcription, size:', audioData.length);
      
      // Convertir Float32Array en PCM16 pour OpenAI
      const int16Array = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convertir en base64
      const uint8Array = new Uint8Array(int16Array.buffer);
      let binaryString = '';
      const chunkSize = 32768;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binaryString);
      
      wsConnection.send(JSON.stringify({
        type: 'audio_chunk',
        audioData: base64Audio
      }));
      
      console.log('Audio chunk sent successfully');
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('Starting recording with transcription:', withTranscription, 'realtime:', realtimeTranscription);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000 // OpenAI préfère 24kHz pour la transcription
        }
      });

      // Setup real-time transcription WebSocket (don't let it block timer)
      if (withTranscription && realtimeTranscription) {
        console.log('Setting up real-time transcription');
        try {
          setupRealtimeTranscription();
        } catch (error) {
          console.error('Real-time transcription setup failed, but continuing with recording:', error);
        }
      }

      // Setup MediaRecorder for final file
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup AudioContext for visualization AND real-time chunks
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Setup ScriptProcessorNode for real-time audio chunks
      if (withTranscription && realtimeTranscription) {
        console.log('Setting up ScriptProcessorNode for real-time chunks');
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processorRef.current.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          // Envoyer pour transcription temps réel
          sendAudioChunkForTranscription(new Float32Array(inputData));
        };
        
        sourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
      }

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255 * 100);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('MediaRecorder chunk received, size:', event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, finalizing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const timestamp = new Date().toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const duration = await getAudioDuration(new File([audioBlob], 'recording.webm'));
        
        setRecordedAudio({
          id: `recording-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: duration || recordingTime,
          name: `Mémo vocal - ${timestamp}`
        });

        setTitle(`Mémo vocal - ${timestamp}`);
        stream.getTracks().forEach(track => track.stop());
        
        // Cleanup audio processing
        if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        
        // Finalize real-time transcription
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          console.log('Finalizing real-time transcription');
          wsConnection.send(JSON.stringify({ type: 'finalize' }));
          setTimeout(() => {
            wsConnection.close();
            setWsConnection(null);
          }, 1000);
        }
        
        setCurrentStep('finalize');
      };

      // Start recording with appropriate chunk size
      if (withTranscription && realtimeTranscription) {
        console.log('Starting MediaRecorder with 1s chunks for real-time');
        mediaRecorder.start(1000); // 1-second chunks for real-time
      } else {
        console.log('Starting MediaRecorder with single chunk');
        mediaRecorder.start();
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      setCurrentStep('recording');
      updateAudioLevel();

      // Start timer immediately (don't let it be blocked by other operations)
      console.log('Starting recording timer');
      recordingIntervalRef.current = setInterval(() => {
        console.log('Timer tick, incrementing recording time');
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Impossible de démarrer l\'enregistrement');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      // Stop ScriptProcessorNode if exists
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // File import
  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      toast.error(`Fichier non valide: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const audioUrl = URL.createObjectURL(file);
      const duration = await getAudioDuration(file);
      
      setRecordedAudio({
        id: `import-${Date.now()}`,
        blob: file,
        url: audioUrl,
        duration: duration || 0,
        name: file.name
      });

      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setCurrentStep('finalize');
      toast.success('Fichier importé avec succès');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import du fichier');
    }
  };

  // Audio playback
  const togglePlayback = () => {
    if (!recordedAudio) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(recordedAudio.url);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Upload to Supabase
  const handleUpload = async () => {
    if (!recordedAudio || !marcheId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = new File([recordedAudio.blob], `${title || recordedAudio.name}.webm`, {
        type: (recordedAudio.blob as any).type || 'audio/webm'
      });

      const actualDuration = await getAudioDuration(file);
      const finalDuration = actualDuration || recordedAudio.duration;

      const audioData: AudioToUpload = {
        id: recordedAudio.id,
        file,
        url: recordedAudio.url,
        name: title || recordedAudio.name,
        size: (recordedAudio.blob as any).size,
        duration: finalDuration,
        uploaded: false,
        titre: title,
        description: description
      };

      const onProgress = (progress: AudioUploadProgress) => {
        setUploadProgress(Math.round(progress.progress));
      };

      const audioId = await saveAudio(marcheId, audioData, onProgress);

      // Handle transcription if enabled (but not real-time)
      if (withTranscription && !realtimeTranscription) {
        const bestModel = getBestTranscriptionModel();
        if (bestModel) {
          await transcribeAudio(audioId, recordedAudio.blob, bestModel.id, 'fr', 'deferred');
          toast.success('Audio sauvegardé et transcription en cours');
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
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    setCurrentStep('choose-action');
    setActionType(null);
    setTitle('');
    setDescription('');
    setWithTranscription(false);
    setRealtimeTranscription(false);
    setTranscriptionText('');
    setIsTranscribing(false);
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goBack = () => {
    if (currentStep === 'configure') {
      setCurrentStep('choose-action');
      setActionType(null);
    } else if (currentStep === 'finalize') {
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio.url);
        setRecordedAudio(null);
      }
      setCurrentStep('choose-action');
      setActionType(null);
      setTitle('');
      setDescription('');
    }
  };

  const renderContent = () => {
    // Step 1: Choose Action
    if (currentStep === 'choose-action') {
      return (
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Créer un mémo vocal</h2>
            <p className="text-muted-foreground">Choisissez comment ajouter votre audio</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => {
                setActionType('record');
                setCurrentStep('configure');
              }}
              variant="outline"
              className="w-full h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
            >
              <Mic className="h-8 w-8 text-green-600" />
              <span className="font-medium">Enregistrer</span>
            </Button>

            <Button
              onClick={() => {
                setActionType('import');
                setCurrentStep('configure');
              }}
              variant="outline"
              className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Upload className="h-8 w-8 text-blue-600" />
              <span className="font-medium">Importer un fichier</span>
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Configure Options
    if (currentStep === 'configure') {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Options</h2>
          </div>

          <div className="space-y-6">
            {/* Transcription toggle */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${withTranscription ? 'bg-success/20' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium">Avec transcription</h3>
                  <p className="text-sm text-muted-foreground">
                    Convertir automatiquement en texte
                  </p>
                </div>
              </div>
              <Switch
                checked={withTranscription}
                onCheckedChange={setWithTranscription}
              />
            </div>

            {/* Real-time transcription toggle (only if transcription is enabled and recording) */}
            {withTranscription && actionType === 'record' && (
              <div className={`flex items-center justify-between p-4 rounded-lg ${realtimeTranscription ? 'bg-success/20' : 'bg-muted/20'}`}>
                <div className="flex items-center gap-3">
                  <Waves className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium">Temps réel</h3>
                    <p className="text-sm text-muted-foreground">
                      Voir le texte pendant l'enregistrement
                    </p>
                  </div>
                </div>
                <Switch
                  checked={realtimeTranscription}
                  onCheckedChange={setRealtimeTranscription}
                />
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={actionType === 'record' ? startRecording : handleFileImport}
                className="w-full"
                size="lg"
              >
                {actionType === 'record' ? (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Démarrer l'enregistrement
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Choisir un fichier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Recording in progress
    if (currentStep === 'recording') {
      return (
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">🔴 Enregistrement</h2>
            <p className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</p>
          </div>

          {/* Audio level visualization */}
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">Niveau audio</p>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>

          {/* Real-time transcription display */}
          {withTranscription && realtimeTranscription && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Transcription en temps réel</span>
                {isTranscribing && (
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">En cours...</span>
                  </div>
                )}
              </div>
              
              <div className="bg-background/50 rounded-md p-3 min-h-[100px] border">
                {transcriptionText ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcriptionText}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {isTranscribing ? "Écoute en cours..." : "Commencez à parler..."}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={stopRecording}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <Square className="h-5 w-5 mr-2" />
            Arrêter l'enregistrement
          </Button>
        </div>
      );
    }

    // Step 4: Finalize
    if (currentStep === 'finalize' && recordedAudio) {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Finaliser</h2>
          </div>

          {/* Audio preview */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <FileAudio className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium">{recordedAudio.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatTime(Math.floor(recordedAudio.duration))} • {(recordedAudio.blob.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={togglePlayback} variant="outline" size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Real-time transcription result */}
          {withTranscription && realtimeTranscription && transcriptionText && (
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Transcription terminée</span>
              </div>
              <div className="bg-background/50 rounded-md p-3 border max-h-32 overflow-y-auto">
                <p className="text-sm text-foreground leading-relaxed">
                  {transcriptionText}
                </p>
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Titre</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Nom de l'enregistrement" 
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optionnelle)</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Ajoutez une description..." 
                rows={3} 
              />
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sauvegarde en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Save button */}
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !title.trim()}
            className="w-full"
            size="lg"
          >
            {isUploading ? 'Sauvegarde en cours...' : 'Sauvegarder le mémo vocal'}
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        style={{ display: 'none' }}
      />
      
      {embedded ? (
        renderContent()
      ) : (
        <div className="fixed z-50 bottom-24 right-6">
          <Sheet open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetState();
          }}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Mic className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
              <SheetHeader className="p-6 pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Mémo vocal
                </SheetTitle>
              </SheetHeader>
              <div className="h-full overflow-auto">
                {renderContent()}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
};

export default SimplifiedAudioCaptureFloat;