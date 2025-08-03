import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface SimpleSatelliteDisplayProps {
  satelliteImage?: {
    imageUrl: string;
    metadata: {
      date: string;
      cloudCover?: number;
      resolution?: string;
      visualizationType: string;
    };
  };
  currentNDVI?: number;
  haiku?: string;
  onRefresh: () => void;
  isLoading: boolean;
  selectedDate: string;
  ndviTimeSeries?: {
    dates: string[];
    ndviValues: number[];
  };
}

const SimpleSatelliteDisplay: React.FC<SimpleSatelliteDisplayProps> = ({
  satelliteImage,
  currentNDVI,
  haiku,
  onRefresh,
  isLoading,
  selectedDate,
  ndviTimeSeries
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentSeason = (): string => {
    const month = new Date(selectedDate).getMonth();
    if (month >= 2 && month <= 4) return 'Printemps';
    if (month >= 5 && month <= 7) return 'Été';
    if (month >= 8 && month <= 10) return 'Automne';
    return 'Hiver';
  };

  const downloadImage = () => {
    if (satelliteImage?.imageUrl) {
      const link = document.createElement('a');
      link.href = satelliteImage.imageUrl;
      link.download = `satellite-${selectedDate}.jpg`;
      link.click();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
      {/* Image Satellite */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200/50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Image Satellite</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          
          {isLoading ? (
            <div className="bg-slate-200 rounded-xl h-64 flex items-center justify-center">
              <div className="text-slate-500">Chargement de l'image...</div>
            </div>
          ) : satelliteImage ? (
            <div className="relative">
              <img 
                src={satelliteImage.imageUrl}
                alt={`Vue satellite du ${formatDate(selectedDate)}`}
                className="w-full h-64 object-cover rounded-xl border border-slate-200"
                onLoad={() => console.log('🖼️ Image satellite loaded successfully')}
              />
              
              {/* Metadata */}
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge className="bg-white/90 text-slate-700">
                  {formatDate(selectedDate)}
                </Badge>
                {satelliteImage.metadata.cloudCover && (
                  <Badge variant="secondary" className="bg-white/90 text-slate-700">
                    Nuages: {satelliteImage.metadata.cloudCover.toFixed(0)}%
                  </Badge>
                )}
              </div>

              {/* Download Button */}
              <div className="absolute bottom-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={downloadImage}
                  className="bg-white/90 hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center">
              <div className="text-slate-500">Aucune image disponible</div>
            </div>
          )}
        </div>
      </div>

      {/* Données Poétiques */}
      <div className="space-y-6">
        {/* Métadonnées NDVI */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Données Végétales</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-slate-600">NDVI Actuel</div>
              <div className="text-xl font-bold text-green-600">
                {currentNDVI ? currentNDVI.toFixed(3) : '---'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-slate-600">Saison</div>
              <div className="text-lg font-bold text-blue-600">
                {getCurrentSeason()}
              </div>
            </div>
          </div>

          {ndviTimeSeries && (
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-slate-600">Données Temporelles</div>
              <div className="text-lg font-bold text-purple-600">
                {ndviTimeSeries.dates.length} passages satellite
              </div>
            </div>
          )}
        </Card>

        {/* Haiku */}
        {haiku && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Interprétation Poétique</h3>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
              <div className="text-center text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                {haiku}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SimpleSatelliteDisplay;