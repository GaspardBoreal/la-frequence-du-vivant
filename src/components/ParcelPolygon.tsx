
import { Polygon, Popup } from 'react-leaflet';
import { RegionalTheme } from '../utils/regionalThemes';
import { SelectedParcel } from '../pages/Index';

interface ParcelPolygonProps {
  parcelData: any;
  theme: RegionalTheme;
  onParcelClick: (parcel: SelectedParcel) => void;
  searchCoordinates: [number, number];
}

const ParcelPolygon: React.FC<ParcelPolygonProps> = ({ 
  parcelData, 
  theme, 
  onParcelClick, 
  searchCoordinates 
}) => {
  const handleClick = () => {
    onParcelClick({
      id: parcelData.cadastre?.id?.value || 'unknown',
      coordinates: searchCoordinates,
      data: parcelData
    });
  };

  if (!parcelData?.geolocation?.shape) {
    return null;
  }

  const coordinates = parcelData.geolocation.shape.coordinates[0][0].map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );

  return (
    <Polygon
      positions={coordinates}
      pathOptions={{
        color: theme.colors.primary,
        fillColor: theme.colors.secondary,
        fillOpacity: 0.3,
        weight: 2
      }}
      eventHandlers={{
        click: handleClick
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
            onClick={handleClick}
            className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Voir détails
          </button>
        </div>
      </Popup>
    </Polygon>
  );
};

export default ParcelPolygon;
