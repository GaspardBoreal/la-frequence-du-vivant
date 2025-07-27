
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Edit, Trash2, Calendar, MapPin, Navigation, Heart, Map, Globe } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { deleteMarche } from '../../utils/supabaseMarcheOperations';
import { toast } from 'sonner';
import { queryClient } from '../../lib/queryClient';
import { createSlug } from '../../utils/slugGenerator';
import { FRENCH_DEPARTMENTS } from '../../utils/frenchDepartments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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
        url = `https://earth.google.com/web/@${latitude},${longitude},500a,500d,35y,0h,0t,0r`;
        break;
      case 'openstreetmap':
        url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
        break;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Nettoyer la date pour éviter les caractères parasites et le 0 à la fin
    const cleanDate = dateString.replace(/[^\d-]/g, '').replace(/0$/, '');
    
    // Vérifier si c'est une date valide
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      return dateString; // Retourner la date originale si elle n'est pas valide
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Marches existantes ({marches.length})</h2>
      </div>

      <div className="space-y-4">
        {marches.map(marche => (
          <div key={marche.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* En-tête principal */}
                <div className="mb-4">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{marche.ville}</h3>
                    {marche.nomMarche && (
                      <span className="text-lg text-gray-600 font-medium">• {marche.nomMarche}</span>
                    )}
                  </div>
                  
                  {/* Localisation */}
                  <div className="flex items-center space-x-4 text-sm">
                    {marche.departement && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {marche.departement}
                      </Badge>
                    )}
                    {marche.region && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {marche.region}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thème */}
                {marche.theme && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                      {marche.theme}
                    </span>
                  </div>
                )}

                {/* Description */}
                {marche.descriptifCourt && (
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">{marche.descriptifCourt}</p>
                )}

                {/* Informations pratiques */}
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  {marche.date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(marche.date)}</span>
                    </div>
                  )}
                  {marche.latitude != null && marche.longitude != null && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{marche.latitude.toFixed(3)}, {marche.longitude.toFixed(3)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-md"
                            title="Voir sur les cartes"
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg z-50">
                          <DropdownMenuItem 
                            onClick={() => handleMapClick(Number(marche.latitude), Number(marche.longitude), marche.ville, 'google-maps')}
                            className="cursor-pointer hover:bg-gray-50 text-gray-900"
                          >
                            <Map className="h-4 w-4 mr-2" />
                            Google Maps
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMapClick(Number(marche.latitude), Number(marche.longitude), marche.ville, 'google-earth')}
                            className="cursor-pointer hover:bg-gray-50 text-gray-900"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Google Earth
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMapClick(Number(marche.latitude), Number(marche.longitude), marche.ville, 'openstreetmap')}
                            className="cursor-pointer hover:bg-gray-50 text-gray-900"
                          >
                            <Map className="h-4 w-4 mr-2" />
                            OpenStreetMap
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFrequenceVivantClick(marche)}
                    className="h-7 w-7 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200 rounded-md"
                    title="Voir dans La Fréquence du Vivant"
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>

                {/* Tags */}
                {marche.supabaseTags && marche.supabaseTags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {marche.supabaseTags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compteurs de médias */}
                <div className="flex flex-wrap gap-2">
                  {marche.photos && marche.photos.length > 0 && (
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                      {marche.photos.length} photo{marche.photos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.audioFiles && marche.audioFiles.length > 0 && (
                    <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                      {marche.audioFiles.length} audio{marche.audioFiles.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.videos && marche.videos.length > 0 && (
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {marche.videos.length} vidéo{marche.videos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.etudes && marche.etudes.length > 0 && (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                      {marche.etudes.length} étude{marche.etudes.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {marche.documents && marche.documents.length > 0 && (
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {marche.documents.length} document{marche.documents.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(marche.id)}
                  disabled={deletingId === marche.id}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deletingId === marche.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
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
                      <AlertDialogAction
                        onClick={() => handleDelete(marche.id, marche.ville)}
                        disabled={deletingId === marche.id}
                        className="bg-red-600 hover:bg-red-700"
                      >
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
