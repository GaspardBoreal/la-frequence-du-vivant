import React, { useState, useRef, useEffect, memo } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Edit2, Save, X, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { ExistingPhoto, updatePhotoMetadata, deletePhoto, updatePhotoTags } from '../../utils/supabasePhotoOperations';
import PhotoTagInput from './PhotoTagInput';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { formatFileSize } from '../../utils/photoUtils';
import { toast } from 'sonner';

interface PhotoWithMarche extends ExistingPhoto {
  marche: MarcheTechnoSensible;
}

interface LazyPhotoCardProps {
  photo: PhotoWithMarche;
  onUpdate: (photoId: string, updates: { titre?: string; description?: string; tags?: string[] }) => void;
  onDelete?: (photoId: string) => void;
  tagRefreshKey?: number; // Pour forcer le rechargement des suggestions de tags
}

const LazyPhotoCard: React.FC<LazyPhotoCardProps> = memo(({ photo, onUpdate, onDelete, tagRefreshKey = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titre, setTitre] = useState(photo.titre || '');
  const [description, setDescription] = useState(photo.description || '');
  const [tags, setTags] = useState<string[]>(photo.tags?.map(t => t.tag) || []);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px' // Commencer à charger 100px avant que l'élément soit visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Générer URL thumbnail Supabase
  const getThumbnailUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    // Pour Supabase Storage, utiliser la transformation directe dans l'URL
    // Format: /render/image/public/[path]?width=200&height=200
    if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
      const path = originalUrl.split('/storage/v1/object/public/')[1];
      const baseUrl = originalUrl.split('/storage/v1/object/public/')[0];
      return `${baseUrl}/storage/v1/render/image/public/${path}?width=200&height=200&resize=cover&quality=80`;
    }
    return originalUrl;
  };

  const getFullImageUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    // Pour la version pleine résolution, optimiser la qualité seulement
    if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
      const path = originalUrl.split('/storage/v1/object/public/')[1];
      const baseUrl = originalUrl.split('/storage/v1/object/public/')[0];
      return `${baseUrl}/storage/v1/render/image/public/${path}?quality=85`;
    }
    return originalUrl;
  };

  const startEdit = () => {
    setEditing(true);
    setTitre(photo.titre || '');
    setDescription(photo.description || '');
    setTags(photo.tags?.map(t => t.tag) || []);
  };

  const saveEdit = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      // Mettre à jour les métadonnées
      await updatePhotoMetadata(photo.id, {
        titre: titre,
        description: description
      });
      
      // Mettre à jour les tags
      await updatePhotoTags(photo.id, tags);
      
      onUpdate(photo.id, { titre, description, tags });
      setEditing(false);
      toast.success('Photo mise à jour');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setTitre(photo.titre || '');
    setDescription(photo.description || '');
    setTags(photo.tags?.map(t => t.tag) || []);
  };

  const openFullImage = () => {
    window.open(getFullImageUrl(photo.url_supabase), '_blank');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!onDelete || deleting) return;
    
    setDeleting(true);
    try {
      await deletePhoto(photo.id);
      onDelete(photo.id);
      toast.success('Photo supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteConfirm(false);
  };

  return (
    <div ref={cardRef}>
      <Card className="overflow-hidden">
        <div className="aspect-square relative bg-muted">
          {!isVisible ? (
            // Skeleton loader avant que l'image ne soit visible
            <Skeleton className="w-full h-full" />
          ) : imageError ? (
            // Affichage d'erreur
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm">Image non disponible</div>
              </div>
            </div>
          ) : (
            <>
              {!imageLoaded && <Skeleton className="w-full h-full absolute inset-0" />}
              <img
                src={getThumbnailUrl(photo.url_supabase)}
                alt={photo.titre || photo.nom_fichier}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />
              
              {/* Bouton pour ouvrir en pleine résolution */}
              {imageLoaded && !imageError && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={openFullImage}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 space-y-2">
          {/* Marche */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {photo.marche.ville}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(photo.metadata?.size || 0)}
            </span>
          </div>
          
          {/* Nom du fichier */}
          <div className="text-xs text-muted-foreground font-mono truncate" title={photo.nom_fichier}>
            {photo.nom_fichier}
          </div>
          
          {/* Titre éditable */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Titre</label>
            {editing ? (
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Titre de la photo"
                className="text-sm h-8"
              />
            ) : (
              <div className="text-sm min-h-[2rem] flex items-center">
                {photo.titre || <span className="text-muted-foreground italic">Pas de titre</span>}
              </div>
            )}
          </div>
          
          {/* Description éditable */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {editing ? (
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la photo"
                className="text-sm h-8"
              />
            ) : (
              <div className="text-sm min-h-[2rem] flex items-center">
                {photo.description || <span className="text-muted-foreground italic">Pas de description</span>}
              </div>
            )}
          </div>
          
          {/* Tags éditables */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <PhotoTagInput
              tags={editing ? tags : (photo.tags?.map(t => t.tag) || [])}
              onTagsChange={setTags}
              disabled={!editing}
              placeholder="Ajouter des tags..."
              refreshKey={tagRefreshKey}
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-1 pt-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-7 px-2"
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdit}
                  className="h-7 px-2"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEdit}
                  className="h-7 px-2"
                  disabled={deleting}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteClick}
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Dialog de confirmation de suppression */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer <span className="font-medium">{photo.nom_fichier}</span> ?
                  <br />
                  Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
});

LazyPhotoCard.displayName = 'LazyPhotoCard';

export default LazyPhotoCard;