import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface AudioTranscriptionViewerProps {
  audioId: string;
  transcriptionText: string | null;
  transcriptionStatus: string;
  transcriptionModel: string | null;
  transcriptionConfidence: number | null;
  transcriptionSegments: TranscriptionSegment[] | null;
  onRetranscribe?: (modelId?: string) => void;
}

const AudioTranscriptionViewer: React.FC<AudioTranscriptionViewerProps> = ({
  audioId,
  transcriptionText,
  transcriptionStatus,
  transcriptionModel,
  transcriptionConfidence,
  transcriptionSegments,
  onRetranscribe
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcriptionText || '');

  const getStatusBadge = () => {
    const statusConfig = {
      none: { label: 'Non transcrit', variant: 'secondary' as const },
      pending: { label: 'En attente', variant: 'default' as const },
      processing: { label: 'En cours', variant: 'default' as const },
      completed: { label: 'Terminé', variant: 'default' as const },
      failed: { label: 'Échec', variant: 'destructive' as const },
    };

    const config = statusConfig[transcriptionStatus as keyof typeof statusConfig] || statusConfig.none;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptionText || '');
      toast.success('Transcription copiée dans le presse-papiers');
    } catch (error) {
      toast.error('Impossible de copier la transcription');
    }
  };

  const handleDownload = () => {
    const text = transcriptionText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${audioId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    // Here you would typically save the edited text to the database
    setIsEditing(false);
    toast.success('Modifications sauvegardées');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (transcriptionStatus === 'none') {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Transcription</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aucune transcription disponible pour cet audio.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (transcriptionStatus === 'processing' || transcriptionStatus === 'pending') {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Transcription</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Transcription en cours...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transcriptionStatus === 'failed') {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Transcription</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm mb-3">
            La transcription a échoué.
          </p>
          {onRetranscribe && (
            <Button size="sm" onClick={() => onRetranscribe()}>
              Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Transcription</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {transcriptionModel && (
              <Badge variant="outline" className="text-xs">
                {transcriptionModel}
              </Badge>
            )}
          </div>
        </div>
        {transcriptionConfidence && (
          <p className="text-xs text-muted-foreground">
            Confiance: {Math.round(transcriptionConfidence * 100)}%
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3 w-3 mr-1" />
                Sauvegarder
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/20 p-3 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{transcriptionText}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" />
                Copier
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                Télécharger
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-3 w-3 mr-1" />
                Modifier
              </Button>
              {onRetranscribe && (
                <Button size="sm" variant="outline" onClick={() => onRetranscribe()}>
                  Re-transcrire
                </Button>
              )}
            </div>
          </div>
        )}

        {transcriptionSegments && transcriptionSegments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Segments temporels</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {transcriptionSegments.map((segment, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {formatTime(segment.start)}
                  </Badge>
                  <span className="text-muted-foreground flex-1">
                    {segment.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioTranscriptionViewer;