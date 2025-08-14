import React from 'react';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Eye, Calendar } from 'lucide-react';

interface BioacousticTooltipSimpleProps {
  marche: MarcheTechnoSensible;
  mapContainer?: HTMLElement | null;
  visible: boolean;
}

export const BioacousticTooltipSimple: React.FC<BioacousticTooltipSimpleProps> = ({
  marche,
  mapContainer,
  visible
}) => {
  const latitude = marche.latitude;
  const longitude = marche.longitude;
  const { data: biodiversityData } = useBiodiversityData({ latitude, longitude });

  if (!visible || !mapContainer) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Get map bounds for positioning calculation
  const mapRect = mapContainer.getBoundingClientRect();
  
  // Compact tooltip dimensions
  const tooltipWidth = 280;
  const tooltipHeight = 140;
  const offsetAbove = 50; // Distance above marker
  const margin = 12;
  
  // Calculate center position of the map for marker anchor
  const markerX = mapRect.width / 2;
  const markerY = mapRect.height / 2;
  
  // Position tooltip above the marker center
  let left = markerX - (tooltipWidth / 2);
  let top = markerY - offsetAbove - tooltipHeight;
  
  // Prevent horizontal overflow
  if (left < margin) {
    left = margin;
  } else if (left + tooltipWidth > mapRect.width - margin) {
    left = mapRect.width - tooltipWidth - margin;
  }
  
  // Prevent vertical overflow - if would go above map, position below marker instead
  if (top < margin) {
    top = markerY + offsetAbove;
  }
  
  // Final bounds check - ensure it stays within map container
  if (top + tooltipHeight > mapRect.height - margin) {
    top = mapRect.height - tooltipHeight - margin;
  }

  const tooltipStyle = {
    position: 'absolute' as const,
    left: left + mapRect.left,
    top: top + mapRect.top,
    zIndex: 9999,
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-background/98 backdrop-blur-md border-2 border-primary/20 rounded-xl shadow-2xl pointer-events-none"
    >
      <div className="p-4 space-y-3" style={{ width: tooltipWidth + 'px' }}>
        {/* Header avec nom du marché */}
        <div className="text-center border-b border-primary/10 pb-2">
          <h3 className="font-bold text-base text-foreground leading-tight">
            {marche.nomMarche || marche.ville}
          </h3>
          <p className="text-xs text-muted-foreground">{marche.ville}</p>
        </div>
        
        {/* Date */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 text-primary" />
          <span className="font-medium">{formatDate(marche.date || '')}</span>
        </div>

        {/* Biodiversité si disponible */}
        {biodiversityData && biodiversityData.species.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs bg-primary/10 rounded-lg py-2 px-3">
            <Eye className="h-3 w-3 text-primary" />
            <span className="font-semibold text-foreground">
              {biodiversityData.species.length} espèce{biodiversityData.species.length > 1 ? 's' : ''} observée{biodiversityData.species.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Call to action */}
        <div className="text-center py-1 px-3 bg-primary/15 rounded-lg">
          <div className="text-xs text-primary font-bold">
            ✨ Cliquer pour explorer
          </div>
        </div>
      </div>
    </div>
  );
};