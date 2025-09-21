import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Mic, Upload, Square, Play, Pause, Trash2, FileAudio, FileText, ArrowLeft } from 'lucide-react';
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  const recordingMimeTypeRef = useRef<string>('audio/webm');
  const isRecordingRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Auto-select best transcription model
  const getBestTranscriptionModel = () => {
    if (!transcriptionModels.length) return null;
    // Sélectionne automatiquement le premier modèle actif
    return transcriptionModels.find(m => m.is_active) || transcriptionModels[0];
  };

  // Cleanup
  useEffect(() => {
    return () => {
      // Stop audio level monitoring
      isRecordingRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
    };
  }, [recordedAudio]);

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording with transcription:', withTranscription);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000 // OpenAI préfère 24kHz pour la transcription
        }
      });

      // Setup MediaRecorder for final file
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
      
      // Improved analyzer configuration for better audio level detection
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.8;
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!analyserRef.current || !isRecordingRef.current) return;
        
        // Use time domain data for real amplitude measurement
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for accurate volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Convert to percentage with logarithmic scaling and threshold
        const threshold = 0.008; // Reduced threshold for better sensitivity
        const normalizedLevel = Math.max(0, (rms - threshold) / (1 - threshold));
        const levelPercentage = Math.min(100, normalizedLevel * 100 * 3); // Increased amplification
        
        setAudioLevel(levelPercentage);
        
        // Continue the loop
        rafIdRef.current = requestAnimationFrame(tick);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📦 MediaRecorder chunk received, size:', event.data.size, 'type:', event.data.type);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, finalizing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create a File from the Blob for duration calculation
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const audioDuration = await getAudioDuration(audioFile) || 0;
        
        const recordedAudioData: RecordedAudio = {
          id: Date.now().toString(),
          blob: audioBlob,
          url: audioUrl,
          duration: audioDuration,
          name: `Enregistrement ${new Date().toLocaleTimeString()}`
        };

        setRecordedAudio(recordedAudioData);
        setCurrentStep('finalize');
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      setCurrentStep('recording');
      
      // Start the audio level monitoring loop BEFORE starting the recorder
      isRecordingRef.current = true;
      
      // Resume audio context if suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Start the audio level monitoring loop
      rafIdRef.current = requestAnimationFrame(tick);
      
      mediaRecorder.start(500); // Collect data every 500ms

      // Update timer every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Impossible de démarrer l\'enregistrement');
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('Stopping recording...');
    
    // Stop the audio level monitoring loop first
    isRecordingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setAudioLevel(0);
  };

  // Handle file import
  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateAudioFile(file);
      if (!validation.valid) {
        toast.error(validation.errors[0] || 'Fichier audio invalide');
        return;
      }

      const audioUrl = URL.createObjectURL(file);
      const audioDuration = await getAudioDuration(file);
      
      const importedAudio: RecordedAudio = {
        id: Date.now().toString(),
        blob: file,
        url: audioUrl,
        duration: audioDuration,
        name: file.name
      };

      setRecordedAudio(importedAudio);
      setCurrentStep('finalize');
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Erreur lors de l\'import du fichier');
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (!recordedAudio) return;

    if (isPlaying) {
      audioElementRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(recordedAudio.url);
        audioElementRef.current.onended = () => setIsPlaying(false);
      }
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!recordedAudio) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('🚀 [SimplifiedAudioCaptureFloat] Début upload avec marcheId:', marcheId);
      console.log('🚀 [SimplifiedAudioCaptureFloat] recordedAudio:', recordedAudio);
      console.log('🚀 [SimplifiedAudioCaptureFloat] withTranscription:', withTranscription);

      // Create a File from the Blob for the AudioToUpload interface
      // Ensure the filename has the correct extension for validation
      const fileName = recordedAudio.name.endsWith('.webm') ? recordedAudio.name : `${recordedAudio.name}.webm`;
      const audioFile = new File([recordedAudio.blob], fileName, { type: 'audio/webm' });
      
      const audioToUpload: AudioToUpload = {
        id: Date.now().toString(),
        file: audioFile,
        url: recordedAudio.url,
        name: recordedAudio.name,
        size: recordedAudio.blob.size,
        duration: recordedAudio.duration,
        uploaded: false,
        titre: title || recordedAudio.name,
        description: description || ''
      };

      console.log('🚀 [SimplifiedAudioCaptureFloat] audioToUpload:', audioToUpload);

      const onProgress = (progress: AudioUploadProgress) => {
        console.log('📊 [SimplifiedAudioCaptureFloat] Progress reçu:', progress);
        setUploadProgress(progress.progress);
      };

      console.log('🚀 [SimplifiedAudioCaptureFloat] Appel saveAudio...');
      const audioId = await saveAudio(marcheId, audioToUpload, onProgress);
      console.log('✅ [SimplifiedAudioCaptureFloat] saveAudio terminé, audioId:', audioId);

      // Handle transcription if enabled
      if (withTranscription && audioId) {
        setIsTranscribing(true);
        const model = getBestTranscriptionModel();
        
        if (model) {
          try {
            await transcribeAudio(audioId, recordedAudio.blob, model.id);
            toast.success('Audio enregistré et transcription lancée');
          } catch (transcriptionError) {
            console.error('Transcription failed:', transcriptionError);
            toast.success('Audio enregistré (transcription échouée)');
          }
        } else {
          toast.success('Audio enregistré (modèle de transcription indisponible)');
        }
        setIsTranscribing(false);
      } else {
        toast.success('Audio enregistré avec succès');
      }

      if (onAudioUploaded && audioId) {
        onAudioUploaded(audioId);
      }

      resetState();
    } catch (error) {
      console.error('❌ [SimplifiedAudioCaptureFloat] Upload error:', error);
      console.error('❌ [SimplifiedAudioCaptureFloat] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        marcheId: marcheId,
        withTranscription: withTranscription
      });
      toast.error('Erreur lors de l\'upload');
      setIsUploading(false);
    }
  };

  // Reset state
  const resetState = () => {
    setCurrentStep('choose-action');
    setActionType(null);
    setRecordedAudio(null);
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setUploadProgress(0);
    setWithTranscription(false);
    setIsTranscribing(false);
    setRecordingTime(0);
    setAudioLevel(0);
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    
    if (!embedded) {
      setIsOpen(false);
    }
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === 'finalize') {
      setCurrentStep('configure');
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio.url);
        setRecordedAudio(null);
      }
    } else if (currentStep === 'configure') {
      setCurrentStep('choose-action');
      setActionType(null);
    }
  };

  // Render content based on current step
  const renderContent = () => {
    // Step 1: Choose action type
    if (currentStep === 'choose-action') {
      return (
        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Capturer du contenu audio</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez comment ajouter votre audio
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => {
                setActionType('record');
                setCurrentStep('configure');
              }}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Mic className="h-8 w-8" />
              <span>Enregistrer</span>
            </Button>

            <Button
              onClick={() => {
                setActionType('import');
                setCurrentStep('configure');
              }}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Upload className="h-8 w-8" />
              <span>Importer un fichier</span>
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Configure options
    if (currentStep === 'configure') {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {actionType === 'record' ? 'Enregistrer' : 'Importer'}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Transcription toggle */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${withTranscription ? 'bg-primary/20' : 'bg-muted/20'}`}>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
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
            <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-75 ${
                  audioLevel > 70 ? 'bg-red-500' : 
                  audioLevel > 40 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.max(2, audioLevel)}%`,
                  boxShadow: audioLevel > 50 ? '0 0 6px rgba(34, 197, 94, 0.5)' : undefined
                }}
              />
              {/* Peak indicator */}
              {audioLevel > 80 && (
                <div className="absolute top-0 right-0 h-3 w-1 bg-red-600 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {audioLevel.toFixed(0)}%
            </p>
          </div>

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

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Titre</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Nom de l'enregistrement" 
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{isTranscribing ? 'Transcription en cours...' : 'Upload en cours...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={resetState} variant="outline" className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Upload...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle sheet state
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onRequestClose) {
      onRequestClose();
    }
  };

  // Hidden file input for import
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="audio/*"
      onChange={handleFileSelect}
      style={{ display: 'none' }}
    />
  );

  if (embedded) {
    return (
      <div className="w-full h-full">
        {fileInput}
        {renderContent()}
      </div>
    );
  }

  return (
    <>
      {fileInput}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 fixed bottom-6 right-6 z-50 shadow-lg"
          >
            <Mic className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Enregistrement Audio</SheetTitle>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SimplifiedAudioCaptureFloat;