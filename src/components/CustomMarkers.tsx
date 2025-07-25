
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { LayerConfig, SearchResult } from '../pages/Index';
import { RegionalTheme } from '../utils/regionalThemes';

interface CustomMarkersProps {
  searchResult: SearchResult;
  parcelData: any;
  layers: LayerConfig;
  theme: RegionalTheme;
}

const CustomMarkers: React.FC<CustomMarkersProps> = ({ 
  searchResult, 
  parcelData, 
  layers, 
  theme 
}) => {
  const createCustomIcon = (type: string, color: string) => {
    const emoji = type === 'weather' ? '🌡️' : type === 'transaction' ? '💰' : '🌾';
    
    return new DivIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <span style="color: white; font-size: 12px;">${emoji}</span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const markers = [];

  // Weather station marker
  if (parcelData?.['last-year-weather-reports']?.station && layers.weatherStations) {
    markers.push(
      <Marker
        key="weather-station"
        position={searchResult.coordinates}
        icon={createCustomIcon('weather', theme.colors.accent)}
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

  // Transaction markers
  if (parcelData?.transactions?.rows && layers.immediateTransactions) {
    parcelData.transactions.rows.slice(0, 3).forEach((transaction: any, index: number) => {
      const offset = (Math.random() - 0.5) * 0.001;
      markers.push(
        <Marker
          key={`transaction-${index}`}
          position={[
            searchResult.coordinates[0] + offset,
            searchResult.coordinates[1] + offset
          ]}
          icon={createCustomIcon('transaction', '#e74c3c')}
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

  return <>{markers}</>;
};

export default CustomMarkers;
