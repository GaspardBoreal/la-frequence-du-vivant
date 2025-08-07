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
}

const CadastralMap: React.FC<CadastralMapProps> = ({ 
  latitude, 
  longitude, 
  className = "w-full h-96" 
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

    // Cadastral overlay - trying multiple sources
    const cadastralLayer = L.tileLayer.wms('https://www.geoportail.gouv.fr/depot/api/carto/LIMITES_ADMINISTRATIVES/wms', {
      layers: 'LIMITES_ADMINISTRATIVES:commune',
      format: 'image/png',
      transparent: true,
      attribution: '© IGN - Limites administratives',
      opacity: 0.6,
      maxZoom: 18,
    });

    // Alternative cadastral layer using different service
    const cadastralParcelsLayer = L.tileLayer(
      'https://cadastre.data.gouv.fr/bundler/cadastre-etalab/{z}/{x}/{y}.pbf?style=parcelles',
      {
        attribution: '© Etalab - Cadastre',
        opacity: 0.7,
        maxZoom: 20,
      }
    );

    // Add base layer first
    osmLayer.addTo(map);
    
    // Try to add cadastral overlay (will fallback if first doesn't work)
    try {
      cadastralParcelsLayer.addTo(map);
    } catch (e) {
      console.log('Trying alternative cadastral source...');
      cadastralLayer.addTo(map);
    }

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

    // Add marker
    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong>Position de l'expérience</strong><br>
          <small>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}</small>
        </div>
      `);

    // Layer control
    const baseLayers = {
      'Plan': osmLayer,
      'Vue satellite': satelliteLayer
    };

    const overlayLayers = {
      'Parcelles cadastrales': cadastralParcelsLayer,
      'Limites communales': cadastralLayer
    };

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