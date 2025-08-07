import React, { useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface InteractiveStationMapProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  stationName: string;
}

const InteractiveStationMap: React.FC<InteractiveStationMapProps> = ({
  coordinates,
  stationName
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="mt-4 h-64 bg-gray-100 rounded-lg border overflow-hidden relative">
      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleZoomIn}
          className="bg-white/90 backdrop-blur-sm shadow-md p-2 h-8 w-8"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleZoomOut}
          className="bg-white/90 backdrop-blur-sm shadow-md p-2 h-8 w-8"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleReset}
          className="bg-white/90 backdrop-blur-sm shadow-md p-2 h-8 w-8"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Carte */}
      <div 
        className="w-full h-full cursor-move relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          background: `
            linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 25%, #ddd6fe 50%, #f3e8ff 75%, #fdf2f8 100%),
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '100% 100%, 300px 300px, 200px 200px, 400px 400px'
        }}
      >
        {/* Grille décorative */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
          }}
        />
        
        {/* Point de la station météorologique */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            left: '50%',
            top: '50%',
            marginLeft: '-12px',
            marginTop: '-12px'
          }}
        >
          {/* Cercles d'animation */}
          <div className="absolute w-12 h-12 bg-red-200 rounded-full animate-ping opacity-30"></div>
          <div className="absolute w-8 h-8 bg-red-300 rounded-full animate-pulse opacity-50"></div>
          
          {/* Point principal */}
          <div className="relative w-6 h-6 bg-red-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Lignes de guidage */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
          }}
        >
          {/* Ligne horizontale */}
          <div 
            className="absolute w-full h-px bg-red-300 opacity-30"
            style={{ top: '50%' }}
          />
          {/* Ligne verticale */}
          <div 
            className="absolute h-full w-px bg-red-300 opacity-30"
            style={{ left: '50%' }}
          />
        </div>
      </div>

      {/* Informations de la station */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-sm font-medium text-gray-800">{stationName}</p>
            <p className="text-xs text-gray-600 font-medium">
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur de zoom */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 font-medium">
        Zoom: {zoom.toFixed(1)}x
      </div>
    </div>
  );
};

export default InteractiveStationMap;