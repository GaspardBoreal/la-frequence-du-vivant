import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { 
  FileText, 
  Copy, 
  Download, 
  Edit3, 
  Save, 
  X, 
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { updateAudioMetadata } from '../../utils/supabaseAudioOperations';
import { transcribeAudio } from '../../utils/audioTranscription';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio: {
    id: string;
    titre?: string;
    nom_fichier: string;
    transcription_status?: string;
    transcription_text?: string;
    transcription_confidence?: number;
    transcription_model?: string;
    transcription_segments?: TranscriptionSegment[];
    url_supabase?: string;
  };
  onTranscriptionUpdate?: () => void;
}

const TranscriptionModal: React.FC<TranscriptionModalProps> = ({
  isOpen,
  onClose,
  audio,
  onTranscriptionUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(audio.transcription_text || '');
  const [isRetranscribing, setIsRetranscribing] = useState(false);

  const getStatusIcon = () => {
    switch (audio.transcription_status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (audio.transcription_status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terminée
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            En cours...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Échec
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Aucune
          </Badge>
        );
    }
  };

  const handleCopy = async () => {
    if (!audio.transcription_text) return;
    
    try {
      await navigator.clipboard.writeText(audio.transcription_text);
      toast.success('Transcription copiée !');
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleDownload = () => {
    if (!audio.transcription_text) return;
    
    const blob = new Blob([audio.transcription_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${audio.titre || audio.nom_fichier}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Transcription téléchargée !');
  };

  const handleSave = async () => {
    try {
      await updateAudioMetadata(audio.id, {
        transcription_text: editedText
      });
      
      setIsEditing(false);
      onTranscriptionUpdate?.();
      toast.success('Transcription mise à jour !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleRetranscribe = async () => {
    if (!audio.url_supabase) {
      toast.error('URL audio non disponible');
      return;
    }

    setIsRetranscribing(true);
    
    try {
      // Fetch audio blob from URL
      const response = await fetch(audio.url_supabase);
      if (!response.ok) throw new Error('Erreur lors du téléchargement de l\'audio');
      
      const audioBlob = await response.blob();
      
      // Start transcription
      await transcribeAudio(audio.id, audioBlob, undefined, 'fr', 'deferred');
      
      toast.success('Nouvelle transcription lancée !');
      onTranscriptionUpdate?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la re-transcription:', error);
      toast.error('Erreur lors de la re-transcription');
    } finally {
      setIsRetranscribing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasTranscription = audio.transcription_status === 'completed' && audio.transcription_text;
  const isProcessing = audio.transcription_status === 'processing';
  const isFailed = audio.transcription_status === 'failed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[800px] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left text-lg font-semibold truncate">
                {audio.titre || audio.nom_fichier}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon()}
                {getStatusBadge()}
                {audio.transcription_confidence && (
                  <Badge variant="outline" className="text-xs">
                    Confiance: {Math.round(audio.transcription_confidence * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {isProcessing && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h3 className="font-semibold text-lg mb-2">Transcription en cours...</h3>
                <p className="text-muted-foreground text-sm">
                  L'analyse audio est en cours. Cela peut prendre quelques minutes.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Transcription échouée</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Une erreur s'est produite lors de la transcription.
                </p>
                <Button
                  onClick={handleRetranscribe}
                  disabled={isRetranscribing}
                  className="w-full max-w-xs"
                >
                  {isRetranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Nouvelle tentative...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réessayer
                    </>
                  )}
                </Button>
              </div>
            )}

            {!hasTranscription && !isProcessing && !isFailed && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucune transcription</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Cette piste audio n'a pas encore été transcrite.
                </p>
                <Button
                  onClick={handleRetranscribe}
                  disabled={isRetranscribing}
                  className="w-full max-w-xs"
                >
                  {isRetranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transcription...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Lancer la transcription
                    </>
                  )}
                </Button>
              </div>
            )}

            {hasTranscription && (
              <div className="h-full flex flex-col">
                {/* Transcription Content */}
                <ScrollArea className="flex-1 px-6">
                  <div className="py-4">
                    {isEditing ? (
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="min-h-[200px] text-sm leading-relaxed resize-none"
                        placeholder="Transcription..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {/* Segments if available */}
                        {audio.transcription_segments && audio.transcription_segments.length > 0 ? (
                          <div className="space-y-3">
                            {audio.transcription_segments.map((segment, index) => (
                              <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                                <div className="text-xs text-muted-foreground font-mono flex-shrink-0 mt-0.5">
                                  {formatTime(segment.start)}
                                </div>
                                <div className="text-sm leading-relaxed">
                                  {segment.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Full text if no segments */
                          <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-lg bg-muted/30">
                            {audio.transcription_text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Model info */}
                {audio.transcription_model && (
                  <div className="px-6 py-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Modèle: {audio.transcription_model}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {hasTranscription && (
            <div className="px-6 py-4 border-t border-border">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedText(audio.transcription_text || '');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                  
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  
                  <Button
                    onClick={handleRetranscribe}
                    disabled={isRetranscribing}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isRetranscribing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Re-transcrire
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptionModal;