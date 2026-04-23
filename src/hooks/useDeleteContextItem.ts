import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MarcheContextUpdate = Database['public']['Tables']['marche_contextes_hybrids']['Update'];

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
 * Utilise le nom de l'élément pour le retrouver plutôt qu'un index (plus fiable)
 */
export const useDeleteContextItem = (onSuccess?: () => void) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteItem = async (params: DeleteItemParams): Promise<boolean> => {
    const { marcheId, opusId, dimension, categoryKey, itemIndex, itemName } = params;
    
    console.log('🗑️ [DELETE] Début suppression avec params:', { marcheId, opusId, dimension, categoryKey, itemIndex, itemName });
    
    setIsDeleting(true);
    
    try {
      // 1. Récupérer l'enregistrement actuel
      console.log('🗑️ [DELETE] Étape 1: Récupération du contexte...');
      const { data: contexte, error: fetchError } = await supabase
        .from('marche_contextes_hybrids')
        .select(dimension)
        .eq('marche_id', marcheId)
        .eq('opus_id', opusId)
        .single();

      if (fetchError) {
        console.error('🗑️ [DELETE] Erreur récupération:', fetchError);
        throw new Error('Impossible de récupérer les données');
      }

      if (!contexte) {
        console.error('🗑️ [DELETE] Contexte non trouvé');
        throw new Error('Contexte non trouvé');
      }

      console.log('🗑️ [DELETE] Contexte récupéré:', JSON.stringify(contexte, null, 2));

      // 2. Naviguer dans la structure JSONB et supprimer l'élément
      const dimensionData = (contexte as any)[dimension];
      if (!dimensionData) {
        console.error('🗑️ [DELETE] Dimension non trouvée:', dimension);
        throw new Error(`Dimension ${dimension} non trouvée`);
      }

      console.log('🗑️ [DELETE] Données de dimension:', JSON.stringify(dimensionData, null, 2));

      // Gérer les différentes structures possibles
      let dataToModify = dimensionData;
      let hasWrappedData = false;
      
      // Check si les données sont wrappées dans 'donnees'
      if (dimensionData.donnees && typeof dimensionData.donnees === 'object') {
        dataToModify = dimensionData.donnees;
        hasWrappedData = true;
        console.log('🗑️ [DELETE] Structure wrappée détectée (donnees)');
      }

      console.log('🗑️ [DELETE] Clés disponibles:', Object.keys(dataToModify));
      console.log('🗑️ [DELETE] Recherche catégorie:', categoryKey);

      // Trouver et supprimer l'élément dans la catégorie (tableau OU objet)
      const categoryValue = (dataToModify as any)[categoryKey];
      let updatedCategoryValue: any;

      if (Array.isArray(categoryValue)) {
        console.log('🗑️ [DELETE] Tableau catégorie trouvé avec', categoryValue.length, 'éléments');
        console.log('🗑️ [DELETE] Index demandé:', itemIndex, '/ Nom:', itemName);

        // Chercher l'élément par nom plutôt que par index (plus fiable)
        let realIndex = -1;
        for (let i = 0; i < categoryValue.length; i++) {
          const item = categoryValue[i];
          const itemTitle =
            item?.nom_vernaculaire || item?.nom_commun || item?.nom || item?.titre || item?.terme || '';
          console.log(`🗑️ [DELETE] Comparaison [${i}]: "${itemTitle}" vs "${itemName}"`);
          if (itemTitle === itemName) {
            realIndex = i;
            break;
          }
        }

        if (realIndex === -1) {
          console.error('🗑️ [DELETE] Élément non trouvé par nom, tentative avec index');
          // Fallback sur l'index si le nom ne correspond pas
          if (itemIndex >= 0 && itemIndex < categoryValue.length) {
            realIndex = itemIndex;
            console.log("🗑️ [DELETE] Utilisation de l'index fourni:", realIndex);
          } else {
            throw new Error(`Élément "${itemName}" non trouvé dans ${categoryKey}`);
          }
        }

        console.log('🗑️ [DELETE] Index réel à supprimer:', realIndex);
        console.log('🗑️ [DELETE] Élément à supprimer:', JSON.stringify(categoryValue[realIndex], null, 2));

        const newArray = [...categoryValue.slice(0, realIndex), ...categoryValue.slice(realIndex + 1)];
        console.log(
          '🗑️ [DELETE] Nouveau tableau:',
          newArray.length,
          'éléments (avant:',
          categoryValue.length,
          ')'
        );

        updatedCategoryValue = newArray;
      } else if (categoryValue && typeof categoryValue === 'object') {
        console.log('🗑️ [DELETE] Catégorie objet détectée (élément unique):', categoryKey);
        const itemTitle =
          (categoryValue as any).nom_vernaculaire ||
          (categoryValue as any).nom_commun ||
          (categoryValue as any).nom ||
          (categoryValue as any).titre ||
          (categoryValue as any).terme ||
          '';
        console.log(`🗑️ [DELETE] Comparaison objet: "${itemTitle}" vs "${itemName}"`);

        if (itemTitle !== itemName) {
          throw new Error(`Élément "${itemName}" non trouvé dans ${categoryKey}`);
        }

        console.log('🗑️ [DELETE] Suppression objet → mise à null');
        updatedCategoryValue = null;
      } else {
        console.error('🗑️ [DELETE] Catégorie non trouvée ou invalide:', categoryKey, categoryValue);
        throw new Error(`Catégorie ${categoryKey} non trouvée ou invalide`);
      }

      // 4. Reconstruire l'objet de dimension
      let updatedDimensionData: any;

      if (hasWrappedData) {
        updatedDimensionData = {
          ...dimensionData,
          donnees: {
            ...dataToModify,
            [categoryKey]: updatedCategoryValue,
          },
        };
      } else {
        updatedDimensionData = {
          ...dimensionData,
          [categoryKey]: updatedCategoryValue,
        };
      }

      console.log('🗑️ [DELETE] Données mises à jour:', JSON.stringify(updatedDimensionData, null, 2));

      // 5. Mettre à jour l'enregistrement
      console.log('🗑️ [DELETE] Étape 5: Mise à jour en base...');
      const updatePayload = {
        [dimension]: updatedDimensionData,
        updated_at: new Date().toISOString()
      } as MarcheContextUpdate;

      const { error: updateError } = await supabase
        .from('marche_contextes_hybrids')
        .update(updatePayload)
        .eq('marche_id', marcheId)
        .eq('opus_id', opusId);

      if (updateError) {
        console.error('🗑️ [DELETE] Erreur mise à jour:', updateError);
        throw new Error('Impossible de mettre à jour les données');
      }

      console.log('🗑️ [DELETE] ✅ Suppression réussie!');

      toast({
        title: 'Élément supprimé',
        description: `"${itemName}" a été supprimé avec succès`,
      });

      onSuccess?.();
      return true;

    } catch (error) {
      console.error('🗑️ [DELETE] ❌ Erreur:', error);
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
