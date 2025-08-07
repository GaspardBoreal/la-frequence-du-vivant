import React, { useState } from 'react';
import { ExternalLink, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { WeatherStation } from '../../utils/weatherStationDatabase';

interface StationComparisonRowProps {
  station: WeatherStation & { distance: number };
}

const StationComparisonRow: React.FC<StationComparisonRowProps> = ({ station }) => {
  const formatDistance = (distance: number): string => {
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  };

  const generateMapLinks = () => {
    const { lat, lng } = station.coordinates;
    
    return {
      openStreetMap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`,
      googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      googleStreetView: `https://www.google.com/maps/@${lat},${lng},21z/data=!3m1!1e3`
    };
  };

  const links = generateMapLinks();

  return (
    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-gray-200 hover:bg-white/70 transition-colors">
      <div className="flex-1 grid grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Nom</p>
          <p className="font-medium text-gray-800">{station.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Code Station</p>
          <p className="font-mono text-sm text-blue-600">{station.code}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Ville</p>
          <p className="font-medium text-gray-800">{station.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Distance</p>
          <p className="font-bold text-orange-600">{formatDistance(station.distance)}</p>
        </div>
      </div>
      
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Voir</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border border-gray-200">
            <DropdownMenuItem asChild>
              <a
                href={links.openStreetMap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Voir dans OpenStreetMap
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={links.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Voir dans Google Maps
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={links.googleStreetView}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Voir dans Google Street View
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default StationComparisonRow;