import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, MapPin, Clock, Palette } from 'lucide-react';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import GalerieFleuve from '@/components/GalerieFleuve';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import { extractPhotosFromGoogleDrive, PhotoData } from '@/utils/googleDriveApi';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { RegionalTheme } from '@/utils/regionalThemes';

export default function GalerieFluveExploration() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: explorationMarches, isLoading: marchesLoading } = useExplorationMarches(exploration?.id || '');
  
  const [marchesTechnoSensibles, setMarchesTechnoSensibles] = useState<MarcheTechnoSensible[]>([]);
  const [themes, setThemes] = useState<RegionalTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    marches: 0,
    photos: 0,
    regions: 0,
  });

  // Convertir les marches d'exploration en format compatible avec GalerieFleuve
  useEffect(() => {
    const convertMarches = async () => {
      if (!explorationMarches) return;
      
      setIsLoading(true);
      
      const converted: MarcheTechnoSensible[] = [];
      const uniqueRegions = new Set<string>();
      let totalPhotos = 0;

      for (const expMarche of explorationMarches) {
        if (!expMarche.marche) continue;
        
        const marche = expMarche.marche;
        
        // Compter les photos depuis Supabase
        const photosCount = marche.photos?.length || 0;
        totalPhotos += photosCount;
        
        if (marche.region) {
          uniqueRegions.add(marche.region);
        }

        const convertedMarche: MarcheTechnoSensible = {
          ville: marche.ville,
          nomMarche: marche.nom_marche || `Marche de ${marche.ville}`,
          date: marche.date || '',
          descriptifCourt: marche.descriptif_court || '',
          descriptifLong: marche.descriptif_long || '',
          latitude: marche.latitude || 0,
          longitude: marche.longitude || 0,
          region: marche.region || '',
          departement: marche.departement || '',
          theme: marche.theme_principal || '',
          sousThemes: marche.sous_themes || [],
          lien: '', // Pas de Google Drive pour les explorations
          temperature: 0,
          id: marche.id,
          photos: marche.photos?.map(p => p.url_supabase) || [],
        };
        
        converted.push(convertedMarche);
      }

        // Générer les thèmes pour toutes les régions
        const regionThemes: RegionalTheme[] = Array.from(uniqueRegions).map(region => ({
          name: region,
          colors: {
            primary: 'hsl(220, 70%, 50%)',
            secondary: 'hsl(220, 30%, 70%)',
            accent: 'hsl(220, 90%, 60%)',
            background: 'hsl(220, 10%, 95%)',
          },
        }));

      setMarchesTechnoSensibles(converted);
      setThemes(regionThemes);
      setStats({
        marches: converted.length,
        photos: totalPhotos,
        regions: uniqueRegions.size,
      });
      setIsLoading(false);
    };

    if (explorationMarches) {
      convertMarches();
    }
  }, [explorationMarches]);

  if (explorationLoading || marchesLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
        <span className="ml-4 text-lg">Préparation de la galerie fleuve...</span>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Exploration non trouvée</h1>
          <Link to="/explorations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux explorations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = `Galerie Fleuve · ${exploration.name}`;
  const description = exploration.description || `Découvrez la galerie fleuve immersive de l'exploration ${exploration.name} avec ${stats.marches} marches et ${stats.photos} visuels géopoétiques.`;
  const canonical = `${window.location.origin}/galerie-fleuve/exploration/${exploration.slug}`;

  return (
    <>
      <SEOHead 
        title={title.slice(0, 58)} 
        description={description.slice(0, 158)} 
        canonicalUrl={canonical}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10">
        {/* Header personnalisé pour l'exploration */}
        <motion.header 
          className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-accent/80 to-secondary/70 text-primary-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Particules décoratives */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

            <div className="relative container mx-auto px-4 py-8">
              <div className="flex justify-end items-start mb-6">
                <Badge className="bg-white/20 text-primary-foreground border-white/30">
                  <Palette className="h-3 w-3 mr-1" />
                  Galerie Fleuve
                </Badge>
              </div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {exploration.name}
              </h1>
              {exploration.description && (
                <div 
                  className="text-lg md:text-xl opacity-90 max-w-3xl mb-6 prose prose-xl prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: exploration.description }}
                />
              )}
            </motion.div>

            {/* Statistiques spécifiques à l'exploration */}
            <motion.div 
              className="grid grid-cols-3 gap-4 max-w-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{stats.marches}</span>
                </div>
                <p className="text-sm opacity-80">
                  {stats.marches > 1 ? 'Marches' : 'Marche'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Camera className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{stats.photos}</span>
                </div>
                <p className="text-sm opacity-80">Visuels</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{stats.regions}</span>
                </div>
                <p className="text-sm opacity-80">
                  {stats.regions > 1 ? 'Régions' : 'Région'}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Instructions pour mobile */}
        <motion.section 
          className="bg-muted/30 px-4 py-6 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="container mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Explorez les modes de vue en bas d'écran • Balayez pour naviguer
            </p>
          </div>
        </motion.section>

        {/* Galerie principale adaptée à l'exploration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <GalerieFleuve 
            explorations={marchesTechnoSensibles} 
            themes={themes}
          />
        </motion.div>
      </div>
    </>
  );
}