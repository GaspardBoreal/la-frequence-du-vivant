import React, { useState, useEffect, useMemo } from 'react';
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
import { useIsMobile } from '../../hooks/use-mobile';
import { stripHtml, truncateWords } from '../../utils/textUtils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '../ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const isMobile = useIsMobile();

  useEffect(() => {
    setCurrentPage(1);
  }, [marches, itemsPerPage]);

  const totalPages = Math.ceil(marches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMarches = marches.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
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

    // Détecter si la date est déjà formatée en français
    const frenchMonthsPattern = /(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i;
    if (frenchMonthsPattern.test(dateString)) {
      return dateString; // La date est déjà formatée, la retourner telle quelle
    }

    // Nettoyer et vérifier si c'est au format ISO (YYYY-MM-DD)
    const cleanDate = dateString.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return dateString; // Format non reconnu, retourner l'original
    }
    
    try {
      // Parser la date manuellement pour éviter les problèmes de timezone
      const [year, month, day] = cleanDate.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month - 1 car les mois commencent à 0
      
      // Vérifier que la date est valide
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Erreur lors du formatage de la date:', dateString, error);
      return dateString; // En cas d'erreur, retourner l'original
    }
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
        {paginatedMarches.map((marche) => (
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
                      <p className="text-sm text-foreground leading-relaxed">{truncateWords(stripHtml(marche.descriptifCourt), 40)}</p>
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
                  {marche.textes && marche.textes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {marche.textes.length} texte{marche.textes.length > 1 ? 's' : ''}
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

              <div className={`flex items-center ml-4 ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                <Button 
                  size={isMobile ? "sm" : "sm"} 
                  variant="outline" 
                  onClick={() => onEdit(marche.id)} 
                  disabled={deletingId === marche.id}
                  className={isMobile ? 'w-full justify-center' : ''}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isMobile ? 'Modifier' : 'Modifier'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size={isMobile ? "sm" : "sm"} 
                      variant="outline" 
                      disabled={deletingId === marche.id} 
                      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isMobile ? 'w-full justify-center' : ''}`}
                    >
                      {deletingId === marche.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mr-1" />
                          {isMobile ? 'Suppression...' : 'Suppression...'}
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isMobile ? 'Supprimer' : 'Supprimer'}
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
