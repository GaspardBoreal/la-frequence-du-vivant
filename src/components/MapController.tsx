
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  center: [number, number];
}

const MapController: React.FC<MapControllerProps> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
      map.setView(center, 15);
    }
  }, [center, map]);

  return null;
};

export default MapController;
