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
  X,
  Tag
} from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { fetchExistingPhotos, ExistingPhoto, deletePhoto, getTagsWithCounts } from '../../utils/supabasePhotoOperations';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminExplorations } from '../../hooks/useExplorations';
import { supabase } from '../../integrations/supabase/client';
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
  const [selectedExploration, setSelectedExploration] = useState<string>('all');
  const [hasTitle, setHasTitle] = useState<boolean | null>(null);
  const [hasDescription, setHasDescription] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsWithCounts, setTagsWithCounts] = useState<Array<{ tag: string; count: number; categorie?: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tagRefreshKey, setTagRefreshKey] = useState(0); // Pour forcer le rechargement des tags
  // Debouncing pour optimiser les performances
  const debouncedSearchText = useDebounce(searchText, 300);

  // Charger les explorations pour le filtre
  const { data: explorations = [] } = useAdminExplorations();

  // Charger les relations exploration-marches pour le filtre par exploration
  const [explorationMarcheIds, setExplorationMarcheIds] = useState<string[]>([]);
  
  useEffect(() => {
    const loadExplorationMarches = async () => {
      if (selectedExploration === 'all') {
        setExplorationMarcheIds([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('exploration_marches')
          .select('marche_id')
          .eq('exploration_id', selectedExploration);
        
        if (error) throw error;
        setExplorationMarcheIds(data?.map(em => em.marche_id) || []);
      } catch (error) {
        console.error('Erreur chargement marches d\'exploration:', error);
        setExplorationMarcheIds([]);
      }
    };
    
    loadExplorationMarches();
  }, [selectedExploration]);

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
        
        // Charger les tags avec compteurs
        const tags = await getTagsWithCounts();
        setTagsWithCounts(tags);
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


  // Photos filtrées et triées
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = photos;

    // Filtre par marche
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(photo => photo.marche.id === selectedMarche);
    }

    // Filtre par exploration
    if (selectedExploration !== 'all') {
      // Filtrer les photos des marches associées à l'exploration sélectionnée
      filtered = filtered.filter(photo => explorationMarcheIds.includes(photo.marche.id));
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


    // Filtre par tags sélectionnés
    if (selectedTags.length > 0) {
      filtered = filtered.filter(photo => {
        const photoTags = photo.tags?.map(t => t.tag) || [];
        return selectedTags.every(selectedTag => photoTags.includes(selectedTag));
      });
    }

    // Recherche textuelle dans les métadonnées des images (y compris les tags)
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(photo => {
        const photoTags = photo.tags?.map(t => t.tag).join(' ') || '';
        return (
          (photo.titre || '').toLowerCase().includes(searchLower) ||
          (photo.description || '').toLowerCase().includes(searchLower) ||
          photo.nom_fichier.toLowerCase().includes(searchLower) ||
          photoTags.toLowerCase().includes(searchLower)
        );
      });
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
  }, [photos, selectedMarche, selectedExploration, explorationMarcheIds, hasTitle, hasDescription, selectedTags, debouncedSearchText, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Callback optimisé pour la mise à jour des photos
  const handlePhotoUpdate = useCallback((photoId: string, updates: { titre?: string; description?: string; tags?: string[] }) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { 
            ...photo, 
            ...updates,
            tags: updates.tags ? updates.tags.map(tag => ({ id: '', tag, created_at: '' })) : photo.tags
          }
        : photo
    ));
    
    // Recharger les tags avec compteurs et forcer le refresh des suggestions si des tags ont été modifiés
    if (updates.tags !== undefined) {
      console.log('🔄 [PhotoGalleryAdmin] Tags modifiés, rechargement en cours...');
      getTagsWithCounts().then((newTags) => {
        setTagsWithCounts(newTags);
        setTagRefreshKey(prev => prev + 1); // Force le refresh des suggestions dans toutes les cartes
        console.log('✅ [PhotoGalleryAdmin] Tags rechargés:', newTags.length);
      }).catch(console.error);
    }
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

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedMarche('all');
    setSelectedExploration('all');
    setHasTitle(null);
    setHasDescription(null);
    setSelectedTags([]);
  }, []);

  const hasActiveFilters = debouncedSearchText || selectedMarche !== 'all' || selectedExploration !== 'all' || hasTitle !== null || hasDescription !== null || selectedTags.length > 0;

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
            <h4 className="font-medium text-accent flex items-center">
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
                    placeholder="Titre, description, nom de fichier, tags..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recherche dans les métadonnées des photos (titre, description, nom de fichier, tags)
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

          {/* Section 2: Filtres par Tags */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-accent flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Filtres par Tags
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Tags avec compteurs */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags disponibles</label>
                {tagsWithCounts.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {tagsWithCounts
                      .sort((a, b) => a.tag.localeCompare(b.tag)) // Tri alphabétique
                      .map(({ tag, count }) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(prev => prev.filter(t => t !== tag));
                            } else {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun tag disponible</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cliquez sur un tag pour filtrer ({selectedTags.length} sélectionné{selectedTags.length > 1 ? 's' : ''})
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Filtres sur les Marches */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-accent flex items-center">
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

              {/* Sélecteur d'exploration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Exploration sélectionnée</label>
                <Select value={selectedExploration} onValueChange={setSelectedExploration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les explorations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Toutes les explorations
                    </SelectItem>
                    {explorations
                      .sort((a, b) => a.name.localeCompare(b.name)) // Tri alphabétique
                      .map((exploration) => (
                        <SelectItem key={exploration.id} value={exploration.id}>
                          {exploration.name} ({exploration.published ? 'Publiée' : 'Non publiée'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Filtre par exploration (classées par ordre alphabétique)
                </p>
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
              tagRefreshKey={tagRefreshKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryAdmin;