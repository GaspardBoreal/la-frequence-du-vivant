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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExplorationBiodiversite() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: biodiversitySummary, isLoading: summaryLoading } = useExplorationBiodiversitySummary(exploration?.id);
  const { data: marcheurs = [] } = useExplorationMarcheurs(exploration?.id);
  
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

  return (
    <div className="bg-slate-950">
      <SEOHead
        title={`Biodiversité | ${exploration.name}`}
        description={`Découvrez les ${biodiversitySummary.totalSpecies.toLocaleString('fr-FR')} espèces identifiées le long de la Dordogne : Top 10, gradient fleuve, galerie emblématique et carte interactive.`}
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
        explorationId={exploration?.id}
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

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 bg-slate-950 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-xs md:text-sm">
          Données issues de GBIF, iNaturalist, eBird et Xeno-Canto
        </p>
        <p className="text-slate-600 text-xs mt-2">
          © 2025 - 2026 La Fréquence du Vivant
        </p>
      </footer>
    </div>
  );
}
