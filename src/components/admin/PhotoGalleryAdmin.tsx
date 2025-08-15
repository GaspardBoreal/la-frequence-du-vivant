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
import { fetchExistingPhotos, ExistingPhoto } from '../../utils/supabasePhotoOperations';
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

  // Obtenir tous les tags uniques avec compteurs (optimisé avec debouncing)
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
      
      if (debouncedSearchText.trim()) {
        const searchLower = debouncedSearchText.toLowerCase();
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
  }, [photos, selectedMarche, hasTitle, hasDescription, debouncedSearchText]);

  // Tags filtrés par la recherche (optimisé avec debouncing)
  const filteredTags = useMemo(() => {
    if (!debouncedTagSearch.trim()) return getUniqueTagsWithCount;
    const searchLower = debouncedTagSearch.toLowerCase();
    return getUniqueTagsWithCount.filter(({ tag }) => 
      tag.toLowerCase().includes(searchLower)
    );
  }, [getUniqueTagsWithCount, debouncedTagSearch]);

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

    // Recherche textuelle (avec debouncing)
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryAdmin;