import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { fetchExistingPhotos, ExistingPhoto, deletePhoto } from '../../utils/supabasePhotoOperations';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import LazyPhotoCard from './LazyPhotoCard';

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');

  // Debouncing pour optimiser les performances
  const debouncedSearchText = useDebounce(searchText, 300);
  const debouncedTagSearch = useDebounce(tagSearch, 300);

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

  // Obtenir les marches qui ont des photos avec compteurs
  const getMarchesWithPhotoCount = useMemo(() => {
    const marchePhotoCounts = new Map<string, number>();
    
    photos.forEach(photo => {
      const marcheId = photo.marche.id;
      marchePhotoCounts.set(marcheId, (marchePhotoCounts.get(marcheId) || 0) + 1);
    });
    
    return marches
      .filter(marche => marchePhotoCounts.has(marche.id))
      .map(marche => ({
        marche,
        photoCount: marchePhotoCounts.get(marche.id) || 0
      }))
      .sort((a, b) => b.photoCount - a.photoCount);
  }, [photos, marches]);

  // Obtenir tous les tags des marches avec compteurs basés sur les photos filtrées
  const getMarcheTagsWithCount = useMemo(() => {
    // Utiliser les photos filtrées comme base pour le comptage des tags
    // Cela exclut les filtres de tags eux-mêmes pour éviter les circularités
    let basePhotos = photos;

    console.log('🔍 [DEBUG] Photos totales au début:', basePhotos.length);

    // Appliquer seulement les filtres non-tags
    if (selectedMarche !== 'all') {
      basePhotos = basePhotos.filter(photo => photo.marche.id === selectedMarche);
      console.log('🔍 [DEBUG] Après filtre marche:', basePhotos.length);
    }

    if (hasTitle !== null) {
      basePhotos = basePhotos.filter(photo => 
        hasTitle ? (photo.titre && photo.titre.trim() !== '') : (!photo.titre || photo.titre.trim() === '')
      );
      console.log('🔍 [DEBUG] Après filtre titre:', basePhotos.length);
    }

    if (hasDescription !== null) {
      basePhotos = basePhotos.filter(photo => 
        hasDescription ? (photo.description && photo.description.trim() !== '') : (!photo.description || photo.description.trim() === '')
      );
      console.log('🔍 [DEBUG] Après filtre description:', basePhotos.length);
    }

    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      basePhotos = basePhotos.filter(photo => 
        (photo.titre || '').toLowerCase().includes(searchLower) ||
        (photo.description || '').toLowerCase().includes(searchLower) ||
        photo.nom_fichier.toLowerCase().includes(searchLower)
      );
      console.log('🔍 [DEBUG] Après filtre recherche:', basePhotos.length);
    }

    const tagCounts = new Map<string, number>();
    
    // Collecter tous les tags uniques de toutes les marches
    const allTagsSet = new Set<string>();
    basePhotos.forEach(photo => {
      const photoTags = [
        ...(photo.marche.supabaseTags || []),
        ...(photo.marche.tagsThematiques || []),
        ...(photo.marche.sousThemes || []),
        photo.marche.theme
      ].filter(Boolean);
      
      photoTags.forEach(tag => allTagsSet.add(tag));
    });

    // Pour chaque tag, compter combien de photos DISTINCTES appartiennent à des marches ayant ce tag
    allTagsSet.forEach(tag => {
      const photosWithThisTag = basePhotos.filter(photo => {
        const photoTags = [
          ...(photo.marche.supabaseTags || []),
          ...(photo.marche.tagsThematiques || []),
          ...(photo.marche.sousThemes || []),
          photo.marche.theme
        ].filter(Boolean);
        
        return photoTags.includes(tag);
      });
      
      tagCounts.set(tag, photosWithThisTag.length);
    });

    const result = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    
    console.log('🔍 [DEBUG] Tags avec compteurs:', result.slice(0, 5));
    console.log('🔍 [DEBUG] "Remontée-Dordogne" count:', tagCounts.get('Remontée-Dordogne'));
    
    return result;
  }, [photos, selectedMarche, hasTitle, hasDescription, debouncedSearchText]);

  // Tags filtrés par la recherche (optimisé avec debouncing)
  const filteredMarcheTags = useMemo(() => {
    if (!debouncedTagSearch.trim()) return getMarcheTagsWithCount;
    const searchLower = debouncedTagSearch.toLowerCase();
    return getMarcheTagsWithCount.filter(({ tag }) => 
      tag.toLowerCase().includes(searchLower)
    );
  }, [getMarcheTagsWithCount, debouncedTagSearch]);

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

    // Recherche textuelle dans les métadonnées des images uniquement
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(photo => 
        (photo.titre || '').toLowerCase().includes(searchLower) ||
        (photo.description || '').toLowerCase().includes(searchLower) ||
        photo.nom_fichier.toLowerCase().includes(searchLower)
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
  }, [photos, selectedMarche, hasTitle, hasDescription, selectedTags, debouncedSearchText, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Callback optimisé pour la mise à jour des photos
  const handlePhotoUpdate = useCallback((photoId: string, updates: { titre?: string; description?: string }) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, ...updates }
        : photo
    ));
  }, []);

  // Callback pour la suppression des photos - optimisé pour éviter la navigation
  const handlePhotoDelete = useCallback((photoId: string) => {
    console.log('Suppression photo ID:', photoId);
    setPhotos(prev => {
      const newPhotos = prev.filter(photo => photo.id !== photoId);
      console.log('Photos restantes:', newPhotos.length);
      return newPhotos;
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedMarche('all');
    setHasTitle(null);
    setHasDescription(null);
    setSelectedTags([]);
    setTagSearch('');
  }, []);

  const hasActiveFilters = debouncedSearchText || selectedMarche !== 'all' || hasTitle !== null || hasDescription !== null || selectedTags.length > 0;

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
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filtres</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Tout effacer
              </Button>
            )}
          </div>
          
          {/* Section 1: Filtres sur les Images */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-primary flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Filtres sur les Images
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recherche textuelle dans les métadonnées des images */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche dans les images</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Titre, description, nom de fichier..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recherche dans les métadonnées des photos uniquement
                </p>
              </div>

              {/* Filtres par contenu des images */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Métadonnées</label>
                <div className="grid grid-cols-2 gap-2">
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
              </div>
            </div>
          </div>

          {/* Section 2: Filtres sur les Marches */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-secondary flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Filtres sur les Marches
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélecteur de marche */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Marche sélectionnée</label>
                <Select value={selectedMarche} onValueChange={setSelectedMarche}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les marches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Toutes les marches ({photos.length} photos)
                    </SelectItem>
                    {getMarchesWithPhotoCount.map(({ marche, photoCount }) => (
                      <SelectItem key={marche.id} value={marche.id}>
                        {marche.ville} - {marche.nomMarche || 'Sans nom'} ({photoCount} photos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags thématiques des marches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Tags thématiques</label>
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTags([])}
                      className="text-xs h-6"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Effacer
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {/* Recherche de tags */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                    <Input
                      placeholder="Rechercher un tag de marche..."
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
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredMarcheTags.length > 0 ? (
                      filteredMarcheTags.map(({ tag, count }) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="text-xs cursor-pointer hover:bg-muted mr-1 mb-1"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag} ({count})
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun tag de marche trouvé</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les nombres indiquent le total de photos dans les marches ayant ce tag
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Tri */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center">
              <SortAsc className="h-4 w-4 mr-2" />
              Tri des résultats
            </h4>
            
            <div className="flex flex-wrap gap-2">
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
        </Card>
      )}

      {/* Grille de photos optimisée avec lazy loading */}
      {filteredAndSortedPhotos.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="h-12 w-12 mx-auto text-muted-foreground mb-4 text-4xl">📷</div>
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
            <LazyPhotoCard 
              key={photo.id} 
              photo={photo} 
              onUpdate={handlePhotoUpdate}
              onDelete={handlePhotoDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryAdmin;