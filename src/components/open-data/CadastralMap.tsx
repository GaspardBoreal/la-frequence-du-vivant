import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CadastralMapProps {
  latitude: number;
  longitude: number;
  className?: string;
  parcelGeometry?: any;
  parcelData?: any;
}

const CadastralMap: React.FC<CadastralMapProps> = ({ 
  latitude, 
  longitude, 
  className = "w-full h-96",
  parcelGeometry,
  parcelData
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fonction pour récupérer la géométrie d'une parcelle via l'Edge Function
  const fetchParcelGeometry = async (parcelId: string): Promise<any | null> => {
    try {
      console.log('🏘️ [CADASTRAL] Appel Edge Function avec parcelId:', parcelId);
      
      const requestBody = { parcelId };
      console.log('🏘️ [CADASTRAL] Body de la requête:', JSON.stringify(requestBody));
      
      const { data, error } = await supabase.functions.invoke('cadastre-proxy', {
        body: requestBody
      });

      console.log('🏘️ [CADASTRAL] Réponse Edge Function complète:', { data, error });

      if (error) {
        console.error('❌ [CADASTRAL] Erreur Edge Function détaillée:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data?.success && data?.data) {
        console.log('✅ [CADASTRAL] Géométrie reçue:', data.data);
        return data.data;
      } else {
        console.warn('⚠️ [CADASTRAL] Réponse sans données:', data);
        throw new Error(data?.message || 'Pas de données cadastrales trouvées');
      }
    } catch (error) {
      console.error('❌ [CADASTRAL] Erreur complète:', error);
      throw error;
    }
  };

  // Fonction de fallback pour récupérer les données cadastrales via coordonnées
  const fetchCadastralDataByCoordinates = async (lat: number, lng: number): Promise<any | null> => {
    try {
      console.log('🌍 [CADASTRAL FALLBACK] Recherche par coordonnées:', { lat, lng });
      
      // Recherche de la commune d'abord
      const communeResponse = await fetch(
        `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=code,nom&format=json&geometry=centre`
      );
      
      if (!communeResponse.ok) {
        console.warn('⚠️ [CADASTRAL FALLBACK] Impossible de trouver la commune');
        return null;
      }
      
      const communes = await communeResponse.json();
      if (!communes || communes.length === 0) {
        console.warn('⚠️ [CADASTRAL FALLBACK] Aucune commune trouvée');
        return null;
      }
      
      const commune = communes[0];
      console.log('✅ [CADASTRAL FALLBACK] Commune trouvée:', commune);
      
      // Essai de récupération des parcelles de la commune
      const parcelsUrls = [
        `https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/${commune.code}/cadastre-${commune.code}-parcelles.json`,
        `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/latest/geojson/communes/${commune.code}/cadastre-${commune.code}-parcelles.json`
      ];
      
      for (const url of parcelsUrls) {
        try {
          console.log('🔍 [CADASTRAL FALLBACK] Test URL:', url);
          const response = await fetch(url);
          
          if (response.ok) {
            const geoJson = await response.json();
            console.log(`✅ [CADASTRAL FALLBACK] ${geoJson.features?.length || 0} parcelles trouvées`);
            
            // Trouve la parcelle la plus proche des coordonnées
            if (geoJson.features && geoJson.features.length > 0) {
              // Pour une implémentation simple, on prend la première parcelle
              // Dans un cas réel, on calculerait la distance
              const closestParcel = geoJson.features[0];
              return {
                geometry: closestParcel.geometry,
                properties: closestParcel.properties,
                commune: commune.nom
              };
            }
          }
        } catch (error) {
          console.warn(`⚠️ [CADASTRAL FALLBACK] Erreur avec ${url}:`, error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ [CADASTRAL FALLBACK] Erreur complète:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initializeMap = async () => {
      console.log('🗺️ [CADASTRAL MAP] Initialisation de la carte');
      console.log('🔍 [CADASTRAL MAP] parcelGeometry reçu:', parcelGeometry);
      console.log('🔍 [CADASTRAL MAP] parcelData reçu:', parcelData);

      // Initialize map
      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Base layer - Simple OpenStreetMap first
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      // Satellite layer from ESRI (alternative to IGN)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri',
          maxZoom: 18,
        }
      );

      // Cadastral overlay using working Etalab service
      const cadastralOverlay = L.tileLayer(
        'https://cadastre.data.gouv.fr/map/{z}/{x}/{y}.png',
        {
          attribution: '© Etalab - Cadastre',
          opacity: 0.6,
          maxZoom: 20,
        }
      );

      // Add base layer first
      osmLayer.addTo(map);
      cadastralOverlay.addTo(map);

      // Custom marker for the location
      const customIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        className: 'custom-location-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add GPS marker for the experience location
      const gpsMarker = L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>Position de l'expérience</strong><br>
            <small>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}</small>
          </div>
        `);

      // Vérifier si on a une géométrie de parcelle ou si on doit la récupérer
      let finalParcelGeometry = parcelGeometry;
      
      // PRIORITÉ : Utiliser l'Edge Function avec l'ID cadastral de LEXICON
      if (!finalParcelGeometry && (parcelData?.parcel_id || parcelData?.identifiant_cadastral || parcelData?.id)) {
        const parcelId = parcelData.parcel_id || parcelData.identifiant_cadastral || parcelData.id;
        console.log('🏘️ [CADASTRAL] Tentative avec Edge Function, parcelId:', parcelId);
        
        try {
          const parcelGeometry = await fetchParcelGeometry(parcelId);
          if (parcelGeometry && parcelGeometry.geometry) {
            console.log('✅ [CADASTRAL] Géométrie obtenue via Edge Function');
            finalParcelGeometry = parcelGeometry.geometry;
          }
        } catch (error) {
          console.error('❌ [CADASTRAL] Edge Function a échoué:', error);
        }
      }
      
      if (!finalParcelGeometry) {
        console.warn('⚠️ [CADASTRAL MAP] Aucune géométrie de parcelle disponible');
        console.log('🔍 [CADASTRAL MAP] Données parcelData disponibles:', Object.keys(parcelData || {}));
      }

      if (!finalParcelGeometry) {
        console.warn('⚠️ [CADASTRAL MAP] Aucune géométrie de parcelle disponible');
      }

      // Try to fetch and display parcel geometry
      let parcelLayer = null;
      const allBounds = [[latitude, longitude]];
      
      let geometryToUse = finalParcelGeometry;
      
      if (geometryToUse && geometryToUse.coordinates) {
        console.log('✅ [CADASTRAL MAP] Géométrie de parcelle trouvée, affichage...');
        try {
          const parcelGeoJSON = L.geoJSON(geometryToUse, {
            style: {
              color: '#ef4444',
              weight: 3,
              opacity: 0.8,
              fillColor: '#fbbf24',
              fillOpacity: 0.3,
            }
          }).addTo(map);
          
          parcelLayer = parcelGeoJSON;
          
          // Add popup to parcel
          const parcelInfo = parcelData ? `
            <div style="padding: 8px;">
              <strong>Parcelle cadastrale</strong><br>
              ${parcelData.parcel_id ? `ID: ${parcelData.parcel_id}<br>` : ''}
              ${parcelData.commune ? `Commune: ${parcelData.commune}<br>` : ''}
              ${parcelData.surface_ha ? `Surface: ${parcelData.surface_ha} ha<br>` : ''}
              ${parcelData.culture_type ? `Culture: ${parcelData.culture_type}` : ''}
            </div>
          ` : `
            <div style="padding: 8px;">
              <strong>Parcelle cadastrale LEXICON</strong>
            </div>
          `;
          
          parcelGeoJSON.bindPopup(parcelInfo);
          
          // Get bounds to include both GPS point and parcel
          const parcelBounds = parcelGeoJSON.getBounds();
          allBounds.push([parcelBounds.getNorth(), parcelBounds.getEast()]);
          allBounds.push([parcelBounds.getSouth(), parcelBounds.getWest()]);
          
        } catch (error) {
          console.error('❌ [CADASTRAL MAP] Erreur lors de l\'affichage de la parcelle:', error);
          console.log('🔍 [CADASTRAL MAP] Géométrie problématique:', geometryToUse);
        }
      } else {
        console.warn('⚠️ [CADASTRAL MAP] Aucune géométrie de parcelle disponible');
        console.log('🔍 [CADASTRAL MAP] parcelGeometry reçu:', parcelGeometry);
        console.log('🔍 [CADASTRAL MAP] parcelData reçu:', parcelData);
      }

      // Layer control
      const baseLayers = {
        'Plan': osmLayer,
        'Vue satellite': satelliteLayer
      };

      const overlayLayers: any = {
        'Cadastre': cadastralOverlay
      };
      
      // Add parcel layer to control if available
      if (parcelLayer) {
        overlayLayers['Parcelle LEXICON'] = parcelLayer;
      }

      // S'assurer que la carte est complètement initialisée avant d'ajouter les contrôles
      map.whenReady(() => {
        try {
          L.control.layers(baseLayers, overlayLayers, {
            position: 'topright',
            collapsed: false
          }).addTo(map);
          
          L.control.zoom({ position: 'topright' }).addTo(map);
          
          L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
          }).addTo(map);
        } catch (error) {
          console.warn('⚠️ [CADASTRAL MAP] Erreur lors de l\'ajout des contrôles:', error);
        }
      });

      // Fit map to show both GPS point and parcel (if available)
      if (allBounds.length > 1) {
        const group = new L.FeatureGroup([gpsMarker, ...(parcelLayer ? [parcelLayer] : [])]);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, parcelGeometry, parcelData]);

  return (
    <div className={`${className} rounded-xl overflow-hidden border border-gray-200 shadow-lg`}>
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h3 className="font-semibold">Carte cadastrale</h3>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Visualisation avec parcelles cadastrales Etalab
        </p>
      </div>
      <div ref={mapRef} className="h-full min-h-[400px]" />
    </div>
  );
};

export default CadastralMap;