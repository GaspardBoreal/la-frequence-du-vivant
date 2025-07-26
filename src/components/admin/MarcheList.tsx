
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import { Edit, Trash2, MapPin, Calendar, Thermometer, Image, Volume2 } from 'lucide-react';
import { MarcheTechnoSensible } from '../../utils/googleSheetsApi';
import { deleteMarche } from '../../utils/supabaseMarcheOperations';
import { toast } from 'sonner';

interface MarcheListProps {
  marches: MarcheTechnoSensible[];
  isLoading: boolean;
  onEdit: (marcheId: string) => void;
}

const MarcheList: React.FC<MarcheListProps> = ({
  marches,
  isLoading,
  onEdit
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (marcheId: string, ville: string) => {
    setDeletingId(marcheId);
    try {
      await deleteMarche(marcheId);
      toast.success(`La marche de ${ville} a été supprimée avec succès`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la marche');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>;
  }

  if (marches.length === 0) {
    return <div className="text-center py-12">
        <h3 className="mb-2 text-slate-50 font-bold text-3xl">Aucune marche trouvée</h3>
        <p className="text-center text-gray-50">Commencez par créer votre première marche (bouton en haut à gauche)</p>
      </div>;
  }

  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Marches existantes ({marches.length})</h2>
      </div>

      <div className="grid gap-4">
        {marches.map(marche => <div key={marche.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{marche.ville}</h3>
                  {marche.region && <Badge variant="outline" className="text-xs">
                      {marche.region}
                    </Badge>}
                </div>

                {marche.theme && <p className="text-sm text-gray-600 mb-2 font-medium">{marche.theme}</p>}

                {marche.descriptifCourt && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{marche.descriptifCourt}</p>}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {marche.date && <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {marche.date}
                    </div>}
                  {marche.temperature !== undefined && <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-1" />
                      {marche.temperature}°C
                    </div>}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {marche.latitude?.toFixed(4)}, {marche.longitude?.toFixed(4)}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-2">
                  {marche.photos && marche.photos.length > 0 && <div className="flex items-center text-sm text-blue-600">
                      <Image className="h-4 w-4 mr-1" />
                      {marche.photos.length} photos
                    </div>}
                  {marche.audioFiles && marche.audioFiles.length > 0 && <div className="flex items-center text-sm text-green-600">
                      <Volume2 className="h-4 w-4 mr-1" />
                      {marche.audioFiles.length} sons
                    </div>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(marche.id)} className="flex items-center">
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center text-red-600 hover:text-red-700"
                      disabled={deletingId === marche.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingId === marche.id ? 'Suppression...' : 'Supprimer'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la marche de <strong>{marche.ville}</strong> ?
                        Cette action est irréversible et supprimera également tous les médias associés 
                        (photos, vidéos, audios, documents).
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
          </div>)}
      </div>
    </div>;
};

export default MarcheList;
