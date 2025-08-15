import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  pageId?: string;
  currentAudioUrl?: string;
  onAudioUploaded?: (audioUrl: string) => void;
  onAudioDeleted?: () => void;
}

export const PageAudioUpload: React.FC<Props> = ({
  pageId,
  currentAudioUrl,
  onAudioUploaded,
  onAudioDeleted
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Veuillez sélectionner un fichier audio valide');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 50MB');
      return;
    }

    await uploadAudio(file);
  };

  const uploadAudio = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `page-${pageId || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `pages/${fileName}`;

      const { data, error } = await supabase.storage
        .from('marche-audio')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('marche-audio')
        .getPublicUrl(filePath);

      onAudioUploaded?.(publicUrl);
      toast.success('Audio uploadé avec succès');
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Erreur lors de l\'upload de l\'audio');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentAudioUrl) return;
    
    if (!confirm('Supprimer cet audio ?')) return;

    try {
      // Extract file path from URL
      const urlParts = currentAudioUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `pages/${fileName}`;

      const { error } = await supabase.storage
        .from('marche-audio')
        .remove([filePath]);

      if (error) throw error;

      onAudioDeleted?.();
      toast.success('Audio supprimé');
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !currentAudioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentAudioUrl ? (
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              className="shrink-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1">
              <p className="text-sm font-medium">Audio de narration</p>
              <p className="text-xs text-muted-foreground">Cliquez sur lecture pour écouter</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <audio
            ref={audioRef}
            src={currentAudioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          {uploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-4 w-4 animate-bounce" />
                <span className="text-sm">Upload en cours...</span>
              </div>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              <Volume2 className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucun audio de narration
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter un audio
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};