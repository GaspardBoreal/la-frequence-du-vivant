import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

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

  // Fonction pour récupérer la géométrie de la parcelle via l'API Etalab
  const fetchParcelGeometry = async (parcelId: string) => {
    try {
      console.log('🔍 [CADASTRAL] Récupération géométrie pour:', parcelId);
      
      // Extraire le code commune des 5 premiers caractères
      const codeCommune = parcelId.substring(0, 5);
      console.log('🏘️ [CADASTRAL] Code commune:', codeCommune);
      
      // API Etalab pour récupérer la géométrie de la parcelle
      const response = await fetch(
        `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/latest/geojson/communes/${codeCommune}/cadastre-${codeCommune}-parcelles.json`
      );
      
      if (!response.ok) {
        console.warn('⚠️ [CADASTRAL] Réponse API non-OK:', response.status);
        return null;
      }
      
      const geoJsonData = await response.json();
      console.log('📦 [CADASTRAL] Données GeoJSON reçues:', geoJsonData);
      
      // Chercher la parcelle avec l'ID correspondant
      const parcel = geoJsonData.features?.find((feature: any) => 
        feature.properties?.id === parcelId
      );
      
      if (parcel) {
        console.log('✅ [CADASTRAL] Parcelle trouvée:', parcel);
        return parcel.geometry;
      } else {
        console.warn('❌ [CADASTRAL] Parcelle non trouvée dans les données');
        return null;
      }
      
    } catch (error) {
      console.error('💥 [CADASTRAL] Erreur récupération géométrie:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initializeMap = async () => {
      // Initialize map
      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: true,
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

      // Try to fetch and display parcel geometry if parcelData contains an ID
      let parcelLayer = null;
      const allBounds = [[latitude, longitude]];
      
      console.log('🗺️ [CADASTRAL MAP] Données reçues:', { parcelGeometry, parcelData });
      
      let geometryToUse = parcelGeometry;
      
      // Si pas de géométrie mais qu'on a un ID de parcelle, essayer de la récupérer
      if (!parcelGeometry && parcelData?.parcel_id) {
        console.log('🔄 [CADASTRAL] Tentative récupération géométrie avec ID:', parcelData.parcel_id);
        geometryToUse = await fetchParcelGeometry(parcelData.parcel_id);
      }
      
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

      L.control.layers(baseLayers, overlayLayers, {
        position: 'topright',
        collapsed: false
      }).addTo(map);

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
      }).addTo(map);

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