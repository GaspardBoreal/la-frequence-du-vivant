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

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
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

    // Satellite layer from IGN (simplified)
    const satelliteLayer = L.tileLayer(
      'https://wxs.ign.fr/essentiels/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution: '© IGN',
        maxZoom: 18,
      }
    );

    // Cadastral parcels - IGN WMTS official service
    const cadastralParcelsLayer = L.tileLayer(
      'https://wxs.ign.fr/essentiels/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=PCI%20vecteur&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution: '© IGN - Plan Cadastral Informatisé',
        opacity: 0.8,
        maxZoom: 20,
      }
    );

    // Administrative boundaries - IGN WMTS official service  
    const administrativeBoundariesLayer = L.tileLayer(
      'https://wxs.ign.fr/essentiels/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&LAYER=LIMITES_ADMINISTRATIVES.BOUNDARIES&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution: '© IGN - Limites administratives',
        opacity: 0.6,
        maxZoom: 18,
      }
    );

    // Add base layer first
    osmLayer.addTo(map);
    
    // Add cadastral layers with error handling
    cadastralParcelsLayer.on('tileerror', function(error) {
      console.warn('Erreur de chargement des parcelles cadastrales:', error);
    });
    
    administrativeBoundariesLayer.on('tileerror', function(error) {
      console.warn('Erreur de chargement des limites administratives:', error);
    });
    
    // Add layers to map
    cadastralParcelsLayer.addTo(map);
    administrativeBoundariesLayer.addTo(map);

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

    // Add parcel polygon if geometry is available
    let parcelLayer = null;
    const allBounds = [[latitude, longitude]];
    
    if (parcelGeometry && parcelGeometry.coordinates) {
      try {
        const parcelGeoJSON = L.geoJSON(parcelGeometry, {
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
        console.warn('Erreur lors de l\'affichage de la parcelle:', error);
      }
    }

    // Layer control
    const baseLayers = {
      'Plan': osmLayer,
      'Vue satellite': satelliteLayer
    };

    const overlayLayers: any = {
      'Parcelles cadastrales': cadastralParcelsLayer,
      'Limites administratives': administrativeBoundariesLayer
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

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className={`${className} rounded-xl overflow-hidden border border-gray-200 shadow-lg`}>
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h3 className="font-semibold">Carte cadastrale</h3>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Visualisation sur fond satellite IGN avec parcelles cadastrales
        </p>
      </div>
      <div ref={mapRef} className="h-full min-h-[400px]" />
    </div>
  );
};

export default CadastralMap;