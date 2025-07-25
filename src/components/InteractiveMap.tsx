
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Icon, DivIcon } from 'leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import { fetchParcelData } from '../utils/lexiconApi';

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
  const [mapKey, setMapKey] = useState(0);

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
      setMapKey(prev => prev + 1); // Force map re-render
    }
  }, [searchResult]);

  // Create icons outside of render to avoid recreation
  const redIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const weatherIcon = new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${theme.colors.accent};
        border: 2px solid white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <span style="color: white; font-size: 12px;">🌡️</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const transactionIcon = new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: #e74c3c;
        border: 2px solid white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <span style="color: white; font-size: 12px;">💰</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const handleParcelClick = () => {
    if (searchResult && parcelData) {
      onParcelClick({
        id: parcelData.cadastre?.id?.value || 'unknown',
        coordinates: searchResult.coordinates,
        data: parcelData
      });
    }
  };

  // Pre-calculate all markers and polygons to avoid conditional rendering inside MapContainer
  const markers = [];
  const polygons = [];

  // Add search result marker
  if (searchResult) {
    markers.push(
      <Marker key="search-result" position={searchResult.coordinates} icon={redIcon}>
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">Point de recherche</h3>
            <p className="text-xs text-gray-600">{searchResult.address}</p>
            <p className="text-xs text-gray-500">
              {searchResult.coordinates[0].toFixed(6)}, {searchResult.coordinates[1].toFixed(6)}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  }

  // Add parcel polygon
  if (parcelData?.geolocation?.shape && searchResult && layers.parcelles) {
    const coordinates = parcelData.geolocation.shape.coordinates[0][0].map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    polygons.push(
      <Polygon
        key="parcel-polygon"
        positions={coordinates}
        pathOptions={{
          color: theme.colors.primary,
          fillColor: theme.colors.secondary,
          fillOpacity: 0.3,
          weight: 2
        }}
        eventHandlers={{
          click: handleParcelClick
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">
              {parcelData.cadastre?.id?.value || 'Parcelle'}
            </h3>
            <p className="text-xs text-gray-600 mb-1">
              Surface: {parcelData.cadastre?.area?.value || 'N/A'} {parcelData.cadastre?.area?.unit || ''}
            </p>
            <p className="text-xs text-gray-600">
              Ville: {parcelData.information?.city?.value || 'N/A'}
            </p>
            <button
              onClick={handleParcelClick}
              className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Voir détails
            </button>
          </div>
        </Popup>
      </Polygon>
    );
  }

  // Add weather station marker
  if (parcelData?.['last-year-weather-reports']?.station && searchResult && layers.weatherStations) {
    markers.push(
      <Marker
        key="weather-station"
        position={searchResult.coordinates}
        icon={weatherIcon}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-sm mb-1">Station Météo</h3>
            <p className="text-xs text-gray-600">
              {parcelData['last-year-weather-reports'].station.value}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  }

  // Add transaction markers
  if (parcelData?.transactions?.rows && searchResult && layers.immediateTransactions) {
    parcelData.transactions.rows.slice(0, 3).forEach((transaction: any, index: number) => {
      const offset = (Math.random() - 0.5) * 0.001;
      markers.push(
        <Marker
          key={`transaction-${index}`}
          position={[
            searchResult.coordinates[0] + offset,
            searchResult.coordinates[1] + offset
          ]}
          icon={transactionIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm mb-1">Transaction</h3>
              <p className="text-xs text-gray-600 mb-1">
                {transaction.address?.value || 'Adresse inconnue'}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                Type: {transaction['building-nature']?.value || 'N/A'}
              </p>
              <p className="text-xs font-bold text-green-600">
                {transaction.price?.value?.toLocaleString() || 'N/A'} {transaction.price?.unit || ''}
              </p>
              <p className="text-xs text-gray-500">
                {transaction.date?.value || 'Date inconnue'}
              </p>
            </div>
          </Popup>
        </Marker>
      );
    });
  }

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
        key={mapKey}
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers}
        {polygons}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
