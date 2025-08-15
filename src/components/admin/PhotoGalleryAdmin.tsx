import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Image as ImageIcon,
  FileText,
  Calendar,
  MapPin,
  Edit2,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { fetchExistingPhotos, ExistingPhoto, updatePhotoMetadata } from '../../utils/supabasePhotoOperations';
import { toast } from 'sonner';
import { formatFileSize } from '../../utils/photoUtils';

interface PhotoGalleryAdminProps {
  marches: MarcheTechnoSensible[];
}

interface PhotoWithMarche extends ExistingPhoto {
  marche: MarcheTechnoSensible;
}

type SortField = 'date' | 'name' | 'marche' | 'size';
type SortDirection = 'asc' | 'desc';

const PhotoGalleryAdmin: React.FC<PhotoGalleryAdminProps> = ({ marches }) => {
  const [photos, setPhotos] = useState<PhotoWithMarche[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchText, setSearchText] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [hasTitle, setHasTitle] = useState<boolean | null>(null);
  const [hasDescription, setHasDescription] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editTitre, setEditTitre] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingPhoto, setSavingPhoto] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  // Charger toutes les photos
  useEffect(() => {
    const loadAllPhotos = async () => {
      setLoading(true);
      try {
        const allPhotos: PhotoWithMarche[] = [];
        
        for (const marche of marches) {
          try {
            const marchePhotos = await fetchExistingPhotos(marche.id);
            const photosWithMarche = marchePhotos.map(photo => ({
              ...photo,
              marche
            }));
            allPhotos.push(...photosWithMarche);
          } catch (error) {
            console.warn(`Erreur chargement photos pour marche ${marche.ville}:`, error);
          }
        }
        
        setPhotos(allPhotos);
      } catch (error) {
        console.error('Erreur chargement photos:', error);
        toast.error('Erreur lors du chargement des photos');
      } finally {
        setLoading(false);
      }
    };

    if (marches.length > 0) {
      loadAllPhotos();
    }
  }, [marches]);

  // Obtenir tous les tags uniques avec compteurs
  const getUniqueTagsWithCount = useMemo(() => {
    const relevantPhotos = photos.filter(photo => {
      // Appliquer tous les autres filtres sauf les tags
      let passes = true;
      
      if (selectedMarche !== 'all') {
        passes = passes && photo.marche.id === selectedMarche;
      }
      
      if (hasTitle !== null) {
        passes = passes && (hasTitle ? (photo.titre && photo.titre.trim() !== '') : (!photo.titre || photo.titre.trim() === ''));
      }
      
      if (hasDescription !== null) {
        passes = passes && (hasDescription ? (photo.description && photo.description.trim() !== '') : (!photo.description || photo.description.trim() === ''));
      }
      
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase();
        passes = passes && (
          (photo.titre || '').toLowerCase().includes(searchLower) ||
          (photo.description || '').toLowerCase().includes(searchLower) ||
          photo.nom_fichier.toLowerCase().includes(searchLower) ||
          photo.marche.ville.toLowerCase().includes(searchLower) ||
          (photo.marche.nomMarche || '').toLowerCase().includes(searchLower)
        );
      }
      
      return passes;
    });

    const tagCounts = new Map<string, number>();
    
    relevantPhotos.forEach(photo => {
      const allTags = [
        ...(photo.marche.supabaseTags || []),
        ...(photo.marche.tagsThematiques || []),
        ...(photo.marche.sousThemes || []),
        photo.marche.theme
      ].filter(Boolean);
      
      allTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [photos, selectedMarche, hasTitle, hasDescription, searchText]);

  // Tags filtrés par la recherche
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return getUniqueTagsWithCount;
    const searchLower = tagSearch.toLowerCase();
    return getUniqueTagsWithCount.filter(({ tag }) => 
      tag.toLowerCase().includes(searchLower)
    );
  }, [getUniqueTagsWithCount, tagSearch]);

  // Photos filtrées et triées
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = photos;

    // Filtre par marche
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(photo => photo.marche.id === selectedMarche);
    }

    // Filtre par titre
    if (hasTitle !== null) {
      filtered = filtered.filter(photo => 
        hasTitle ? (photo.titre && photo.titre.trim() !== '') : (!photo.titre || photo.titre.trim() === '')
      );
    }

    // Filtre par description
    if (hasDescription !== null) {
      filtered = filtered.filter(photo => 
        hasDescription ? (photo.description && photo.description.trim() !== '') : (!photo.description || photo.description.trim() === '')
      );
    }

    // Filtre par tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(photo => {
        const photoTags = [
          ...(photo.marche.supabaseTags || []),
          ...(photo.marche.tagsThematiques || []),
          ...(photo.marche.sousThemes || []),
          photo.marche.theme
        ].filter(Boolean);
        
        return selectedTags.some(selectedTag => photoTags.includes(selectedTag));
      });
    }

    // Recherche textuelle
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(photo => 
        (photo.titre || '').toLowerCase().includes(searchLower) ||
        (photo.description || '').toLowerCase().includes(searchLower) ||
        photo.nom_fichier.toLowerCase().includes(searchLower) ||
        photo.marche.ville.toLowerCase().includes(searchLower) ||
        (photo.marche.nomMarche || '').toLowerCase().includes(searchLower)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'name':
          aValue = a.nom_fichier.toLowerCase();
          bValue = b.nom_fichier.toLowerCase();
          break;
        case 'marche':
          aValue = a.marche.ville.toLowerCase();
          bValue = b.marche.ville.toLowerCase();
          break;
        case 'size':
          aValue = a.metadata?.size || 0;
          bValue = b.metadata?.size || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [photos, selectedMarche, hasTitle, hasDescription, selectedTags, searchText, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEdit = (photo: PhotoWithMarche) => {
    setEditingPhoto(photo.id);
    setEditTitre(photo.titre || '');
    setEditDescription(photo.description || '');
  };

  const saveEdit = async (photoId: string) => {
    if (savingPhoto) return;
    
    setSavingPhoto(photoId);
    try {
      await updatePhotoMetadata(photoId, {
        titre: editTitre,
        description: editDescription
      });
      
      // Mettre à jour l'état local
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, titre: editTitre, description: editDescription }
          : photo
      ));
      
      setEditingPhoto(null);
      toast.success('Photo mise à jour');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingPhoto(null);
    }
  };

  const cancelEdit = () => {
    setEditingPhoto(null);
    setEditTitre('');
    setEditDescription('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedMarche('all');
    setHasTitle(null);
    setHasDescription(null);
    setSelectedTags([]);
    setTagSearch('');
  };

  const hasActiveFilters = searchText || selectedMarche !== 'all' || hasTitle !== null || hasDescription !== null || selectedTags.length > 0;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des photos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Galerie Photos</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedPhotos.length} photo{filteredAndSortedPhotos.length > 1 ? 's' : ''} 
            {photos.length !== filteredAndSortedPhotos.length && ` sur ${photos.length} total`}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? 'Masquer' : 'Filtres'}
          {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filtres et recherche</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Recherche textuelle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Titre, description, fichier, ville..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par marche */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Marche</label>
              <Select value={selectedMarche} onValueChange={setSelectedMarche}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les marches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marches</SelectItem>
                  {marches.map((marche) => (
                    <SelectItem key={marche.id} value={marche.id}>
                      {marche.ville} - {marche.nomMarche || 'Sans nom'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tri */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Trier par</label>
              <div className="flex space-x-2">
                <Button
                  variant={sortField === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('date')}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Date {getSortIcon('date')}
                </Button>
                <Button
                  variant={sortField === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="flex items-center"
                >
                  Nom {getSortIcon('name')}
                </Button>
                <Button
                  variant={sortField === 'marche' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('marche')}
                  className="flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Marche {getSortIcon('marche')}
                </Button>
              </div>
            </div>
          </div>

          {/* Filtres par contenu */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-title"
                checked={hasTitle === true}
                onCheckedChange={(checked) => setHasTitle(checked ? true : hasTitle === true ? null : false)}
              />
              <label htmlFor="has-title" className="text-sm">Avec titre</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-title"
                checked={hasTitle === false}
                onCheckedChange={(checked) => setHasTitle(checked ? false : hasTitle === false ? null : true)}
              />
              <label htmlFor="no-title" className="text-sm">Sans titre</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-description"
                checked={hasDescription === true}
                onCheckedChange={(checked) => setHasDescription(checked ? true : hasDescription === true ? null : false)}
              />
              <label htmlFor="has-description" className="text-sm">Avec description</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-description"
                checked={hasDescription === false}
                onCheckedChange={(checked) => setHasDescription(checked ? false : hasDescription === false ? null : true)}
              />
              <label htmlFor="no-description" className="text-sm">Sans description</label>
            </div>
          </div>

          {/* Filtres par tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tags</label>
              {selectedTags.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedTags([])}
                  className="text-xs h-6"
                >
                  <X className="h-3 w-3 mr-1" />
                  Effacer tags
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Recherche de tags */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                <Input
                  placeholder="Rechercher un tag..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="pl-7 text-xs h-8"
                />
              </div>
              
              {/* Tags sélectionnés */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="default"
                      className="text-xs cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Tags disponibles */}
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {filteredTags
                  .filter(({ tag }) => !selectedTags.includes(tag))
                  .slice(0, 20)
                  .map(({ tag, count }) => (
                    <Badge 
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary/10 flex items-center"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <span className="ml-1 text-xs bg-muted px-1 rounded">
                        {count}
                      </span>
                    </Badge>
                  ))}
              </div>
              
              {filteredTags.filter(({ tag }) => !selectedTags.includes(tag)).length > 20 && (
                <p className="text-xs text-muted-foreground">
                  ... et {filteredTags.filter(({ tag }) => !selectedTags.includes(tag)).length - 20} autres tags
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Grille de photos */}
      {filteredAndSortedPhotos.length === 0 ? (
        <Card className="p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucune photo trouvée</p>
          <p className="text-muted-foreground">
            {hasActiveFilters 
              ? 'Essayez de modifier vos filtres'
              : 'Aucune photo disponible dans les marches sélectionnées'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              {/* Image */}
              <div className="aspect-square bg-muted relative">
                <img 
                  src={photo.url_supabase} 
                  alt={photo.titre || photo.nom_fichier}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(photo.url_supabase, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Informations */}
              <div className="p-4 space-y-3">
                {/* Contexte marche */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {photo.marche.ville}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(photo.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Nom de fichier */}
                <div className="text-sm font-medium truncate" title={photo.nom_fichier}>
                  {photo.nom_fichier}
                </div>

                {/* Taille */}
                {photo.metadata?.size && (
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(photo.metadata.size)}
                  </div>
                )}

                {/* Métadonnées éditables */}
                <div className="space-y-2 pt-2 border-t">
                  {editingPhoto === photo.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitre}
                        onChange={(e) => setEditTitre(e.target.value)}
                        placeholder="Titre de la photo"
                        className="text-sm"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        className="text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => saveEdit(photo.id)}
                          disabled={savingPhoto === photo.id}
                          className="flex-1"
                        >
                          {savingPhoto === photo.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Save className="h-3 w-3 mr-1" />
                          )}
                          Sauver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEdit}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="min-h-[2.5rem]">
                        <p className="text-sm font-medium line-clamp-2" title={photo.titre}>
                          {photo.titre || 
                            <span className="text-muted-foreground italic">Sans titre</span>
                          }
                        </p>
                        {photo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2" title={photo.description}>
                            {photo.description}
                          </p>
                        )}
                        {!photo.description && (
                          <p className="text-xs text-muted-foreground italic">Sans description</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(photo)}
                        className="w-full"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryAdmin;