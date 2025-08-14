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
      className="rounded-2xl shadow-2xl pointer-events-none overflow-hidden border border-gaspard-forest/30"
    >
      <div className="p-0 space-y-0" style={{ width: tooltipWidth + 'px' }}>
        {/* Header avec nom du marché - Vert foncé avec texte blanc */}
        <div className="px-4 py-3 text-center" style={{ backgroundColor: 'hsl(140 30% 6%)' }}>
          <h3 className="font-bold text-white text-lg leading-tight font-crimson">
            {marche.nomMarche || marche.ville}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'hsl(140 22% 70%)' }}>{marche.ville}</p>
        </div>
        
        {/* Date - Vert sage avec texte vert clair */}
        <div className="px-4 py-3 flex items-center justify-center gap-3" style={{ backgroundColor: 'hsl(140 28% 28%)' }}>
          <Calendar className="h-4 w-4" style={{ color: 'hsl(140 25% 35%)' }} />
          <span className="font-semibold text-base text-white font-inter">{formatDate(marche.date || '')}</span>
        </div>

        {/* Biodiversité si disponible - Vert mint avec texte blanc */}
        {biodiversityData && biodiversityData.species.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-center gap-3" style={{ backgroundColor: 'hsl(140 25% 35%)' }}>
            <Eye className="h-4 w-4 text-white" />
            <span className="font-bold text-base text-white font-inter">
              {biodiversityData.species.length} espèce{biodiversityData.species.length > 1 ? 's' : ''} observée{biodiversityData.species.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Call to action - Vert mint avec texte vert foncé et effet premium */}
        <div 
          className="px-4 py-3 text-center"
          style={{ 
            backgroundColor: 'hsl(140 25% 35%)',
            backgroundImage: 'linear-gradient(135deg, hsl(140 25% 35%) 0%, hsl(140 22% 42%) 100%)'
          }}
        >
          <div className="font-bold text-base font-inter" style={{ color: 'hsl(140 30% 6%)' }}>
            ✨ Cliquer pour explorer
          </div>
        </div>
      </div>
    </div>
  );
};