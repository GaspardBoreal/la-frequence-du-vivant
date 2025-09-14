import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Edit3, Trash2, Upload } from 'lucide-react';
import { ProcessedPhoto } from '../../../utils/photoUtils';
import { savePhoto, fetchExistingPhotos, deletePhoto, updatePhotoMetadata, ExistingPhoto } from '../../../utils/supabasePhotoOperations';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ExistingPhoto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadExistingPhotos();
  }, [marcheId]);

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

  const handleUploadPhoto = async (photo: ProcessedPhoto) => {
    if (!marcheId) return;

    try {
      const photoData = {
        ...photo,
        id: crypto.randomUUID(),
        uploaded: false,
        titre: `Photo ${new Date().toLocaleString('fr-FR')}`,
        description: 'Photo de marché'
      };

      const photoId = await savePhoto(marcheId, photoData);
      onPhotoUploaded(photoId);
      await loadExistingPhotos();
      toast.success('📷 Photo uploadée !');
    } catch (error) {
      console.error('Erreur upload photo:', error);
      toast.error('Erreur lors de l\'upload');
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

  // Upload pending photos automatically
  useEffect(() => {
    const uploadPendingPhotos = async () => {
      for (const photo of pendingPhotos) {
        await handleUploadPhoto(photo);
      }
    };
    
    if (pendingPhotos.length > 0) {
      uploadPendingPhotos();
    }
  }, [pendingPhotos]);

  const allPhotos = [...existingPhotos];

  if (allPhotos.length === 0 && pendingPhotos.length === 0) {
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          📷 Photos ({allPhotos.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {allPhotos.map((photo) => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={photo.url_supabase}
                alt={photo.titre || 'Photo de marché'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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