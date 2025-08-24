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
  BookOpen,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Type,
  FileText
} from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { MarcheTexte, useDeleteMarcheTexte } from '../../hooks/useMarcheTextes';
import { TextType } from '@/types/textTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface TextesLitterairesGalleryAdminProps {
  marches: MarcheTechnoSensible[];
}

interface TexteWithMarche extends MarcheTexte {
  marche: MarcheTechnoSensible;
}

type SortField = 'date' | 'titre' | 'marche' | 'type' | 'ordre';
type SortDirection = 'asc' | 'desc';

// Mapping des types de texte avec leurs familles
const TEXT_FAMILIES = {
  'haiku': 'Poétique',
  'poeme': 'Poétique', 
  'carte-poetique': 'Poétique',
  'haibun': 'Narrative',
  'dialogue-polyphonique': 'Narrative',
  'fragment': 'Narrative',
  'fable': 'Narrative',
  'essai-bref': 'Réflexive'
} as const;

const getTextFamily = (type: TextType): string => {
  return TEXT_FAMILIES[type] || 'Autre';
};

// Composant pour afficher une carte de texte
const TexteCard: React.FC<{
  texte: TexteWithMarche;
  onPreview: (texte: TexteWithMarche) => void;
  onEdit: (texte: TexteWithMarche) => void;
  onDelete: (id: string) => void;
}> = ({ texte, onPreview, onEdit, onDelete }) => {
  const family = getTextFamily(texte.type_texte);
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header avec badges */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{texte.type_texte}</Badge>
              <Badge variant="outline">{family}</Badge>
            </div>
            <h3 className="font-semibold text-sm line-clamp-1">{texte.titre}</h3>
          </div>
        </div>
        
        {/* Aperçu du contenu */}
        <div className="text-sm text-muted-foreground">
          <p className="line-clamp-3">{texte.contenu}</p>
        </div>
        
        {/* Informations contextuelles */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{texte.marche.ville}</span>
            {texte.marche.nomMarche && (
              <span>- {texte.marche.nomMarche}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Ordre: {texte.ordre}</span>
            <span>{new Date(texte.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPreview(texte)}
            title="Voir"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(texte)}
            title="Éditer"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(texte.id)}
            title="Supprimer"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Composant pour la prévisualisation
const TextePreviewDialog: React.FC<{
  texte: TexteWithMarche | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ texte, open, onOpenChange }) => {
  if (!texte) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {texte.titre}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="secondary">{texte.type_texte}</Badge>
            <Badge variant="outline">{getTextFamily(texte.type_texte)}</Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {texte.marche.ville} - {texte.marche.nomMarche}
              </span>
              <span>Ordre: {texte.ordre}</span>
              <span>{new Date(texte.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{texte.contenu}</div>
          </div>
          
          {texte.metadata && Object.keys(texte.metadata).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Métadonnées</h4>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(texte.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TextesLitterairesGalleryAdmin: React.FC<TextesLitterairesGalleryAdminProps> = ({ marches }) => {
  const [textes, setTextes] = useState<TexteWithMarche[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchText, setSearchText] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [hasMetadata, setHasMetadata] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [previewTexte, setPreviewTexte] = useState<TexteWithMarche | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Debouncing pour optimiser les performances
  const debouncedSearchText = useDebounce(searchText, 300);
  
  const deleteTexte = useDeleteMarcheTexte();

  // Charger tous les textes
  useEffect(() => {
    const loadAllTextes = async () => {
      setLoading(true);
      try {
        const allTextes: TexteWithMarche[] = [];
        
        for (const marche of marches) {
          try {
            const { data, error } = await supabase
              .from('marche_textes')
              .select('*')
              .eq('marche_id', marche.id)
              .order('ordre', { ascending: true });
              
            if (error) throw error;
            
            const textesWithMarche = data.map(texte => ({
              ...texte,
              type_texte: texte.type_texte as TextType, // Cast to TextType
              metadata: texte.metadata as Record<string, any> | null, // Cast metadata
              marche
            }));
            allTextes.push(...textesWithMarche);
          } catch (error) {
            console.warn(`Erreur chargement textes pour marche ${marche.ville}:`, error);
          }
        }
        
        setTextes(allTextes);
      } catch (error) {
        console.error('Erreur chargement textes:', error);
        toast.error('Erreur lors du chargement des textes');
      } finally {
        setLoading(false);
      }
    };

    if (marches.length > 0) {
      loadAllTextes();
    }
  }, [marches]);

  // Obtenir les marches qui ont des textes avec compteurs
  const getMarchesWithTextCount = useMemo(() => {
    const marcheTextCounts = new Map<string, number>();
    
    textes.forEach(texte => {
      const marcheId = texte.marche.id;
      marcheTextCounts.set(marcheId, (marcheTextCounts.get(marcheId) || 0) + 1);
    });
    
    return marches
      .filter(marche => marcheTextCounts.has(marche.id))
      .map(marche => ({
        marche,
        textCount: marcheTextCounts.get(marche.id) || 0
      }))
      .sort((a, b) => b.textCount - a.textCount);
  }, [textes, marches]);

  // Types de texte disponibles avec compteurs
  const getTypesWithCount = useMemo(() => {
    const typeCounts = new Map<string, number>();
    textes.forEach(texte => {
      typeCounts.set(texte.type_texte, (typeCounts.get(texte.type_texte) || 0) + 1);
    });
    
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [textes]);

  // Familles de texte avec compteurs
  const getFamiliesWithCount = useMemo(() => {
    const familyCounts = new Map<string, number>();
    textes.forEach(texte => {
      const family = getTextFamily(texte.type_texte);
      familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    });
    
    return Array.from(familyCounts.entries())
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count);
  }, [textes]);

  // Textes filtrés et triés
  const filteredAndSortedTextes = useMemo(() => {
    let filtered = textes;

    // Filtre par marche
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(texte => texte.marche.id === selectedMarche);
    }

    // Filtre par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(texte => texte.type_texte === selectedType);
    }

    // Filtre par famille
    if (selectedFamily !== 'all') {
      filtered = filtered.filter(texte => getTextFamily(texte.type_texte) === selectedFamily);
    }

    // Filtre par métadonnées
    if (hasMetadata !== null) {
      filtered = filtered.filter(texte => 
        hasMetadata ? 
          (texte.metadata && Object.keys(texte.metadata).length > 0) : 
          (!texte.metadata || Object.keys(texte.metadata).length === 0)
      );
    }

    // Recherche textuelle
    if (debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(texte => 
        texte.titre.toLowerCase().includes(searchLower) ||
        texte.contenu.toLowerCase().includes(searchLower) ||
        texte.marche.ville.toLowerCase().includes(searchLower) ||
        (texte.marche.nomMarche || '').toLowerCase().includes(searchLower)
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
        case 'titre':
          aValue = a.titre.toLowerCase();
          bValue = b.titre.toLowerCase();
          break;
        case 'marche':
          aValue = a.marche.ville.toLowerCase();
          bValue = b.marche.ville.toLowerCase();
          break;
        case 'type':
          aValue = a.type_texte;
          bValue = b.type_texte;
          break;
        case 'ordre':
          aValue = a.ordre;
          bValue = b.ordre;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [textes, selectedMarche, selectedType, selectedFamily, hasMetadata, debouncedSearchText, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handlePreview = useCallback((texte: TexteWithMarche) => {
    setPreviewTexte(texte);
    setPreviewOpen(true);
  }, []);

  const handleEdit = useCallback((texte: TexteWithMarche) => {
    // TODO: Implémenter l'édition
    toast.info('Édition en cours de développement');
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce texte ?')) {
      try {
        await deleteTexte.mutateAsync(id);
        setTextes(prev => prev.filter(texte => texte.id !== id));
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  }, [deleteTexte]);

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedMarche('all');
    setSelectedType('all');
    setSelectedFamily('all');
    setHasMetadata(null);
  }, []);

  const hasActiveFilters = debouncedSearchText || selectedMarche !== 'all' || 
    selectedType !== 'all' || selectedFamily !== 'all' || hasMetadata !== null;

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des textes littéraires...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Textes Littéraires</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedTextes.length} texte{filteredAndSortedTextes.length > 1 ? 's' : ''} 
            {textes.length !== filteredAndSortedTextes.length && ` sur ${textes.length} total`}
            {getMarchesWithTextCount.length > 0 && ` • ${getMarchesWithTextCount.length} marche${getMarchesWithTextCount.length > 1 ? 's' : ''}`}
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
          
          {/* Section 1: Filtres sur les Textes */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-primary flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Filtres sur les Textes
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche textuelle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche textuelle</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Titre, contenu, ville..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtre par type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de texte</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Tous les types ({textes.length} textes)
                    </SelectItem>
                    {getTypesWithCount.map(({ type, count }) => (
                      <SelectItem key={type} value={type}>
                        {type} ({count} texte{count > 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par famille */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Famille de texte</label>
                <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les familles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Toutes les familles ({textes.length} textes)
                    </SelectItem>
                    {getFamiliesWithCount.map(({ family, count }) => (
                      <SelectItem key={family} value={family}>
                        {family} ({count} texte{count > 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtres par métadonnées */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Métadonnées</label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-metadata"
                    checked={hasMetadata === true}
                    onCheckedChange={(checked) => setHasMetadata(checked ? true : hasMetadata === true ? null : false)}
                  />
                  <label htmlFor="has-metadata" className="text-sm">Avec métadonnées</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-metadata"
                    checked={hasMetadata === false}
                    onCheckedChange={(checked) => setHasMetadata(checked ? false : hasMetadata === false ? null : true)}
                  />
                  <label htmlFor="no-metadata" className="text-sm">Sans métadonnées</label>
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Marche sélectionnée</label>
              <Select value={selectedMarche} onValueChange={setSelectedMarche}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les marches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Toutes les marches ({textes.length} textes)
                  </SelectItem>
                  {getMarchesWithTextCount.map(({ marche, textCount }) => (
                    <SelectItem key={marche.id} value={marche.id}>
                      {marche.ville} - {marche.nomMarche || 'Sans nom'} ({textCount} texte{textCount > 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                variant={sortField === 'titre' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('titre')}
                className="flex items-center"
              >
                <Type className="h-4 w-4 mr-1" />
                Titre {getSortIcon('titre')}
              </Button>
              <Button
                variant={sortField === 'type' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('type')}
                className="flex items-center"
              >
                <FileText className="h-4 w-4 mr-1" />
                Type {getSortIcon('type')}
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
              <Button
                variant={sortField === 'ordre' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('ordre')}
                className="flex items-center"
              >
                Ordre {getSortIcon('ordre')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Grille de textes */}
      {filteredAndSortedTextes.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="h-12 w-12 mx-auto text-muted-foreground mb-4 text-4xl">📖</div>
          <p className="text-lg font-medium">Aucun texte trouvé</p>
          <p className="text-muted-foreground">
            {hasActiveFilters 
              ? 'Essayez de modifier vos filtres'
              : 'Aucun texte littéraire disponible dans les marches sélectionnées'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedTextes.map((texte) => (
            <TexteCard 
              key={texte.id} 
              texte={texte} 
              onPreview={handlePreview}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialog de prévisualisation */}
      <TextePreviewDialog
        texte={previewTexte}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
};

export default TextesLitterairesGalleryAdmin;