import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TreePine, 
  Bird, 
  Flower2, 
  Bug, 
  MapPin, 
  Filter, 
  Eye,
  X,
  ExternalLink,
  Calendar,
  User,
  Building,
  Navigation
} from 'lucide-react';
import L from 'leaflet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { BiodiversityData, BiodiversitySpecies } from '@/types/biodiversity';
import SpeciesDetailModal from './SpeciesDetailModal';
import 'leaflet/dist/leaflet.css';

interface MarcheLocation {
  marcheId: string;
  marcheName: string;
  speciesCount: number;
  order: number;
  latitude?: number;
  longitude?: number;
}

interface BiodiversityMapProps {
  data: BiodiversityData;
  centerLat: number;
  centerLon: number;
  isLoading?: boolean;
  marches?: MarcheLocation[];
  selectedMarcheId?: string | null;
  biodiversityStats?: {
    flora: number;
    fauna: number;
    fungi: number;
    other: number;
    total: number;
  };
}

// Type pour les clusters de données
interface ObservationCluster {
  id: string;
  lat: number;
  lng: number;
  species: BiodiversitySpecies[];
  count: number;
  mainKingdom: string;
}

// Composant pour ajuster la vue de la carte
const MapViewController: React.FC<{ 
  clusters: ObservationCluster[]; 
  center: [number, number];
  marches?: MarcheLocation[];
  selectedMarcheId?: string | null;
}> = ({ clusters, center, marches = [], selectedMarcheId }) => {
  const map = useMap();
  
  useEffect(() => {
    const group = new L.FeatureGroup();
    
    // Si une marche spécifique est sélectionnée, zoomer dessus
    if (selectedMarcheId) {
      const selectedMarche = marches.find(m => m.marcheId === selectedMarcheId);
      if (selectedMarche?.latitude && selectedMarche?.longitude) {
        map.setView([selectedMarche.latitude, selectedMarche.longitude], 12);
        return;
      }
    }
    
    // Ajouter toutes les marches aux bounds
    marches.forEach(marche => {
      if (marche.latitude && marche.longitude) {
        group.addLayer(L.marker([marche.latitude, marche.longitude]));
      }
    });
    
    // Ajouter les clusters aux bounds
    clusters.forEach(cluster => {
      group.addLayer(L.marker([cluster.lat, cluster.lng]));
    });
    
    // Si on a des points, ajuster la vue
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else {
      map.setView(center, 8);
    }
  }, [clusters, center, marches, selectedMarcheId, map]);
  
  return null;
};

// Création des icônes personnalisées pour chaque royaume
const createCustomIcon = (kingdom: string, count: number, isSelected: boolean = false) => {
  const getKingdomColor = (k: string) => {
    switch (k) {
      case 'Plantae': return { bg: '#10b981', border: '#065f46', icon: '🌿' };
      case 'Animalia': return { bg: '#3b82f6', border: '#1e40af', icon: '🐦' };
      case 'Fungi': return { bg: '#8b5cf6', border: '#5b21b6', icon: '🍄' };
      default: return { bg: '#6b7280', border: '#374151', icon: '🔬' };
    }
  };

  const { bg, border, icon } = getKingdomColor(kingdom);
  const size = Math.min(Math.max(20 + (count * 2), 24), 48);
  const selectedClass = isSelected ? 'ring-4 ring-white ring-opacity-70 shadow-2xl' : 'shadow-lg';
  
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-full h-full ${selectedClass} rounded-full transition-all duration-300 animate-pulse" 
           style="background: ${bg}; border: 3px solid ${border}; width: ${size}px; height: ${size}px;">
        <span style="font-size: ${size * 0.4}px;">${icon}</span>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Création des icônes pour les marches
const createMarcheIcon = (order: number, speciesCount: number, isSelected: boolean = false) => {
  const size = Math.min(Math.max(36 + Math.log10(speciesCount + 1) * 8, 36), 52);
  const selectedClass = isSelected ? 'ring-4 ring-yellow-400' : '';
  
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-center ${selectedClass} rounded-full shadow-lg transition-all duration-300" 
           style="background: linear-gradient(135deg, #10b981, #059669); width: ${size}px; height: ${size}px; border: 3px solid white;">
        <span style="font-size: 14px; color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${order}</span>
      </div>
    `,
    className: 'marche-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const BiodiversityMap: React.FC<BiodiversityMapProps> = ({ 
  data, 
  centerLat, 
  centerLon, 
  isLoading,
  marches = [],
  selectedMarcheId,
  biodiversityStats
}) => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['flora', 'fauna', 'fungi', 'other']));
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<number>(data?.location?.radius || 5);
  const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<BiodiversitySpecies | null>(null);
  
  // Création des clusters d'observations
  const observationClusters = useMemo(() => {
    if (!data?.species) return [];
    
    const clusters = new Map<string, ObservationCluster>();
    
    data.species.forEach(species => {
      // Filtrage par catégorie (sélection multiple)
      const speciesCategory = 
        species.kingdom === 'Plantae' ? 'flora' :
        species.kingdom === 'Animalia' ? 'fauna' :
        species.kingdom === 'Fungi' ? 'fungi' : 'other';
      
      if (!activeFilters.has(speciesCategory)) return;
      
      species.attributions?.forEach(attribution => {
        if (attribution.exactLatitude && attribution.exactLongitude) {
          // Créer un ID unique basé sur les coordonnées arrondies (pour grouper les observations proches)
          const roundedLat = Math.round(attribution.exactLatitude * 1000) / 1000;
          const roundedLng = Math.round(attribution.exactLongitude * 1000) / 1000;
          const clusterId = `${roundedLat}_${roundedLng}`;
          
          if (!clusters.has(clusterId)) {
            clusters.set(clusterId, {
              id: clusterId,
              lat: roundedLat,
              lng: roundedLng,
              species: [],
              count: 0,
              mainKingdom: species.kingdom
            });
          }
          
          const cluster = clusters.get(clusterId)!;
          if (!cluster.species.find(s => s.id === species.id)) {
            cluster.species.push(species);
            cluster.count += 1;
          }
        }
      });
    });
    
    return Array.from(clusters.values());
  }, [data?.species, activeFilters]);

  // Statistiques filtrées - utiliser les stats passées en prop si disponibles
  const filteredStats = useMemo(() => {
    // Si les stats sont passées en props (données de la BDD), les utiliser en priorité
    if (biodiversityStats) {
      return {
        total: biodiversityStats.total,
        observations: biodiversityStats.total,
        flora: biodiversityStats.flora,
        fauna: biodiversityStats.fauna,
        fungi: biodiversityStats.fungi,
        other: biodiversityStats.other,
      };
    }
    
    // Sinon, fallback sur le calcul depuis les clusters
    return {
      total: observationClusters.length,
      observations: observationClusters.reduce((sum, cluster) => sum + cluster.count, 0),
      flora: observationClusters.filter(c => c.mainKingdom === 'Plantae').length,
      fauna: observationClusters.filter(c => c.mainKingdom === 'Animalia').length,
      fungi: observationClusters.filter(c => c.mainKingdom === 'Fungi').length,
      other: observationClusters.filter(c => !['Plantae', 'Animalia', 'Fungi'].includes(c.mainKingdom)).length,
    };
  }, [observationClusters, biodiversityStats]);

  const center: [number, number] = [centerLat, centerLon];
  
  if (isLoading) {
    return (
      <div className="w-full h-[600px] rounded-lg bg-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des données de biodiversité...</p>
        </div>
      </div>
    );
  }

  const toggleFilter = (filterKey: string) => {
    if (filterKey === 'all') {
      if (activeFilters.size === 4) {
        setActiveFilters(new Set()); // Tout désélectionner
      } else {
        setActiveFilters(new Set(['flora', 'fauna', 'fungi', 'other'])); // Tout sélectionner
      }
    } else {
      const newFilters = new Set(activeFilters);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      setActiveFilters(newFilters);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres et contrôles */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card/50 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes', icon: MapPin, count: filteredStats.total },
            { key: 'flora', label: 'Flore', icon: TreePine, count: filteredStats.flora },
            { key: 'fauna', label: 'Faune', icon: Bird, count: filteredStats.fauna },
            { key: 'fungi', label: 'Champignons', icon: Flower2, count: filteredStats.fungi },
            { key: 'other', label: 'Autres', icon: Bug, count: filteredStats.other },
          ].map(({ key, label, icon: Icon, count }) => {
            const isActive = key === 'all' 
              ? activeFilters.size === 4 
              : activeFilters.has(key);
            
            return (
              <Button
                key={key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter(key)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredStats.observations} observations
          </span>
        </div>
      </div>

      {/* Carte interactive */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
        {/* Légende interactive */}
        <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Légende
            <span className="text-xs text-muted-foreground ml-auto">
              ({activeFilters.size}/4)
            </span>
          </h4>
          <div className="space-y-1">
            {[
              { kingdom: 'all', filterKey: 'all', label: 'Toutes', color: '#64748b', icon: '🗺️' },
              { kingdom: 'Plantae', filterKey: 'flora', label: 'Flore', color: '#10b981', icon: '🌿' },
              { kingdom: 'Animalia', filterKey: 'fauna', label: 'Faune', color: '#3b82f6', icon: '🐦' },
              { kingdom: 'Fungi', filterKey: 'fungi', label: 'Champignons', color: '#8b5cf6', icon: '🍄' },
              { kingdom: 'Other', filterKey: 'other', label: 'Autres', color: '#6b7280', icon: '🔬' },
            ].map(({ kingdom, filterKey, label, color, icon }) => {
              const isActive = filterKey === 'all' 
                ? activeFilters.size === 4 
                : activeFilters.has(filterKey);
              
              return (
                <button
                  key={kingdom}
                  onClick={() => toggleFilter(filterKey)}
                  className={`flex items-center gap-2 text-xs w-full p-1.5 rounded transition-all duration-200 hover:bg-muted/50 ${
                    isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isActive ? 'scale-100 shadow-sm' : 'scale-90'
                    }`}
                    style={{ 
                      backgroundColor: isActive ? color : 'transparent', 
                      borderColor: color 
                    }}
                  >
                    <span style={{ fontSize: '8px' }}>{icon}</span>
                  </div>
                  <span className={`transition-colors duration-200 ${
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                  {filterKey !== 'all' && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {filterKey === 'flora' ? filteredStats.flora : 
                       filterKey === 'fauna' ? filteredStats.fauna :
                       filterKey === 'fungi' ? filteredStats.fungi : 
                       filteredStats.other}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0"
          key={`biodiversity-map-${center[0]}-${center[1]}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <ZoomControl position="topright" />
          <MapViewController 
            clusters={observationClusters} 
            center={center} 
            marches={marches}
            selectedMarcheId={selectedMarcheId}
          />
          
          {/* Marqueurs des marches */}
          {marches
            .filter(m => m.latitude && m.longitude)
            .map((marche) => (
              <Marker
                key={`marche-${marche.marcheId}`}
                position={[marche.latitude!, marche.longitude!]}
                icon={createMarcheIcon(marche.order, marche.speciesCount, selectedMarcheId === marche.marcheId)}
              >
                <Popup>
                  <div className="text-center p-2 min-w-[180px]">
                    <h4 className="font-bold text-lg text-slate-800">{marche.marcheName.split(' - ')[0]}</h4>
                    <p className="text-emerald-600 font-semibold text-base">
                      {marche.speciesCount.toLocaleString('fr-FR')} espèces
                    </p>
                    <p className="text-sm text-slate-500">Étape {marche.order}</p>
                  </div>
                </Popup>
              </Marker>
            ))
          }
          
          {/* Marqueur central */}
          <Marker
            position={center}
            icon={L.divIcon({
              html: '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>',
              className: 'custom-center-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <div className="text-center">
                <strong>Point de recherche</strong>
                <br />
                Rayon: {data?.location?.radius}km
              </div>
            </Popup>
          </Marker>
          
          {/* Marqueurs d'observations */}
          {observationClusters.map((cluster) => (
            <Marker
              key={cluster.id}
              position={[cluster.lat, cluster.lng]}
              icon={createCustomIcon(cluster.mainKingdom, cluster.count, selectedCluster === cluster.id)}
              eventHandlers={{
                click: () => {
                  setSelectedCluster(cluster.id);
                  setIsSheetOpen(true);
                }
              }}
            >
              <Popup>
                <div className="space-y-2 min-w-[200px]">
                  <h4 className="font-semibold">{cluster.count} espèce{cluster.count > 1 ? 's' : ''}</h4>
                  <div className="space-y-2">
                     {cluster.species.slice(0, 3).map(species => {
                       console.log(`🔍 POPUP Species data:`, {
                         name: species.commonName,
                         source: species.source,
                         photosArray: species.photos,
                         photosLength: species.photos?.length,
                         firstPhoto: species.photos?.[0],
                         hasPhotos: !!(species.photos?.[0])
                       });
                       
                       return (
                         <div key={species.id} className="text-sm flex gap-2 items-center">
                           {species.photos?.[0] ? (
                             <img
                               src={species.photos[0]}
                               alt={species.commonName}
                               className="w-6 h-6 object-cover rounded border"
                               loading="lazy"
                               onLoad={() => console.log(`✅ POPUP Photo loaded for ${species.commonName}:`, species.photos[0])}
                               onError={(e) => {
                                 console.log(`❌ POPUP Photo failed for ${species.commonName}:`, species.photos[0]);
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                               }}
                             />
                           ) : (
                             <div className="w-6 h-6 bg-muted rounded border flex items-center justify-center">
                               <span className="text-[8px] text-muted-foreground">
                                 {species.source === 'ebird' ? '🐦' : '?'}
                               </span>
                             </div>
                           )}
                           <div className="flex-1">
                             <div className="font-medium">{species.commonName}</div>
                             <div className="text-muted-foreground italic text-xs">{species.scientificName}</div>
                           </div>
                         </div>
                       );
                     })}
                    {cluster.species.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{cluster.species.length - 3} autres espèces
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCluster(cluster.id);
                      setIsSheetOpen(true);
                    }}
                  >
                    Voir détails
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Sheet pour les détails du cluster sélectionné */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-hidden">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Observations à ce point
              {selectedCluster && (
                <Badge variant="secondary">
                  {observationClusters.find(c => c.id === selectedCluster)?.species?.length || 0} espèces
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 h-full overflow-y-auto pb-6">
            {selectedCluster && (() => {
              const cluster = observationClusters.find(c => c.id === selectedCluster);
              if (!cluster) return null;
              
               return (
                 <div className="space-y-4">
                   {cluster.species.map((species) => {
                     console.log(`🔍 LISTE Species data:`, {
                       name: species.commonName,
                       source: species.source,
                       photosArray: species.photos,
                       photosLength: species.photos?.length,
                       firstPhoto: species.photos?.[0],
                       hasPhotos: !!(species.photos?.[0])
                     });
                     
                     return (
                        <motion.div
                          key={species.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedSpeciesForModal(species)}
                        >
                         <div className="flex gap-4">
                           {species.photos?.[0] ? (
                             <div className="w-20 h-20 flex-shrink-0">
                               <img
                                 src={species.photos[0]}
                                 alt={species.commonName}
                                 className="w-full h-full object-cover rounded-lg border"
                                 loading="lazy"
                                 onLoad={() => console.log(`✅ LISTE Photo loaded for ${species.commonName}:`, species.photos[0])}
                                 onError={(e) => {
                                   console.log(`❌ LISTE Photo failed for ${species.commonName}:`, species.photos[0]);
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   // Afficher le fallback
                                   const fallback = target.nextElementSibling as HTMLElement;
                                   if (fallback) fallback.style.display = 'flex';
                                 }}
                               />
                               <div className="w-full h-full bg-muted rounded-lg border items-center justify-center" style={{ display: 'none' }}>
                                 <span className="text-xs text-muted-foreground">
                                   {species.source === 'ebird' ? '🐦' : 'Pas d\'image'}
                                 </span>
                               </div>
                             </div>
                           ) : (
                             <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-lg border flex items-center justify-center">
                               <span className="text-xs text-muted-foreground">
                                 {species.source === 'ebird' ? '🐦' : 'Pas d\'image'}
                               </span>
                             </div>
                           )}
                         
                           <div className="flex-1 space-y-2">
                             <div>
                               <h4 className="font-semibold">{species.commonName}</h4>
                               <p className="text-sm text-muted-foreground italic">{species.scientificName}</p>
                             </div>
                             
                             <div className="flex flex-wrap gap-2">
                               <Badge variant="outline" className="text-xs">
                                 {species.kingdom}
                               </Badge>
                               <Badge variant="secondary" className="text-xs">
                                 {species.observations} obs.
                               </Badge>
                               <Badge variant="outline" className="text-xs">
                                 {new Date(species.lastSeen).toLocaleDateString('fr-FR')}
                               </Badge>
                             </div>
                             
                             {species.attributions && species.attributions.length > 0 ? (
                               <div className="space-y-1">
                                 {species.attributions.slice(0, 2).map((attribution, idx) => (
                                   <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                     <User className="h-3 w-3" />
                                     <span className="font-medium">
                                       {attribution.observerName || 'Observateur anonyme'}
                                     </span>
                                     {attribution.date && (
                                       <>
                                         <Calendar className="h-3 w-3 ml-2" />
                                         {new Date(attribution.date).toLocaleDateString('fr-FR')}
                                       </>
                                     )}
                                     {attribution.originalUrl && (
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="h-auto p-0 text-xs hover:text-primary"
                                         onClick={() => window.open(attribution.originalUrl, '_blank')}
                                       >
                                         <ExternalLink className="h-3 w-3" />
                                       </Button>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-xs text-muted-foreground">
                                 Aucun contributeur identifié
                               </div>
                             )}
                           </div>
                         </div>
                       </motion.div>
                     );
                   })}
                 </div>
               );
             })()}
           </div>
          </SheetContent>
        </Sheet>
        
        {/* Modal de détails d'espèce */}
        <SpeciesDetailModal
          species={selectedSpeciesForModal}
          isOpen={selectedSpeciesForModal !== null}
          onClose={() => setSelectedSpeciesForModal(null)}
        />
      </div>
    );
  };