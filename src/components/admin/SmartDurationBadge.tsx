import React from 'react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Clock, 
  AlertTriangle, 
  Loader2,
  Calculator
} from 'lucide-react';

interface SmartDurationBadgeProps {
  duration: number | null;
  size?: number;
  format?: string;
  isCalculating?: boolean;
  onRecalculate?: () => void;
  className?: string;
  isEstimated?: boolean;
}

/**
 * Badge de durée intelligent avec indicateurs visuels élégants
 */
export const SmartDurationBadge: React.FC<SmartDurationBadgeProps> = ({
  duration,
  size,
  format,
  isCalculating = false,
  onRecalculate,
  className = "",
  isEstimated = false
}) => {
  const formatDurationSmart = (seconds: number | null): string => {
    if (!seconds || seconds <= 0) {
      // Si pas de durée, mais on a taille et format, estimer pour affichage
      if (size && format && size > 0) {
        const bitrates = {
          'audio/webm': 64000,
          'audio/mp3': 128000, 
          'audio/wav': 1411200,
          'audio/aac': 128000,
          'audio/ogg': 96000,
          'default': 96000
        };
        const bitrate = bitrates[format as keyof typeof bitrates] || bitrates.default;
        const estimated = Math.round((size * 8) / bitrate);
        const mins = Math.floor(estimated / 60);
        const secs = estimated % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}*`;
      }
      return '--:--';
    }
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}${isEstimated ? '*' : ''}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}${isEstimated ? '*' : ''}`;
  };

  const getDurationVariant = (seconds: number | null): 'default' | 'secondary' | 'destructive' => {
    if (!seconds) return 'destructive';
    if (seconds <= 120) return 'default'; // 0-2min: vert
    if (seconds <= 600) return 'secondary'; // 2-10min: orange  
    return 'destructive'; // >10min: rouge (attention longue durée)
  };

  const getDurationIcon = (seconds: number | null) => {
    if (isCalculating) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (!seconds) return <AlertTriangle className="h-3 w-3" />;
    if (seconds > 1200) return <Clock className="h-3 w-3 text-amber-500" />; // >20min
    return <Clock className="h-3 w-3" />;
  };

  const getTooltipContent = (seconds: number | null) => {
    if (isCalculating) return "Calcul de la durée en cours...";
    
    const sizeInfo = size ? ` • ${Math.round(size / 1024)}KB` : '';
    const formatInfo = format ? ` • ${format}` : '';
    
    if (!seconds) {
      if (size && format && size > 0) {
        return `Durée estimée (basée sur la taille)${sizeInfo}${formatInfo} - Cliquez pour recalculer`;
      }
      return "Durée inconnue - Cliquez pour recalculer";
    }
    
    const estimatedPrefix = isEstimated ? "Durée estimée: " : "";
    
    if (seconds <= 120) return `${estimatedPrefix}Courte durée: ${formatDurationSmart(seconds).replace('*', '')}${sizeInfo}${formatInfo}`;
    if (seconds <= 600) return `${estimatedPrefix}Durée moyenne: ${formatDurationSmart(seconds).replace('*', '')}${sizeInfo}${formatInfo}`;
    if (seconds <= 1800) return `${estimatedPrefix}Longue durée: ${formatDurationSmart(seconds).replace('*', '')}${sizeInfo}${formatInfo}`;
    return `${estimatedPrefix}Très longue durée: ${formatDurationSmart(seconds).replace('*', '')}${sizeInfo}${formatInfo} ⚠️`;
  };

  const getBadgeColor = (seconds: number | null) => {
    if (!seconds) {
      // Si on peut estimer avec size/format, couleur plus douce
      if (size && format && size > 0) {
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      }
      return 'bg-red-500/10 text-red-700 border-red-200';
    }
    
    // Couleur différente si c'est estimé
    if (isEstimated) {
      return 'bg-indigo-500/10 text-indigo-700 border-indigo-200';
    }
    
    if (seconds <= 120) return 'bg-green-500/10 text-green-700 border-green-200';
    if (seconds <= 600) return 'bg-orange-500/10 text-orange-700 border-orange-200';
    if (seconds <= 1800) return 'bg-blue-500/10 text-blue-700 border-blue-200';
    return 'bg-amber-500/10 text-amber-700 border-amber-200';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getDurationVariant(duration)}
            className={`text-xs gap-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ${getBadgeColor(duration)} ${className}`}
            onClick={!duration && onRecalculate ? onRecalculate : undefined}
          >
            {getDurationIcon(duration)}
            {formatDurationSmart(duration)}
            {!duration && onRecalculate && (
              <Calculator className="h-3 w-3 ml-1 animate-pulse" />
            )}
            {duration && duration > 1800 && (
              <span className="text-amber-500 animate-pulse">⚠️</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent(duration)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};