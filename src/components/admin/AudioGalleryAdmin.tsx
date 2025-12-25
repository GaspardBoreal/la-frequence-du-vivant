import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Clock,
  FileAudio,
  Edit
} from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { fetchExistingAudio, ExistingAudio, deleteAudio } from '../../utils/supabaseAudioOperations';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminExplorations } from '../../hooks/useExplorations';
import { supabase } from '../../integrations/supabase/client';

interface AudioGalleryAdminProps {
  marches: MarcheTechnoSensible[];
}

interface AudioWithMarche extends ExistingAudio {
  marche: MarcheTechnoSensible;
}

type SortField = 'date' | 'name' | 'marche' | 'duration' | 'size';
type SortDirection = 'asc' | 'desc';

const AudioGalleryAdmin: React.FC<AudioGalleryAdminProps> = ({ marches }) => {
  const [audios, setAudios] = useState<AudioWithMarche[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchText, setSearchText] = useState('');
  const [selectedMarche, setSelectedMarche] = useState<string>('all');
  const [selectedExploration, setSelectedExploration] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const debouncedSearchText = useDebounce(searchText, 300);

  // États pour le mode édition
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingAudioType, setEditingAudioType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Types d'audio disponibles (spécifiques à l'exploration Dordogne)
  const audioTypes = [
    { key: 'gaspard', label: 'Gaspard parle', icon: '🎙️' },
    { key: 'dordogne', label: 'La Dordogne parle', icon: '🌊' },
    { key: 'sounds', label: 'Sons captés', icon: '🎵' }
  ];

  const { data: explorations = [] } = useAdminExplorations();
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

  // Charger tous les audios
  useEffect(() => {
    const loadAllAudios = async () => {
      setLoading(true);
      try {
        const allAudios: AudioWithMarche[] = [];
        
        for (const marche of marches) {
          try {
            const marcheAudios = await fetchExistingAudio(marche.id);
            const audiosWithMarche = marcheAudios.map(audio => ({
              ...audio,
              marche
            }));
            allAudios.push(...audiosWithMarche);
          } catch (error) {
            console.error(`Erreur chargement audio pour marche ${marche.id}:`, error);
          }
        }
        
        setAudios(allAudios);
      } catch (error) {
        console.error('Erreur chargement audios:', error);
        toast.error('Erreur lors du chargement des audios');
      } finally {
        setLoading(false);
      }
    };

    if (marches.length > 0) {
      loadAllAudios();
    }
  }, [marches]);

  // Filtrage et tri des audios
  const filteredAndSortedAudios = useMemo(() => {
    let filtered = audios;

    // Filtre par texte
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(audio => 
        audio.nom_fichier.toLowerCase().includes(searchLower) ||
        audio.titre?.toLowerCase().includes(searchLower) ||
        audio.description?.toLowerCase().includes(searchLower) ||
        audio.marche.ville?.toLowerCase().includes(searchLower) ||
        audio.marche.nomMarche?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par marche
    if (selectedMarche !== 'all') {
      filtered = filtered.filter(audio => audio.marche.id === selectedMarche);
    }

    // Filtre par exploration
    if (selectedExploration !== 'all' && explorationMarcheIds.length > 0) {
      filtered = filtered.filter(audio => explorationMarcheIds.includes(audio.marche.id));
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.nom_fichier?.toLowerCase() || '';
          bValue = b.nom_fichier?.toLowerCase() || '';
          break;
        case 'marche':
          aValue = a.marche.ville?.toLowerCase() || '';
          bValue = b.marche.ville?.toLowerCase() || '';
          break;
        case 'duration':
          aValue = a.duree_secondes || 0;
          bValue = b.duree_secondes || 0;
          break;
        case 'size':
          aValue = a.taille_octets || 0;
          bValue = b.taille_octets || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [audios, debouncedSearchText, selectedMarche, selectedExploration, explorationMarcheIds, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet audio ?')) return;

    try {
      await deleteAudio(audioId);
      setAudios(prev => prev.filter(audio => audio.id !== audioId));
      toast.success('Audio supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression audio:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonctions pour le mode édition
  const handleStartEdit = (audio: AudioWithMarche) => {
    setEditingAudioId(audio.id);
    setEditingTitle(audio.titre || audio.nom_fichier);
    setEditingDescription(audio.description || '');
    setEditingAudioType((audio as any).type_audio || '');
  };

  const handleCancelEdit = () => {
    setEditingAudioId(null);
    setEditingTitle('');
    setEditingDescription('');
    setEditingAudioType('');
  };

  const handleSaveEdit = async (audioId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('marche_audio')
        .update({
          titre: editingTitle,
          description: editingDescription,
          type_audio: editingAudioType || null
        })
        .eq('id', audioId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setAudios(prev => prev.map(audio => 
        audio.id === audioId 
          ? { ...audio, titre: editingTitle, description: editingDescription, type_audio: editingAudioType || null } as any
          : audio
      ));
      
      setEditingAudioId(null);
      setEditingAudioType('');
      toast.success('Audio modifié avec succès');
    } catch (error) {
      console.error('Erreur modification audio:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper pour obtenir le label du type audio
  const getAudioTypeLabel = (typeKey: string | null | undefined) => {
    if (!typeKey) return null;
    return audioTypes.find(t => t.key === typeKey);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const togglePlayback = (audioId: string, audioUrl: string) => {
    if (currentPlayingId === audioId) {
      setCurrentPlayingId(null);
      const audio = document.getElementById(`audio-${audioId}`) as HTMLAudioElement;
      audio?.pause();
    } else {
      // Arrêter l'audio précédent s'il y en a un
      if (currentPlayingId) {
        const prevAudio = document.getElementById(`audio-${currentPlayingId}`) as HTMLAudioElement;
        prevAudio?.pause();
      }
      
      setCurrentPlayingId(audioId);
      const audio = document.getElementById(`audio-${audioId}`) as HTMLAudioElement;
      if (audio) {
        audio.play();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des audios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Galerie Audio</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedAudios.length} audio{filteredAndSortedAudios.length > 1 ? 's' : ''} 
            {audios.length !== filteredAndSortedAudios.length && ` sur ${audios.length} total`}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Marche</label>
              <Select value={selectedMarche} onValueChange={setSelectedMarche}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les marches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marches</SelectItem>
                  {marches.map(marche => (
                    <SelectItem key={marche.id} value={marche.id}>
                      {marche.ville} - {marche.nomMarche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Exploration</label>
              <Select value={selectedExploration} onValueChange={setSelectedExploration}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les explorations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les explorations</SelectItem>
                  {explorations.map(exploration => (
                    <SelectItem key={exploration.id} value={exploration.id}>
                      {exploration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tri</label>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="marche">Marche</SelectItem>
                    <SelectItem value="duration">Durée</SelectItem>
                    <SelectItem value="size">Taille</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedAudios.map(audio => (
          <Card key={audio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {audio.titre || audio.nom_fichier}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {audio.marche.ville}
                    </Badge>
                    {(audio as any).type_audio && (
                      <Badge variant="outline" className="text-xs">
                        {getAudioTypeLabel((audio as any).type_audio)?.icon} {getAudioTypeLabel((audio as any).type_audio)?.label}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={
                        audio.duree_secondes 
                          ? audio.duree_secondes > 600 
                            ? 'text-orange-600 font-medium' 
                            : 'text-gray-700'
                          : 'text-red-500'
                      }>
                        {formatDuration(audio.duree_secondes)}
                        {audio.duree_secondes && audio.duree_secondes > 1800 && (
                          <span className="ml-1 text-amber-600 animate-pulse">⚠️</span>
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePlayback(audio.id, audio.url_supabase)}
                  className="shrink-0"
                >
                  {currentPlayingId === audio.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {editingAudioId === audio.id ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Titre</Label>
                    <Input 
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Titre de l'audio"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea 
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Description de l'audio"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type d'audio</Label>
                    <Select 
                      value={editingAudioType || 'auto'} 
                      onValueChange={(val) => setEditingAudioType(val === 'auto' ? '' : val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Auto-détection (par mots-clés)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🔍 Auto-détection (par mots-clés)</SelectItem>
                        {audioTypes.map(type => (
                          <SelectItem key={type.key} value={type.key}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveEdit(audio.id)} 
                      disabled={isSaving}
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Sauvegarder
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {audio.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {audio.description}
                    </p>
                  )}

                  <audio
                    id={`audio-${audio.id}`}
                    src={audio.url_supabase}
                    onEnded={() => setCurrentPlayingId(null)}
                    className="w-full mb-3"
                    controls
                    preload="none"
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileAudio className="h-3 w-3" />
                      {formatFileSize(audio.taille_octets)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(audio)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAudio(audio.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedAudios.length === 0 && (
        <div className="text-center py-12">
          <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun audio trouvé</h3>
          <p className="text-muted-foreground">
            {audios.length === 0 
              ? "Aucun fichier audio n'a été uploadé pour le moment."
              : "Aucun audio ne correspond aux filtres sélectionnés."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioGalleryAdmin;