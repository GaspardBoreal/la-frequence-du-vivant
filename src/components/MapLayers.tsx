
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { LayerConfig, SearchResult, SelectedParcel } from '../pages/Index';
import SearchMarker from './SearchMarker';
import ParcelPolygon from './ParcelPolygon';
import CustomMarkers from './CustomMarkers';

interface MapLayersProps {
  center: [number, number];
  searchResult: SearchResult | null;
  parcelData: any;
  layers: LayerConfig;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
}

const MapLayers: React.FC<MapLayersProps> = ({
  center,
  searchResult,
  parcelData,
  layers,
  theme,
  onParcelClick
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
      console.log('Updating map view to:', center);
      map.setView(center, 15);
    }
  }, [center, map]);

  return (
    <>
      {searchResult && (
        <SearchMarker searchResult={searchResult} />
      )}
      
      {parcelData && layers.parcelles && searchResult && (
        <ParcelPolygon
          parcelData={parcelData}
          theme={theme}
          onParcelClick={onParcelClick}
          searchCoordinates={searchResult.coordinates}
        />
      )}
      
      {searchResult && (
        <CustomMarkers
          searchResult={searchResult}
          parcelData={parcelData}
          layers={layers}
          theme={theme}
        />
      )}
    </>
  );
};

export default MapLayers;
