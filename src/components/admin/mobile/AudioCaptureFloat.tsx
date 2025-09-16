import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Mic, MicOff, Upload, Square, Play, Pause, Trash2, FileAudio, Waves } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Progress } from '../../ui/progress';
import { toast } from 'sonner';
import { saveAudio, validateAudioFile, getAudioDuration, AudioUploadProgress, AudioToUpload } from '../../../utils/supabaseAudioOperations';
import { useTranscriptionModels } from '../../../hooks/useTranscriptionModels';
import { transcribeAudio } from '../../../utils/audioTranscription';

// Offset constant pour éviter les barres système mobiles
const CONTROL_OFFSET = 'clamp(96px, 14vh, 180px)';

interface AudioCaptureFloatProps {
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

const AudioCaptureFloat: React.FC<AudioCaptureFloatProps> = ({ 
  marcheId, 
  onAudioUploaded,
  embedded = false,
  onRequestClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [withTranscription, setWithTranscription] = useState(false);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string>('');
  const [transcriptionMode, setTranscriptionMode] = useState<'immediate' | 'deferred'>('deferred');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const { data: transcriptionModels = [] } = useTranscriptionModels();

  // Sélectionner le premier modèle par défaut
  useEffect(() => {
    if (transcriptionModels.length > 0 && !selectedTranscriptionModel) {
      setSelectedTranscriptionModel(transcriptionModels[0].id);
    }
  }, [transcriptionModels, selectedTranscriptionModel]);

  // Fonction de transcription
  const handleTranscription = async (audioId: string, audioBlob: Blob) => {
    if (!withTranscription) return;
    
    try {
      addDebug('🎤 Démarrage transcription', { audioId, modelId: selectedTranscriptionModel });
      
      const result = await transcribeAudio(
        audioId,
        audioBlob,
        selectedTranscriptionModel || undefined,
        'fr',
        transcriptionMode
      );

      if (result.success) {
        addDebug('✅ Transcription réussie', { audioId });
        toast.success('Transcription terminée !');
      } else {
        addDebug('❌ Échec transcription', { error: result.error });
        toast.error(`Erreur de transcription: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur transcription:', error);
      addDebug('❌ Erreur transcription', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      toast.error('Erreur lors de la transcription');
    }
  };

  const addDebug = (msg: string, data?: any) => {
    try {
      const line = data ? `${msg} ${JSON.stringify(data)}` : msg;
      setDebugLogs((prev) => {
        const next = [...prev, line];
        return next.slice(-100);
      });
      if (debugEnabled) {
        console.debug('[AudioCaptureFloat][debug]', line);
      }
    } catch {}
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio.url);
      }
    };
  }, [recordedAudio]);

  // Initialiser l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Configuration MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Configuration de l'analyseur audio pour la visualisation
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Animation de visualisation
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
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Générer un nom avec timestamp
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
      };

      // Démarrer l'enregistrement
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      updateAudioLevel();

      // Timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Enregistrement démarré');
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast.error('Impossible de démarrer l\'enregistrement');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      toast.success('Enregistrement terminé');
    }
  };

  // Lecture/pause de l'audio enregistré
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

  // Supprimer l'enregistrement
  const deleteRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
      setTitle('');
      setDescription('');
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  // Import de fichier
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
      toast.success('Fichier importé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Erreur lors de l\'import du fichier');
    }
  };

  // Upload vers Supabase
  const handleUpload = async () => {
    if (!recordedAudio || !marcheId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setLastError(null);
    addDebug('🎬 Démarrage upload', { marcheId, hasRecorded: !!recordedAudio });

    try {
      const file = new File([recordedAudio.blob], `${title || recordedAudio.name}.webm`, {
        type: (recordedAudio.blob as any).type || 'audio/webm'
      });

      addDebug('📄 Fichier prêt', { name: file.name, type: file.type, size: file.size });

      // Calculer la vraie durée de l'audio avant l'upload
      const actualDuration = await getAudioDuration(file);
      const finalDuration = actualDuration || recordedAudio.duration;

      addDebug('🎵 Durée calculée', { 
        recorded: recordedAudio.duration, 
        calculated: actualDuration, 
        final: finalDuration 
      });

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
        const p = Math.round(progress.progress);
        setUploadProgress(p);
        addDebug('↗️ Progression', { p, status: progress.status });
      };

      const audioId = await saveAudio(marcheId, audioData, onProgress);
      
      addDebug('✅ Upload terminé', { audioId });

      // Déclencher la transcription si activée
      if (withTranscription) {
        await handleTranscription(audioId, recordedAudio.blob);
      }

      toast.success('Audio uploadé avec succès !');
      onAudioUploaded?.(audioId);
      
      // Reset
      if (embedded) {
        onRequestClose?.();
      } else {
        setIsOpen(false);
      }
      deleteRecording();
      setWithTranscription(false);
      
    } catch (error) {
      console.error('Erreur upload:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setLastError(message);
      addDebug('❌ Erreur upload', { message });
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {!recordedAudio ? (
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Mode d'enregistrement</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Mémo vocal</h4>
                      <p className="text-sm text-muted-foreground">Enregistrer depuis le micro</p>
                    </div>
                  </div>
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    disabled={isUploading}
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Arrêter
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>

                {isRecording && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        🔴 En cours... {formatTime(recordingTime)}
                      </span>
                      <MicOff 
                        className="h-4 w-4 text-green-600 cursor-pointer" 
                        onClick={stopRecording}
                      />
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Import fichier</h4>
                    <p className="text-sm text-muted-foreground">Depuis apps biodiversité</p>
                  </div>
                </div>
                <Button
                  onClick={handleFileImport}
                  variant="outline"
                  size="sm"
                  disabled={isRecording || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-purple-600" />
                <div>
                  <h4 className="font-medium">Transcription automatique</h4>
                  <p className="text-sm text-muted-foreground">
                    {withTranscription ? 'Activée' : 'Convertir audio en texte'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="transcription" 
                  checked={withTranscription}
                  onCheckedChange={(checked) => setWithTranscription(checked as boolean)}
                />
              </div>
            </div>

            {withTranscription && transcriptionModels.length > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modèle de transcription</label>
                  <Select value={selectedTranscriptionModel} onValueChange={setSelectedTranscriptionModel}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choisir un modèle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {transcriptionModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode de transcription</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={transcriptionMode === 'deferred' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranscriptionMode('deferred')}
                      className="flex-1"
                    >
                      Après upload
                    </Button>
                    <Button
                      type="button"
                      variant={transcriptionMode === 'immediate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTranscriptionMode('immediate')}
                      className="flex-1"
                    >
                      Temps réel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
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
                <Button onClick={deleteRecording} variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Titre</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom de l'enregistrement" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optionnelle..." rows={3} />
              </div>
            </div>

            <div className="space-y-2">
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {recordedAudio && (
        <div className="border-t p-4 bg-background">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !title.trim()}
            className="w-full"
          >
            {isUploading ? 'Upload en cours...' : 'Sauvegarder l\'audio'}
          </Button>
        </div>
      )}

      {debugEnabled && (
        <div className="border-t p-2 bg-muted/20 max-h-32 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {debugLogs.slice(-10).map((log, i) => (
              <div key={i} className="text-muted-foreground">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
        <div 
          className="fixed z-50"
          style={{ bottom: CONTROL_OFFSET, right: '20px' }}
        >
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Mic className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Audio
                </SheetTitle>
              </SheetHeader>
              {renderContent()}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
};

export default AudioCaptureFloat;