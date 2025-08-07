import React, { useState } from 'react';
import { ExternalLink, MapPin, ChevronDown, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { WeatherStation } from '../../utils/weatherStationDatabase';

interface StationComparisonRowProps {
  station: WeatherStation & { distance: number };
  isCurrentStation?: boolean;
}

const StationComparisonRow: React.FC<StationComparisonRowProps> = ({ station, isCurrentStation = false }) => {
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

  const baseClasses = "flex items-center justify-between p-4 rounded-lg border transition-all duration-200";
  const currentStationClasses = isCurrentStation 
    ? "bg-primary border-accent shadow-lg" 
    : "bg-card hover:bg-accent/50 border-border";

  return (
    <div className={`${baseClasses} ${currentStationClasses}`}>
      {isCurrentStation && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="default" className="flex items-center gap-1 bg-accent text-accent-foreground shadow-md">
            <Star className="h-3 w-3" />
            Station actuelle
          </Badge>
        </div>
      )}
      
      <div className="flex-1 grid grid-cols-4 gap-4 relative">
        <div>
          <p className={`text-sm ${isCurrentStation ? 'text-white/70' : 'text-muted-foreground'}`}>Nom</p>
          <p className={`font-medium ${isCurrentStation ? 'text-white font-semibold' : 'text-foreground'}`}>
            {station.name}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isCurrentStation ? 'text-white/70' : 'text-muted-foreground'}`}>Code Station</p>
          <p className={`font-mono text-sm ${isCurrentStation ? 'text-white font-semibold' : 'text-primary/80'}`}>
            {station.code}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isCurrentStation ? 'text-white/70' : 'text-muted-foreground'}`}>Ville</p>
          <p className={`font-medium ${isCurrentStation ? 'text-white font-semibold' : 'text-foreground'}`}>
            {station.name}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isCurrentStation ? 'text-white/70' : 'text-muted-foreground'}`}>Distance</p>
          <p className={`font-bold ${isCurrentStation ? 'text-accent' : 'text-accent'}`}>
            {formatDistance(station.distance)}
          </p>
        </div>
      </div>
      
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={isCurrentStation ? "secondary" : "outline"} 
              size="sm" 
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Voir</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-popover border-border shadow-lg z-50"
          >
            <DropdownMenuItem asChild>
              <a
                href={links.openStreetMap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer text-popover-foreground hover:text-accent-foreground hover:bg-accent"
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
                className="flex items-center gap-2 cursor-pointer text-popover-foreground hover:text-accent-foreground hover:bg-accent"
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
                className="flex items-center gap-2 cursor-pointer text-popover-foreground hover:text-accent-foreground hover:bg-accent"
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