
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import { fetchParcelData } from '../utils/lexiconApi';
import MapLayers from './MapLayers';

interface InteractiveMapProps {
  searchResult: SearchResult | null;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  searchResult, 
  layers, 
  theme, 
  onParcelClick 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([46.603354, 1.888334]);

  const { data: parcelData, isLoading } = useQuery({
    queryKey: ['parcelData', searchResult?.coordinates],
    queryFn: () => {
      if (!searchResult) return Promise.resolve(null);
      console.log('Fetching parcel data for:', searchResult.coordinates);
      return fetchParcelData(searchResult.coordinates[0], searchResult.coordinates[1]);
    },
    enabled: !!searchResult,
    staleTime: 5 * 60 * 1000,
    retry: 3
  });

  useEffect(() => {
    if (searchResult) {
      console.log('Setting map center to:', searchResult.coordinates);
      setMapCenter(searchResult.coordinates);
    }
  }, [searchResult]);

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="text-sm text-gray-600">Chargement des données...</span>
          </div>
        </div>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        key={`map-${searchResult?.coordinates.join(',') || 'default'}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapLayers
          center={mapCenter}
          searchResult={searchResult}
          parcelData={parcelData}
          layers={layers}
          theme={theme}
          onParcelClick={onParcelClick}
        />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
