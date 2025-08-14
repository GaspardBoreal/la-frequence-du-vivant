import React from 'react';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';
import { useBiodiversityData } from '@/hooks/useBiodiversityData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Eye } from 'lucide-react';

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

  // Simple positioning to avoid viewport overflow
  const tooltipStyle = {
    position: 'fixed' as const,
    left: Math.min(position.x + 10, window.innerWidth - 280),
    top: Math.max(position.y - 100, 10),
    zIndex: 9999,
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 w-64 pointer-events-none"
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm text-foreground">{marche.nomMarche || marche.ville}</h3>
            <p className="text-xs text-muted-foreground">{marche.ville}</p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {formatDate(marche.date || '')}
        </div>

        {biodiversityData && biodiversityData.species.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Eye className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">
              {biodiversityData.species.length} espèce(s) observée(s)
            </span>
          </div>
        )}

        <div className="text-xs text-primary/80 font-medium">
          Cliquer pour plus de détails
        </div>
      </div>
    </div>
  );
};