
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, Plus, Trash2, Volume2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchExistingAudio, 
  saveAudio, 
  saveAudioFiles, 
  deleteAudio, 
  updateAudioMetadata,
  updateAudioOrder,
  validateAudioFile,
  getAudioDuration,
  AudioToUpload,
  ExistingAudio,
  AudioUploadProgress
} from '../../utils/supabaseAudioOperations';
import AudioCard from './AudioCard';
import SortableAudioCard from './SortableAudioCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
// Remove the modifiers import since it's not available in this version

interface AudioUploadSectionProps {
  marcheId: string | null;
}

interface AudioItem {
  id: string;
  file?: File;
  url: string;
  name: string;
  size: number;
  duration: number | null;
  uploaded: boolean;
  isExisting?: boolean;
  titre?: string;
  description?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  uploadError?: string;
}

const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({ marcheId }) => {
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration des capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Évite les clics accidentels
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger les fichiers audio existants au montage
  useEffect(() => {
    if (marcheId) {
      loadExistingAudio();
    }
  }, [marcheId]);

  const loadExistingAudio = async () => {
    if (!marcheId) return;
    
    console.log('🔄 [AudioUploadSection] Chargement des fichiers audio existants...');
    setIsLoading(true);
    try {
      const existingAudio = await fetchExistingAudio(marcheId);
      
      const formattedAudio: AudioItem[] = existingAudio.map(audio => ({
        id: audio.id,
        url: audio.url_supabase,
        name: audio.nom_fichier,
        size: audio.taille_octets || 0,
        duration: audio.duree_secondes || null,
        uploaded: true,
        isExisting: true,
        titre: audio.titre,
        description: audio.description
      }));

      // Trier par ordre
      formattedAudio.sort((a, b) => {
        const aOrder = existingAudio.find(e => e.id === a.id)?.ordre || 0;
        const bOrder = existingAudio.find(e => e.id === b.id)?.ordre || 0;
        return aOrder - bOrder;
      });

      setAudioItems(formattedAudio);
      console.log(`✅ [AudioUploadSection] ${formattedAudio.length} fichiers audio existants chargés`);
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur chargement audio:', error);
      toast.error('Erreur lors du chargement des fichiers audio existants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFiles = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    console.log(`📁 [AudioUploadSection] Traitement de ${files.length} fichier(s) audio`);

    try {
      const newItems: AudioItem[] = [];
      
      for (const file of Array.from(files)) {
        // Valider le fichier
        const validation = validateAudioFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Obtenir la durée
        const duration = await getAudioDuration(file);
        
        const newItem: AudioItem = {
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          duration: duration,
          uploaded: false,
          titre: '',
          description: '',
          uploadStatus: 'pending',
          uploadProgress: 0
        };
        
        newItems.push(newItem);
      }

      if (newItems.length > 0) {
        setAudioItems(prev => [...prev, ...newItems]);
        toast.success(`${newItems.length} fichier(s) audio ajouté(s)`);
      }
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur traitement fichiers:', error);
      toast.error('Erreur lors du traitement des fichiers');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleUploadSingle = async (itemId: string) => {
    if (!marcheId) {
      toast.error('Aucun ID de marche fourni');
      return;
    }

    const item = audioItems.find(i => i.id === itemId);
    if (!item || !item.file) return;

    console.log(`🚀 [AudioUploadSection] Upload fichier: ${item.name}`);
    setIsUploading(true);
    
    try {
      const audioData: AudioToUpload = {
        id: item.id,
        file: item.file,
        url: item.url,
        name: item.name,
        size: item.size,
        duration: item.duration,
        uploaded: false,
        titre: item.titre || item.name,
        description: item.description || ''
      };

      await saveAudio(marcheId, audioData, (progress: AudioUploadProgress) => {
        setAudioItems(prev => prev.map(audio => 
          audio.id === itemId 
            ? { 
                ...audio, 
                uploadProgress: progress.progress,
                uploadStatus: progress.status,
                uploadError: progress.error
              }
            : audio
        ));
      });

      // Marquer comme uploadé
      setAudioItems(prev => prev.map(audio => 
        audio.id === itemId 
          ? { ...audio, uploaded: true, uploadStatus: 'success', uploadProgress: 100 }
          : audio
      ));

      toast.success(`Fichier ${item.name} uploadé avec succès`);
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur upload:', error);
      
      setAudioItems(prev => prev.map(audio => 
        audio.id === itemId 
          ? { 
              ...audio, 
              uploadStatus: 'error', 
              uploadError: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          : audio
      ));
      
      toast.error(`Erreur upload ${item.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    if (!marcheId) {
      toast.error('Aucun ID de marche fourni');
      return;
    }

    const itemsToUpload = audioItems.filter(item => !item.uploaded && item.file);
    if (itemsToUpload.length === 0) {
      toast.info('Aucun fichier à uploader');
      return;
    }

    console.log(`🚀 [AudioUploadSection] Upload de ${itemsToUpload.length} fichiers`);
    setIsUploading(true);
    
    const uploadToast = toast.loading(`Upload de ${itemsToUpload.length} fichier(s) en cours...`);
    
    try {
      const audioData: AudioToUpload[] = itemsToUpload.map(item => ({
        id: item.id,
        file: item.file!,
        url: item.url,
        name: item.name,
        size: item.size,
        duration: item.duration,
        uploaded: false,
        titre: item.titre || item.name,
        description: item.description || ''
      }));

      await saveAudioFiles(marcheId, audioData, (fileName: string, progress: AudioUploadProgress) => {
        setAudioItems(prev => prev.map(audio => 
          audio.name === fileName 
            ? { 
                ...audio, 
                uploadProgress: progress.progress,
                uploadStatus: progress.status,
                uploadError: progress.error
              }
            : audio
        ));
      });

      // Marquer tous comme uploadés
      setAudioItems(prev => prev.map(audio => 
        itemsToUpload.find(item => item.id === audio.id)
          ? { ...audio, uploaded: true, uploadStatus: 'success', uploadProgress: 100 }
          : audio
      ));

      toast.dismiss(uploadToast);
      toast.success(`${itemsToUpload.length} fichier(s) uploadé(s) avec succès`);
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur upload multiple:', error);
      toast.dismiss(uploadToast);
      toast.error('Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    const item = audioItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.isExisting) {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce fichier audio ?')) {
        return;
      }

      console.log('🗑️ [AudioUploadSection] Suppression fichier audio existant:', itemId);
      
      try {
        const loadingToast = toast.loading('Suppression en cours...');
        
        await deleteAudio(itemId);
        
        toast.dismiss(loadingToast);
        setAudioItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Fichier audio supprimé avec succès');
      } catch (error) {
        console.error('❌ [AudioUploadSection] Erreur suppression:', error);
        toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    } else {
      // Suppression simple pour les fichiers non uploadés
      setAudioItems(prev => prev.filter(item => item.id !== itemId));
      toast.info('Fichier retiré de la liste');
    }
  };

  const handleUpdateMetadata = async (itemId: string, updates: { titre?: string; description?: string }) => {
    const item = audioItems.find(i => i.id === itemId);
    if (!item) return;

    console.log(`📝 [AudioUploadSection] Mise à jour métadonnées pour ${itemId}:`, updates);

    try {
      // Si c'est un fichier existant, le mettre à jour dans Supabase
      if (item.isExisting) {
        await updateAudioMetadata(itemId, updates);
        toast.success('Métadonnées mises à jour');
      } else {
        // Si c'est un nouveau fichier, juste mettre à jour localement
        console.log('📝 [AudioUploadSection] Mise à jour locale pour nouveau fichier');
        toast.success('Métadonnées ajoutées (seront sauvegardées lors de l\'upload)');
      }
      
      // Mettre à jour localement dans tous les cas
      setAudioItems(prev => prev.map(audio => 
        audio.id === itemId ? { ...audio, ...updates } : audio
      ));
      
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleClearAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (audioItems.length === 0) return;
    
    const hasUnsavedFiles = audioItems.some(item => !item.uploaded && !item.isExisting);
    
    if (hasUnsavedFiles) {
      if (!window.confirm('Vous avez des fichiers non sauvegardés. Êtes-vous sûr de vouloir tout supprimer ?')) {
        return;
      }
    }
    
    setAudioItems([]);
    toast.info('Tous les fichiers ont été supprimés de la liste');
  };

  // Gestion du drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = audioItems.findIndex(item => item.id === active.id);
    const newIndex = audioItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedItems = arrayMove(audioItems, oldIndex, newIndex);
    setAudioItems(reorderedItems);

    // Sauvegarder l'ordre uniquement pour les fichiers déjà uploadés
    const uploadedItems = reorderedItems.filter(item => item.uploaded && item.isExisting);
    if (uploadedItems.length > 0) {
      await handleSaveOrder(uploadedItems.map(item => item.id));
    }
  };

  // Déplacement manuel (boutons)
  const handleMoveUp = async (audioId: string) => {
    const currentIndex = audioItems.findIndex(item => item.id === audioId);
    if (currentIndex <= 0) return;

    const newItems = arrayMove(audioItems, currentIndex, currentIndex - 1);
    setAudioItems(newItems);

    // Sauvegarder l'ordre si nécessaire
    const uploadedItems = newItems.filter(item => item.uploaded && item.isExisting);
    if (uploadedItems.length > 0) {
      await handleSaveOrder(uploadedItems.map(item => item.id));
    }
  };

  const handleMoveDown = async (audioId: string) => {
    const currentIndex = audioItems.findIndex(item => item.id === audioId);
    if (currentIndex >= audioItems.length - 1) return;

    const newItems = arrayMove(audioItems, currentIndex, currentIndex + 1);
    setAudioItems(newItems);

    // Sauvegarder l'ordre si nécessaire
    const uploadedItems = newItems.filter(item => item.uploaded && item.isExisting);
    if (uploadedItems.length > 0) {
      await handleSaveOrder(uploadedItems.map(item => item.id));
    }
  };

  // Sauvegarder l'ordre des fichiers audio
  const handleSaveOrder = async (audioIds: string[]) => {
    if (!marcheId || audioIds.length === 0) return;

    setIsReordering(true);
    try {
      await updateAudioOrder(audioIds);
      console.log('✅ [AudioUploadSection] Ordre des fichiers audio sauvegardé');
    } catch (error) {
      console.error('❌ [AudioUploadSection] Erreur sauvegarde ordre:', error);
      toast.error('Erreur lors de la sauvegarde de l\'ordre');
      // Recharger pour restaurer l'ordre correct
      await loadExistingAudio();
    } finally {
      setIsReordering(false);
    }
  };

  const hasUnsavedFiles = audioItems.some(item => !item.uploaded);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Chargement des fichiers audio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestion des fichiers audio</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={handleAddFiles}
            variant="outline"
            className="flex items-center"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isProcessing ? 'Traitement...' : 'Ajouter audio'}
          </Button>
          {hasUnsavedFiles && (
            <Button
              type="button"
              onClick={handleUploadAll}
              disabled={!marcheId || isUploading}
              className="flex items-center"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
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

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <p className="text-blue-800">Traitement des fichiers en cours...</p>
          </div>
        </div>
      )}

      {audioItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-white mb-2">
            Aucun fichier audio ajouté
          </h4>
          <p className="mb-4 text-slate-200">
            Cliquez sur "Ajouter audio" pour commencer
          </p>
          <p className="text-sm text-slate-300">
            Formats supportés : MP3, WAV, OGG, M4A, AAC, FLAC
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Indicateur de réorganisation */}
          {isReordering && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-blue-800 text-sm">Sauvegarde de l'ordre en cours...</span>
              </div>
            </div>
          )}

          {/* Contexte de drag & drop */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={audioItems.map(item => item.id)} 
              strategy={verticalListSortingStrategy}
            >
              {/* Grille responsive des fichiers audio */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {audioItems.map((item, index) => (
                  <SortableAudioCard
                    key={item.id}
                    audio={item}
                    index={index}
                    totalItems={audioItems.length}
                    onRemove={handleRemove}
                    onUpload={handleUploadSingle}
                    onUpdateMetadata={handleUpdateMetadata}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isUploading={isUploading}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {audioItems.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex flex-wrap gap-2 items-center">
              <span>{audioItems.length} fichier(s) audio</span>
              <span>•</span>
              <span>{audioItems.filter(item => item.uploaded).length} uploadé(s)</span>
              {isReordering && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">Réorganisation...</span>
                </>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            disabled={isProcessing || isReordering}
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
