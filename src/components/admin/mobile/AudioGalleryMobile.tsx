import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Edit3, Trash2, Upload, Play, Pause, Volume2, Loader2, RotateCcw } from 'lucide-react';
import { saveAudio, fetchExistingAudio, deleteAudio, updateAudioMetadata, ExistingAudio, AudioToUpload } from '../../../utils/supabaseAudioOperations';
import { toast } from 'sonner';

type AudioStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

interface PendingAudioWithStatus extends AudioToUpload {
  status: AudioStatus;
  uploadProgress?: number;
  error?: string;
}

interface AudioGalleryMobileProps {
  marcheId: string;
  pendingAudios: AudioToUpload[];
  onAudioUploaded: (audioId: string) => void;
  onAudioRemoved: (audioId: string) => void;
}

const AudioGalleryMobile: React.FC<AudioGalleryMobileProps> = ({
  marcheId,
  pendingAudios,
  onAudioUploaded,
  onAudioRemoved
}) => {
  const [existingAudios, setExistingAudios] = useState<ExistingAudio[]>([]);
  const [pendingAudiosWithStatus, setPendingAudiosWithStatus] = useState<PendingAudioWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<ExistingAudio | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    loadExistingAudios();
  }, [marcheId]);

  useEffect(() => {
    setPendingAudiosWithStatus(
      pendingAudios.map(audio => ({
        ...audio,
        status: 'pending' as AudioStatus
      }))
    );
  }, [pendingAudios]);

  const loadExistingAudios = async () => {
    if (!marcheId) return;
    
    try {
      setIsLoading(true);
      const audios = await fetchExistingAudio(marcheId);
      setExistingAudios(audios);
    } catch (error) {
      console.error('Erreur chargement audio:', error);
      toast.error('Erreur lors du chargement des audios');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAudioStatus = (audioIndex: number, status: AudioStatus, progress?: number, error?: string) => {
    setPendingAudiosWithStatus(prev => 
      prev.map((audio, index) => 
        index === audioIndex 
          ? { ...audio, status, uploadProgress: progress, error }
          : audio
      )
    );
  };

  const handleUploadAudio = async (audio: PendingAudioWithStatus, audioIndex: number) => {
    if (!marcheId) return;

    updateAudioStatus(audioIndex, 'uploading', 0);

    try {
      const audioData = {
        ...audio,
        id: crypto.randomUUID(),
        uploaded: false,
        titre: `Mémo vocal ${new Date().toLocaleString('fr-FR')}`,
        description: 'Enregistrement de marché'
      };

      // Simulate upload progress
      for (let progress = 10; progress <= 90; progress += 20) {
        updateAudioStatus(audioIndex, 'uploading', progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const audioId = await saveAudio(marcheId, audioData);
      updateAudioStatus(audioIndex, 'uploaded', 100);
      
      onAudioUploaded(audioId);
      await loadExistingAudios();
      toast.success('🎵 Audio uploadé avec succès !');
      
      // Remove from pending after successful upload
      setTimeout(() => {
        setPendingAudiosWithStatus(prev => prev.filter((_, index) => index !== audioIndex));
      }, 1000);
      
    } catch (error) {
      console.error('Erreur upload audio:', error);
      updateAudioStatus(audioIndex, 'error', 0, error instanceof Error ? error.message : 'Erreur inconnue');
      toast.error('Erreur lors de l\'upload');
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    const pendingAudiosToUpload = pendingAudiosWithStatus.filter(audio => audio.status === 'pending' || audio.status === 'error');
    
    for (let i = 0; i < pendingAudiosToUpload.length; i++) {
      const audioIndex = pendingAudiosWithStatus.findIndex(a => a === pendingAudiosToUpload[i]);
      if (audioIndex !== -1) {
        await handleUploadAudio(pendingAudiosToUpload[i], audioIndex);
      }
    }
    setIsUploading(false);
  };

  const retryUpload = async (audioIndex: number) => {
    const audio = pendingAudiosWithStatus[audioIndex];
    if (audio && audio.status === 'error') {
      await handleUploadAudio(audio, audioIndex);
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    try {
      await deleteAudio(audioId);
      onAudioRemoved(audioId);
      await loadExistingAudios();
      toast.success('🗑️ Audio supprimé');
    } catch (error) {
      console.error('Erreur suppression audio:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditAudio = async () => {
    if (!selectedAudio) return;

    try {
      await updateAudioMetadata(selectedAudio.id, {
        titre: editTitle,
        description: editDescription
      });
      
      await loadExistingAudios();
      setSelectedAudio(null);
      toast.success('✏️ Audio modifié');
    } catch (error) {
      console.error('Erreur modification audio:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const openEditModal = (audio: ExistingAudio) => {
    setSelectedAudio(audio);
    setEditTitle(audio.titre || '');
    setEditDescription(audio.description || '');
  };

  const togglePlayAudio = (audioId: string) => {
    if (playingAudioId === audioId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(audioId);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  const getStatusBadge = (status: AudioStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs">🔄 En attente</Badge>;
      case 'uploading':
        return <Badge className="text-xs animate-pulse bg-primary">⬆️ Upload...</Badge>;
      case 'uploaded':
        return <Badge className="text-xs bg-green-500 text-white">✅ Uploadé</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">❌ Erreur</Badge>;
    }
  };

  const getStatusCounts = () => {
    const total = pendingAudiosWithStatus.length + existingAudios.length;
    const pending = pendingAudiosWithStatus.filter(a => a.status === 'pending' || a.status === 'error').length;
    const uploaded = pendingAudiosWithStatus.filter(a => a.status === 'uploaded').length + existingAudios.length;
    const uploading = pendingAudiosWithStatus.filter(a => a.status === 'uploading').length;
    
    return { total, pending, uploaded, uploading };
  };

  const allAudios = [...existingAudios];
  const statusCounts = getStatusCounts();

  if (allAudios.length === 0 && pendingAudiosWithStatus.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <div className="text-muted-foreground mb-2">🎵</div>
        <p className="text-sm text-muted-foreground">
          Aucun audio pour cette marche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            🎵 Audio
          </h3>
          {statusCounts.pending > 0 && (
            <Badge variant="outline" className="animate-pulse">
              {statusCounts.pending} en attente
            </Badge>
          )}
        </div>
        
        {statusCounts.pending > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>📤 {statusCounts.uploaded} uploadés • {statusCounts.pending} en attente</span>
              {statusCounts.uploading > 0 && (
                <span className="text-primary">⬆️ {statusCounts.uploading} en cours...</span>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={(statusCounts.uploaded / statusCounts.total) * 100} 
                className="h-2" 
              />
              <Button
                onClick={handleUploadAll}
                disabled={isUploading || statusCounts.pending === 0}
                className="w-full h-10 animate-fade-in"
                variant="default"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    📤 Uploader {statusCounts.pending} audio{statusCounts.pending > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Audios */}
      {pendingAudiosWithStatus.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Audio en attente</h4>
          <div className="space-y-2">
            {pendingAudiosWithStatus.map((audio, index) => (
              <div key={index} className="relative group">
                <div className="rounded-lg bg-muted border-2 border-dashed border-muted-foreground/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audio.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(audio.duration || 0)} • {Math.round(audio.size / 1024)}KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(audio.status)}
                    </div>
                  </div>
                  
                  {audio.status === 'uploading' && audio.uploadProgress !== undefined && (
                    <div className="mt-2">
                      <Progress value={audio.uploadProgress} className="h-1" />
                    </div>
                  )}
                  
                  {audio.status === 'error' && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(index)}
                        className="animate-bounce"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Réessayer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Audios */}
      {allAudios.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Audio uploadés</h4>
          <div className="space-y-2">
            {allAudios.map((audio) => (
              <div key={audio.id} className="relative">
                <div className="rounded-lg bg-card border border-border p-4">
                  <div className="flex items-center gap-3">
                    {/* Play button */}
                    <button
                      onClick={() => togglePlayAudio(audio.id)}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      {playingAudioId === audio.id ? (
                        <Pause className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-primary ml-0.5" />
                      )}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate mb-1">
                        {audio.titre || audio.nom_fichier}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(audio.duree_secondes)}
                        {audio.taille_octets && ` • ${formatFileSize(audio.taille_octets)}`}
                      </p>
                    </div>
                    
                    {/* Actions - always visible */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(audio)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAudio(audio.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Audio element for playback */}
                  {playingAudioId === audio.id && (
                    <div className="mt-3 pt-3 border-t">
                      <audio 
                        controls 
                        autoPlay
                        className="w-full h-8"
                        onEnded={() => setPlayingAudioId(null)}
                      >
                        <source src={audio.url_supabase} type={audio.format_audio || 'audio/mpeg'} />
                        Votre navigateur ne supporte pas l'élément audio.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Audio Modal */}
      <Sheet open={!!selectedAudio} onOpenChange={() => setSelectedAudio(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>✏️ Modifier l'audio</SheetTitle>
            <SheetDescription>
              Modifiez le titre et la description de l'audio
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de l'audio..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description de l'audio..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditAudio} className="flex-1">
                💾 Enregistrer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedAudio(null)}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AudioGalleryMobile;
