import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Edit, Trash2, Calendar, MapPin, MoreVertical } from 'lucide-react';
import { MarcheTechnoSensible } from '../../../utils/googleSheetsApi';
import { deleteMarche } from '../../../utils/supabaseMarcheOperations';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { stripHtml, truncateWords } from '../../../utils/textUtils';

interface MarcheListMobileProps {
  marches: MarcheTechnoSensible[];
  onEdit: (marcheId: string) => void;
  onDelete?: () => void;
}

const MarcheListMobile: React.FC<MarcheListMobileProps> = ({
  marches,
  onEdit,
  onDelete
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (marcheId: string, ville: string) => {
    if (deletingId) return;
    setDeletingId(marcheId);
    
    try {
      await deleteMarche(marcheId);
      toast.success(`Marche "${ville}" supprimée`);
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const frenchMonthsPattern = /(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i;
    if (frenchMonthsPattern.test(dateString)) {
      return dateString;
    }

    const cleanDate = dateString.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return dateString;
    }
    
    try {
      const [year, month, day] = cleanDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (marches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2 text-foreground font-bold text-xl">Aucune marche trouvée</h3>
        <p className="text-center text-muted-foreground text-sm">
          Utilisez les filtres ou créez une nouvelle marche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {marches.map((marche) => (
        <div key={marche.id} className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {marche.ville}
              </h3>
              {marche.nomMarche && (
                <p className="text-sm text-muted-foreground truncate">
                  {marche.nomMarche}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(marche.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Supprimer la marche "{marche.ville}" ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(marche.id, marche.ville)} 
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{marche.departement}</span>
              </div>
              {marche.region && (
                <Badge variant="outline" className="text-xs">
                  {marche.region}
                </Badge>
              )}
            </div>

            {marche.date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(marche.date)}</span>
              </div>
            )}

            {marche.descriptifCourt && (
              <p className="text-sm text-foreground line-clamp-2">
                {truncateWords(stripHtml(marche.descriptifCourt), 20)}
              </p>
            )}
          </div>

          {/* Indicateurs de contenu */}
          <div className="flex flex-wrap gap-1">
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
          </div>

          {/* Tags */}
          {marche.supabaseTags && marche.supabaseTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {marche.supabaseTags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {marche.supabaseTags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{marche.supabaseTags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MarcheListMobile;