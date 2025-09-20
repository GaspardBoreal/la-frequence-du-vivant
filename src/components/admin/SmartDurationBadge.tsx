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
  isCalculating?: boolean;
  onRecalculate?: () => void;
  className?: string;
}

/**
 * Badge de durée intelligent avec indicateurs visuels élégants
 */
export const SmartDurationBadge: React.FC<SmartDurationBadgeProps> = ({
  duration,
  size,
  isCalculating = false,
  onRecalculate,
  className = ""
}) => {
  const formatDurationSmart = (seconds: number | null): string => {
    if (!seconds || seconds <= 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    if (!seconds) return "Durée inconnue - Cliquez pour recalculer";
    
    const sizeInfo = size ? ` • ${Math.round(size / 1024)}KB` : '';
    
    if (seconds <= 120) return `Courte durée: ${formatDurationSmart(seconds)}${sizeInfo}`;
    if (seconds <= 600) return `Durée moyenne: ${formatDurationSmart(seconds)}${sizeInfo}`;
    if (seconds <= 1800) return `Longue durée: ${formatDurationSmart(seconds)}${sizeInfo}`;
    return `Très longue durée: ${formatDurationSmart(seconds)}${sizeInfo} ⚠️`;
  };

  const getBadgeColor = (seconds: number | null) => {
    if (!seconds) return 'bg-red-500/10 text-red-700 border-red-200';
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