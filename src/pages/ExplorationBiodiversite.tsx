import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { useExploration } from '@/hooks/useExplorations';
import { useExplorationBiodiversitySummary } from '@/hooks/useExplorationBiodiversitySummary';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import BiodiversityHeroSection from '@/components/biodiversity/BiodiversityHeroSection';
import BiodiversityTop10Podium from '@/components/biodiversity/BiodiversityTop10Podium';
import BiodiversityGradientRiver from '@/components/biodiversity/BiodiversityGradientRiver';
import EmblematicSpeciesGallery from '@/components/biodiversity/EmblematicSpeciesGallery';
import { BiodiversityMap } from '@/components/biodiversity/BiodiversityMap';
import BiodiversityTransitionRadar from '@/components/biodiversity/BiodiversityTransitionRadar';
import GaspardBorealNarratives from '@/components/biodiversity/GaspardBorealNarratives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExplorationBiodiversite() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: biodiversitySummary, isLoading: summaryLoading } = useExplorationBiodiversitySummary(exploration?.id);
  const { data: marcheurs = [] } = useExplorationMarcheurs(exploration?.id);
  
  const [activeYear, setActiveYear] = useState(2025);
  const [selectedMarcheId, setSelectedMarcheId] = useState<string | null>(null);
  const [selectedMarcheurIds, setSelectedMarcheurIds] = useState<string[]>([]);

  // Get first marche coordinates for map center, or selected marche
  const selectedMarche = selectedMarcheId 
    ? biodiversitySummary?.speciesByMarche.find(m => m.marcheId === selectedMarcheId)
    : null;
  const firstMarcheWithCoords = biodiversitySummary?.speciesByMarche.find(m => m.latitude && m.longitude);
  
  const mapCenter = {
    lat: selectedMarche?.latitude || firstMarcheWithCoords?.latitude || 44.8378,
    lon: selectedMarche?.longitude || firstMarcheWithCoords?.longitude || -0.5792,
  };

  const intelligenceData = null;
  const isLoading = explorationLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center px-4"
        >
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-emerald-200 text-base md:text-lg">Chargement des données de biodiversité...</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration || !biodiversitySummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center px-4">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Exploration non trouvée</h1>
          <Link to="/galerie-fleuve">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build map data
  const mockMapData = {
    location: {
      latitude: mapCenter.lat,
      longitude: mapCenter.lon,
      radius: 10,
    },
    summary: {
      totalSpecies: biodiversitySummary.totalSpecies,
      birds: biodiversitySummary.speciesByKingdom.birds,
      plants: biodiversitySummary.speciesByKingdom.plants,
      fungi: biodiversitySummary.speciesByKingdom.fungi,
      others: biodiversitySummary.speciesByKingdom.others,
      recentObservations: biodiversitySummary.totalSpecies,
    },
    species: biodiversitySummary.topSpecies.map((sp, i) => ({
      id: `sp-${i}`,
      commonName: sp.name,
      scientificName: sp.scientificName,
      family: 'Unknown',
      kingdom: sp.kingdom as 'Plantae' | 'Animalia' | 'Fungi' | 'Other',
      observations: sp.count,
      lastSeen: new Date().toISOString(),
      photos: sp.photos,
      source: 'gbif' as const,
      attributions: [],
    })),
    hotspots: [
      { name: 'Réserve naturelle de la Dordogne', type: 'reserve', distance: 5 },
      { name: 'Zone humide du bec d\'Ambès', type: 'wetland', distance: 12 },
    ],
    methodology: {
      radius: 10,
      dateFilter: 'recent',
      excludedData: [],
      sources: ['gbif', 'inaturalist', 'ebird'],
      confidence: 'high',
    },
  };

  // Mock intelligence data
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
    <div className="bg-slate-950">
      <SEOHead
        title={`Biodiversité | ${exploration.name}`}
        description={`Découvrez les ${biodiversitySummary.totalSpecies.toLocaleString('fr-FR')} espèces identifiées le long de la Dordogne : Top 10, gradient fleuve, carte interactive et récits prospectifs.`}
        canonicalUrl={`${window.location.origin}/galerie-fleuve/exploration/${slug}/biodiversite`}
      />

      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link to={`/galerie-fleuve/exploration/${slug}`}>
          <Button 
            variant="outline" 
            className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-800 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Retour</span>
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
        topSpecies={biodiversitySummary.allSpecies}
        marcheurs={marcheurs}
        selectedMarcheurIds={selectedMarcheurIds}
        onMarcheurSelectionChange={setSelectedMarcheurIds}
      />

      {/* Section 5: Interactive Map with marche selector */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              🗺️ Carte interactive
            </h2>
            <p className="text-base md:text-lg text-slate-400">
              Localisez les observations le long du fleuve
            </p>
          </motion.div>

          {/* Marche selector - Enriched with city and department */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium">Étape :</span>
            </div>
            <Select 
              value={selectedMarcheId || 'all'} 
              onValueChange={(val) => setSelectedMarcheId(val === 'all' ? null : val)}
            >
              <SelectTrigger className="w-full sm:w-80 bg-slate-800/90 border-slate-600 text-white hover:bg-slate-700/80 transition-colors">
                <SelectValue>
                  {selectedMarcheId ? (
                    (() => {
                      const marche = biodiversitySummary.speciesByMarche.find(m => m.marcheId === selectedMarcheId);
                      if (!marche) return 'Toutes les étapes';
                      const formatVille = (v: string | undefined | null) => {
                        if (!v) return 'Étape';
                        return v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
                      };
                      const formatDept = (d: string | undefined | null) => {
                        if (!d) return '';
                        return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
                      };
                      const deptDisplay = formatDept(marche.departement);
                      return (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                            {marche.order}
                          </span>
                          <span className="truncate font-medium">{formatVille(marche.ville)}</span>
                          {deptDisplay && <span className="text-slate-400 text-sm hidden sm:inline">· {deptDisplay}</span>}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-bold">∞</span>
                      <span>Toutes les étapes</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 max-h-80 z-50">
                {/* All stages option */}
                <SelectItem value="all" className="text-white hover:bg-slate-700 py-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-600 text-white text-xs font-bold shrink-0">∞</span>
                    <div>
                      <div className="font-medium">Toutes les étapes</div>
                      <div className="text-sm text-slate-400">
                        {biodiversitySummary.totalSpecies.toLocaleString('fr-FR')} espèces au total
                      </div>
                    </div>
                  </div>
                </SelectItem>
                
                {/* Individual marches */}
                {biodiversitySummary.speciesByMarche.map((marche) => {
                  const formatVille = (v: string | undefined | null) => {
                    if (!v) return 'Étape';
                    return v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
                  };
                  const formatDept = (d: string | undefined | null) => {
                    if (!d) return '';
                    return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
                  };
                  const villeDisplay = formatVille(marche.ville);
                  const deptDisplay = formatDept(marche.departement);
                  return (
                    <SelectItem 
                      key={marche.marcheId} 
                      value={marche.marcheId}
                      className="text-white hover:bg-slate-700 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                          {marche.order}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {villeDisplay}
                          </div>
                          <div className="text-sm text-slate-400 truncate">
                            {deptDisplay ? `${deptDisplay} · ` : ''}{marche.speciesCount.toLocaleString('fr-FR')} esp.
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-700">
            <BiodiversityMap
              data={mockMapData}
              centerLat={mapCenter.lat}
              centerLon={mapCenter.lon}
              isLoading={false}
              marches={biodiversitySummary.speciesByMarche}
              selectedMarcheId={selectedMarcheId}
              biodiversityStats={{
                flora: biodiversitySummary.speciesByKingdom.plants,
                fauna: biodiversitySummary.speciesByKingdom.birds,
                fungi: biodiversitySummary.speciesByKingdom.fungi,
                other: biodiversitySummary.speciesByKingdom.others,
                total: biodiversitySummary.totalSpecies,
              }}
            />
          </div>
        </div>
      </section>

      {/* Section 6: Prospective Radar 2025-2045 */}
      <section className="py-12 md:py-16 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <BiodiversityTransitionRadar
            intelligenceData={mockIntelligenceData}
            activeYear={activeYear}
            onYearChange={setActiveYear}
          />
        </div>
      </section>

      {/* Section 7: Gaspard Boreal Narratives */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950">
        <div className="max-w-7xl mx-auto">
          <GaspardBorealNarratives narratives={mockIntelligenceData.gaspardNarratives} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 bg-slate-950 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-xs md:text-sm">
          Données issues de GBIF, iNaturalist, eBird et Xeno-Canto
        </p>
        <p className="text-slate-600 text-xs mt-2">
          © {new Date().getFullYear()} La Fréquence du Vivant
        </p>
      </footer>
    </div>
  );
}
