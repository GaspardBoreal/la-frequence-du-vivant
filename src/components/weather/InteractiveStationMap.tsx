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
    <div className="mt-4 h-64 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden relative shadow-inner">
      {/* Contrôles de zoom - améliorés */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <Button 
          size="sm" 
          variant="default" 
          onClick={handleZoomIn}
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 shadow-lg p-2 h-10 w-10 text-gray-700"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="default" 
          onClick={handleZoomOut}
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 shadow-lg p-2 h-10 w-10 text-gray-700"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="default" 
          onClick={handleReset}
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 shadow-lg p-2 h-10 w-10 text-gray-700"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Carte - améliorée */}
      <div 
        className="w-full h-full cursor-move relative bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Fond de carte plus clair et contrasté */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%),
              repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(148, 163, 184, 0.1) 20px, rgba(148, 163, 184, 0.1) 40px)
            `
          }}
        />
        
        {/* Grille de référence plus visible */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(71, 85, 105, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(71, 85, 105, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
          }}
        />
        
        {/* Point de la station météorologique - plus visible */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            left: '50%',
            top: '50%',
            marginLeft: '-16px',
            marginTop: '-16px'
          }}
        >
          {/* Cercles d'animation plus contrastés */}
          <div className="absolute w-16 h-16 bg-red-300 rounded-full animate-ping opacity-40"></div>
          <div className="absolute w-12 h-12 bg-red-400 rounded-full animate-pulse opacity-60"></div>
          
          {/* Point principal plus gros et visible */}
          <div className="relative w-8 h-8 bg-red-600 rounded-full shadow-xl border-3 border-white flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full shadow-inner"></div>
          </div>
        </div>

        {/* Lignes de guidage plus visibles */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
          }}
        >
          {/* Ligne horizontale */}
          <div 
            className="absolute w-full h-0.5 bg-red-400 opacity-50 shadow-sm"
            style={{ top: '50%' }}
          />
          {/* Ligne verticale */}
          <div 
            className="absolute h-full w-0.5 bg-red-400 opacity-50 shadow-sm"
            style={{ left: '50%' }}
          />
        </div>
      </div>

      {/* Informations de la station - plus contrastées */}
      <div className="absolute bottom-3 left-3 bg-white rounded-lg p-3 shadow-xl border-2 border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-bold text-gray-800">{stationName}</p>
            <p className="text-xs text-gray-600 font-semibold">
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur de zoom - plus visible */}
      <div className="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 font-semibold border-2 border-gray-200 shadow-lg">
        Zoom: {zoom.toFixed(1)}x
      </div>
    </div>
  );
};

export default InteractiveStationMap;