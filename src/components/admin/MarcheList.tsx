
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Edit, Trash2, Calendar, MapPin } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { deleteMarche } from '../../utils/supabaseMarcheOperations';
import { toast } from 'sonner';
import { queryClient } from '../../lib/queryClient';
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

interface MarcheListProps {
  marches: MarcheTechnoSensible[];
  isLoading: boolean;
  onEdit: (marcheId: string) => void;
  onDelete?: () => void; // Callback pour notifier le parent de la suppression
}

const MarcheList: React.FC<MarcheListProps> = ({
  marches,
  isLoading,
  onEdit,
  onDelete
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (marcheId: string, ville: string) => {
    setDeletingId(marcheId);
    try {
      await deleteMarche(marcheId);
      toast.success(`Marche "${ville}" supprimée avec succès`);
      
      // Forcer un refetch immédiat des données
      await queryClient.refetchQueries({ queryKey: ['marches-supabase'] });
      
      // Notifier le composant parent pour qu'il mette à jour la liste filtrée
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la marche');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (marches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2 text-slate-50 font-bold text-3xl">Aucune marche trouvée</h3>
        <p className="text-center text-gray-50">Commencez par créer votre première marche (bouton en haut à gauche)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Marches existantes ({marches.length})</h2>
      </div>

      <div className="space-y-3">
        {marches.map(marche => (
          <div key={marche.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">Ville :</span>
                    <h3 className="text-lg font-medium text-gray-900">{marche.ville}</h3>
                    {marche.region && (
                      <Badge variant="outline" className="text-xs">
                        {marche.region}
                      </Badge>
                    )}
                  </div>

                  {marche.nomMarche && (
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">Nom de la marche :</span>
                      <span className="text-lg font-medium text-gray-900">{marche.nomMarche}</span>
                    </div>
                  )}

                  {marche.theme && (
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">Thème :</span>
                      <span className="text-sm font-medium text-slate-50">{marche.theme}</span>
                    </div>
                  )}
                </div>

                {marche.descriptifCourt && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{marche.descriptifCourt}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {marche.date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{marche.date}</span>
                    </div>
                  )}
                  {marche.latitude && marche.longitude && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{marche.latitude.toFixed(3)}, {marche.longitude.toFixed(3)}</span>
                    </div>
                  )}
                </div>

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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(marche.id)}
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === marche.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {deletingId === marche.id ? 'Suppression...' : 'Supprimer'}
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
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(marche.id, marche.ville)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer définitivement
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
