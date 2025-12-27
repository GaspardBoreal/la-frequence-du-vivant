import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DimensionType = 
  | 'especes_caracteristiques' 
  | 'vocabulaire_local' 
  | 'technodiversite' 
  | 'empreintes_humaines' 
  | 'ia_fonctionnalites' 
  | 'leviers_agroecologiques' 
  | 'nouvelles_activites'
  | 'projection_2035_2045';

export interface DeleteItemParams {
  marcheId: string;
  opusId: string;
  dimension: DimensionType;
  categoryKey: string; // ex: 'especes_vegetales', 'termes_locaux', etc.
  itemIndex: number;
  itemName: string;
}

/**
 * Hook pour supprimer un élément individuel d'un contexte JSONB
 */
export const useDeleteContextItem = (onSuccess?: () => void) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteItem = async (params: DeleteItemParams): Promise<boolean> => {
    const { marcheId, opusId, dimension, categoryKey, itemIndex, itemName } = params;
    
    setIsDeleting(true);
    
    try {
      // 1. Récupérer l'enregistrement actuel
      const { data: contexte, error: fetchError } = await supabase
        .from('marche_contextes_hybrids')
        .select(dimension)
        .eq('marche_id', marcheId)
        .eq('opus_id', opusId)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du contexte:', fetchError);
        throw new Error('Impossible de récupérer les données');
      }

      if (!contexte) {
        throw new Error('Contexte non trouvé');
      }

      // 2. Naviguer dans la structure JSONB et supprimer l'élément
      const dimensionData = (contexte as any)[dimension];
      if (!dimensionData) {
        throw new Error(`Dimension ${dimension} non trouvée`);
      }

      // Gérer les différentes structures possibles
      let dataToModify = dimensionData;
      let hasWrappedData = false;
      
      // Check si les données sont wrappées dans 'donnees'
      if (dimensionData.donnees && typeof dimensionData.donnees === 'object') {
        dataToModify = dimensionData.donnees;
        hasWrappedData = true;
      }

      // Trouver le tableau correspondant à la catégorie
      const categoryArray = dataToModify[categoryKey];
      
      if (!Array.isArray(categoryArray)) {
        console.error(`La catégorie ${categoryKey} n'est pas un tableau:`, categoryArray);
        throw new Error(`Catégorie ${categoryKey} non trouvée ou invalide`);
      }

      if (itemIndex < 0 || itemIndex >= categoryArray.length) {
        throw new Error(`Index ${itemIndex} hors limites (0-${categoryArray.length - 1})`);
      }

      // 3. Créer le nouveau tableau sans l'élément
      const newArray = [
        ...categoryArray.slice(0, itemIndex),
        ...categoryArray.slice(itemIndex + 1)
      ];

      // 4. Reconstruire l'objet de dimension
      let updatedDimensionData: any;
      
      if (hasWrappedData) {
        updatedDimensionData = {
          ...dimensionData,
          donnees: {
            ...dataToModify,
            [categoryKey]: newArray
          }
        };
      } else {
        updatedDimensionData = {
          ...dimensionData,
          [categoryKey]: newArray
        };
      }

      // 5. Mettre à jour l'enregistrement
      const { error: updateError } = await supabase
        .from('marche_contextes_hybrids')
        .update({ 
          [dimension]: updatedDimensionData,
          updated_at: new Date().toISOString()
        })
        .eq('marche_id', marcheId)
        .eq('opus_id', opusId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        throw new Error('Impossible de mettre à jour les données');
      }

      toast({
        title: 'Élément supprimé',
        description: `"${itemName}" a été supprimé avec succès`,
      });

      onSuccess?.();
      return true;

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur de suppression',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteItem, isDeleting };
};
