import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import GalerieFleuve from '@/components/GalerieFleuve';
import GalerieFleuveWelcome from '@/components/GalerieFleuveWelcome';
import { useExplorationBySlug, useExplorationMarchesByStatus } from '@/hooks/useExplorations';
import { MarcheTechnoSensible } from '@/types';
import { exploreRegionalThemes } from '@/utils/regionalThemes';

const GalerieFluveExplorationLecteurs: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get('mode') as 'voir' | 'suivre' | 'ecouter' | 'lire' | null;
  const selectedMarcheSlug = searchParams.get('marche');

  const { data: exploration, isLoading: isLoadingExploration, error } = useExplorationBySlug(slug || '');
  const { data: explorationMarches = [], isLoading: isLoadingMarches } = useExplorationMarchesByStatus(
    exploration?.id || '', 
    true // readers mode = true
  );

  // Traitement des données pour les convertir au format attendu
  const processedMarches: MarcheTechnoSensible[] = explorationMarches.map(em => ({
    id: em.marche?.id || '',
    ville: em.marche?.ville || '',
    nom_marche: em.marche?.nom_marche || null,
    date: em.marche?.date || null,
    descriptif_court: em.marche?.descriptif_court || null,
    descriptif_long: em.marche?.descriptif_long || null,
    latitude: em.marche?.latitude || null,
    longitude: em.marche?.longitude || null,
    region: em.marche?.region || null,
    departement: em.marche?.departement || null,
    theme_principal: em.marche?.theme_principal || null,
    sous_themes: em.marche?.sous_themes || [],
    temperature: em.marche?.temperature || null,
    coordonnees: em.marche?.coordonnees || null,
    lien_google_drive: em.marche?.lien_google_drive || null,
    created_at: em.marche?.created_at || '',
    updated_at: em.marche?.updated_at || '',
    photos: em.marche?.photos || [],
    audio: em.marche?.audio || []
  }));

  // Calcul des statistiques
  const stats = {
    marches: processedMarches.length,
    photos: processedMarches.reduce((sum, marche) => sum + (marche.photos?.length || 0), 0),
    regions: new Set(processedMarches.map(marche => marche.region).filter(Boolean)).size
  };

  // Thèmes régionaux basés sur les régions des marches
  const uniqueRegions = [...new Set(processedMarches.map(marche => marche.region).filter(Boolean))];
  const regionalThemes = exploreRegionalThemes(uniqueRegions as string[]);

  // Scroll vers la galerie si une marche spécifique est ciblée
  useEffect(() => {
    if (selectedMarcheSlug && processedMarches.length > 0) {
      const targetElement = document.getElementById(`marche-${selectedMarcheSlug}`);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1000);
      }
    }
  }, [selectedMarcheSlug, processedMarches.length]);

  if (isLoadingExploration || isLoadingMarches) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gaspard-primary rounded-full animate-gentle-float"></div>
            <div className="w-2 h-2 bg-gaspard-secondary rounded-full animate-gentle-float animation-delay-300"></div>
            <div className="w-2 h-2 bg-gaspard-accent rounded-full animate-gentle-float animation-delay-600"></div>
          </div>
          <p className="text-gaspard-muted font-light">Révélation de l'exploration lecteurs...</p>
        </div>
      </div>
    );
  }

  if (error || !exploration) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-background via-gaspard-background/95 to-gaspard-background/90"></div>
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <Sparkles className="h-16 w-16 text-gaspard-accent/40 mx-auto mb-6 animate-soft-pulse" />
          <h3 className="gaspard-main-title text-xl font-semibold text-gaspard-primary mb-4">
            Exploration introuvable
          </h3>
          <p className="text-gaspard-muted mb-8 font-light leading-relaxed">
            Cette exploration n'existe pas ou n'est pas encore accessible aux lecteurs
          </p>
          <Button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90 text-white rounded-2xl px-8 py-3 shadow-lg shadow-gaspard-primary/20 hover:shadow-xl hover:shadow-gaspard-primary/30 transition-all duration-300 hover:scale-105 border-0"
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${exploration.name} - Galerie Lecteurs - La Fréquence du Vivant`}
        description={exploration.description || `Découvrez progressivement l'exploration "${exploration.name}" dans sa version accessible aux lecteurs`}
        keywords={exploration.meta_keywords?.join(', ') || 'exploration, lecteurs'}
      />

      <div className="min-h-screen relative overflow-hidden">
        {/* Composants conditionnels selon le mode */}
        {!viewMode || !selectedMarcheSlug ? (
          <GalerieFleuveWelcome
            marches={processedMarches}
            stats={stats}
            themes={regionalThemes}
            viewMode="voir"
            isReadersMode={true}
          />
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <GalerieFleuve
            title={exploration.name}
            marches={processedMarches}
            stats={stats}
            themes={regionalThemes}
            viewMode={viewMode}
            isReadersMode={true}
          />
        </motion.div>
      </div>
    </>
  );
};

export default GalerieFluveExplorationLecteurs;