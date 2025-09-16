import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Edit3, Trash2, Upload, CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { ProcessedPhoto } from '../../../utils/photoUtils';
import { savePhoto, fetchExistingPhotos, deletePhoto, updatePhotoMetadata, ExistingPhoto } from '../../../utils/supabasePhotoOperations';
import { toast } from 'sonner';

type PhotoStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

interface PendingPhotoWithStatus extends ProcessedPhoto {
  status: PhotoStatus;
  uploadProgress?: number;
  error?: string;
}

interface PhotoGalleryMobileProps {
  marcheId: string;
  pendingPhotos: ProcessedPhoto[];
  onPhotoUploaded: (photoId: string) => void;
  onPhotoRemoved: (photoId: string) => void;
}

const PhotoGalleryMobile: React.FC<PhotoGalleryMobileProps> = ({
  marcheId,
  pendingPhotos,
  onPhotoUploaded,
  onPhotoRemoved
}) => {
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [pendingPhotosWithStatus, setPendingPhotosWithStatus] = useState<PendingPhotoWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ExistingPhoto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadExistingPhotos();
  }, [marcheId]);

  useEffect(() => {
    setPendingPhotosWithStatus(
      pendingPhotos.map(photo => ({
        ...photo,
        status: 'pending' as PhotoStatus
      }))
    );
  }, [pendingPhotos]);

  const loadExistingPhotos = async () => {
    if (!marcheId) return;
    
    try {
      setIsLoading(true);
      const photos = await fetchExistingPhotos(marcheId);
      setExistingPhotos(photos);
    } catch (error) {
      console.error('Erreur chargement photos:', error);
      toast.error('Erreur lors du chargement des photos');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhotoStatus = (photoIndex: number, status: PhotoStatus, progress?: number, error?: string) => {
    setPendingPhotosWithStatus(prev => 
      prev.map((photo, index) => 
        index === photoIndex 
          ? { ...photo, status, uploadProgress: progress, error }
          : photo
      )
    );
  };

  const handleUploadPhoto = async (photo: PendingPhotoWithStatus, photoIndex: number) => {
    if (!marcheId) return;

    updatePhotoStatus(photoIndex, 'uploading', 0);

    try {
      const photoData = {
        ...photo,
        id: crypto.randomUUID(),
        uploaded: false,
        titre: `Photo ${new Date().toLocaleString('fr-FR')}`,
        description: 'Photo de marché'
      };

      // Simulate upload progress
      for (let progress = 10; progress <= 90; progress += 20) {
        updatePhotoStatus(photoIndex, 'uploading', progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const photoId = await savePhoto(marcheId, photoData);
      updatePhotoStatus(photoIndex, 'uploaded', 100);
      
      onPhotoUploaded(photoId);
      await loadExistingPhotos();
      toast.success('📷 Photo uploadée avec succès !');
      
      // Remove from pending after successful upload
      setTimeout(() => {
        setPendingPhotosWithStatus(prev => prev.filter((_, index) => index !== photoIndex));
      }, 1000);
      
    } catch (error) {
      console.error('Erreur upload photo:', error);
      updatePhotoStatus(photoIndex, 'error', 0, error instanceof Error ? error.message : 'Erreur inconnue');
      toast.error('Erreur lors de l\'upload');
    }
  };

  const handleUploadAll = async () => {
    setIsUploading(true);
    const pendingPhotosToUpload = pendingPhotosWithStatus.filter(photo => photo.status === 'pending' || photo.status === 'error');
    
    for (let i = 0; i < pendingPhotosToUpload.length; i++) {
      const photoIndex = pendingPhotosWithStatus.findIndex(p => p === pendingPhotosToUpload[i]);
      if (photoIndex !== -1) {
        await handleUploadPhoto(pendingPhotosToUpload[i], photoIndex);
      }
    }
    setIsUploading(false);
  };

  const retryUpload = async (photoIndex: number) => {
    const photo = pendingPhotosWithStatus[photoIndex];
    if (photo && photo.status === 'error') {
      await handleUploadPhoto(photo, photoIndex);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
      onPhotoRemoved(photoId);
      await loadExistingPhotos();
      toast.success('🗑️ Photo supprimée');
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditPhoto = async () => {
    if (!selectedPhoto) return;

    try {
      await updatePhotoMetadata(selectedPhoto.id, {
        titre: editTitle,
        description: editDescription
      });
      
      await loadExistingPhotos();
      setSelectedPhoto(null);
      toast.success('✏️ Photo modifiée');
    } catch (error) {
      console.error('Erreur modification photo:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const openEditModal = (photo: ExistingPhoto) => {
    setSelectedPhoto(photo);
    setEditTitle(photo.titre || '');
    setEditDescription(photo.description || '');
  };

  const getStatusBadge = (status: PhotoStatus) => {
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
    const total = pendingPhotosWithStatus.length + existingPhotos.length;
    const pending = pendingPhotosWithStatus.filter(p => p.status === 'pending' || p.status === 'error').length;
    const uploaded = pendingPhotosWithStatus.filter(p => p.status === 'uploaded').length + existingPhotos.length;
    const uploading = pendingPhotosWithStatus.filter(p => p.status === 'uploading').length;
    
    return { total, pending, uploaded, uploading };
  };

  const allPhotos = [...existingPhotos];
  const statusCounts = getStatusCounts();

  if (allPhotos.length === 0 && pendingPhotosWithStatus.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <div className="text-muted-foreground mb-2">📸</div>
        <p className="text-sm text-muted-foreground">
          Aucune photo pour cette marche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            📷 Photos
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
              <span>📤 {statusCounts.uploaded} uploadées • {statusCounts.pending} en attente</span>
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
                    📤 Uploader {statusCounts.pending} photo{statusCounts.pending > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Photos */}
      {pendingPhotosWithStatus.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Photos en attente</h4>
          <div className="grid grid-cols-2 gap-3">
            {pendingPhotosWithStatus.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/30">
                  <img
                    src={photo.preview}
                    alt={`Photo en attente ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="absolute top-1 right-1">
                  {getStatusBadge(photo.status)}
                </div>
                
                {photo.status === 'uploading' && photo.uploadProgress !== undefined && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <Progress value={photo.uploadProgress} className="h-1" />
                  </div>
                )}
                
                {photo.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryUpload(index)}
                      className="animate-bounce"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Photos */}
      {allPhotos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Photos uploadées</h4>
          <div className="grid grid-cols-2 gap-3">
            {allPhotos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-green-200 dark:border-green-800">
                  <img
                    src={photo.url_supabase}
                    alt={photo.titre || 'Photo de marché'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                <div className="absolute top-1 right-1">
                  <Badge className="text-xs bg-green-500 text-white">✅</Badge>
                </div>
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditModal(photo)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {photo.titre && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {photo.titre}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      <Sheet open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>✏️ Modifier la photo</SheetTitle>
            <SheetDescription>
              Modifiez le titre et la description de la photo
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de la photo..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description de la photo..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditPhoto} className="flex-1">
                💾 Enregistrer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPhoto(null)}
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

export default PhotoGalleryMobile;