import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { useExploration } from '@/hooks/useExplorations';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import { useBiodiversityIntelligence } from '@/hooks/useBiodiversityIntelligence';
import BiodiversityHeroSection from '@/components/biodiversity/BiodiversityHeroSection';
import BiodiversityTop10Podium from '@/components/biodiversity/BiodiversityTop10Podium';
import BiodiversityGradientRiver from '@/components/biodiversity/BiodiversityGradientRiver';
import EmblematicSpeciesGallery from '@/components/biodiversity/EmblematicSpeciesGallery';
import { BiodiversityMap } from '@/components/biodiversity/BiodiversityMap';
import BiodiversityTransitionRadar from '@/components/biodiversity/BiodiversityTransitionRadar';
import GaspardBorealNarratives from '@/components/biodiversity/GaspardBorealNarratives';

export default function ExplorationBiodiversite() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: biodiversitySummary, isLoading: summaryLoading } = useExplorationBiodiversitySummary(exploration?.id);
  
  // Get first marche coordinates for map center
  const firstMarcheWithCoords = biodiversitySummary?.speciesByMarche.find(m => m.latitude && m.longitude);
  const mapCenter = {
    lat: firstMarcheWithCoords?.latitude || 44.8378,
    lon: firstMarcheWithCoords?.longitude || -0.5792,
  };

  // Get biodiversity intelligence for radar (disabled for now - use mock data)
  const intelligenceData = null;
  const [activeYear, setActiveYear] = useState(2025);

  const [activeYear, setActiveYear] = useState(2025);

  const isLoading = explorationLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-teal-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-emerald-200 text-lg">Chargement des données de biodiversité...</p>
          <p className="text-emerald-300/60 text-sm mt-2">Analyse de 13 800+ espèces en cours</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration || !biodiversitySummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Exploration non trouvée</h1>
          <Link to="/galerie-fleuve">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mock biodiversity data for the map (should come from actual data in production)
  const mockMapData = {
    location: {
      latitude: mapCenter.lat,
      longitude: mapCenter.lon,
      radius: 10,
      locationName: exploration.name,
    },
    summary: {
      totalSpecies: biodiversitySummary.totalSpecies,
      floraCount: biodiversitySummary.speciesByKingdom.plants,
      faunaCount: biodiversitySummary.speciesByKingdom.birds + biodiversitySummary.speciesByKingdom.others,
      fungiCount: biodiversitySummary.speciesByKingdom.fungi,
      biodiversityIndex: 0.85,
    },
    species: biodiversitySummary.topSpecies.map((sp, i) => ({
      id: `sp-${i}`,
      commonName: sp.name,
      scientificName: sp.scientificName,
      kingdom: sp.kingdom,
      observationCount: sp.count,
      photos: sp.photos,
      attributions: [],
      source: 'gbif' as const,
    })),
  };

  // Mock intelligence data for radar
  const mockIntelligenceData = intelligenceData || {
    signals: [
      {
        species: 'Hirondelle rustique',
        signalType: 'new_arrival' as const,
        strength: 0.85,
        trend: 'increasing' as const,
        prediction: {
          likelihood2035: 0.7,
          likelihood2045: 0.9,
          migrationDirection: 'Nord',
          estimatedDistance: 150,
        },
      },
      {
        species: 'Loutre d\'Europe',
        signalType: 'population_decline' as const,
        strength: 0.6,
        trend: 'stable' as const,
        prediction: {
          likelihood2035: 0.5,
          likelihood2045: 0.4,
        },
      },
    ],
    territorialAlerts: [
      {
        id: 'alert-1',
        title: 'Sécheresse prolongée',
        description: 'Impact sur les populations de poissons migrateurs',
        severity: 'warning' as const,
        timeline: '2-5years' as const,
        stakeholders: ['Pêcheurs', 'Écologistes'],
        actionRequired: true,
      },
    ],
    ecosystemTransition: {
      currentType: 'Forêt alluviale tempérée',
      futureType2035: 'Forêt mixte méditerranéenne',
      futureType2045: 'Garrigue et maquis',
      transitionProbability: 0.65,
      conservationActions: [
        {
          action: 'Préserver les corridors écologiques',
          priority: 'immediate' as const,
          expectedOutcome: 'Maintien de la connectivité',
        },
        {
          action: 'Restaurer les zones humides',
          priority: 'short_term' as const,
          expectedOutcome: 'Refuge pour espèces sensibles',
        },
      ],
    },
    citizenContributions: {
      totalObservations: 15420,
      validatedObservations: 12350,
      topContributors: [
        { username: 'naturalist_dordogne', observations: 1250, validationScore: 0.95 },
        { username: 'birdwatcher24', observations: 890, validationScore: 0.88 },
      ],
    },
    climateThresholds: biodiversitySummary.topSpecies.slice(0, 5).map(sp => ({
      species: sp.name,
      currentTemp: 12,
      maxTolerance: 18,
      criticalYear: 2038,
    })),
    gaspardNarratives: [
      {
        id: 'narrative-1',
        type: 'future_chronicle' as const,
        title: 'La Dordogne de 2045',
        story: 'En cette année 2045, la rivière a changé de visage. Les hirondelles, autrefois rares, nichent maintenant sous chaque pont...',
        species: 'Hirondelle rustique',
        location: 'Bergerac',
        mood: 'hopeful' as const,
        futureYear: 2045,
        readingTime: 5,
        callToAction: {
          actionType: 'observe' as const,
          message: 'Participez au suivi des hirondelles',
          link: 'https://www.oiseaux.net/',
        },
      },
      {
        id: 'narrative-2',
        type: 'ecosystem_story' as const,
        title: 'Les gardiens du fleuve',
        story: 'Dans les méandres de la Dordogne, une communauté de loutres a reconquis son territoire ancestral...',
        species: 'Loutre d\'Europe',
        location: 'Argentat',
        mood: 'inspiring' as const,
        readingTime: 4,
        callToAction: {
          actionType: 'protect' as const,
          message: 'Soutenez la protection des loutres',
          link: 'https://www.lpo.fr/',
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title={`Biodiversité | ${exploration.name}`}
        description={`Découvrez les ${biodiversitySummary.totalSpecies.toLocaleString('fr-FR')} espèces identifiées le long de la Dordogne : Top 10, gradient fleuve, carte interactive et récits prospectifs.`}
        canonicalUrl={`${window.location.origin}/galerie-fleuve/exploration/${slug}/biodiversite`}
      />

      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link to={`/galerie-fleuve/exploration/${slug}`}>
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm shadow-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Section 1: Hero with animated counter */}
      <BiodiversityHeroSection
        totalSpecies={biodiversitySummary.totalSpecies}
        totalMarches={biodiversitySummary.totalMarches}
        speciesByKingdom={biodiversitySummary.speciesByKingdom}
      />

      {/* Section 2: Top 10 Podium */}
      <BiodiversityTop10Podium species={biodiversitySummary.topSpecies} />

      {/* Section 3: Biodiversity Gradient River */}
      <BiodiversityGradientRiver data={biodiversitySummary.gradientData} />

      {/* Section 4: Emblematic Species Gallery */}
      <EmblematicSpeciesGallery
        speciesByMarche={biodiversitySummary.speciesByMarche}
        topSpecies={biodiversitySummary.topSpecies}
      />

      {/* Section 5: Interactive Map */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              🗺️ Carte interactive
            </h2>
            <p className="text-lg text-slate-600">
              Localisez les observations le long du fleuve
            </p>
          </motion.div>

          <BiodiversityMap
            data={mockMapData}
            centerLat={mapCenter.lat}
            centerLon={mapCenter.lon}
            isLoading={false}
          />
        </div>
      </section>

      {/* Section 6: Prospective Radar 2025-2045 */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <BiodiversityTransitionRadar
            intelligenceData={mockIntelligenceData}
            activeYear={activeYear}
            onYearChange={setActiveYear}
          />
        </div>
      </section>

      {/* Section 7: Gaspard Boreal Narratives */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <GaspardBorealNarratives narratives={mockIntelligenceData.gaspardNarratives} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-center">
        <p className="text-slate-400 text-sm">
          Données issues de GBIF, iNaturalist, eBird et Xeno-Canto
        </p>
        <p className="text-slate-500 text-xs mt-2">
          © {new Date().getFullYear()} La Fréquence du Vivant
        </p>
      </footer>
    </>
  );
}
