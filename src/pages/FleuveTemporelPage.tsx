import React from 'react';
import { motion } from 'framer-motion';
import FleuveTemporel from '../components/FleuveTemporel';
import { useExploration, useExplorationMarches } from '../hooks/useExplorations';
import { transformSupabaseToLegacyFormat } from '../utils/supabaseDataTransformer';

const FleuveTemporelPage: React.FC = () => {
  // Récupérer l'exploration "Fréquences de la rivière Dordogne"
  const { data: exploration, isLoading: explorationLoading } = useExploration('remontee-dordogne-atlas-eaux-vivantes-2025-2045');
  
  // Récupérer les marches de cette exploration
  const { data: explorationMarches = [], isLoading: marchesLoading } = useExplorationMarches(
    exploration?.id || ''
  );

  const isLoading = explorationLoading || marchesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent/80 to-secondary text-primary-foreground">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Chargement du fleuve temporel...</p>
          <p className="text-sm opacity-80 mt-2">
            Exploration : {exploration?.name || 'Fréquences de la rivière Dordogne'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Transformer les données au format legacy pour compatibilité
  const transformedMarches = explorationMarches
    .filter(em => em.marche)
    .map(em => {
      const marche = em.marche!;
      return {
        id: marche.id,
        ville: marche.ville,
        nomMarche: marche.nom_marche,
        date: marche.date,
        departement: marche.departement || '',
        region: marche.region || '',
        theme: marche.theme_principal || '',
        latitude: marche.latitude || 0,
        longitude: marche.longitude || 0,
        descriptifCourt: marche.descriptif_court,
        descriptifLong: marche.descriptif_long,
        // Transformer les photos en array de strings (URLs)
        photos: marche.photos?.map(p => p.url_supabase) || [],
        audioFiles: marche.audio?.map(a => a.url_supabase) || [],
        audioData: marche.audio?.map(a => ({
          id: a.id,
          url: a.url_supabase,
          nom_fichier: a.titre || '',
          titre: a.titre,
          description: a.description,
          duree_secondes: a.duree_secondes,
          ordre: a.ordre
        })) || [],
        videos: marche.videos?.map(v => v.url_supabase) || [],
        // Garder aussi les données complètes des photos pour FleuveTemporel
        photosData: marche.photos || [],
      };
    });

  return <FleuveTemporel explorations={transformedMarches} explorationName={exploration?.name} />;
};

export default FleuveTemporelPage;