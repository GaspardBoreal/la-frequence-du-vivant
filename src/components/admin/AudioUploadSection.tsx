
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, X, Play, Pause, Trash2, Plus, Volume2 } from 'lucide-react';
import { saveAudioFiles } from '../../utils/supabaseMarcheOperations';

interface AudioItem {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  duration: number | null;
  uploaded: boolean;
}

interface AudioUploadSectionProps {
  marcheId: string | null;
}

const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({ marcheId }) => {
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newItems: AudioItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
        audio.src = url;
      });

      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        url,
        name: file.name,
        size: file.size,
        duration,
        uploaded: false
      });
    }

    setAudioItems(prev => [...prev, ...newItems]);
  };

  const handlePlay = (itemId: string) => {
    // Arrêter tous les autres audios
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (playingId === itemId) {
      setPlayingId(null);
      return;
    }

    const audio = audioRefs.current[itemId];
    if (audio) {
      audio.play();
      setPlayingId(itemId);
      
      audio.addEventListener('ended', () => {
        setPlayingId(null);
      });
    }
  };

  const handleUpload = async (item: AudioItem) => {
    if (!marcheId) {
      console.error('❌ Aucun ID de marche fourni pour l\'upload');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Upload audio:', item.name);
      
      await saveAudioFiles(marcheId, [{ ...item, uploaded: false }]);
      
      setAudioItems(prev => 
        prev.map(audio => 
          audio.id === item.id ? { ...audio, uploaded: true } : audio
        )
      );
      
      console.log('✅ Upload audio terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur upload audio:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    if (!marcheId) {
      console.error('❌ Aucun ID de marche fourni pour l\'upload');
      return;
    }

    const itemsToUpload = audioItems.filter(item => !item.uploaded);
    if (itemsToUpload.length === 0) return;

    setIsUploading(true);
    try {
      console.log(`🔄 Upload de ${itemsToUpload.length} fichiers audio...`);
      
      await saveAudioFiles(marcheId, itemsToUpload);
      
      setAudioItems(prev => 
        prev.map(audio => ({ ...audio, uploaded: true }))
      );
      
      console.log('✅ Tous les fichiers audio ont été uploadés');
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload audio en masse:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (itemId: string) => {
    if (playingId === itemId) {
      const audio = audioRefs.current[itemId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingId(null);
    }
    
    setAudioItems(prev => prev.filter(item => item.id !== itemId));
    delete audioRefs.current[itemId];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestion des fichiers audio</h3>
        <div className="flex space-x-2">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter audio
          </Button>
          {audioItems.some(item => !item.uploaded) && (
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || !marcheId}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Tout uploader
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!marcheId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Sauvegardez d'abord les informations de base de la marche pour pouvoir ajouter des fichiers audio.
          </p>
        </div>
      )}

      {audioItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun fichier audio ajouté
          </h4>
          <p className="text-gray-600 mb-4">
            Cliquez sur "Ajouter audio" pour commencer
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {audioItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center space-x-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlay(item.id)}
                  className="flex-shrink-0"
                >
                  {playingId === item.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <audio
                  ref={(el) => {
                    if (el) audioRefs.current[item.id] = el;
                  }}
                  src={item.url}
                  className="hidden"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{formatDuration(item.duration)}</span>
                    {item.uploaded && (
                      <span className="text-green-600">✓ Uploadé</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!item.uploaded ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpload(item)}
                      disabled={isUploading || !marcheId}
                    >
                      {isUploading ? 'Upload...' : 'Uploader'}
                    </Button>
                  ) : (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleRemove(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {audioItems.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-600">
            {audioItems.length} fichier(s) audio • {audioItems.filter(item => item.uploaded).length} uploadé(s)
          </span>
          <Button 
            variant="outline"
            onClick={() => {
              setAudioItems([]);
              setPlayingId(null);
              audioRefs.current = {};
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioUploadSection;
