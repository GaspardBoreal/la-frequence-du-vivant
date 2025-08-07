import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Edit, Trash2, Calendar, MapPin, Navigation, Heart, Map, Globe, Music } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { deleteMarche } from '../../utils/supabaseMarcheOperations';
import { toast } from 'sonner';
import { queryClient } from '../../lib/queryClient';
import { createSlug } from '../../utils/slugGenerator';
import { FRENCH_DEPARTMENTS } from '../../utils/frenchDepartments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface MarcheListProps {
  marches: MarcheTechnoSensible[];
  isLoading: boolean;
  onEdit: (marcheId: string) => void;
  onDelete?: () => void;
}

const MarcheList: React.FC<MarcheListProps> = ({
  marches,
  isLoading,
  onEdit,
  onDelete
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const truncateWords = (text: string, wordLimit: number = 30): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleDelete = async (marcheId: string, ville: string) => {
    if (deletingId) return;
    setDeletingId(marcheId);
    console.log(`🗑️ Tentative de suppression de la marche ${marcheId} (${ville})`);
    
    try {
      await deleteMarche(marcheId);
      toast.success(`Marche "${ville}" supprimée avec succès`);
      
      if (onDelete) {
        onDelete();
      }
      
      console.log(`✅ Suppression réussie pour ${ville}`);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMapClick = (latitude: number, longitude: number, ville: string, option: string) => {
    let url = '';
    switch (option) {
      case 'google-maps':
        url = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
        break;
      case 'google-earth':
        url = `https://earth.google.com/web/search/${latitude},${longitude}`;
        break;
      case 'openstreetmap':
        url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
        break;
      case 'all':
        // Ouvrir tous les onglets
        const urls = [`https://www.google.com/maps?q=${latitude},${longitude}&z=15`, `https://earth.google.com/web/search/${latitude},${longitude}`, `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`];
        urls.forEach(url => window.open(url, '_blank'));
        return;
    }
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleFrequenceVivantClick = (marche: MarcheTechnoSensible) => {
    const slug = createSlug(marche.nomMarche || marche.ville, marche.ville);
    const frequenceVivantUrl = `${window.location.origin}/marche/${slug}`;
    window.open(frequenceVivantUrl, '_blank');
  };

  const handleBioacoustiqueClick = (marche: MarcheTechnoSensible) => {
    const slug = createSlug(marche.nomMarche || marche.ville, marche.ville);
    const bioacoustiqueUrl = `${window.location.origin}/bioacoustique/${slug}`;
    window.open(bioacoustiqueUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    // Nettoyer la date pour éviter les caractères parasites et le 0 à la fin
    const cleanDate = dateString.replace(/[^\d-]/g, '').replace(/0$/, '');

    // Vérifier si c'est une date valide au format ISO (YYYY-MM-DD)
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      return dateString; // Retourner la date originale si elle n'est pas valide
    }
    
    // S'assurer que la date est correctement interprétée en UTC pour éviter les décalages
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    return utcDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDepartmentFromRegion = (region: string): string => {
    // Mapping basique région -> département principal
    const regionToDepartment: {
      [key: string]: string;
    } = {
      'Nouvelle-Aquitaine': 'Gironde',
      'Bretagne': 'Finistère',
      'Occitanie': 'Haute-Garonne',
      'Auvergne-Rhône-Alpes': 'Rhône',
      'Provence-Alpes-Côte d\'Azur': 'Bouches-du-Rhône',
      'Île-de-France': 'Paris',
      'Grand Est': 'Bas-Rhin',
      'Hauts-de-France': 'Nord',
      'Normandie': 'Calvados',
      'Centre-Val de Loire': 'Loiret',
      'Bourgogne-Franche-Comté': 'Côte-d\'Or',
      'Pays de la Loire': 'Loire-Atlantique',
      'Corse': 'Corse-du-Sud'
    };
    return regionToDepartment[region] || region;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (marches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2 text-foreground font-bold text-3xl">Aucune marche trouvée</h3>
        <p className="text-center text-muted-foreground">Commencez par créer votre première marche (bouton en haut à gauche)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Marches existantes ({marches.length})</h2>
      </div>

      <div className="space-y-3">
        {marches.map((marche) => (
          <div key={marche.id} className="gaspard-card rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-accent font-medium">Ville :</span>
                    <h3 className="text-lg font-medium text-foreground">{marche.ville}</h3>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-accent font-medium">Département :</span>
                      <span className="text-foreground">{marche.departement}</span>
                    </div>
                    {marche.region && (
                      <div className="flex items-center space-x-2">
                        <span className="text-accent font-medium text-sm">Région :</span>
                        <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                          {marche.region}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {marche.nomMarche && (
                    <div className="flex items-center space-x-3">
                      <span className="text-accent font-medium">Nom de la marche :</span>
                      <span className="text-lg font-medium text-foreground">{marche.nomMarche}</span>
                    </div>
                  )}
                </div>

                {marche.descriptifCourt && (
                  <div className="mb-3">
                    <div className="flex items-start space-x-4">
                      <span className="text-accent font-medium whitespace-nowrap">Descriptif :</span>
                      <p className="text-sm text-foreground leading-relaxed">{truncateWords(marche.descriptifCourt, 40)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  {marche.date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(marche.date)}</span>
                    </div>
                  )}
                  {marche.latitude && marche.longitude && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{marche.latitude.toFixed(3)}, {marche.longitude.toFixed(3)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200" title="Voir sur les cartes">
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                          <DropdownMenuItem onClick={() => handleMapClick(marche.latitude!, marche.longitude!, marche.ville, 'google-maps')} className="cursor-pointer hover:bg-gray-50 text-gray-900">
                            <Map className="h-4 w-4 mr-2" />
                            Google Maps
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMapClick(marche.latitude!, marche.longitude!, marche.ville, 'google-earth')} className="cursor-pointer hover:bg-gray-50 text-gray-900">
                            <Globe className="h-4 w-4 mr-2" />
                            Google Earth
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMapClick(marche.latitude!, marche.longitude!, marche.ville, 'openstreetmap')} className="cursor-pointer hover:bg-gray-50 text-gray-900">
                            <Map className="h-4 w-4 mr-2" />
                            OpenStreetMap
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleMapClick(marche.latitude!, marche.longitude!, marche.ville, 'all')} className="cursor-pointer hover:bg-gray-50 font-medium text-gray-900">
                            <Navigation className="h-4 w-4 mr-2" />
                            Ouvrir tous les onglets
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleFrequenceVivantClick(marche)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200" title="Voir dans La Fréquence du Vivant">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBioacoustiqueClick(marche)} className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800 hover:bg-teal-50 border border-teal-200" title="Voir en mode Bioacoustique Poétique">
                    <Music className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tags */}
                {marche.supabaseTags && marche.supabaseTags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-accent font-medium text-sm">Tags :</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {marche.supabaseTags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {marche.photos && marche.photos.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.photos.length} photo{marche.photos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.audioFiles && marche.audioFiles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.audioFiles.length} audio{marche.audioFiles.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.videos && marche.videos.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.videos.length} vidéo{marche.videos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.etudes && marche.etudes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.etudes.length} étude{marche.etudes.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.documents && marche.documents.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.documents.length} document{marche.documents.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => onEdit(marche.id)} disabled={deletingId === marche.id}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={deletingId === marche.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      {deletingId === marche.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mr-1" />
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la marche "{marche.ville}" ?
                        Cette action est irréversible et supprimera également tous les médias associés (photos, vidéos, audios, documents).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingId === marche.id}>
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(marche.id, marche.ville)} disabled={deletingId === marche.id} className="bg-red-600 hover:bg-red-700">
                        {deletingId === marche.id ? 'Suppression...' : 'Supprimer définitivement'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarcheList;
