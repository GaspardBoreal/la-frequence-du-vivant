import React from 'react';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Eye, Calendar } from 'lucide-react';

interface BioacousticTooltipSimpleProps {
  marche: MarcheTechnoSensible;
  position: { x: number; y: number };
  visible: boolean;
}

export const BioacousticTooltipSimple: React.FC<BioacousticTooltipSimpleProps> = ({
  marche,
  position,
  visible
}) => {
  const latitude = marche.latitude;
  const longitude = marche.longitude;
  const { data: biodiversityData } = useBiodiversityData({ latitude, longitude });

  if (!visible) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Intelligent positioning to prevent overflow
  const tooltipWidth = 320;
  const tooltipHeight = 160;
  const margin = 16;
  
  let left = position.x + 10;
  let top = position.y - tooltipHeight / 2;
  
  // Prevent right overflow
  if (left + tooltipWidth > window.innerWidth - margin) {
    left = position.x - tooltipWidth - 10;
  }
  
  // Prevent left overflow
  if (left < margin) {
    left = margin;
  }
  
  // Prevent top overflow
  if (top < margin) {
    top = margin;
  }
  
  // Prevent bottom overflow
  if (top + tooltipHeight > window.innerHeight - margin) {
    top = window.innerHeight - tooltipHeight - margin;
  }

  const tooltipStyle = {
    position: 'fixed' as const,
    left,
    top,
    zIndex: 9999,
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-background/98 backdrop-blur-md border-2 border-primary/20 rounded-xl shadow-2xl p-6 w-80 pointer-events-none"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground leading-tight">
              {marche.nomMarche || marche.ville}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{marche.ville}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">{formatDate(marche.date || '')}</span>
        </div>

        {biodiversityData && biodiversityData.species.length > 0 && (
          <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-3">
            <Eye className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {biodiversityData.species.length} espèce{biodiversityData.species.length > 1 ? 's' : ''} observée{biodiversityData.species.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="text-center py-2 px-4 bg-primary/10 rounded-lg">
          <div className="text-sm text-primary font-bold">
            ✨ Cliquer pour explorer
          </div>
        </div>
      </div>
    </div>
  );
};