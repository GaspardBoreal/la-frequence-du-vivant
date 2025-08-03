import { Badge } from '@/components/ui/badge';
import { Music, Volume2 } from 'lucide-react';
import { XenoCantoRecording } from '@/types/biodiversity';

interface AudioIndicatorProps {
  recordings?: XenoCantoRecording[];
  isPlaying?: boolean;
  className?: string;
}

export const AudioIndicator = ({ recordings, isPlaying, className }: AudioIndicatorProps) => {
  if (!recordings || recordings.length === 0) return null;

  const bestQuality = recordings.reduce((best, current) => {
    const qualityOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
    const currentScore = qualityOrder[current.quality as keyof typeof qualityOrder] || 0;
    const bestScore = qualityOrder[best.quality as keyof typeof qualityOrder] || 0;
    return currentScore > bestScore ? current : best;
  }, recordings[0]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-lime-100 text-lime-800 border-lime-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'E': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-1 flex items-center gap-1 ${getQualityColor(bestQuality.quality)}`}
      >
        {isPlaying ? (
          <Volume2 className="h-3 w-3 animate-pulse" />
        ) : (
          <Music className="h-3 w-3" />
        )}
        Audio {bestQuality.quality}
      </Badge>
      
      {recordings.length > 1 && (
        <Badge variant="outline" className="text-xs">
          +{recordings.length - 1}
        </Badge>
      )}
    </div>
  );
};