
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { SearchResult } from '../pages/Index';

interface SearchMarkerProps {
  searchResult: SearchResult;
}

const SearchMarker: React.FC<SearchMarkerProps> = ({ searchResult }) => {
  const redIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <Marker position={searchResult.coordinates} icon={redIcon}>
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
};

export default SearchMarker;
