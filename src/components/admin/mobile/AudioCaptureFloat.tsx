import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Mic, MicOff, Upload, Square, Play, Pause, Trash2, FileAudio, Waves } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Progress } from '../../ui/progress';
import { toast } from 'sonner';
import { saveAudio, validateAudioFile, getAudioDuration, AudioUploadProgress, AudioToUpload } from '../../../utils/supabaseAudioOperations';

// Offset constant pour éviter les barres système mobiles
const CONTROL_OFFSET = 'clamp(96px, 14vh, 180px)';

interface AudioCaptureFloatProps {
  marcheId: string;
  onAudioUploaded?: (audioId: string) => void;
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
  onAudioUploaded 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [withTranscription, setWithTranscription] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

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

      toast.success('Audio uploadé avec succès !');
      onAudioUploaded?.(audioId);
      
      // Reset
      setIsOpen(false);
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

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="audio/*"
        style={{ display: 'none' }}
      />
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-green-600 hover:bg-green-700 text-white border-2 border-green-400"
            style={{ 
              bottom: `calc(env(safe-area-inset-bottom, 0px) + ${CONTROL_OFFSET})` 
            }}
          >
            <Mic className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="bottom" 
          className="h-[85vh] max-h-[85vh] p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-green-600" />
                Capture Audio
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto">
              {!recordedAudio ? (
                <div className="p-4 space-y-6">
                  {/* Options principales */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Mode d'enregistrement</h3>
                    
                    {/* Dictaphone */}
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

                      {/* Visualisation pendant l'enregistrement */}
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
                          
                          {/* Barre de niveau audio */}
                          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-100"
                              style={{ width: `${audioLevel}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Import de fichier */}
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

                  {/* Option transcription */}
                  <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-lg">
                    <Checkbox 
                      id="transcription" 
                      checked={withTranscription}
                      onCheckedChange={(checked) => setWithTranscription(checked as boolean)}
                    />
                    <label htmlFor="transcription" className="text-sm font-medium">
                      Transcrire automatiquement 
                      <span className="text-muted-foreground">(bientôt disponible)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Aperçu de l'audio */}
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
                      <Button
                        onClick={togglePlayback}
                        variant="outline"
                        size="sm"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={deleteRecording}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="space-y-3">
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

                  {/* Upload progress + Debug */}
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={debugEnabled}
                          onChange={(e) => setDebugEnabled(e.target.checked)}
                        />
                        Mode debug
                      </label>
                      {lastError && (
                        <span className="text-destructive">Erreur: {lastError}</span>
                      )}
                    </div>

                    {debugEnabled && (
                      <div className="rounded-md bg-muted/40 p-2 max-h-40 overflow-auto font-mono text-xs space-y-1">
                        <div>
                          Fichier: {recordedAudio?.name} • {(recordedAudio?.blob as any)?.type || 'inconnu'} • {Math.round(((recordedAudio?.blob as any)?.size || 0) / 1024)}KB
                        </div>
                        <div>Marche: {marcheId}</div>
                        {debugLogs.map((l, i) => (
                          <div key={i} className="truncate">• {l}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div 
              className="border-t bg-background/95 backdrop-blur-sm p-4"
              style={{ 
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)` 
              }}
            >
              {recordedAudio ? (
                <div className="flex gap-3">
                  <Button
                    onClick={deleteRecording}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Recommencer
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="flex-1"
                    disabled={isUploading || !title.trim()}
                  >
                    {isUploading ? 'Upload...' : 'Sauvegarder'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="w-full"
                  disabled={isRecording}
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AudioCaptureFloat;